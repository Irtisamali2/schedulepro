import { pgTable, text, serial, integer, boolean, timestamp, varchar, real, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Main user table for authentication
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("CLIENT"), // SUPER_ADMIN or CLIENT
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Plans/Pricing table
export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  
  // Monthly pricing
  monthlyPrice: real("monthly_price"),
  monthlyDiscount: real("monthly_discount").default(0), // Percentage discount 0-100
  monthlyEnabled: boolean("monthly_enabled").default(true),
  
  // Yearly pricing  
  yearlyPrice: real("yearly_price"),
  yearlyDiscount: real("yearly_discount").default(0), // Percentage discount 0-100
  yearlyEnabled: boolean("yearly_enabled").default(true),
  
  features: text("features").array().notNull(),
  maxUsers: integer("max_users").notNull(),
  storageGB: integer("storage_gb").notNull(),
  isActive: boolean("is_active").default(true),
  isFreeTrial: boolean("is_free_trial").default(false),
  trialDays: integer("trial_days").default(0),
  
  // Stripe integration - separate for monthly/yearly
  monthlyStripePriceId: text("monthly_stripe_price_id"), // Stripe Price ID for monthly
  yearlyStripePriceId: text("yearly_stripe_price_id"), // Stripe Price ID for yearly
  stripeProductId: text("stripe_product_id"), // Stripe Product ID (shared)
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlanSchema = createInsertSchema(plans).pick({
  name: true,
  monthlyPrice: true,
  monthlyDiscount: true,
  monthlyEnabled: true,
  yearlyPrice: true,
  yearlyDiscount: true,
  yearlyEnabled: true,
  features: true,
  maxUsers: true,
  storageGB: true,
  isActive: true,
  isFreeTrial: true,
  trialDays: true,
});

export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plans.$inferSelect;

// Onboarding sessions for tracking multi-step signup
export const onboardingSessions = pgTable("onboarding_sessions", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  planId: text("plan_id").notNull(),
  currentStep: integer("current_step").default(1),
  isCompleted: boolean("is_completed").default(false),
  businessData: text("business_data"), // JSON string
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertOnboardingSessionSchema = createInsertSchema(onboardingSessions).pick({
  sessionId: true,
  planId: true,
  currentStep: true,
  businessData: true,
});

export type InsertOnboardingSession = z.infer<typeof insertOnboardingSessionSchema>;
export type OnboardingSession = typeof onboardingSessions.$inferSelect;

// Client businesses 
export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  businessName: text("business_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  businessAddress: text("business_address"),
  industry: text("industry"),
  businessDescription: text("business_description"),
  logoUrl: text("logo_url"),
  operatingHours: text("operating_hours"), // JSON string
  timeZone: text("time_zone"),
  planId: text("plan_id").notNull(),
  status: text("status").notNull().default("TRIAL"), // TRIAL, ACTIVE, INACTIVE, CANCELLED
  userId: text("user_id").notNull().unique(),
  onboardingSessionId: text("onboarding_session_id"),
  stripeCustomerId: text("stripe_customer_id"), // Stripe Customer ID
  stripeSubscriptionId: text("stripe_subscription_id"), // Stripe Subscription ID for plan billing
  stripePublicKey: text("stripe_public_key"), // Client's own Stripe public key
  stripeSecretKey: text("stripe_secret_key"), // Client's own Stripe secret key (encrypted)
  stripeAccountId: text("stripe_account_id"), // Stripe Connect Account ID for direct payments
  // SMTP Email Configuration
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUsername: text("smtp_username"),
  smtpPassword: text("smtp_password"), // Encrypted in production
  smtpFromEmail: text("smtp_from_email"),
  smtpFromName: text("smtp_from_name"),
  smtpSecure: boolean("smtp_secure").default(true), // Use TLS/SSL
  smtpEnabled: boolean("smtp_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const insertClientSchema = createInsertSchema(clients).pick({
  businessName: true,
  contactPerson: true,
  email: true,
  phone: true,
  businessAddress: true,
  industry: true,
  businessDescription: true,
  logoUrl: true,
  operatingHours: true,
  timeZone: true,
  planId: true,
  status: true,
  userId: true,
  onboardingSessionId: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  stripePublicKey: true,
  stripeSecretKey: true,
  stripeAccountId: true,
  smtpHost: true,
  smtpPort: true,
  smtpUsername: true,
  smtpPassword: true,
  smtpFromEmail: true,
  smtpFromName: true,
  smtpSecure: true,
  smtpEnabled: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Legacy services table (keeping for now)
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: text("price").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  category: text("category"),
});

export const insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  description: true,
  price: true,
  durationMinutes: true,
  category: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Reviews table (keeping for demo purposes)
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  date: timestamp("date").defaultNow(),
  publishConsent: boolean("publish_consent").default(false),
  published: boolean("published").default(false),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  name: true,
  email: true,
  rating: true,
  text: true,
  publishConsent: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Client-specific business services
export const clientServices = pgTable("client_services", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  category: text("category"),
  isActive: boolean("is_active").default(true),
  stripeProductId: text("stripe_product_id"), // Stripe Product ID for this service
  stripePriceId: text("stripe_price_id"), // Stripe Price ID for this service
  enableOnlinePayments: boolean("enable_online_payments").default(false), // Whether online payments are enabled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientServiceSchema = createInsertSchema(clientServices).pick({
  clientId: true,
  name: true,
  description: true,
  price: true,
  durationMinutes: true,
  category: true,
  isActive: true,
  stripeProductId: true,
  stripePriceId: true,
  enableOnlinePayments: true,
});

// Add Stripe price ID to services for custom pricing
export const clientServicesStripe = pgTable("client_services_stripe", {
  id: text("id").primaryKey(),
  serviceId: text("service_id").notNull(),
  clientId: text("client_id").notNull(),
  stripePriceId: text("stripe_price_id").notNull(),
  stripeProductId: text("stripe_product_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientServicesStripeSchema = createInsertSchema(clientServicesStripe).pick({
  serviceId: true,
  clientId: true,
  stripePriceId: true,
  stripeProductId: true,
  isActive: true,
});

export type InsertClientServicesStripe = z.infer<typeof insertClientServicesStripeSchema>;
export type ClientServicesStripe = typeof clientServicesStripe.$inferSelect;

export type InsertClientService = z.infer<typeof insertClientServiceSchema>;
export type ClientService = typeof clientServices.$inferSelect;

// Client appointments
export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  serviceId: text("service_id").notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(),
  status: text("status").notNull().default("SCHEDULED"), // SCHEDULED, CONFIRMED, COMPLETED, CANCELLED
  notes: text("notes"),
  totalPrice: real("total_price").notNull(),
  paymentMethod: text("payment_method").default("CASH"), // CASH, ONLINE
  paymentStatus: text("payment_status").default("PENDING"), // PENDING, PAID, FAILED
  paymentIntentId: text("payment_intent_id"), // Stripe Payment Intent ID
  emailConfirmation: boolean("email_confirmation").default(true),
  smsConfirmation: boolean("sms_confirmation").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).pick({
  clientId: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  serviceId: true,
  appointmentDate: true,
  startTime: true,
  endTime: true,
  status: true,
  notes: true,
  totalPrice: true,
  paymentMethod: true,
  paymentStatus: true,
  paymentIntentId: true,
  emailConfirmation: true,
  smsConfirmation: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Client operating hours
export const operatingHours = pgTable("operating_hours", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  isOpen: boolean("is_open").default(true),
  openTime: text("open_time"), // HH:MM format
  closeTime: text("close_time"), // HH:MM format
  breakStartTime: text("break_start_time"),
  breakEndTime: text("break_end_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOperatingHoursSchema = createInsertSchema(operatingHours).pick({
  clientId: true,
  dayOfWeek: true,
  isOpen: true,
  openTime: true,
  closeTime: true,
  breakStartTime: true,
  breakEndTime: true,
});

export type InsertOperatingHours = z.infer<typeof insertOperatingHoursSchema>;
export type OperatingHours = typeof operatingHours.$inferSelect;

// Client leads tracking
export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  source: text("source").notNull(), // website, phone, referral, social, etc.
  status: text("status").notNull().default("NEW"), // NEW, CONTACTED, QUALIFIED, CONVERTED, LOST
  notes: text("notes"),
  interestedServices: text("interested_services").array().default([]),
  estimatedValue: real("estimated_value"),
  followUpDate: timestamp("follow_up_date"),
  convertedToAppointment: boolean("converted_to_appointment").default(false),
  appointmentId: text("appointment_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).pick({
  clientId: true,
  name: true,
  email: true,
  phone: true,
  source: true,
  status: true,
  notes: true,
  interestedServices: true,
  estimatedValue: true,
  followUpDate: true,
  convertedToAppointment: true,
  appointmentId: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Client website settings
export const clientWebsites = pgTable("client_websites", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  subdomain: text("subdomain").notNull().unique(), // e.g., "johns-salon"
  customDomain: text("custom_domain"), // e.g., "johnssalon.com"
  title: text("title").notNull(),
  description: text("description"),
  heroImage: text("hero_image"),
  primaryColor: text("primary_color").default("#3B82F6"),
  secondaryColor: text("secondary_color").default("#F3F4F6"),
  contactInfo: text("contact_info"), // JSON string
  socialLinks: text("social_links"), // JSON string
  sections: text("sections"), // JSON string for website sections
  showPrices: boolean("show_prices").default(true),
  allowOnlineBooking: boolean("allow_online_booking").default(true),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientWebsiteSchema = createInsertSchema(clientWebsites).pick({
  clientId: true,
  subdomain: true,
  customDomain: true,
  title: true,
  description: true,
  heroImage: true,
  primaryColor: true,
  secondaryColor: true,
  contactInfo: true,
  socialLinks: true,
  sections: true,
  showPrices: true,
  allowOnlineBooking: true,
  isPublished: true,
});

export type InsertClientWebsite = z.infer<typeof insertClientWebsiteSchema>;
export type ClientWebsite = typeof clientWebsites.$inferSelect;

// Appointment Slots for availability management
export const appointmentSlots = pgTable("appointment_slots", {
  id: varchar("id").primaryKey().notNull(),
  clientId: varchar("client_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar("start_time").notNull(), // "09:00"
  endTime: varchar("end_time").notNull(), // "17:00"
  slotDuration: integer("slot_duration").default(30), // minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAppointmentSlotSchema = createInsertSchema(appointmentSlots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointmentSlot = z.infer<typeof insertAppointmentSlotSchema>;
export type AppointmentSlot = typeof appointmentSlots.$inferSelect;

// Team Members table
export const teamMembers = pgTable("team_members", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("STAFF"), // ADMIN, STAFF, MANAGER
  permissions: text("permissions").array().default([]), // Array of permission strings
  isActive: boolean("is_active").default(true),
  hourlyRate: real("hourly_rate"),
  specializations: text("specializations").array().default([]),
  workingHours: text("working_hours"), // JSON string with schedule
  password: text("password").notNull(), // Hashed password for authentication
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  clientId: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  permissions: true,
  isActive: true,
  hourlyRate: true,
  specializations: true,
  workingHours: true,
  password: true,
});

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

// Payments table
export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  appointmentId: text("appointment_id"),
  paymentMethod: text("payment_method").notNull(), // STRIPE, PAYPAL, VENMO, ZELLE, CASH
  paymentProvider: text("payment_provider"), // stripe, paypal, etc.
  paymentIntentId: text("payment_intent_id"), // External payment ID
  amount: real("amount").notNull(),
  currency: text("currency").default("USD"),
  status: text("status").notNull().default("PENDING"), // PENDING, COMPLETED, FAILED, REFUNDED
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  description: text("description"),
  metadata: text("metadata"), // JSON string for additional data
  processingFee: real("processing_fee"),
  netAmount: real("net_amount"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  clientId: true,
  appointmentId: true,
  paymentMethod: true,
  paymentProvider: true,
  paymentIntentId: true,
  amount: true,
  currency: true,
  status: true,
  customerName: true,
  customerEmail: true,
  description: true,
  metadata: true,
  processingFee: true,
  netAmount: true,
  paidAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// AI Voice Agents table
export const aiVoiceAgents = pgTable("ai_voice_agents", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  agentName: text("agent_name").notNull(),
  voiceType: text("voice_type").default("PROFESSIONAL"), // PROFESSIONAL, FRIENDLY, CASUAL
  language: text("language").default("en-US"),
  isActive: boolean("is_active").default(false),
  welcomeMessage: text("welcome_message"),
  businessHours: text("business_hours"), // JSON string
  availableServices: text("available_services").array().default([]),
  bookingEnabled: boolean("booking_enabled").default(true),
  transcriptionEnabled: boolean("transcription_enabled").default(true),
  twilioPhoneNumber: text("twilio_phone_number"),
  callVolume: integer("call_volume").default(0),
  lastCallAt: timestamp("last_call_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAIVoiceAgentSchema = createInsertSchema(aiVoiceAgents).pick({
  clientId: true,
  agentName: true,
  voiceType: true,
  language: true,
  isActive: true,
  welcomeMessage: true,
  businessHours: true,
  availableServices: true,
  bookingEnabled: true,
  transcriptionEnabled: true,
  twilioPhoneNumber: true,
});

export type InsertAIVoiceAgent = z.infer<typeof insertAIVoiceAgentSchema>;
export type AIVoiceAgent = typeof aiVoiceAgents.$inferSelect;

// Google Business Profiles table
export const googleBusinessProfiles = pgTable("google_business_profiles", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  businessName: text("business_name").notNull(),
  googlePlaceId: text("google_place_id"),
  googleAccountId: text("google_account_id"), // Google account ID from OAuth
  locationId: text("location_id"), // Google Business Profile location ID
  oauthConnected: boolean("oauth_connected").default(false),
  verificationStatus: text("verification_status").notNull().default("UNLINKED"), // UNLINKED, LINKED_UNVERIFIED, PENDING_VERIFICATION, VERIFIED, FAILED
  verificationSource: text("verification_source"), // GOOGLE, MANUAL
  averageRating: real("average_rating"),
  totalReviews: integer("total_reviews").default(0),
  businessHours: text("business_hours"), // JSON string
  businessDescription: text("business_description"),
  businessCategories: text("business_categories").array().default([]),
  businessPhotos: text("business_photos").array().default([]),
  website: text("website"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  postalCode: text("postal_code"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGoogleBusinessProfileSchema = createInsertSchema(googleBusinessProfiles).pick({
  clientId: true,
  businessName: true,
  googlePlaceId: true,
  googleAccountId: true,
  locationId: true,
  oauthConnected: true,
  verificationStatus: true,
  verificationSource: true,
  averageRating: true,
  totalReviews: true,
  businessHours: true,
  businessDescription: true,
  businessCategories: true,
  businessPhotos: true,
  website: true,
  phoneNumber: true,
  address: true,
  postalCode: true,
  city: true,
  state: true,
  country: true,
  latitude: true,
  longitude: true,
  lastSyncAt: true,
});

export type InsertGoogleBusinessProfile = z.infer<typeof insertGoogleBusinessProfileSchema>;
export type GoogleBusinessProfile = typeof googleBusinessProfiles.$inferSelect;

// Review platforms for landing page "How It Works" section
export const reviewPlatforms = pgTable("landing_review_platforms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Google", "Yelp", "Trust Pilot"
  displayName: text("display_name").notNull(), // e.g., "Google Reviews"
  rating: real("rating").notNull(), // e.g., 4.9
  maxRating: real("max_rating").notNull().default(5), // e.g., 5
  reviewCount: integer("review_count"), // Optional: number of reviews
  logoUrl: text("logo_url"), // Optional: logo image URL
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0), // For ordering on frontend
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReviewPlatformSchema = createInsertSchema(reviewPlatforms).pick({
  name: true,
  displayName: true,
  rating: true,
  maxRating: true,
  reviewCount: true,
  logoUrl: true,
  isActive: true,
  sortOrder: true,
});

export type InsertReviewPlatform = z.infer<typeof insertReviewPlatformSchema>;
export type ReviewPlatform = typeof reviewPlatforms.$inferSelect;

// Domain configurations for client admin and client websites
export const domainConfigurations = pgTable("domain_configurations", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  domainType: text("domain_type").notNull(), // ADMIN_PORTAL, CLIENT_WEBSITE
  domain: text("domain").notNull(), // e.g., "admin.mybusiness.com" or "mybusiness.com"
  subdomain: text("subdomain"), // e.g., "admin" or "www" 
  isActive: boolean("is_active").default(false),
  verificationStatus: text("verification_status").default("PENDING"), // PENDING, VERIFIED, FAILED
  verificationToken: text("verification_token"), // For domain verification
  verificationMethod: text("verification_method").default("DNS_TXT"), // DNS_TXT, FILE_UPLOAD, CNAME
  sslStatus: text("ssl_status").default("PENDING"), // PENDING, ACTIVE, FAILED, EXPIRED
  sslCertificateId: text("ssl_certificate_id"), // External SSL cert reference
  sslIssuedAt: timestamp("ssl_issued_at"),
  sslExpiresAt: timestamp("ssl_expires_at"),
  dnsRecords: text("dns_records"), // JSON string of required DNS records
  redirectToHttps: boolean("redirect_to_https").default(true),
  customSettings: text("custom_settings"), // JSON string for additional domain settings
  lastCheckedAt: timestamp("last_checked_at"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDomainConfigurationSchema = createInsertSchema(domainConfigurations).pick({
  clientId: true,
  domainType: true,
  domain: true,
  subdomain: true,
  isActive: true,
  verificationStatus: true,
  verificationToken: true,
  verificationMethod: true,
  sslStatus: true,
  sslCertificateId: true,
  sslIssuedAt: true,
  sslExpiresAt: true,
  dnsRecords: true,
  redirectToHttps: true,
  customSettings: true,
  lastCheckedAt: true,
  verifiedAt: true,
});

export type InsertDomainConfiguration = z.infer<typeof insertDomainConfigurationSchema>;
export type DomainConfiguration = typeof domainConfigurations.$inferSelect;

// Domain verification logs for tracking verification attempts
export const domainVerificationLogs = pgTable("domain_verification_logs", {
  id: text("id").primaryKey(),
  domainConfigId: text("domain_config_id").notNull(),
  verificationAttempt: integer("verification_attempt").default(1),
  verificationMethod: text("verification_method").notNull(),
  status: text("status").notNull(), // SUCCESS, FAILED, TIMEOUT
  errorMessage: text("error_message"),
  verificationData: text("verification_data"), // JSON string with verification details
  responseTime: integer("response_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDomainVerificationLogSchema = createInsertSchema(domainVerificationLogs).pick({
  domainConfigId: true,
  verificationAttempt: true,
  verificationMethod: true,
  status: true,
  errorMessage: true,
  verificationData: true,
  responseTime: true,
});

export type InsertDomainVerificationLog = z.infer<typeof insertDomainVerificationLogSchema>;
export type DomainVerificationLog = typeof domainVerificationLogs.$inferSelect;

// Newsletter Subscriptions table for client websites
export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, UNSUBSCRIBED, BOUNCED
  source: text("source").default("WEBSITE"), // WEBSITE, ADMIN, IMPORT
  metadata: text("metadata"), // JSON string for additional data
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions).pick({
  clientId: true,
  email: true,
  name: true,
  status: true,
  source: true,
  metadata: true,
  subscribedAt: true,
  unsubscribedAt: true,
});

export type InsertNewsletterSubscription = z.infer<typeof insertNewsletterSubscriptionSchema>;
export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;

// Website Staff Members (extends team members for public display)
export const websiteStaff = pgTable("website_staff", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  bio: text("bio"),
  profileImage: text("profile_image"), // URL to profile image
  experience: text("experience"), // e.g., "8 years experience"
  specialties: text("specialties").array().default([]),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  teamMemberId: text("team_member_id"), // Link to team members table if applicable
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWebsiteStaffSchema = createInsertSchema(websiteStaff).pick({
  clientId: true,
  name: true,
  title: true,
  bio: true,
  profileImage: true,
  experience: true,
  specialties: true,
  displayOrder: true,
  isActive: true,
  teamMemberId: true,
});

export type InsertWebsiteStaff = z.infer<typeof insertWebsiteStaffSchema>;
export type WebsiteStaff = typeof websiteStaff.$inferSelect;

// Service Pricing Tiers for client websites
export const servicePricingTiers = pgTable("service_pricing_tiers", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(), // e.g., "Hair Dryer", "Hair Washer"
  price: real("price").notNull(),
  currency: text("currency").default("USD"),
  duration: text("duration"), // e.g., "30 min", "1 hour"
  features: text("features").array().default([]), // Array of included features
  isPopular: boolean("is_popular").default(false), // Highlight this tier
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  buttonText: text("button_text").default("Book Now"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServicePricingTierSchema = createInsertSchema(servicePricingTiers).pick({
  clientId: true,
  name: true,
  price: true,
  currency: true,
  duration: true,
  features: true,
  isPopular: true,
  displayOrder: true,
  isActive: true,
  buttonText: true,
  description: true,
});

export type InsertServicePricingTier = z.infer<typeof insertServicePricingTierSchema>;
export type ServicePricingTier = typeof servicePricingTiers.$inferSelect;

// Website Testimonials (extends reviews for public display)
export const websiteTestimonials = pgTable("website_testimonials", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerTitle: text("customer_title"), // e.g., "Hair Influencer"
  testimonialText: text("testimonial_text").notNull(),
  customerImage: text("customer_image"), // URL to customer photo
  rating: integer("rating").default(5),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  source: text("source").default("WEBSITE"), // WEBSITE, GOOGLE, YELP, MANUAL
  reviewId: text("review_id"), // Link to reviews table if applicable
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWebsiteTestimonialSchema = createInsertSchema(websiteTestimonials).pick({
  clientId: true,
  customerName: true,
  customerTitle: true,
  testimonialText: true,
  customerImage: true,
  rating: true,
  isActive: true,
  displayOrder: true,
  source: true,
  reviewId: true,
});

export type InsertWebsiteTestimonial = z.infer<typeof insertWebsiteTestimonialSchema>;
export type WebsiteTestimonial = typeof websiteTestimonials.$inferSelect;

// Stylist schema (for beauty industry specific features)
export const stylists = pgTable("stylists", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  specializations: text("specializations").array().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStylistSchema = createInsertSchema(stylists).pick({
  clientId: true,
  name: true,
  email: true,
  specializations: true,
  isActive: true,
});

export type InsertStylist = z.infer<typeof insertStylistSchema>;
export type Stylist = typeof stylists.$inferSelect;

// Booking data interface for managing state across steps
export interface BookingData {
  // Step 1: Service Selection
  serviceId: string | null;
  stylistId: string | null;
  
  // Step 2: Appointment Details
  appointmentDate: Date | null;
  timeSlot: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  
  // Step 3: Additional Details
  specialRequests: string;
  howHeardAboutUs: string;
  emailConfirmation: boolean;
  smsConfirmation: boolean;
  
  // Step 4: Payment Method
  paymentMethod: "CASH" | "ONLINE" | null;
  
  // Step 5: Payment Processing
  paymentIntentId: string | null;
  paymentStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | null;
  
  // Step 6: Confirmation
  appointmentId: string | null;
  confirmationNumber: string | null;
}

// Review platforms configuration for real review data
export const reviewPlatformConnections = pgTable("review_platform_connections", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  platform: text("platform").notNull(), // GOOGLE, YELP, TRUSTPILOT
  platformAccountId: text("platform_account_id"), // External account ID
  apiKey: text("api_key"), // Encrypted API key
  accessToken: text("access_token"), // OAuth token if needed
  refreshToken: text("refresh_token"), // OAuth refresh token
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  averageRating: real("average_rating"),
  totalReviews: integer("total_reviews").default(0),
  platformUrl: text("platform_url"), // URL to the business profile on the platform
  syncFrequency: text("sync_frequency").default("DAILY"), // HOURLY, DAILY, WEEKLY
  errorMessage: text("error_message"), // Last sync error if any
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReviewPlatformConnectionSchema = createInsertSchema(reviewPlatformConnections).pick({
  clientId: true,
  platform: true,
  platformAccountId: true,
  apiKey: true,
  accessToken: true,
  refreshToken: true,
  isActive: true,
  lastSyncAt: true,
  averageRating: true,
  totalReviews: true,
  platformUrl: true,
  syncFrequency: true,
  errorMessage: true,
});

export type InsertReviewPlatformConnection = z.infer<typeof insertReviewPlatformConnectionSchema>;
export type ReviewPlatformConnection = typeof reviewPlatformConnections.$inferSelect;

// Individual reviews from platforms
export const platformReviews = pgTable("platform_reviews", {
  id: text("id").primaryKey(),
  connectionId: text("connection_id").notNull(),
  clientId: text("client_id").notNull(),
  platform: text("platform").notNull(), // GOOGLE, YELP, TRUSTPILOT
  externalReviewId: text("external_review_id").notNull(), // Platform's review ID
  customerName: text("customer_name").notNull(),
  customerAvatar: text("customer_avatar"), // Profile picture URL
  rating: integer("rating").notNull(), // 1-5 stars
  reviewText: text("review_text"),
  reviewDate: timestamp("review_date").notNull(),
  businessResponse: text("business_response"), // Business owner reply
  businessResponseDate: timestamp("business_response_date"),
  isVerified: boolean("is_verified").default(false), // Platform verification status
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlatformReviewSchema = createInsertSchema(platformReviews).pick({
  connectionId: true,
  clientId: true,
  platform: true,
  externalReviewId: true,
  customerName: true,
  customerAvatar: true,
  rating: true,
  reviewText: true,
  reviewDate: true,
  businessResponse: true,
  businessResponseDate: true,
  isVerified: true,
  helpfulCount: true,
});

export type InsertPlatformReview = z.infer<typeof insertPlatformReviewSchema>;
export type PlatformReview = typeof platformReviews.$inferSelect;

// =============================================================================
// Super Admin Contact Messages / Leads
// =============================================================================

// Contact messages from the super admin website
export const contactMessages = pgTable("contact_messages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  source: text("source").default("website"), // website, referral, etc.
  status: text("status").default("NEW"), // NEW, CONTACTED, CONVERTED, CLOSED
  notes: text("notes"), // Internal admin notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  name: true,
  email: true,
  subject: true,
  message: true,
  source: true,
  status: true,
  notes: true,
});

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;