import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import express from "express";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertPlanSchema,
  insertOnboardingSessionSchema,
  insertClientSchema,
  insertServiceSchema,
  insertReviewSchema,
  insertClientServiceSchema,
  insertAppointmentSchema,
  insertOperatingHoursSchema,
  insertLeadSchema,
  insertClientWebsiteSchema,
  insertAppointmentSlotSchema,
  insertTeamMemberSchema,
  insertReviewPlatformSchema,
  insertReviewPlatformConnectionSchema,
  insertPlatformReviewSchema,
  insertDomainConfigurationSchema,
  insertDomainVerificationLogSchema,
  insertGoogleBusinessProfileSchema,
  insertNewsletterSubscriptionSchema,
  insertWebsiteStaffSchema,
  insertServicePricingTierSchema,
  insertWebsiteTestimonialSchema,
  insertContactMessageSchema
} from "@shared/schema";
import { 
  validateDomain, 
  DomainValidationError, 
  enhancedDomainConfigurationSchema 
} from "./domain-validation";
import { v4 as uuidv4 } from "uuid";
import { createRateLimitMiddleware, contactFormLimiter } from "./rate-limiter";
import bcrypt from "bcrypt";

// Initialize Stripe (if configured)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Permission checking middleware
interface TeamMemberSession {
  teamMemberId: string;
  permissions: string[];
  clientId: string;
}

// Admin authentication middleware - checks for SUPER_ADMIN role
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Admin authentication required" });
    }

    // In production, this would verify a JWT token
    // For demo, we check against a simple user session stored in header
    const userSession = req.headers['x-admin-user'];
    if (!userSession) {
      return res.status(401).json({ error: "Admin user session required" });
    }

    try {
      const userData = JSON.parse(userSession as string);
      if (!userData.role || userData.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Super admin privileges required" });
      }
      
      // Verify user exists in storage
      const user = await storage.getUserByEmail(userData.email);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Invalid admin credentials" });
      }

      req.adminUser = userData;
      next();
    } catch (parseError) {
      return res.status(401).json({ error: "Invalid admin session format" });
    }
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ error: "Admin authentication failed" });
  }
};

const requirePermission = (requiredPermission: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      // Check if request has team member session data
      const teamMemberSession = req.headers['x-team-member-session'];
      
      // First check if this is a business owner with full access
      // Business owners should bypass team member permission checking
      if (teamMemberSession) {
        try {
          const sessionData = JSON.parse(teamMemberSession as string);
          
          // If session has full permissions (*), this is a business owner - grant access
          if (sessionData.permissions && sessionData.permissions.includes('*')) {
            console.log(`Business owner access granted for ${requiredPermission}`);
            return next();
          }
          
          // Verify client ID matches for team members
          const { clientId } = req.params;
          if (!clientId || sessionData.clientId !== clientId) {
            return res.status(403).json({ error: "Access denied: Client ID mismatch or missing" });
          }

          // Check if team member has required permission
          if (!sessionData.permissions.includes(requiredPermission)) {
            return res.status(403).json({ 
              error: `Access denied: Missing required permission '${requiredPermission}'` 
            });
          }

          // Permission granted for team member
          return next();
        } catch (parseError) {
          return res.status(401).json({ error: "Invalid team member session format" });
        }
      }
      
      // No authentication provided
      return res.status(401).json({ error: "Authentication required: Missing team member session" });
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Permission validation failed" });
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable JSON parsing
  app.use(express.json());

  // CORS headers for all routes
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Team-Member-Session");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", service: "SaaS Platform API" });
  });

  // =============================================================================
  // STRIPE PAYMENT ROUTES
  // =============================================================================
  
  // Create payment intent for plan purchase
  app.post("/api/payments/create-payment-intent", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    try {
      const { planId, clientEmail, billingPeriod = 'monthly' } = req.body;
      
      const plan = await storage.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      // Calculate amount based on user's selected billing period with backwards compatibility
      let amount = 0;
      let finalBillingPeriod = billingPeriod;
      
      // Handle new schema format
      if (plan.monthlyPrice !== undefined || plan.yearlyPrice !== undefined) {
        const requestedPrice = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
        const requestedDiscount = billingPeriod === 'monthly' ? (plan.monthlyDiscount || 0) : (plan.yearlyDiscount || 0);
        const requestedEnabled = billingPeriod === 'monthly' ? (plan.monthlyEnabled !== false) : (plan.yearlyEnabled !== false);
        
        if (requestedEnabled && requestedPrice) {
          // Use requested billing period
          amount = requestedPrice * (1 - requestedDiscount / 100);
        } else {
          // Fallback to any available billing period
          if (plan.monthlyEnabled && plan.monthlyPrice) {
            amount = plan.monthlyPrice * (1 - (plan.monthlyDiscount || 0) / 100);
            finalBillingPeriod = 'monthly';
          } else if (plan.yearlyEnabled && plan.yearlyPrice) {
            amount = plan.yearlyPrice * (1 - (plan.yearlyDiscount || 0) / 100);
            finalBillingPeriod = 'yearly';
          }
        }
      } else {
        // Handle old schema format (backwards compatibility)
        amount = (plan as any).price || 0;
      }
      
      // Validation: Ensure we have a valid amount
      if (amount <= 0) {
        return res.status(400).json({ 
          error: "No valid pricing available for this plan and billing period" 
        });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          planId: plan.id,
          planName: plan.name,
          clientEmail: clientEmail,
          billingPeriod: finalBillingPeriod
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        planName: plan.name,
        amount: amount,
        billingPeriod: finalBillingPeriod
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Handle successful payment
  app.post("/api/payments/confirm", async (req, res) => {
    try {
      const { paymentIntentId, clientId } = req.body;
      
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Update client status to ACTIVE
        const planId = paymentIntent.metadata.planId;
        if (clientId && planId) {
          await storage.updateClient(clientId, { 
            status: "ACTIVE", 
            planId: planId 
          });
        }
        
        res.json({ success: true, status: paymentIntent.status });
      } else {
        res.json({ success: false, status: paymentIntent.status });
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // =============================================================================
  // SECURE STRIPE CONFIGURATION ROUTES
  // =============================================================================

  // Get Stripe configuration status (PUBLIC KEY ONLY - NO SECRET EXPOSURE)
  app.get("/api/client/:clientId/stripe-status", requirePermission('stripe.view'), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      const isConfigured = await storage.validateStripeConfig(clientId);
      const publicKey = await storage.getStripePublicKey(clientId);
      
      res.json({
        isConfigured,
        hasValidKeys: isConfigured,
        publicKey: publicKey // Only return public key
        // NEVER expose secret key to frontend
      });
    } catch (error) {
      console.error("Error fetching Stripe status:", error);
      res.status(500).json({ error: "Failed to fetch Stripe status" });
    }
  });

  // Save Stripe configuration (SECURE SECRET KEY HANDLING)
  app.post("/api/client/:clientId/stripe-config", requirePermission('stripe.edit'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { stripePublicKey, stripeSecretKey } = req.body;

      // Validate Stripe keys format
      if (!stripePublicKey?.startsWith('pk_')) {
        return res.status(400).json({ error: "Invalid Stripe public key format" });
      }
      if (!stripeSecretKey?.startsWith('sk_')) {
        return res.status(400).json({ error: "Invalid Stripe secret key format" });
      }

      // Store securely (secret key should be encrypted in production)
      await storage.updateStripeConfig(clientId, stripePublicKey, stripeSecretKey);

      res.json({ 
        success: true, 
        message: "Stripe configuration saved securely",
        publicKey: stripePublicKey // Only return public key in response
      });
    } catch (error) {
      console.error("Error saving Stripe config:", error);
      res.status(500).json({ error: "Failed to save Stripe configuration" });
    }
  });

  // =============================================================================
  // SECURE PAYMENT DASHBOARD ROUTES  
  // =============================================================================

  // Get client payments (SECURE - FILTERED BY CLIENT)
  app.get("/api/client/:clientId/payments", requirePermission('payments.view'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const payments = await storage.getPayments(clientId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // =============================================================================
  // STRIPE PRODUCT GENERATION FOR SERVICES
  // =============================================================================

  // Generate new Stripe product and price for a service
  app.post("/api/client/:clientId/generate-stripe-product", requirePermission('services.edit'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { name, price, description } = req.body;

      // Enhanced input validation
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ 
          error: "Invalid name: Must be a string with at least 2 characters" 
        });
      }

      if (!description || typeof description !== 'string' || description.trim().length < 10) {
        return res.status(400).json({ 
          error: "Invalid description: Must be a string with at least 10 characters" 
        });
      }

      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({ 
          error: "Invalid price: Must be a positive number" 
        });
      }

      const numericPrice = parseFloat(price);
      
      // Validate reasonable price limits (cents conversion safe)
      if (numericPrice > 99999.99) {
        return res.status(400).json({ 
          error: "Price too high: Maximum allowed is $99,999.99" 
        });
      }

      if (numericPrice < 0.50) {
        return res.status(400).json({ 
          error: "Price too low: Minimum allowed is $0.50" 
        });
      }

      // Verify client exists
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Get client's Stripe configuration with enhanced validation
      const isConfigured = await storage.validateStripeConfig(clientId);
      if (!isConfigured) {
        return res.status(400).json({ 
          error: "Stripe not configured for this client",
          details: "Please configure your Stripe keys in payment settings first"
        });
      }

      const stripeSecretKey = await storage.getStripeSecretKey(clientId);
      if (!stripeSecretKey) {
        return res.status(400).json({ 
          error: "Stripe secret key not found",
          details: "Missing Stripe secret key configuration"
        });
      }

      // Validate Stripe secret key format
      if (!stripeSecretKey.startsWith('sk_')) {
        return res.status(400).json({ 
          error: "Invalid Stripe secret key format",
          details: "Stripe secret key must start with 'sk_'"
        });
      }

      // Initialize client-specific Stripe instance (CRITICAL SECURITY FIX)
      const clientStripe = new Stripe(stripeSecretKey);

      // Create Stripe product with sanitized input
      const product = await clientStripe.products.create({
        name: name.trim(),
        description: description.trim(),
        type: 'service',
        metadata: {
          client_id: clientId,
          created_via: 'saas_platform_auto_generation'
        }
      });

      // Create Stripe price with proper cent conversion
      const stripePrice = await clientStripe.prices.create({
        product: product.id,
        unit_amount: Math.round(numericPrice * 100), // Ensure proper cents conversion
        currency: 'usd',
        metadata: {
          client_id: clientId,
          original_price: numericPrice.toString()
        }
      });

      res.json({
        success: true,
        productId: product.id,
        priceId: stripePrice.id,
        message: `Stripe product "${name.trim()}" created successfully`,
        details: {
          price_in_cents: Math.round(numericPrice * 100),
          price_formatted: `$${numericPrice.toFixed(2)}`
        }
      });

    } catch (error: any) {
      console.error('Error generating Stripe product:', error);
      
      // Handle specific Stripe errors
      if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ 
          error: "Stripe API error",
          details: error.message
        });
      }
      
      if (error.type === 'StripeAuthenticationError') {
        return res.status(401).json({ 
          error: "Invalid Stripe credentials",
          details: "Please check your Stripe secret key configuration"
        });
      }

      res.status(500).json({ 
        error: "Failed to generate Stripe product",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // =============================================================================
  // SECURE BOOKING PAYMENT ROUTES (SERVER-SIDE AMOUNT CALCULATION)
  // =============================================================================

  // Create payment intent with SERVER-SIDE amount calculation
  app.post("/api/bookings/payment-intent", async (req, res) => {
    try {
      const { clientId, serviceId, tipPercentage, customerEmail, customerName } = req.body;

      // CRITICAL: Calculate amount SERVER-SIDE (never trust client)
      const baseAmount = await storage.calculateServiceAmount(clientId, serviceId);
      const totalAmount = await storage.calculateTotalWithTip(baseAmount, tipPercentage);

      // Verify client has valid Stripe configuration
      const isConfigured = await storage.validateStripeConfig(clientId);
      if (!isConfigured) {
        return res.status(400).json({ error: "Stripe not configured for this business" });
      }

      // Determine which Stripe instance to use: client-specific or global
      let stripeInstance = null;
      const client = await storage.getClient(clientId);
      
      // Try client-specific configuration first
      if (client?.stripeSecretKey) {
        try {
          stripeInstance = new Stripe(client.stripeSecretKey);
          // Test the key with a simple operation to ensure it's valid
          await stripeInstance.balance.retrieve();
        } catch (error: any) {
          console.warn(`Client Stripe key failed (${error.message}), falling back to global config`);
          stripeInstance = null;
          // Clear the invalid client-specific key
          await storage.clearStripeConfig(clientId);
        }
      }
      
      // Fall back to global Stripe configuration if client config failed or doesn't exist
      if (!stripeInstance && process.env.STRIPE_SECRET_KEY) {
        try {
          stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
          // Test the global key
          await stripeInstance.balance.retrieve();
        } catch (error: any) {
          console.error(`Global Stripe key also failed: ${error.message}`);
          return res.status(500).json({ error: "No valid Stripe configuration available" });
        }
      }
      
      if (!stripeInstance) {
        return res.status(500).json({ error: "No Stripe configuration found" });
      }

      // Create payment intent with server-calculated amount
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          clientId,
          serviceId,
          baseAmount: baseAmount.toString(),
          tipPercentage: tipPercentage?.toString() || '0',
          customerEmail,
          customerName
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount,
        baseAmount,
        tipAmount: totalAmount - baseAmount,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Confirm booking payment and create appointment + payment record
  app.post("/api/bookings/confirm", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const { 
        paymentIntentId, 
        customerName, 
        customerEmail, 
        customerPhone,
        appointmentDate,
        startTime,
        endTime,
        notes 
      } = req.body;

      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not successful" });
      }

      const { clientId, serviceId, baseAmount } = paymentIntent.metadata;
      const totalAmount = paymentIntent.amount / 100; // Convert from cents

      // Create appointment record
      const appointment = await storage.createAppointment({
        clientId,
        customerName,
        customerEmail,
        customerPhone,
        serviceId,
        appointmentDate: new Date(appointmentDate),
        startTime,
        endTime,
        notes,
        totalPrice: totalAmount,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        paymentIntentId,
        status: "CONFIRMED"
      });

      // Create payment record
      const payment = await storage.createPayment({
        clientId,
        appointmentId: appointment.id,
        paymentMethod: "STRIPE",
        paymentProvider: "stripe",
        paymentIntentId,
        amount: totalAmount,
        currency: "USD",
        status: "COMPLETED",
        customerName,
        customerEmail,
        description: `Service payment - ${customerName}`,
        processingFee: totalAmount * 0.029 + 0.30, // 2.9% + $0.30
        netAmount: totalAmount - (totalAmount * 0.029 + 0.30),
        paidAt: new Date()
      });

      res.json({ 
        success: true, 
        appointment, 
        payment,
        message: "Booking confirmed and payment processed" 
      });
    } catch (error) {
      console.error("Error confirming booking payment:", error);
      res.status(500).json({ error: "Failed to confirm booking payment" });
    }
  });

  // =============================================================================
  // SUBSCRIPTION MANAGEMENT ROUTES
  // =============================================================================

  // Get current subscription details
  app.get("/api/client/:clientId/subscription", requirePermission('subscription.view'), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Get client data to get current plan
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Get plan details
      const plan = await storage.getPlan(client.planId);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      // Mock subscription details (in production, fetch from Stripe)
      const subscription = {
        id: `sub_${clientId}`,
        planId: plan.id,
        planName: plan.name,
        planPrice: plan.monthlyPrice || 0,
        billing: "monthly", // Default billing period
        status: client.status,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        features: plan.features,
        maxUsers: plan.maxUsers,
        storageGB: plan.storageGB,
        stripeSubscriptionId: client.stripeSubscriptionId,
        trialEndsAt: client.status === 'TRIAL' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null,
        cancelAtPeriodEnd: false
      };

      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription details" });
    }
  });

  // Update subscription plan
  app.post("/api/client/:clientId/subscription/update-plan", requirePermission('subscription.edit'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      // Verify the plan exists
      const newPlan = await storage.getPlan(planId);
      if (!newPlan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      // Get current client
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Update client's plan
      await storage.updateClient(clientId, { 
        planId: newPlan.id,
        status: "ACTIVE" // Activate the new plan
      });

      // In production, update Stripe subscription here
      if (stripe && client.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.update(client.stripeSubscriptionId, {
            items: [{
              id: client.stripeSubscriptionId, // This would be the subscription item ID
              price: newPlan.monthlyStripePriceId || undefined
            }],
            proration_behavior: 'always_invoice'
          });
        } catch (stripeError) {
          console.error("Stripe subscription update error:", stripeError);
          // Could rollback the database change here if needed
        }
      }

      res.json({ 
        success: true, 
        message: "Subscription plan updated successfully",
        newPlan: {
          id: newPlan.id,
          name: newPlan.name,
          price: newPlan.monthlyPrice || 0
        }
      });
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ error: "Failed to update subscription plan" });
    }
  });

  // Cancel subscription
  app.post("/api/client/:clientId/subscription/cancel", requirePermission('subscription.edit'), async (req, res) => {
    try {
      const { clientId } = req.params;

      // Get current client
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Update client status to cancelled
      await storage.updateClient(clientId, { 
        status: "CANCELLED"
      });

      // In production, cancel Stripe subscription here
      if (stripe && client.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.update(client.stripeSubscriptionId, {
            cancel_at_period_end: true
          });
        } catch (stripeError) {
          console.error("Stripe subscription cancellation error:", stripeError);
        }
      }

      res.json({ 
        success: true, 
        message: "Subscription cancelled successfully. You'll retain access until the end of your billing period."
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Get payment methods
  app.get("/api/client/:clientId/payment-methods", requirePermission('payments.view'), async (req, res) => {
    try {
      const { clientId } = req.params;

      // Get current client
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Mock payment methods (in production, fetch from Stripe)
      const paymentMethods = [
        {
          id: "pm_1234567890",
          brand: "visa",
          last4: "4242",
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true
        }
      ];

      // In production, fetch from Stripe
      if (stripe && client.stripeCustomerId) {
        try {
          const stripePaymentMethods = await stripe.paymentMethods.list({
            customer: client.stripeCustomerId,
            type: 'card'
          });
          
          const formattedMethods = stripePaymentMethods.data.map(pm => ({
            id: pm.id,
            brand: pm.card?.brand || 'unknown',
            last4: pm.card?.last4 || '0000',
            expiryMonth: pm.card?.exp_month || 1,
            expiryYear: pm.card?.exp_year || 2025,
            isDefault: false // Would need to check default payment method
          }));

          return res.json(formattedMethods);
        } catch (stripeError) {
          console.error("Stripe payment methods error:", stripeError);
          // Fall back to mock data
        }
      }

      res.json(paymentMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  // Update payment method
  app.post("/api/client/:clientId/subscription/update-payment", requirePermission('payments.edit'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { paymentMethodId, setAsDefault } = req.body;

      // Get current client
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // In production, update Stripe payment method here
      if (stripe && client.stripeCustomerId && paymentMethodId) {
        try {
          // Attach payment method to customer
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: client.stripeCustomerId
          });

          // Set as default if requested
          if (setAsDefault) {
            await stripe.customers.update(client.stripeCustomerId, {
              invoice_settings: {
                default_payment_method: paymentMethodId
              }
            });
          }
        } catch (stripeError) {
          console.error("Stripe payment method update error:", stripeError);
          return res.status(400).json({ error: "Failed to update payment method with Stripe" });
        }
      }

      res.json({ 
        success: true, 
        message: "Payment method updated successfully"
      });
    } catch (error) {
      console.error("Error updating payment method:", error);
      res.status(500).json({ error: "Failed to update payment method" });
    }
  });

  // Get billing history
  app.get("/api/client/:clientId/billing-history", requirePermission('payments.view'), async (req, res) => {
    try {
      const { clientId } = req.params;

      // Get current client
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Mock billing history (in production, fetch from Stripe invoices)
      const billingHistory = [
        {
          id: "inv_1234567890",
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          amount: 79.00,
          status: "PAID",
          description: "Professional Plan - Monthly",
          invoiceUrl: "https://invoice.stripe.com/example"
        },
        {
          id: "inv_0987654321",
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
          amount: 79.00,
          status: "PAID",
          description: "Professional Plan - Monthly",
          invoiceUrl: "https://invoice.stripe.com/example2"
        }
      ];

      // In production, fetch from Stripe
      if (stripe && client.stripeCustomerId) {
        try {
          const invoices = await stripe.invoices.list({
            customer: client.stripeCustomerId,
            limit: 20
          });

          const formattedHistory = invoices.data.map(invoice => ({
            id: invoice.id,
            date: new Date(invoice.created * 1000).toISOString(),
            amount: invoice.amount_paid / 100, // Convert from cents
            status: invoice.status === 'paid' ? 'PAID' : invoice.status?.toUpperCase() || 'UNKNOWN',
            description: invoice.description || 'Subscription Payment',
            invoiceUrl: invoice.hosted_invoice_url
          }));

          return res.json(formattedHistory);
        } catch (stripeError) {
          console.error("Stripe invoices error:", stripeError);
          // Fall back to mock data
        }
      }

      res.json(billingHistory);
    } catch (error) {
      console.error("Error fetching billing history:", error);
      res.status(500).json({ error: "Failed to fetch billing history" });
    }
  });

  // Create SetupIntent for secure payment method updates (PCI COMPLIANT)
  app.post("/api/client/:clientId/setup-intent", requirePermission('payments.edit'), async (req, res) => {
    try {
      const { clientId } = req.params;

      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      // Get current client
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Create or get Stripe customer
      let customerId = client.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: client.email,
          name: client.contactPerson,
          metadata: {
            clientId: client.id,
            businessName: client.businessName
          }
        });
        customerId = customer.id;
        
        // Update client with Stripe customer ID
        await storage.updateClient(clientId, { stripeCustomerId: customerId });
      }

      // Create SetupIntent for future payments
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session', // For future payments
        metadata: {
          clientId: client.id
        }
      });

      res.json({
        success: true,
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
        message: "SetupIntent created successfully for secure payment method update"
      });
    } catch (error) {
      console.error("Error creating SetupIntent:", error);
      res.status(500).json({ error: "Failed to create secure payment setup" });
    }
  });

  // Confirm SetupIntent and save payment method
  app.post("/api/client/:clientId/confirm-setup-intent", requirePermission('payments.edit'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { setupIntentId, setAsDefault } = req.body;

      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      // Get current client
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Retrieve the SetupIntent to get the payment method
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      
      if (setupIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "SetupIntent not completed successfully" });
      }

      const paymentMethodId = setupIntent.payment_method as string;

      // Set as default payment method if requested
      if (setAsDefault && client.stripeCustomerId) {
        await stripe.customers.update(client.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
      }

      res.json({
        success: true,
        message: "Payment method saved successfully",
        paymentMethodId: paymentMethodId
      });
    } catch (error) {
      console.error("Error confirming SetupIntent:", error);
      res.status(500).json({ error: "Failed to confirm payment method setup" });
    }
  });

  // =============================================================================
  // AUTHENTICATION ROUTES
  // =============================================================================

  // Super Admin Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // For demo purposes, we'll send back the user info (in production use JWT)
      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        message: "Login successful"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Client Login
  app.post("/api/auth/client-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== "CLIENT") {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const client = await storage.getClientByEmail(email);
      if (!client) {
        return res.status(404).json({ error: "Client profile not found" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        client: client,
        message: "Client login successful"
      });
    } catch (error) {
      console.error("Client login error:", error);
      res.status(500).json({ error: "Client login failed" });
    }
  });

  // =============================================================================
  // SUPER ADMIN ROUTES - Plans Management
  // =============================================================================

  // Get all plans
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.getPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  // Create new plan
  app.post("/api/plans", async (req, res) => {
    try {
      const planData = insertPlanSchema.parse(req.body);
      const plan = await storage.createPlan(planData);
      res.json(plan);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(500).json({ error: "Failed to create plan" });
    }
  });

  // Update plan
  app.put("/api/plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const plan = await storage.updatePlan(id, updates);
      res.json(plan);
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ error: "Failed to update plan" });
    }
  });

  // Delete plan
  app.delete("/api/plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePlan(id);
      res.json({ message: "Plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ error: "Failed to delete plan" });
    }
  });

  // =============================================================================
  // SUPER ADMIN ROUTES - Contact Messages / Website Leads
  // =============================================================================

  // Get all contact messages for super admin
  app.get("/api/contact-messages", async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      res.status(500).json({ error: "Failed to fetch contact messages" });
    }
  });

  // Handle contact form submission from website
  app.post("/api/contact", createRateLimitMiddleware(contactFormLimiter), async (req, res) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      
      console.log("📧 New contact form submission:", {
        id: message.id,
        name: message.name,
        email: message.email,
        subject: message.subject
      });
      
      res.json({ 
        message: "Contact form submitted successfully",
        id: message.id 
      });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "Failed to submit contact form" });
    }
  });

  // Update contact message status/notes (for super admin)
  app.put("/api/contact-messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const message = await storage.updateContactMessage(id, updates);
      res.json(message);
    } catch (error) {
      console.error("Error updating contact message:", error);
      res.status(500).json({ error: "Failed to update contact message" });
    }
  });

  // Delete contact message
  app.delete("/api/contact-messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteContactMessage(id);
      res.json({ message: "Contact message deleted successfully" });
    } catch (error) {
      console.error("Error deleting contact message:", error);
      res.status(500).json({ error: "Failed to delete contact message" });
    }
  });

  // =============================================================================
  // SUPER ADMIN ROUTES - Review Platforms Management
  // =============================================================================

  // Get all review platforms
  app.get("/api/review-platforms", async (req, res) => {
    try {
      const platforms = await storage.getReviewPlatforms();
      res.json(platforms);
    } catch (error) {
      console.error("Error fetching review platforms:", error);
      res.status(500).json({ error: "Failed to fetch review platforms" });
    }
  });

  // Create new review platform
  app.post("/api/review-platforms", async (req, res) => {
    try {
      const platformData = insertReviewPlatformSchema.parse(req.body);
      const platform = await storage.createReviewPlatform(platformData);
      res.json(platform);
    } catch (error) {
      console.error("Error creating review platform:", error);
      res.status(500).json({ error: "Failed to create review platform" });
    }
  });

  // Update review platform
  app.put("/api/review-platforms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const platform = await storage.updateReviewPlatform(id, updates);
      res.json(platform);
    } catch (error) {
      console.error("Error updating review platform:", error);
      res.status(500).json({ error: "Failed to update review platform" });
    }
  });

  // Delete review platform
  app.delete("/api/review-platforms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReviewPlatform(id);
      res.json({ message: "Review platform deleted successfully" });
    } catch (error) {
      console.error("Error deleting review platform:", error);
      res.status(500).json({ error: "Failed to delete review platform" });
    }
  });

  // =============================================================================
  // CLIENT ROUTES - Review Platform Connections (Real Review Data)
  // =============================================================================

  // Get review platform connections for a client
  app.get("/api/clients/:clientId/review-connections", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const connections = await storage.getReviewPlatformConnections(clientId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching review platform connections:", error);
      res.status(500).json({ error: "Failed to fetch review platform connections" });
    }
  });

  // Create new review platform connection
  app.post("/api/clients/:clientId/review-connections", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const connectionData = insertReviewPlatformConnectionSchema.parse({
        ...req.body,
        clientId
      });
      const connection = await storage.createReviewPlatformConnection(connectionData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating review platform connection:", error);
      res.status(500).json({ error: "Failed to create review platform connection" });
    }
  });

  // Update review platform connection
  app.put("/api/clients/:clientId/review-connections/:id", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const connection = await storage.updateReviewPlatformConnection(id, updates);
      res.json(connection);
    } catch (error) {
      console.error("Error updating review platform connection:", error);
      res.status(500).json({ error: "Failed to update review platform connection" });
    }
  });

  // Delete review platform connection
  app.delete("/api/clients/:clientId/review-connections/:id", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReviewPlatformConnection(id);
      res.json({ message: "Review platform connection deleted successfully" });
    } catch (error) {
      console.error("Error deleting review platform connection:", error);
      res.status(500).json({ error: "Failed to delete review platform connection" });
    }
  });

  // Sync review platform data
  app.post("/api/clients/:clientId/review-connections/:id/sync", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { id } = req.params;
      const connection = await storage.syncReviewPlatformData(id);
      res.json(connection);
    } catch (error) {
      console.error("Error syncing review platform data:", error);
      res.status(500).json({ error: "Failed to sync review platform data" });
    }
  });

  // =============================================================================
  // CLIENT ROUTES - Platform Reviews (Individual Review Data)
  // =============================================================================

  // Get platform reviews for a client
  app.get("/api/clients/:clientId/platform-reviews", requirePermission("VIEW_REVIEWS"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { platform } = req.query;
      const reviews = await storage.getPlatformReviews(clientId, platform as string);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching platform reviews:", error);
      res.status(500).json({ error: "Failed to fetch platform reviews" });
    }
  });

  // Create new platform review
  app.post("/api/clients/:clientId/platform-reviews", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const reviewData = insertPlatformReviewSchema.parse({
        ...req.body,
        clientId
      });
      const review = await storage.createPlatformReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating platform review:", error);
      res.status(500).json({ error: "Failed to create platform review" });
    }
  });

  // Update platform review (typically for business responses)
  app.put("/api/clients/:clientId/platform-reviews/:id", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const review = await storage.updatePlatformReview(id, updates);
      res.json(review);
    } catch (error) {
      console.error("Error updating platform review:", error);
      res.status(500).json({ error: "Failed to update platform review" });
    }
  });

  // Delete platform review
  app.delete("/api/clients/:clientId/platform-reviews/:id", requirePermission("MANAGE_REVIEWS"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePlatformReview(id);
      res.json({ message: "Platform review deleted successfully" });
    } catch (error) {
      console.error("Error deleting platform review:", error);
      res.status(500).json({ error: "Failed to delete platform review" });
    }
  });

  // =============================================================================
  // SUPER ADMIN ROUTES - Review Analytics & Management
  // =============================================================================

  // Get all platform reviews across all clients (for super admin analytics)
  app.get("/api/admin/platform-reviews", requireAdmin, async (req, res) => {
    try {
      const { platform, clientId } = req.query;
      
      if (clientId) {
        const reviews = await storage.getPlatformReviews(clientId as string, platform as string);
        res.json(reviews);
      } else {
        // Get all reviews across all clients for super admin dashboard
        const clients = await storage.getClients();
        const allReviews = [];
        
        for (const client of clients) {
          const clientReviews = await storage.getPlatformReviews(client.id, platform as string);
          allReviews.push(...clientReviews);
        }
        
        res.json(allReviews);
      }
    } catch (error) {
      console.error("Error fetching admin platform reviews:", error);
      res.status(500).json({ error: "Failed to fetch platform reviews" });
    }
  });

  // Get review analytics summary for super admin
  app.get("/api/admin/review-analytics", requireAdmin, async (req, res) => {
    try {
      const clients = await storage.getClients();
      const analytics = [];
      
      for (const client of clients) {
        const connections = await storage.getReviewPlatformConnections(client.id);
        const reviews = await storage.getPlatformReviews(client.id);
        
        const clientAnalytics = {
          clientId: client.id,
          clientName: client.businessName,
          totalConnections: connections.length,
          activeConnections: connections.filter(c => c.isActive).length,
          totalReviews: reviews.length,
          averageRating: reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
            : 0,
          platforms: connections.map(conn => ({
            platform: conn.platform,
            isActive: conn.isActive,
            averageRating: conn.averageRating,
            totalReviews: conn.totalReviews,
            lastSyncAt: conn.lastSyncAt
          }))
        };
        
        analytics.push(clientAnalytics);
      }
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching review analytics:", error);
      res.status(500).json({ error: "Failed to fetch review analytics" });
    }
  });

  // =============================================================================
  // SUPER ADMIN ROUTES - Client Management
  // =============================================================================

  // Get all clients
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      
      // Enhance with plan information and revenue calculation
      const enhancedClients = await Promise.all(
        clients.map(async (client) => {
          const plan = await storage.getPlan(client.planId);
          return {
            ...client,
            plan: plan ? plan.name : "Unknown",
            planPrice: plan ? (plan.monthlyPrice || 0) : 0,
            monthlyRevenue: plan ? (plan.monthlyPrice || 0) : 0
          };
        })
      );
      
      res.json(enhancedClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // Create new client
  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  // Update client
  app.put("/api/clients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const client = await storage.updateClient(id, updates);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  // Delete client
  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClient(id);
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // =============================================================================
  // SUPER ADMIN ROUTES - Analytics
  // =============================================================================

  // Revenue analytics
  app.get("/api/analytics/revenue", async (req, res) => {
    try {
      const clients = await storage.getClients();
      const plans = await storage.getPlans();
      
      let totalMRR = 0;
      const planDistribution: { [key: string]: number } = {};
      
      for (const client of clients) {
        const plan = plans.find(p => p.id === client.planId);
        if (plan && client.status === "ACTIVE") {
          totalMRR += (plan.monthlyPrice || 0);
          planDistribution[plan.name] = (planDistribution[plan.name] || 0) + 1;
        }
      }
      
      // Generate sample time series data for charts
      const now = new Date();
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyData.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: totalMRR * (0.8 + Math.random() * 0.4), // Simulate growth
          clients: Math.floor(clients.length * (0.7 + i * 0.05))
        });
      }
      
      res.json({
        totalMRR,
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === "ACTIVE").length,
        averageRevenuePerClient: clients.length > 0 ? totalMRR / clients.length : 0,
        planDistribution,
        monthlyData,
        churnRate: 2.5, // Sample churn rate
      });
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Client analytics
  app.get("/api/analytics/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      
      const statusDistribution = clients.reduce((acc, client) => {
        acc[client.status] = (acc[client.status] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
      
      const industryDistribution = clients.reduce((acc, client) => {
        const industry = client.industry || "Other";
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
      
      res.json({
        statusDistribution,
        industryDistribution,
        totalClients: clients.length,
        newClientsThisMonth: Math.floor(clients.length * 0.2), // Sample data
      });
    } catch (error) {
      console.error("Error fetching client analytics:", error);
      res.status(500).json({ error: "Failed to fetch client analytics" });
    }
  });

  // =============================================================================
  // ONBOARDING ROUTES
  // =============================================================================

  // Get all onboarding sessions (Super Admin)
  app.get("/api/onboarding/sessions", async (req, res) => {
    try {
      const sessions = await storage.getOnboardingSessions();
      
      // Enhance with plan information
      const enhancedSessions = await Promise.all(
        sessions.map(async (session) => {
          const plan = await storage.getPlan(session.planId);
          return {
            ...session,
            planName: plan ? plan.name : "Unknown",
            businessData: session.businessData ? JSON.parse(session.businessData) : null
          };
        })
      );
      
      res.json(enhancedSessions);
    } catch (error) {
      console.error("Error fetching onboarding sessions:", error);
      res.status(500).json({ error: "Failed to fetch onboarding sessions" });
    }
  });

  // Get onboarding analytics
  app.get("/api/onboarding/analytics", async (req, res) => {
    try {
      const sessions = await storage.getOnboardingSessions();
      
      const completionRate = sessions.length > 0 
        ? (sessions.filter(s => s.isCompleted).length / sessions.length) * 100 
        : 0;
      
      const stepAnalysis = {
        step1: sessions.filter(s => (s.currentStep || 1) >= 1).length,
        step2: sessions.filter(s => (s.currentStep || 1) >= 2).length,
        step3: sessions.filter(s => (s.currentStep || 1) >= 3).length,
        step4: sessions.filter(s => (s.currentStep || 1) >= 4).length,
        step5: sessions.filter(s => (s.currentStep || 1) >= 5).length,
        step6: sessions.filter(s => (s.currentStep || 1) >= 6).length,
        completed: sessions.filter(s => s.isCompleted).length,
      };
      
      res.json({
        totalSessions: sessions.length,
        completionRate: Math.round(completionRate),
        averageCompletionTime: "12 minutes", // Sample data
        dropOffPoints: [
          { step: "Step 2: Business Info", dropoff: "15%" },
          { step: "Step 4: Payment", dropoff: "35%" },
          { step: "Step 5: Setup", dropoff: "8%" }
        ],
        stepAnalysis
      });
    } catch (error) {
      console.error("Error fetching onboarding analytics:", error);
      res.status(500).json({ error: "Failed to fetch onboarding analytics" });
    }
  });

  // =============================================================================
  // PUBLIC WEBSITE & ONBOARDING ROUTES
  // =============================================================================

  // Get public plans for website
  app.get("/api/public/plans", async (req, res) => {
    try {
      const plans = await storage.getPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching public plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  // Start onboarding session
  app.post("/api/onboarding/start", async (req, res) => {
    try {
      const { planId } = req.body;
      const sessionId = uuidv4();
      
      const session = await storage.createOnboardingSession({
        sessionId,
        planId,
        currentStep: 1,
        businessData: null
      });
      
      res.json({ sessionId: session.sessionId, session });
    } catch (error) {
      console.error("Error starting onboarding:", error);
      res.status(500).json({ error: "Failed to start onboarding" });
    }
  });

  // Get onboarding session
  app.get("/api/onboarding/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getOnboardingSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Onboarding session not found" });
      }
      
      const plan = await storage.getPlan(session.planId);
      
      res.json({
        ...session,
        plan,
        businessData: session.businessData ? JSON.parse(session.businessData) : null
      });
    } catch (error) {
      console.error("Error fetching onboarding session:", error);
      res.status(500).json({ error: "Failed to fetch onboarding session" });
    }
  });

  // Save step data
  app.put("/api/onboarding/:sessionId/step/:stepNumber", async (req, res) => {
    try {
      const { sessionId, stepNumber } = req.params;
      const stepData = req.body;
      
      const session = await storage.getOnboardingSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Onboarding session not found" });
      }
      
      // Merge new step data with existing business data
      const existingData = session.businessData ? JSON.parse(session.businessData) : {};
      const updatedData = { ...existingData, [`step${stepNumber}`]: stepData };
      
      const updatedSession = await storage.updateOnboardingSession(sessionId, {
        currentStep: Math.max(parseInt(stepNumber), session.currentStep || 1),
        businessData: JSON.stringify(updatedData)
      });
      
      res.json(updatedSession);
    } catch (error) {
      console.error("Error saving step data:", error);
      res.status(500).json({ error: "Failed to save step data" });
    }
  });

  // Complete onboarding and create client
  app.post("/api/onboarding/:sessionId/complete", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = await storage.getOnboardingSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Onboarding session not found" });
      }
      
      const businessData = session.businessData ? JSON.parse(session.businessData) : {};
      
      // Create user account
      const user = await storage.createUser({
        email: businessData.step3?.adminEmail || businessData.step2?.businessEmail,
        password: businessData.step3?.password,
        role: "CLIENT"
      });
      
      // Create client
      const client = await storage.createClient({
        businessName: businessData.step2?.businessName,
        contactPerson: businessData.step2?.contactPerson,
        email: businessData.step2?.businessEmail,
        phone: businessData.step2?.phone,
        businessAddress: businessData.step2?.businessAddress,
        industry: businessData.step2?.industry,
        businessDescription: businessData.step5?.businessDescription,
        operatingHours: businessData.step5?.operatingHours ? JSON.stringify(businessData.step5.operatingHours) : null,
        timeZone: businessData.step5?.timeZone,
        planId: session.planId,
        status: "TRIAL",
        userId: user.id,
        onboardingSessionId: session.id
      });
      
      // Mark onboarding as completed
      await storage.completeOnboarding(sessionId);
      
      res.json({
        message: "Onboarding completed successfully",
        client,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  // =============================================================================
  // PAYMENT ROUTES (Stripe Integration)
  // =============================================================================

  // Process payment
  app.post("/api/payment/process", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(400).json({ error: "Stripe not configured" });
      }
      
      const { amount, currency = "usd", paymentMethodId, planId } = req.body;
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        payment_method: paymentMethodId,
        confirm: true,
        return_url: `${req.headers.origin}/payment-success`
      });
      
      res.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status
        }
      });
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ error: "Payment processing failed" });
    }
  });

  // =============================================================================
  // CLIENT DASHBOARD ROUTES
  // =============================================================================

  // Get client dashboard data
  app.get("/api/client/:clientId/dashboard", async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const services = await storage.getClientServices(clientId);
      const appointments = await storage.getAppointments(clientId);
      const leads = await storage.getLeads(clientId);
      const operatingHours = await storage.getOperatingHours(clientId);
      const website = await storage.getClientWebsite(clientId);

      // Calculate dashboard metrics
      const thisMonth = new Date();
      const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
      
      const thisMonthAppointments = appointments.filter(a => 
        a.appointmentDate && new Date(a.appointmentDate) >= startOfMonth
      );
      const thisMonthRevenue = thisMonthAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
      const newLeadsThisMonth = leads.filter(l => 
        l.createdAt && new Date(l.createdAt) >= startOfMonth
      );

      res.json({
        client,
        services,
        appointments: appointments.slice(-10), // Recent 10 appointments
        leads: leads.slice(-10), // Recent 10 leads
        operatingHours,
        website,
        metrics: {
          totalAppointments: appointments.length,
          thisMonthAppointments: thisMonthAppointments.length,
          thisMonthRevenue,
          totalLeads: leads.length,
          newLeadsThisMonth: newLeadsThisMonth.length,
          conversionRate: leads.length > 0 ? 
            (leads.filter(l => l.convertedToAppointment).length / leads.length * 100) : 0
        }
      });
    } catch (error) {
      console.error("Error fetching client dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Client Services Management
  app.get("/api/client/:clientId/services", requirePermission('services.view'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const services = await storage.getClientServices(clientId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client services" });
    }
  });

  app.post("/api/client/:clientId/services", requirePermission('services.create'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { enableOnlinePayments, stripeProductId, stripePriceId, ...serviceData } = req.body;
      
      // Create the service
      const parsedServiceData = { ...insertClientServiceSchema.parse(serviceData), clientId };
      const service = await storage.createClientService(parsedServiceData);
      
      // If online payments are enabled and client has Stripe configured, create Stripe product
      if (enableOnlinePayments) {
        const client = await storage.getClient(clientId);
        
        if (client?.stripeSecretKey) {
          try {
            const clientStripe = new Stripe(client.stripeSecretKey);
            
            // Create Stripe product
            const product = await clientStripe.products.create({
              name: serviceData.name,
              description: serviceData.description || `${serviceData.name} service`,
              metadata: {
                clientId,
                serviceId: service.id
              }
            });
            
            // Create Stripe price
            const price = await clientStripe.prices.create({
              product: product.id,
              unit_amount: Math.round(parseFloat(serviceData.price) * 100), // Convert to cents
              currency: 'usd',
              metadata: {
                clientId,
                serviceId: service.id
              }
            });
            
            // Store Stripe IDs in the service (extend the service record)
            await storage.updateClientService(service.id, {
              stripeProductId: product.id,
              stripePriceId: price.id,
              enableOnlinePayments: true
            });
            
            // Return updated service with Stripe info
            res.json({
              ...service,
              stripeProductId: product.id,
              stripePriceId: price.id,
              enableOnlinePayments: true
            });
          } catch (stripeError) {
            console.error("Stripe product creation failed:", stripeError);
            // Service was created but Stripe failed - return service anyway
            res.json({
              ...service,
              enableOnlinePayments: false,
              warning: "Service created but Stripe integration failed"
            });
          }
        } else {
          // No Stripe configured - just return the service
          res.json({
            ...service,
            enableOnlinePayments: false,
            warning: "Stripe not configured for online payments"
          });
        }
      } else {
        res.json(service);
      }
    } catch (error) {
      console.error("Service creation error:", error);
      res.status(500).json({ error: "Failed to create service" });
    }
  });

  app.put("/api/client/:clientId/services/:serviceId", requirePermission('services.edit'), async (req, res) => {
    try {
      const { clientId, serviceId } = req.params;
      const { enableOnlinePayments, stripeProductId, stripePriceId, ...updates } = req.body;
      
      // Update the basic service info
      const service = await storage.updateClientService(serviceId, updates);
      
      // Handle Stripe integration updates
      if (enableOnlinePayments !== undefined) {
        const client = await storage.getClient(clientId);
        
        if (enableOnlinePayments && client?.stripeSecretKey) {
          try {
            const clientStripe = new Stripe(client.stripeSecretKey);
            
            let productId = stripeProductId;
            let priceId = stripePriceId;
            
            // Create or update Stripe product if needed
            if (!productId) {
              const product = await clientStripe.products.create({
                name: updates.name || service.name,
                description: updates.description || service.description || `${service.name} service`,
                metadata: {
                  clientId,
                  serviceId: service.id
                }
              });
              productId = product.id;
            } else {
              // Update existing product
              await clientStripe.products.update(productId, {
                name: updates.name || service.name,
                description: updates.description || service.description
              });
            }
            
            // Create new price if price changed or no price exists
            if (!priceId || updates.price) {
              const price = await clientStripe.prices.create({
                product: productId,
                unit_amount: Math.round(parseFloat(updates.price || service.price) * 100),
                currency: 'usd',
                metadata: {
                  clientId,
                  serviceId: service.id
                }
              });
              priceId = price.id;
              
              // Deactivate old price if it exists
              if (stripePriceId && stripePriceId !== priceId) {
                try {
                  await clientStripe.prices.update(stripePriceId, { active: false });
                } catch (e) {
                  console.warn("Failed to deactivate old price:", (e as Error).message);
                }
              }
            }
            
            // Update service with Stripe info
            await storage.updateClientService(serviceId, {
              stripeProductId: productId,
              stripePriceId: priceId,
              enableOnlinePayments: true
            });
            
            res.json({
              ...service,
              stripeProductId: productId,
              stripePriceId: priceId,
              enableOnlinePayments: true
            });
          } catch (stripeError) {
            console.error("Stripe update failed:", stripeError);
            res.json({
              ...service,
              enableOnlinePayments: false,
              warning: "Service updated but Stripe integration failed"
            });
          }
        } else {
          // Disable online payments
          await storage.updateClientService(serviceId, {
            enableOnlinePayments: false
          });
          res.json({
            ...service,
            enableOnlinePayments: false
          });
        }
      } else {
        res.json(service);
      }
    } catch (error) {
      console.error("Service update error:", error);
      res.status(500).json({ error: "Failed to update service" });
    }
  });

  app.delete("/api/client/:clientId/services/:serviceId", requirePermission('services.delete'), async (req, res) => {
    try {
      const { serviceId } = req.params;
      await storage.deleteClientService(serviceId);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  // =============================================================================
  // CLIENT STRIPE CONFIGURATION ROUTES
  // =============================================================================

  // Get client Stripe configuration
  app.get("/api/client/:clientId/stripe-config", requirePermission('payments.view'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Return configuration without exposing the full secret key
      const config = {
        stripePublicKey: client.stripePublicKey || "",
        stripeSecretKey: client.stripeSecretKey ? client.stripeSecretKey.substring(0, 8) + "••••••••" : "",
        stripeAccountId: client.stripeAccountId || "",
        isConnected: !!(client.stripePublicKey && client.stripeSecretKey)
      };

      res.json(config);
    } catch (error) {
      console.error("Error fetching Stripe config:", error);
      res.status(500).json({ error: "Failed to fetch Stripe configuration" });
    }
  });

  // Update client Stripe configuration
  app.put("/api/client/:clientId/stripe-config", requirePermission('payments.manage'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { stripePublicKey, stripeSecretKey } = req.body;

      // Basic validation
      if (!stripePublicKey || !stripeSecretKey) {
        return res.status(400).json({ error: "Both public and secret keys are required" });
      }

      if (!stripePublicKey.startsWith('pk_')) {
        return res.status(400).json({ error: "Invalid public key format" });
      }

      if (!stripeSecretKey.startsWith('sk_')) {
        return res.status(400).json({ error: "Invalid secret key format" });
      }

      // Update client with encrypted secret key (in production, encrypt this)
      const updatedClient = await storage.updateClient(clientId, {
        stripePublicKey,
        stripeSecretKey, // In production, encrypt this before storing
      });

      res.json({ 
        message: "Stripe configuration updated successfully",
        isConnected: true 
      });
    } catch (error) {
      console.error("Error updating Stripe config:", error);
      res.status(500).json({ error: "Failed to update Stripe configuration" });
    }
  });

  // Test client Stripe connection
  app.post("/api/client/:clientId/stripe-test", requirePermission('payments.manage'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      
      if (!client || !client.stripeSecretKey) {
        return res.status(400).json({ error: "Stripe not configured for this client" });
      }

      // Create a temporary Stripe instance with client's secret key
      const clientStripe = new Stripe(client.stripeSecretKey);
      
      // Test the connection by retrieving account information
      const account = await clientStripe.accounts.retrieve();
      
      res.json({ 
        success: true, 
        accountName: account.business_profile?.name || account.email || "Account verified",
        accountId: account.id
      });
    } catch (error) {
      console.error("Stripe connection test failed:", error);
      res.status(400).json({ 
        error: "Failed to connect to Stripe",
        details: (error as Error).message 
      });
    }
  });

  // =============================================================================
  // SMTP EMAIL CONFIGURATION ROUTES
  // =============================================================================

  // Get SMTP configuration (sanitized - no passwords)
  app.get("/api/client/:clientId/smtp-config", requirePermission('settings.view'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const config = await storage.getSmtpConfig(clientId);
      
      // Sanitize sensitive information
      const sanitizedConfig = {
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUsername: config.smtpUsername,
        smtpFromEmail: config.smtpFromEmail,
        smtpFromName: config.smtpFromName,
        smtpSecure: config.smtpSecure,
        smtpEnabled: config.smtpEnabled,
        isConfigured: !!(config.smtpHost && config.smtpPort && config.smtpUsername && config.smtpPassword && config.smtpFromEmail)
      };
      
      res.json(sanitizedConfig);
    } catch (error) {
      console.error('Get SMTP config error:', error);
      res.status(500).json({ error: 'Failed to get SMTP configuration' });
    }
  });

  // Update SMTP configuration
  app.put("/api/client/:clientId/smtp-config", requirePermission('settings.manage'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { smtpHost, smtpPort, smtpUsername, smtpPassword, smtpFromEmail, smtpFromName, smtpSecure, smtpEnabled } = req.body;

      // Validation
      if (smtpEnabled) {
        if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !smtpFromEmail) {
          return res.status(400).json({ error: 'All SMTP fields are required when enabled' });
        }
        
        if (smtpPort < 1 || smtpPort > 65535) {
          return res.status(400).json({ error: 'SMTP port must be between 1 and 65535' });
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(smtpFromEmail)) {
          return res.status(400).json({ error: 'Invalid from email address' });
        }
      }

      console.log('SMTP config update data:', { smtpHost, smtpPort, smtpUsername, smtpPassword: '***', smtpFromEmail, smtpFromName, smtpSecure, smtpEnabled });
      
      await storage.updateSmtpConfig(clientId, {
        smtpHost: smtpHost || undefined,
        smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
        smtpUsername: smtpUsername || undefined,
        smtpPassword: smtpPassword || undefined, // In production, encrypt this
        smtpFromEmail: smtpFromEmail || undefined,
        smtpFromName: smtpFromName || undefined,
        smtpSecure: smtpSecure !== undefined ? smtpSecure : true,
        smtpEnabled: smtpEnabled !== undefined ? smtpEnabled : false
      });

      res.json({ message: 'SMTP configuration updated successfully' });
    } catch (error) {
      console.error('Update SMTP config error:', error);
      res.status(500).json({ error: 'Failed to update SMTP configuration' });
    }
  });

  // Test SMTP configuration
  app.post("/api/client/:clientId/smtp-test", requirePermission('settings.manage'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { testEmail } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ error: 'Test email address is required' });
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testEmail)) {
        return res.status(400).json({ error: 'Invalid test email address' });
      }
      
      // Send actual test email using EmailService
      const { EmailService } = await import('./emailService');
      const emailService = new EmailService(storage);
      const result = await emailService.sendTestEmail(clientId, testEmail);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: result.message
        });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Test SMTP error:', error);
      res.status(500).json({ error: 'Failed to test SMTP configuration' });
    }
  });

  // Clear SMTP configuration
  app.delete("/api/client/:clientId/smtp-config", requirePermission('settings.manage'), async (req, res) => {
    try {
      const { clientId } = req.params;
      await storage.clearSmtpConfig(clientId);
      res.json({ message: 'SMTP configuration cleared successfully' });
    } catch (error) {
      console.error('Clear SMTP config error:', error);
      res.status(500).json({ error: 'Failed to clear SMTP configuration' });
    }
  });

  // Appointments Management
  app.get("/api/client/:clientId/appointments", requirePermission('appointments.view'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const appointments = await storage.getAppointments(clientId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/client/:clientId/appointments", requirePermission('appointments.create'), async (req, res) => {
    try {
      const { clientId } = req.params;
      console.log("Creating appointment with data:", req.body);
      
      // Add clientId and convert appointmentDate to Date object
      const dataWithClientId = { 
        ...req.body, 
        clientId,
        appointmentDate: new Date(req.body.appointmentDate) 
      };
      
      const appointmentData = insertAppointmentSchema.parse(dataWithClientId);
      console.log("Parsed appointment data:", appointmentData);
      const appointment = await storage.createAppointment(appointmentData);
      
      // Send confirmation email using SMTP
      try {
        const { EmailService } = await import('./emailService');
        const emailService = new EmailService(storage);
        const client = await storage.getClient(clientId);
        const services = await storage.getClientServices(clientId);
        const service = services.find(s => s.id === appointmentData.serviceId);
        
        if (client && service && appointmentData.customerEmail) {
          const emailResult = await emailService.sendAppointmentConfirmation(
            clientId,
            appointmentData.customerEmail,
            appointmentData.customerName,
            {
              id: appointment.id,
              serviceName: service.name,
              servicePrice: service.price,
              serviceDuration: service.durationMinutes,
              appointmentDate: new Date(appointment.appointmentDate), // Ensure Date object
              startTime: appointment.startTime,
              endTime: appointment.endTime,
              notes: appointment.notes || '',
              businessName: client.businessName,
              businessPhone: client.phone || '',
              businessEmail: client.email
            }
          );
          console.log(`📧 Admin appointment confirmation: ${emailResult.success ? 'Success' : `Failed - ${emailResult.message}`}`);
        }
      } catch (error) {
        console.error('❌ Failed to send admin appointment confirmation:', error);
      }
      
      res.json(appointment);
    } catch (error) {
      console.error("Failed to create appointment:", error);
      res.status(500).json({ error: "Failed to create appointment", details: (error as Error).message });
    }
  });

  app.put("/api/client/:clientId/appointments/:appointmentId", requirePermission('appointments.edit'), async (req, res) => {
    try {
      const { appointmentId, clientId } = req.params;
      const updates = req.body;
      
      // Get the appointment before update to check for status changes
      const originalAppointment = await storage.getAppointment(appointmentId);
      if (!originalAppointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      // Update the appointment
      const appointment = await storage.updateAppointment(appointmentId, updates);
      
      // Send email notification if status changed
      if (updates.status && updates.status !== originalAppointment.status) {
        try {
          const client = await storage.getClient(clientId);
          const services = await storage.getClientServices(clientId);
          const service = services.find(s => s.id === appointment.serviceId);
          
          if (client && service && appointment.customerEmail) {
            const { EmailService } = await import('./emailService');
            const emailService = new EmailService(storage);
            
            const emailResult = await emailService.sendAppointmentStatusUpdate(
              clientId,
              appointment.customerEmail,
              appointment.customerName,
              {
                id: appointment.id,
                serviceName: service.name,
                servicePrice: service.price,
                appointmentDate: new Date(appointment.appointmentDate), // Ensure Date object
                startTime: appointment.startTime,
                endTime: appointment.endTime,
                status: appointment.status,
                businessName: client.businessName,
                businessPhone: client.phone || '',
                businessEmail: client.email
              }
            );
            
            console.log(`📧 Status update email: ${emailResult.success ? 'Success' : `Failed - ${emailResult.message}`}`);
          }
        } catch (emailError) {
          console.error('❌ Failed to send status update email:', emailError);
        }
      }
      
      res.json(appointment);
    } catch (error) {
      console.error("Failed to update appointment:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.delete("/api/client/:clientId/appointments/:appointmentId", requirePermission('appointments.edit'), async (req, res) => {
    try {
      const { appointmentId } = req.params;
      await storage.deleteAppointment(appointmentId);
      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Operating Hours Management
  app.get("/api/client/:clientId/operating-hours", async (req, res) => {
    try {
      const { clientId } = req.params;
      const hours = await storage.getOperatingHours(clientId);
      res.json(hours);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch operating hours" });
    }
  });

  app.post("/api/client/:clientId/operating-hours", async (req, res) => {
    try {
      const { clientId } = req.params;
      const hoursData = req.body.map((h: any) => ({ ...h, clientId }));
      const hours = await storage.setOperatingHours(clientId, hoursData);
      res.json(hours);
    } catch (error) {
      res.status(500).json({ error: "Failed to update operating hours" });
    }
  });

  // Leads Management
  app.get("/api/client/:clientId/leads", requirePermission('leads.view'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const leads = await storage.getLeads(clientId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.post("/api/client/:clientId/leads", requirePermission('leads.create'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const leadData = { ...insertLeadSchema.parse(req.body), clientId };
      const lead = await storage.createLead(leadData);
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  app.put("/api/client/:clientId/leads/:leadId", requirePermission('leads.edit'), async (req, res) => {
    try {
      const { leadId } = req.params;
      const updates = req.body;
      const lead = await storage.updateLead(leadId, updates);
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  app.delete("/api/client/:clientId/leads/:leadId", requirePermission('leads.edit'), async (req, res) => {
    try {
      const { leadId } = req.params;
      await storage.deleteLead(leadId);
      res.json({ message: "Lead deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // Client Website Management
  app.get("/api/client/:clientId/website", async (req, res) => {
    try {
      const { clientId } = req.params;
      const website = await storage.getClientWebsite(clientId);
      res.json(website);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch website settings" });
    }
  });

  app.post("/api/client/:clientId/website", async (req, res) => {
    try {
      const { clientId } = req.params;
      console.log('POST website request body:', req.body);
      const websiteData = { ...insertClientWebsiteSchema.parse(req.body), clientId };
      const website = await storage.createClientWebsite(websiteData);
      res.json(website);
    } catch (error) {
      console.error('POST website error:', error);
      res.status(500).json({ error: "Failed to create website" });
    }
  });

  app.put("/api/client/:clientId/website", async (req, res) => {
    try {
      const { clientId } = req.params;
      const updates = req.body;
      console.log('PUT website request body:', updates);
      const website = await storage.updateClientWebsite(clientId, updates);
      res.json(website);
    } catch (error) {
      console.error('PUT website error:', error);
      res.status(500).json({ error: "Failed to update website" });
    }
  });

  // Public website data endpoint
  app.get("/api/public/client/:clientId/website", async (req, res) => {
    try {
      const { clientId } = req.params;
      const website = await storage.getClientWebsite(clientId);
      if (!website) {
        return res.status(404).json({ error: "Website not found" });
      }
      res.json(website);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch website" });
    }
  });

  // Appointment Slots Management
  app.get("/api/client/:clientId/appointment-slots", async (req, res) => {
    try {
      const { clientId } = req.params;
      const slots = await storage.getAppointmentSlots(clientId);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointment slots" });
    }
  });

  app.post("/api/client/:clientId/appointment-slots", async (req, res) => {
    try {
      const { clientId } = req.params;
      console.log("Creating appointment slot - clientId:", clientId);
      console.log("Request body:", req.body);
      
      const slotData = { ...insertAppointmentSlotSchema.parse(req.body), clientId };
      console.log("Parsed slot data:", slotData);
      
      const slot = await storage.createAppointmentSlot(slotData);
      console.log("Created slot:", slot);
      res.json(slot);
    } catch (error) {
      console.error("Error creating appointment slot:", error);
      res.status(500).json({ error: "Failed to create appointment slot", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/client/:clientId/appointment-slots/:slotId", async (req, res) => {
    try {
      const { slotId } = req.params;
      const updates = req.body;
      const slot = await storage.updateAppointmentSlot(slotId, updates);
      res.json(slot);
    } catch (error) {
      res.status(500).json({ error: "Failed to update appointment slot" });
    }
  });

  app.delete("/api/client/:clientId/appointment-slots/:slotId", async (req, res) => {
    try {
      const { slotId } = req.params;
      await storage.deleteAppointmentSlot(slotId);
      res.json({ message: "Appointment slot deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete appointment slot" });
    }
  });

  // Team Members Management
  app.get("/api/client/:clientId/team", requirePermission('team.view'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const teamMembers = await storage.getTeamMembers(clientId);
      res.json(teamMembers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/client/:clientId/team", async (req, res) => {
    try {
      const { clientId } = req.params;
      const memberData = { ...insertTeamMemberSchema.parse(req.body), clientId };
      const member = await storage.createTeamMember(memberData);
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to create team member" });
    }
  });

  app.patch("/api/client/:clientId/team/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      const updates = req.body;
      const member = await storage.updateTeamMember(memberId, updates);
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  app.delete("/api/client/:clientId/team/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      await storage.deleteTeamMember(memberId);
      res.json({ message: "Team member deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });

  // Public Website Routes
  app.get("/api/public/website/:subdomain", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const website = await storage.getPublicWebsite(subdomain);
      
      if (!website) {
        return res.status(404).json({ error: "Website not found" });
      }

      const client = await storage.getClient(website.clientId);
      const services = await storage.getClientServices(website.clientId);
      const operatingHours = await storage.getOperatingHours(website.clientId);

      res.json({
        website,
        client,
        services: services.filter(s => s.isActive),
        operatingHours
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch public website" });
    }
  });

  // Public appointment booking
  app.post("/api/public/website/:subdomain/book-appointment", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const website = await storage.getPublicWebsite(subdomain);
      
      if (!website || !website.allowOnlineBooking) {
        return res.status(404).json({ error: "Booking not available" });
      }

      const appointmentData = { 
        ...insertAppointmentSchema.parse(req.body), 
        clientId: website.clientId,
        status: "SCHEDULED"
      };
      
      const appointment = await storage.createAppointment(appointmentData);
      
      // Also create a lead
      await storage.createLead({
        clientId: website.clientId,
        name: appointment.customerName,
        email: appointment.customerEmail,
        phone: appointment.customerPhone || "",
        source: "website",
        status: "CONVERTED",
        convertedToAppointment: true,
        appointmentId: appointment.id,
        interestedServices: [appointment.serviceId]
      });

      res.json({ 
        message: "Appointment booked successfully",
        appointment 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to book appointment" });
    }
  });

  // Unified client authentication route - handles both business owners and team members
  app.post("/api/auth/client-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check for business owner first
      const user = await storage.getUserByEmail(email);
      if (user && user.role === 'CLIENT' && user.password === password) {
        const client = await storage.getClientByEmail(email);
        if (client) {
          res.json({
            user: { 
              id: user.id, 
              email: user.email, 
              role: "BUSINESS_OWNER",
              clientId: client.id,
              permissions: ["*"], // Full access
              name: client.contactPerson
            },
            client,
            userType: "BUSINESS_OWNER"
          });
          return;
        }
      }
      
      // Check for team members
      console.log(`Looking for team member with email: ${email}`);
      
      const clients = await storage.getClients();
      const allTeamMembers = [];
      
      for (const client of clients) {
        try {
          const clientTeamMembers = await storage.getTeamMembers(client.id);
          allTeamMembers.push(...clientTeamMembers);
        } catch (error) {
          console.error(`Error fetching team members for client ${client.id}:`, error);
        }
      }
      
      const teamMember = allTeamMembers.find(member => 
        member.email === email && member.isActive !== false
      );
      
      if (teamMember && teamMember.password === password) {
        console.log(`Found team member: ${teamMember.name} (${teamMember.email})`);
        
        const client = await storage.getClient(teamMember.clientId);
        if (client) {
          console.log("Team login successful");
          res.json({
            user: {
              id: teamMember.id,
              email: teamMember.email,
              role: "TEAM_MEMBER",
              clientId: teamMember.clientId,
              permissions: teamMember.permissions,
              name: teamMember.name
            },
            client,
            userType: "TEAM_MEMBER",
            teamMember: {
              id: teamMember.id,
              name: teamMember.name,
              email: teamMember.email,
              role: teamMember.role,
              permissions: teamMember.permissions,
              clientId: teamMember.clientId
            }
          });
          return;
        }
      }
      
      // No match found
      res.status(401).json({ error: "Invalid credentials" });
    } catch (error) {
      console.error("Client login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Team member authentication route
  app.post("/api/auth/team-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Get team members from all clients
      const clients = await storage.getClients();
      const allTeamMembers = [];
      
      for (const client of clients) {
        try {
          const clientTeamMembers = await storage.getTeamMembers(client.id);
          allTeamMembers.push(...clientTeamMembers);
        } catch (error) {
          console.error(`Error fetching team members for client ${client.id}:`, error);
        }
      }
      
      console.log(`Found ${allTeamMembers.length} total team members`);
      console.log(`Looking for team member with email: ${email}`);
      
      const teamMember = allTeamMembers.find(member => 
        member.email === email && member.isActive !== false
      );
      
      if (!teamMember) {
        console.log("Team member not found or inactive");
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      console.log(`Found team member: ${teamMember.name} (${teamMember.email})`);
      
      // Verify password (simple comparison for demo)
      if (teamMember.password !== password) {
        console.log("Password mismatch");
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Get the client info for the team member
      const client = await storage.getClient(teamMember.clientId);
      if (!client) {
        console.log(`Client ${teamMember.clientId} not found`);
        return res.status(404).json({ error: "Client not found" });
      }
      
      console.log("Team login successful");
      res.json({
        teamMember: {
          id: teamMember.id,
          name: teamMember.name,
          email: teamMember.email,
          role: teamMember.role,
          permissions: teamMember.permissions,
          clientId: teamMember.clientId
        },
        client
      });
    } catch (error) {
      console.error("Team member login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // =============================================================================
  // PUBLIC CLIENT WEBSITE ROUTES
  // =============================================================================

  // Get public client info
  app.get("/api/public/client/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      res.json(client);
    } catch (error) {
      console.error("Error fetching public client:", error);
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  // Get public client services
  app.get("/api/public/client/:clientId/services", async (req, res) => {
    try {
      const { clientId } = req.params;
      const services = await storage.getClientServices(clientId);
      
      // Only return active services for public view
      const activeServices = services.filter(s => s.isActive);
      res.json(activeServices);
    } catch (error) {
      console.error("Error fetching public services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  // Get available time slots for a specific date
  app.get("/api/public/client/:clientId/available-slots", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
      }

      const availableSlots = await storage.getAvailableSlots(clientId, date as string);
      res.json(availableSlots);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      res.status(500).json({ error: "Failed to fetch available slots" });
    }
  });

  // Public contact form submission
  app.post("/api/public/client/:clientId/contact", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { name, email, phone, message } = req.body;
      
      // Create lead from contact form
      const lead = await storage.createLead({
        clientId,
        name,
        email,
        phone: phone || "",
        source: "website",
        status: "NEW",
        notes: message,
        estimatedValue: 0,
        convertedToAppointment: false
      });

      res.json({ 
        message: "Contact form submitted successfully",
        lead 
      });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "Failed to submit contact form" });
    }
  });

  // Public lead form submission
  app.post("/api/public/client/:clientId/submit-lead", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { name, email, phone, serviceInterest, estimatedBudget, contactMethod, notes } = req.body;
      
      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }
      
      // Parse estimated budget if provided
      let estimatedValue = null;
      if (estimatedBudget && estimatedBudget.trim()) {
        const cleanBudget = estimatedBudget.replace(/[^\d.]/g, '');
        const parsedBudget = parseFloat(cleanBudget);
        if (!isNaN(parsedBudget)) {
          estimatedValue = parsedBudget;
        }
      }
      
      // Resolve service interest to service name for source field
      let sourceField = "website-lead-form";
      let interestedServicesArray: string[] = [];
      
      if (serviceInterest) {
        // Check if serviceInterest is a UUID (service ID) vs static option
        const isServiceId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serviceInterest);
        
        if (isServiceId) {
          try {
            // Try to fetch the service to get its name
            const services = await storage.getClientServices(clientId);
            const service = services.find(s => s.id === serviceInterest);
            if (service) {
              sourceField = service.name;
              interestedServicesArray = [serviceInterest]; // Store the service ID
            } else {
              sourceField = "Unknown Service";
              interestedServicesArray = [serviceInterest];
            }
          } catch (error) {
            console.error("Error resolving service ID:", error);
            sourceField = "Service ID: " + serviceInterest;
            interestedServicesArray = [serviceInterest];
          }
        } else {
          // It's a static option, use it directly
          sourceField = serviceInterest;
          interestedServicesArray = [serviceInterest];
        }
      }
      
      // Create lead from lead form
      const lead = await storage.createLead({
        clientId,
        name,
        email,
        phone: phone || "",
        source: sourceField,
        status: "NEW",
        notes: notes || `Contact preference: ${contactMethod || 'Not specified'}`,
        interestedServices: interestedServicesArray,
        estimatedValue,
        followUpDate: null,
        convertedToAppointment: false,
        appointmentId: null
      });
      
      res.json({ message: "Lead submitted successfully! We'll contact you within 24 hours.", leadId: lead.id });
    } catch (error) {
      console.error("Error submitting lead form:", error);
      res.status(500).json({ error: "Failed to submit lead form" });
    }
  });

  // Public appointment booking
  app.post("/api/public/client/:clientId/book", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { serviceId, customerName, customerEmail, customerPhone, appointmentDate, startTime, notes, source } = req.body;
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const service = await storage.getClientServices(clientId);
      const selectedService = service.find(s => s.id === serviceId);
      if (!selectedService) {
        return res.status(404).json({ error: "Service not found" });
      }

      // Check if the time slot is available
      console.log(`Booking validation - clientId: ${clientId}, appointmentDate: ${appointmentDate}, startTime: ${startTime}`);
      const availableSlots = await storage.getAvailableSlots(clientId, appointmentDate);
      console.log(`Available slots for ${appointmentDate}:`, availableSlots);
      console.log(`Checking if '${startTime}' is in available slots:`, availableSlots.includes(startTime));
      
      if (!availableSlots.includes(startTime)) {
        console.log(`BOOKING FAILED: startTime '${startTime}' not found in available slots:`, availableSlots);
        return res.status(400).json({ error: "Time slot is not available" });
      }
      
      console.log(`BOOKING SUCCESS: Time slot ${startTime} is available!`);

      // Calculate end time based on service duration
      const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
      const endMinutes = startMinutes + selectedService.durationMinutes;
      const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

      // Create appointment
      const appointment = await storage.createAppointment({
        clientId,
        serviceId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || "",
        appointmentDate,
        startTime,
        endTime,
        notes: notes || "",
        status: "PENDING",
        totalPrice: selectedService.price
      });
      
      // Also create a lead
      await storage.createLead({
        clientId,
        name: customerName,
        email: customerEmail,
        phone: customerPhone || "",
        source: source || "website",
        status: "CONVERTED",
        estimatedValue: selectedService.price,
        convertedToAppointment: true,
        appointmentId: appointment.id,
        interestedServices: [serviceId]
      });
      
      // Send confirmation email using SMTP
      try {
        const { EmailService } = await import('./emailService');
        const emailService = new EmailService(storage);
        
        const emailResult = await emailService.sendAppointmentConfirmation(
          clientId,
          customerEmail,
          customerName,
          {
            id: appointment.id,
            serviceName: selectedService.name,
            servicePrice: selectedService.price,
            serviceDuration: selectedService.durationMinutes,
            appointmentDate: new Date(appointmentDate),
            startTime,
            endTime,
            notes,
            businessName: client.businessName,
            businessPhone: client.phone || '',
            businessEmail: client.email
          }
        );
        
        console.log(`📧 Appointment confirmation email: ${emailResult.success ? 'Success' : `Failed - ${emailResult.message}`}`);
      } catch (error) {
        console.error('❌ Failed to send appointment confirmation email:', error);
      }

      res.json({ 
        message: "Appointment booked successfully",
        appointment 
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      res.status(500).json({ error: "Failed to book appointment" });
    }
  });

  // =============================================================================
  // Domain Configuration Management
  // =============================================================================

  // Get domain configurations for a client
  app.get("/api/clients/:clientId/domains", requirePermission("domains.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const domains = await storage.getDomainConfigurations(clientId);
      res.json(domains);
    } catch (error) {
      console.error("Error fetching domain configurations:", error);
      res.status(500).json({ error: "Failed to fetch domain configurations" });
    }
  });

  // Get a specific domain configuration
  app.get("/api/domains/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const domain = await storage.getDomainConfiguration(id);
      if (!domain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }
      res.json(domain);
    } catch (error) {
      console.error("Error fetching domain configuration:", error);
      res.status(500).json({ error: "Failed to fetch domain configuration" });
    }
  });

  // Verify domain DNS configuration
  app.post("/api/domains/:id/verify", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get domain configuration
      const domain = await storage.getDomainConfiguration(id);
      if (!domain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }

      // Perform DNS verification
      const { DNSVerificationService } = await import("./dns-verification.js");
      const dnsService = new DNSVerificationService();
      const fullDomain = domain.subdomain ? `${domain.subdomain}.${domain.domain}` : domain.domain;
      
      const verificationResult = await dnsService.verifyDomainViaDNS(fullDomain, `scheduled-verify-${id}`);
      
      if (verificationResult.success) {
        // Update domain status to verified
        const updatedDomain = await storage.updateDomainConfiguration(id, {
          ...domain,
          verificationStatus: "VERIFIED",
          verifiedAt: new Date()
        });
        
        res.json({
          message: "Domain verified successfully",
          domain: updatedDomain,
          verificationResult
        });
      } else {
        res.status(400).json({
          error: "Domain verification failed",
          details: verificationResult.errorMessage,
          instructions: "Please ensure you have added the required DNS records and wait 5-10 minutes for propagation"
        });
      }
    } catch (error) {
      console.error("Error verifying domain:", error);
      res.status(500).json({ error: "Domain verification failed" });
    }
  });

  // Delete domain configuration
  app.delete("/api/domains/:id", requirePermission("domains.delete"), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get domain configuration first to verify it exists
      const domain = await storage.getDomainConfiguration(id);
      if (!domain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }

      // Delete the domain configuration
      await storage.deleteDomainConfiguration(id);
      
      res.json({ 
        message: "Domain configuration removed successfully",
        removedDomain: domain.domain
      });
    } catch (error) {
      console.error("Error deleting domain configuration:", error);
      res.status(500).json({ error: "Failed to delete domain configuration" });
    }
  });

  // Create domain configuration
  app.post("/api/clients/:clientId/domains", requirePermission("domains.create"), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Enhanced domain validation
      let validatedData;
      try {
        validatedData = enhancedDomainConfigurationSchema.parse(req.body);
      } catch (validationError: any) {
        return res.status(400).json({ 
          error: "Domain validation failed", 
          details: validationError.errors || validationError.message 
        });
      }

      // Comprehensive uniqueness validation
      const normalizedDomain = validateDomain(validatedData.domain);
      
      // Check if exact domain already exists
      const existingDomain = await storage.getDomainConfigurationByDomain(normalizedDomain);
      if (existingDomain) {
        return res.status(400).json({ 
          error: "Domain already configured",
          domain: normalizedDomain
        });
      }

      // Check for similar domains (with/without www)
      const wwwDomain = `www.${normalizedDomain}`;
      const nonWwwDomain = normalizedDomain.replace(/^www\./, '');
      
      if (normalizedDomain !== wwwDomain) {
        const wwwExists = await storage.getDomainConfigurationByDomain(wwwDomain);
        if (wwwExists) {
          return res.status(400).json({ 
            error: "Domain conflict: www variant already configured",
            conflicting_domain: wwwDomain
          });
        }
      }
      
      if (normalizedDomain !== nonWwwDomain) {
        const nonWwwExists = await storage.getDomainConfigurationByDomain(nonWwwDomain);
        if (nonWwwExists) {
          return res.status(400).json({ 
            error: "Domain conflict: non-www variant already configured",
            conflicting_domain: nonWwwDomain
          });
        }
      }

      // Create domain configuration with validated data
      const domainData = {
        ...validatedData,
        clientId,
        domain: normalizedDomain
      };

      const domain = await storage.createDomainConfiguration(domainData);
      res.json(domain);
    } catch (error) {
      console.error("Error creating domain configuration:", error);
      
      if (error instanceof DomainValidationError) {
        return res.status(400).json({ 
          error: error.message,
          code: error.code
        });
      }
      
      res.status(500).json({ error: "Failed to create domain configuration" });
    }
  });

  // Update domain configuration
  app.put("/api/domains/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // First get the domain to ensure it exists and get clientId for permission check
      const existingDomain = await storage.getDomainConfiguration(id);
      if (!existingDomain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }

      // Check permissions manually by creating a modified request
      const permissionCheck = await requirePermission("domains.edit")(
        { ...req, params: { ...req.params, clientId: existingDomain.clientId } }, 
        res, 
        () => {}
      );

      if (res.headersSent) {
        return; // Permission check failed and response was sent
      }

      // Validate update data with enhanced validation
      let validatedUpdates;
      try {
        validatedUpdates = enhancedDomainConfigurationSchema.partial().parse(req.body);
      } catch (validationError: any) {
        return res.status(400).json({ 
          error: "Domain validation failed", 
          details: validationError.errors || validationError.message 
        });
      }

      // If domain is being updated, validate uniqueness
      if (validatedUpdates.domain && validatedUpdates.domain !== existingDomain.domain) {
        const normalizedDomain = validateDomain(validatedUpdates.domain);
        const domainExists = await storage.getDomainConfigurationByDomain(normalizedDomain);
        
        if (domainExists && domainExists.id !== id) {
          return res.status(400).json({ 
            error: "Domain already configured by another configuration",
            domain: normalizedDomain
          });
        }
        
        validatedUpdates.domain = normalizedDomain;
      }

      const domain = await storage.updateDomainConfiguration(id, validatedUpdates);
      res.json(domain);
    } catch (error) {
      console.error("Error updating domain configuration:", error);
      
      if (error instanceof DomainValidationError) {
        return res.status(400).json({ 
          error: error.message,
          code: error.code
        });
      }
      
      res.status(500).json({ error: "Failed to update domain configuration" });
    }
  });

  // Delete domain configuration
  app.delete("/api/domains/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // First get the domain to ensure it exists and get clientId for permission check
      const existingDomain = await storage.getDomainConfiguration(id);
      if (!existingDomain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }

      // Check permissions manually by creating a modified request
      const permissionCheck = await requirePermission("domains.delete")(
        { ...req, params: { ...req.params, clientId: existingDomain.clientId } }, 
        res, 
        () => {}
      );

      if (res.headersSent) {
        return; // Permission check failed and response was sent
      }

      await storage.deleteDomainConfiguration(id);
      res.json({ message: "Domain configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting domain configuration:", error);
      
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }
      
      res.status(500).json({ error: "Failed to delete domain configuration" });
    }
  });

  // Verify domain
  app.post("/api/domains/:id/verify", async (req, res) => {
    try {
      const { id } = req.params;
      
      // First get the domain to ensure it exists and get clientId for permission check
      const existingDomain = await storage.getDomainConfiguration(id);
      if (!existingDomain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }

      // Check permissions manually by creating a modified request
      const permissionCheck = await requirePermission("domains.edit")(
        { ...req, params: { ...req.params, clientId: existingDomain.clientId } }, 
        res, 
        () => {}
      );

      if (res.headersSent) {
        return; // Permission check failed and response was sent
      }

      const domain = await storage.verifyDomain(id);
      res.json(domain);
    } catch (error) {
      console.error("Error verifying domain:", error);
      
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }
      
      if (error instanceof Error && error.message.includes("verification")) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: "Failed to verify domain" });
    }
  });

  // Get domain verification logs
  app.get("/api/domains/:id/logs", async (req, res) => {
    try {
      const { id } = req.params;
      
      // First get the domain to ensure it exists and get clientId for permission check
      const existingDomain = await storage.getDomainConfiguration(id);
      if (!existingDomain) {
        return res.status(404).json({ error: "Domain configuration not found" });
      }

      // Check permissions manually by creating a modified request
      const permissionCheck = await requirePermission("domains.view")(
        { ...req, params: { ...req.params, clientId: existingDomain.clientId } }, 
        res, 
        () => {}
      );

      if (res.headersSent) {
        return; // Permission check failed and response was sent
      }

      const logs = await storage.getDomainVerificationLogs(id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching domain verification logs:", error);
      res.status(500).json({ error: "Failed to fetch domain verification logs" });
    }
  });

  // =============================================================================
  // LEGACY ROUTES (keeping for demo)
  // =============================================================================

  // Services
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  // Reviews
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviews();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Create review
  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Google Business Profile Management Routes
  
  // Get Google Business Profile for a client
  app.get("/api/clients/:clientId/google-business", requirePermission("google_business.view"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const profile = await storage.getGoogleBusinessProfile(clientId);
      
      if (!profile) {
        return res.json(null); // Return null instead of 404 to indicate no profile exists yet
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching Google Business Profile:", error);
      res.status(500).json({ error: "Failed to fetch Google Business Profile" });
    }
  });

  // Create Google Business Profile for a client
  app.post("/api/clients/:clientId/google-business", requirePermission("google_business.create"), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Check if profile already exists
      const existingProfile = await storage.getGoogleBusinessProfile(clientId);
      if (existingProfile) {
        return res.status(400).json({ error: "Google Business Profile already exists for this client" });
      }
      
      // Validate request body
      const validatedData = insertGoogleBusinessProfileSchema.parse({
        ...req.body,
        clientId
      });
      
      const profile = await storage.createGoogleBusinessProfile(validatedData);
      res.json(profile);
    } catch (error) {
      console.error("Error creating Google Business Profile:", error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid profile data", 
          details: error.message 
        });
      }
      
      res.status(500).json({ error: "Failed to create Google Business Profile" });
    }
  });

  // Update Google Business Profile
  app.put("/api/google-business/:clientId", requirePermission("google_business.edit"), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Check if profile exists
      const existingProfile = await storage.getGoogleBusinessProfile(clientId);
      if (!existingProfile) {
        return res.status(404).json({ error: "Google Business Profile not found" });
      }
      
      // Validate update data
      const validatedUpdates = insertGoogleBusinessProfileSchema.partial().parse(req.body);
      
      const profile = await storage.updateGoogleBusinessProfile(clientId, validatedUpdates);
      res.json(profile);
    } catch (error) {
      console.error("Error updating Google Business Profile:", error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid profile data", 
          details: error.message 
        });
      }
      
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: "Google Business Profile not found" });
      }
      
      res.status(500).json({ error: "Failed to update Google Business Profile" });
    }
  });

  // Delete Google Business Profile
  app.delete("/api/google-business/:clientId", requirePermission("google_business.delete"), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Check if profile exists
      const existingProfile = await storage.getGoogleBusinessProfile(clientId);
      if (!existingProfile) {
        return res.status(404).json({ error: "Google Business Profile not found" });
      }
      
      await storage.deleteGoogleBusinessProfile(clientId);
      res.json({ message: "Google Business Profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting Google Business Profile:", error);
      
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: "Google Business Profile not found" });
      }
      
      res.status(500).json({ error: "Failed to delete Google Business Profile" });
    }
  });

  // Sync Google Business Profile data
  app.post("/api/google-business/:clientId/sync", requirePermission("google_business.edit"), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Check if profile exists
      const existingProfile = await storage.getGoogleBusinessProfile(clientId);
      if (!existingProfile) {
        return res.status(404).json({ error: "Google Business Profile not found" });
      }
      
      const profile = await storage.syncGoogleBusinessProfile(clientId);
      res.json(profile);
    } catch (error) {
      console.error("Error syncing Google Business Profile:", error);
      
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: "Google Business Profile not found" });
      }
      
      if (error instanceof Error && error.message.includes("OAuth authentication")) {
        return res.status(401).json({ error: error.message });
      }
      
      res.status(500).json({ error: "Failed to sync Google Business Profile" });
    }
  });

  // Google OAuth endpoints
  app.get("/api/auth/google/start/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Generate secure CSRF state token
      const stateToken = `${clientId}_${crypto.randomUUID()}_${Date.now()}`;
      
      // Google OAuth 2.0 configuration
      const googleOAuthURL = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      googleOAuthURL.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
      googleOAuthURL.searchParams.set("redirect_uri", `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/google/callback`);
      googleOAuthURL.searchParams.set("response_type", "code");
      googleOAuthURL.searchParams.set("scope", "https://www.googleapis.com/auth/business.manage");
      googleOAuthURL.searchParams.set("state", stateToken); // Secure CSRF token
      googleOAuthURL.searchParams.set("access_type", "offline");
      googleOAuthURL.searchParams.set("prompt", "consent");
      
      res.redirect(googleOAuthURL.toString());
    } catch (error) {
      console.error("Error starting Google OAuth:", error);
      res.status(500).json({ error: "Failed to start Google authentication" });
    }
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      // Extract clientId from secure state token  
      const clientId = typeof state === 'string' ? state.split('_')[0] : null;
      
      if (!code || !clientId) {
        return res.status(400).json({ error: "Missing authorization code or client ID" });
      }
      
      // Exchange authorization code for access token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          code: code as string,
          grant_type: "authorization_code",
          redirect_uri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/google/callback`,
        }),
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        console.error("Google OAuth error:", tokenData.error);
        return res.redirect(`/google-business-setup?error=oauth_failed`);
      }
      
      // Get user info to get Google account ID
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      
      const userData = await userResponse.json();
      
      // Update the Google Business Profile with OAuth information
      await storage.updateGoogleBusinessProfile(clientId as string, {
        oauthConnected: true,
        googleAccountId: userData.id,
        verificationStatus: "LINKED_UNVERIFIED", // Will become VERIFIED after successful sync
        verificationSource: "GOOGLE",
        // Store tokens securely (in real app, encrypt these)
        // For now, we'll just mark as connected
      });
      
      // Redirect back to the setup page with success
      res.redirect("/google-business-setup?connected=true");
    } catch (error) {
      console.error("Error handling Google OAuth callback:", error);
      res.redirect("/google-business-setup?error=callback_failed");
    }
  });

  // =============================================================================
  // NEWSLETTER SUBSCRIPTIONS ROUTES
  // =============================================================================

  // Get newsletter subscriptions for a client (admin access)
  app.get("/api/clients/:clientId/newsletter-subscriptions", requirePermission("view_marketing"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const subscriptions = await storage.getNewsletterSubscriptions(clientId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching newsletter subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch newsletter subscriptions" });
    }
  });

  // Create newsletter subscription (public access for website)
  app.post("/api/public/clients/:clientId/newsletter-subscribe", async (req, res) => {
    try {
      const { clientId } = req.params;
      const data = insertNewsletterSubscriptionSchema.parse({
        ...req.body,
        clientId
      });
      
      const subscription = await storage.createNewsletterSubscription(data);
      res.json(subscription);
    } catch (error) {
      console.error("Error creating newsletter subscription:", error);
      res.status(500).json({ error: "Failed to subscribe to newsletter" });
    }
  });

  // Update newsletter subscription (admin access)
  app.put("/api/clients/:clientId/newsletter-subscriptions/:id", requirePermission("manage_marketing"), async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertNewsletterSubscriptionSchema.partial().parse(req.body);
      
      const subscription = await storage.updateNewsletterSubscription(id, data);
      res.json(subscription);
    } catch (error) {
      console.error("Error updating newsletter subscription:", error);
      res.status(500).json({ error: "Failed to update newsletter subscription" });
    }
  });

  // Delete newsletter subscription (admin access)
  app.delete("/api/clients/:clientId/newsletter-subscriptions/:id", requirePermission("manage_marketing"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNewsletterSubscription(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting newsletter subscription:", error);
      res.status(500).json({ error: "Failed to delete newsletter subscription" });
    }
  });

  // =============================================================================
  // WEBSITE STAFF ROUTES
  // =============================================================================

  // Get website staff for a client (admin access)
  app.get("/api/clients/:clientId/website-staff", requirePermission("view_staff"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const staff = await storage.getWebsiteStaff(clientId);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching website staff:", error);
      res.status(500).json({ error: "Failed to fetch website staff" });
    }
  });

  // Get website staff for public display
  app.get("/api/public/clients/:clientId/website-staff", async (req, res) => {
    try {
      const { clientId } = req.params;
      const staff = await storage.getWebsiteStaff(clientId);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching public website staff:", error);
      res.status(500).json({ error: "Failed to fetch website staff" });
    }
  });

  // Create website staff member (admin access)
  app.post("/api/clients/:clientId/website-staff", requirePermission("manage_staff"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const data = insertWebsiteStaffSchema.parse({
        ...req.body,
        clientId
      });
      
      const staff = await storage.createWebsiteStaff(data);
      res.json(staff);
    } catch (error) {
      console.error("Error creating website staff:", error);
      res.status(500).json({ error: "Failed to create website staff member" });
    }
  });

  // Update website staff member (admin access)
  app.put("/api/clients/:clientId/website-staff/:id", requirePermission("manage_staff"), async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertWebsiteStaffSchema.partial().parse(req.body);
      
      const staff = await storage.updateWebsiteStaff(id, data);
      res.json(staff);
    } catch (error) {
      console.error("Error updating website staff:", error);
      res.status(500).json({ error: "Failed to update website staff member" });
    }
  });

  // Delete website staff member (admin access)
  app.delete("/api/clients/:clientId/website-staff/:id", requirePermission("manage_staff"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWebsiteStaff(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting website staff:", error);
      res.status(500).json({ error: "Failed to delete website staff member" });
    }
  });

  // =============================================================================
  // SERVICE PRICING TIERS ROUTES
  // =============================================================================

  // Get service pricing tiers for a client (admin access)
  app.get("/api/clients/:clientId/pricing-tiers", requirePermission("view_services"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const tiers = await storage.getServicePricingTiers(clientId);
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching pricing tiers:", error);
      res.status(500).json({ error: "Failed to fetch pricing tiers" });
    }
  });

  // Get pricing tiers for public display
  app.get("/api/public/clients/:clientId/pricing-tiers", async (req, res) => {
    try {
      const { clientId } = req.params;
      const tiers = await storage.getServicePricingTiers(clientId);
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching public pricing tiers:", error);
      res.status(500).json({ error: "Failed to fetch pricing tiers" });
    }
  });

  // Create pricing tier (admin access)
  app.post("/api/clients/:clientId/pricing-tiers", requirePermission("manage_services"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const data = insertServicePricingTierSchema.parse({
        ...req.body,
        clientId
      });
      
      const tier = await storage.createServicePricingTier(data);
      res.json(tier);
    } catch (error) {
      console.error("Error creating pricing tier:", error);
      res.status(500).json({ error: "Failed to create pricing tier" });
    }
  });

  // Update pricing tier (admin access)
  app.put("/api/clients/:clientId/pricing-tiers/:id", requirePermission("manage_services"), async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertServicePricingTierSchema.partial().parse(req.body);
      
      const tier = await storage.updateServicePricingTier(id, data);
      res.json(tier);
    } catch (error) {
      console.error("Error updating pricing tier:", error);
      res.status(500).json({ error: "Failed to update pricing tier" });
    }
  });

  // Delete pricing tier (admin access)
  app.delete("/api/clients/:clientId/pricing-tiers/:id", requirePermission("manage_services"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteServicePricingTier(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting pricing tier:", error);
      res.status(500).json({ error: "Failed to delete pricing tier" });
    }
  });

  // =============================================================================
  // WEBSITE TESTIMONIALS ROUTES
  // =============================================================================

  // Get website testimonials for a client (admin access)
  app.get("/api/clients/:clientId/website-testimonials", requirePermission("view_reviews"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const testimonials = await storage.getWebsiteTestimonials(clientId);
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching website testimonials:", error);
      res.status(500).json({ error: "Failed to fetch website testimonials" });
    }
  });

  // Get testimonials for public display
  app.get("/api/public/clients/:clientId/website-testimonials", async (req, res) => {
    try {
      const { clientId } = req.params;
      const testimonials = await storage.getWebsiteTestimonials(clientId);
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching public testimonials:", error);
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });

  // Create website testimonial (admin access)
  app.post("/api/clients/:clientId/website-testimonials", requirePermission("manage_reviews"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const data = insertWebsiteTestimonialSchema.parse({
        ...req.body,
        clientId
      });
      
      const testimonial = await storage.createWebsiteTestimonial(data);
      res.json(testimonial);
    } catch (error) {
      console.error("Error creating website testimonial:", error);
      res.status(500).json({ error: "Failed to create website testimonial" });
    }
  });

  // Update website testimonial (admin access)
  app.put("/api/clients/:clientId/website-testimonials/:id", requirePermission("manage_reviews"), async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertWebsiteTestimonialSchema.partial().parse(req.body);
      
      const testimonial = await storage.updateWebsiteTestimonial(id, data);
      res.json(testimonial);
    } catch (error) {
      console.error("Error updating website testimonial:", error);
      res.status(500).json({ error: "Failed to update website testimonial" });
    }
  });

  // Delete website testimonial (admin access)
  app.delete("/api/clients/:clientId/website-testimonials/:id", requirePermission("manage_reviews"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWebsiteTestimonial(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting website testimonial:", error);
      res.status(500).json({ error: "Failed to delete website testimonial" });
    }
  });

  // ===========================================
  // STRIPE PAYMENT ROUTES
  // ===========================================

  // Create payment intent for appointment booking
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const { amount, customerEmail, customerName, appointmentData } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        receipt_email: customerEmail,
        metadata: {
          customerName,
          appointmentData: JSON.stringify(appointmentData)
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error('Stripe payment intent creation error:', error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Confirm payment and complete booking
  app.post("/api/confirm-payment-booking", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const { paymentIntentId, appointmentData } = req.body;

      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          message: "Payment not completed" 
        });
      }

      // Create the appointment with payment confirmation
      const appointment = await storage.createAppointment({
        ...appointmentData,
        paymentMethod: 'ONLINE',
        paymentStatus: 'PAID',
        paymentIntentId: paymentIntentId,
        status: 'CONFIRMED' // Auto-confirm paid appointments
      });

      // Store payment record
      await storage.createPayment({
        clientId: appointmentData.clientId,
        appointmentId: appointment.id,
        paymentMethod: 'STRIPE',
        paymentProvider: 'stripe',
        paymentIntentId: paymentIntentId,
        amount: paymentIntent.amount / 100, // Convert back from cents
        currency: paymentIntent.currency.toUpperCase(),
        status: 'COMPLETED',
        customerName: appointmentData.customerName,
        customerEmail: appointmentData.customerEmail,
        description: `Payment for appointment`,
        processingFee: 0, // Could calculate Stripe fees here
        netAmount: paymentIntent.amount / 100,
        paidAt: new Date(),
      });

      res.json({ 
        appointment,
        message: "Payment confirmed and appointment booked successfully!" 
      });
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      res.status(500).json({ 
        message: "Error confirming payment: " + error.message 
      });
    }
  });

  // Super Admin: Create Stripe subscription for client plan
  app.post('/api/admin/create-subscription', requireAdmin, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const { clientId, planId, customerEmail } = req.body;

      const plan = await storage.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Create or retrieve Stripe customer
      let customer;
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: customerEmail,
        });
      }

      // Create subscription using plan's Stripe price ID
      if (!plan.monthlyStripePriceId) {
        return res.status(400).json({ 
          message: "Plan does not have Stripe pricing configured" 
        });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: plan.monthlyStripePriceId,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update client with Stripe IDs
      await storage.updateClient(clientId, {
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ 
        message: "Error creating subscription: " + error.message 
      });
    }
  });

  // Super Admin: Generate new Stripe product and price for plans
  app.post("/api/admin/generate-stripe-product", requireAdmin, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const { name, price, billing, features } = req.body;

      if (!name || !price || !billing) {
        return res.status(400).json({ 
          message: "Missing required fields: name, price, billing" 
        });
      }

      console.log(`Admin generating Stripe product: ${name} - $${price} ${billing}`);

      // Create Stripe product
      const product = await stripe.products.create({
        name: name,
        description: features ? features.join(', ') : `${name} subscription plan`,
        metadata: {
          plan_name: name,
          billing_cycle: billing,
          created_by: 'admin_dashboard',
          created_at: new Date().toISOString()
        }
      });

      console.log(`Stripe product created: ${product.id}`);

      // Create Stripe price
      const stripePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: billing.toLowerCase() === 'yearly' ? 'year' : 'month'
        },
        metadata: {
          plan_name: name,
          billing_cycle: billing,
          created_by: 'admin_dashboard'
        }
      });

      console.log(`Stripe price created: ${stripePrice.id}`);

      // Return the created Stripe product and price IDs
      res.json({
        success: true,
        productId: product.id,
        priceId: stripePrice.id,
        message: `Stripe product "${name}" created successfully`,
        details: {
          productName: product.name,
          priceAmount: price,
          currency: 'USD',
          interval: billing.toLowerCase() === 'yearly' ? 'year' : 'month'
        }
      });

    } catch (error: any) {
      console.error('Error generating Stripe product:', error);
      res.status(500).json({ 
        message: "Failed to generate Stripe product",
        error: error.message || 'Unknown error'
      });
    }
  });

  // =============================================================================
  // STRIPE WEBHOOK HANDLERS - PRODUCTION CRITICAL
  // =============================================================================

  // Stripe webhook endpoint for handling payment and subscription events
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !endpointSecret || !sig) {
      console.log("Stripe webhook config missing");
      return res.status(400).send('Webhook configuration error');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.log(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Stripe webhook received: ${event.type}`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
          
          // Update payment status in our database
          if (paymentIntent.metadata.clientId && paymentIntent.metadata.serviceId) {
            // Payment was for a booking - record is likely already created by confirm endpoint
            console.log(`Booking payment confirmed via webhook: ${paymentIntent.id}`);
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          console.log(`PaymentIntent failed: ${failedPayment.id}`);
          // Could update appointment status to PAYMENT_FAILED
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          console.log(`Invoice payment succeeded: ${invoice.id}`);
          
          // Update subscription/client status
          if ((invoice as any).subscription) {
            const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
            // Find client by Stripe customer ID and update status
            const clients = await storage.getClients();
            const client = clients.find(c => c.stripeCustomerId === subscription.customer);
            if (client) {
              await storage.updateClient(client.id, { status: "ACTIVE" });
              console.log(`Client ${client.id} activated via subscription payment`);
            }
          }
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          console.log(`Invoice payment failed: ${failedInvoice.id}`);
          
          // Update client status to PAYMENT_FAILED or SUSPENDED
          if ((failedInvoice as any).subscription) {
            const subscription = await stripe.subscriptions.retrieve((failedInvoice as any).subscription as string);
            const clients = await storage.getClients();
            const client = clients.find(c => c.stripeCustomerId === subscription.customer);
            if (client) {
              await storage.updateClient(client.id, { status: "PAYMENT_FAILED" });
              console.log(`Client ${client.id} payment failed`);
            }
          }
          break;

        case 'customer.subscription.created':
          const newSubscription = event.data.object;
          console.log(`Subscription created: ${newSubscription.id}`);
          break;

        case 'customer.subscription.updated':
          const updatedSubscription = event.data.object;
          console.log(`Subscription updated: ${updatedSubscription.id} - Status: ${updatedSubscription.status}`);
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object;
          console.log(`Subscription cancelled: ${deletedSubscription.id}`);
          
          // Update client status to CANCELLED
          const clients = await storage.getClients();
          const client = clients.find(c => c.stripeSubscriptionId === deletedSubscription.id);
          if (client) {
            await storage.updateClient(client.id, { status: "CANCELLED" });
            console.log(`Client ${client.id} subscription cancelled`);
          }
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error(`Webhook handler error:`, error);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  });

  const server = createServer(app);
  return server;
}