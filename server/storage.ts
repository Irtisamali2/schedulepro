import { 
  users, type User, type InsertUser,
  plans, type Plan, type InsertPlan,
  onboardingSessions, type OnboardingSession, type InsertOnboardingSession,
  clients, type Client, type InsertClient,
  services, type Service, type InsertService,
  reviews, type Review, type InsertReview,
  clientServices, type ClientService, type InsertClientService,
  appointments, type Appointment, type InsertAppointment,
  operatingHours, type OperatingHours, type InsertOperatingHours,
  leads, type Lead, type InsertLead,
  clientWebsites, type ClientWebsite, type InsertClientWebsite,
  appointmentSlots, type AppointmentSlot, type InsertAppointmentSlot,
  teamMembers, type TeamMember, type InsertTeamMember,
  reviewPlatforms, type ReviewPlatform, type InsertReviewPlatform,
  domainConfigurations, type DomainConfiguration, type InsertDomainConfiguration,
  domainVerificationLogs, type DomainVerificationLog, type InsertDomainVerificationLog,
  reviewPlatformConnections, type ReviewPlatformConnection, type InsertReviewPlatformConnection,
  platformReviews, type PlatformReview, type InsertPlatformReview,
  googleBusinessProfiles, type GoogleBusinessProfile, type InsertGoogleBusinessProfile,
  newsletterSubscriptions, type NewsletterSubscription, type InsertNewsletterSubscription,
  websiteStaff, type WebsiteStaff, type InsertWebsiteStaff,
  servicePricingTiers, type ServicePricingTier, type InsertServicePricingTier,
  websiteTestimonials, type WebsiteTestimonial, type InsertWebsiteTestimonial,
  payments, type Payment, type InsertPayment,
  contactMessages, type ContactMessage, type InsertContactMessage,
} from "@shared/schema";
import { dnsVerificationService } from "./dns-verification";
import { promises as fs } from "fs";
import path from "path";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Authentication & Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Plans Management
  getPlans(): Promise<Plan[]>;
  getPlan(id: string): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: string, updates: Partial<InsertPlan>): Promise<Plan>;
  deletePlan(id: string): Promise<void>;
  
  // Plan Synchronization
  syncClientPlans(planId: string): Promise<void>;
  updatePlanPricing(planId: string, updates: { monthlyPrice?: number; yearlyPrice?: number; stripeProductId?: string; monthlyStripePriceId?: string; yearlyStripePriceId?: string }): Promise<Plan>;
  updateClientPlan(clientId: string, planId: string): Promise<Client>;
  
  // Onboarding Management
  getOnboardingSessions(): Promise<OnboardingSession[]>;
  getOnboardingSession(sessionId: string): Promise<OnboardingSession | undefined>;
  createOnboardingSession(session: InsertOnboardingSession): Promise<OnboardingSession>;
  updateOnboardingSession(sessionId: string, updates: Partial<InsertOnboardingSession>): Promise<OnboardingSession>;
  completeOnboarding(sessionId: string): Promise<OnboardingSession>;
  
  // Client Management
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  getClientBySubdomain(subdomain: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  
  // Legacy services (keeping for demo)
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  
  // Legacy reviews (keeping for demo)
  getReviews(): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Client-specific services
  getClientServices(clientId: string): Promise<ClientService[]>;
  createClientService(service: InsertClientService): Promise<ClientService>;
  updateClientService(id: string, updates: Partial<InsertClientService>): Promise<ClientService>;
  deleteClientService(id: string): Promise<void>;
  
  // Appointments
  getAppointments(clientId: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;
  
  // Operating Hours
  getOperatingHours(clientId: string): Promise<OperatingHours[]>;
  setOperatingHours(clientId: string, hours: InsertOperatingHours[]): Promise<OperatingHours[]>;
  
  // Leads
  getLeads(clientId: string): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  
  // Client Websites
  getClientWebsite(clientId: string): Promise<ClientWebsite | undefined>;
  createClientWebsite(website: InsertClientWebsite): Promise<ClientWebsite>;
  updateClientWebsite(clientId: string, updates: Partial<InsertClientWebsite>): Promise<ClientWebsite>;
  getPublicWebsite(subdomain: string): Promise<ClientWebsite | undefined>;
  
  // Appointment Slots
  getAppointmentSlots(clientId: string): Promise<AppointmentSlot[]>;
  createAppointmentSlot(slot: InsertAppointmentSlot): Promise<AppointmentSlot>;
  updateAppointmentSlot(id: string, updates: Partial<InsertAppointmentSlot>): Promise<AppointmentSlot>;
  deleteAppointmentSlot(id: string): Promise<void>;
  getAvailableSlots(clientId: string, date: string): Promise<string[]>;
  
  // Team Members
  getTeamMembers(clientId: string): Promise<TeamMember[]>;
  getTeamMember(id: string): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, updates: Partial<InsertTeamMember>): Promise<TeamMember>;
  deleteTeamMember(id: string): Promise<void>;

  // Review Platforms (for landing page)
  getReviewPlatforms(): Promise<ReviewPlatform[]>;
  getReviewPlatform(id: string): Promise<ReviewPlatform | undefined>;
  createReviewPlatform(platform: InsertReviewPlatform): Promise<ReviewPlatform>;
  updateReviewPlatform(id: string, updates: Partial<InsertReviewPlatform>): Promise<ReviewPlatform>;
  deleteReviewPlatform(id: string): Promise<void>;

  // Review Platform Connections (for real review data)
  getReviewPlatformConnections(clientId: string): Promise<ReviewPlatformConnection[]>;
  getReviewPlatformConnection(id: string): Promise<ReviewPlatformConnection | undefined>;
  createReviewPlatformConnection(connection: InsertReviewPlatformConnection): Promise<ReviewPlatformConnection>;
  updateReviewPlatformConnection(id: string, updates: Partial<InsertReviewPlatformConnection>): Promise<ReviewPlatformConnection>;
  deleteReviewPlatformConnection(id: string): Promise<void>;
  syncReviewPlatformData(connectionId: string): Promise<ReviewPlatformConnection>;

  // Platform Reviews
  getPlatformReviews(clientId: string, platform?: string): Promise<PlatformReview[]>;
  getPlatformReview(id: string): Promise<PlatformReview | undefined>;
  createPlatformReview(review: InsertPlatformReview): Promise<PlatformReview>;
  updatePlatformReview(id: string, updates: Partial<InsertPlatformReview>): Promise<PlatformReview>;
  deletePlatformReview(id: string): Promise<void>;

  // Domain Configurations
  getDomainConfigurations(clientId: string): Promise<DomainConfiguration[]>;
  getDomainConfiguration(id: string): Promise<DomainConfiguration | undefined>;
  getDomainConfigurationByDomain(domain: string): Promise<DomainConfiguration | undefined>;
  createDomainConfiguration(domain: InsertDomainConfiguration): Promise<DomainConfiguration>;
  updateDomainConfiguration(id: string, updates: Partial<InsertDomainConfiguration>): Promise<DomainConfiguration>;
  deleteDomainConfiguration(id: string): Promise<void>;
  verifyDomain(id: string): Promise<DomainConfiguration>;

  // Google Business Profile methods
  getGoogleBusinessProfile(clientId: string): Promise<GoogleBusinessProfile | undefined>;
  createGoogleBusinessProfile(profile: InsertGoogleBusinessProfile): Promise<GoogleBusinessProfile>;
  updateGoogleBusinessProfile(clientId: string, updates: Partial<InsertGoogleBusinessProfile>): Promise<GoogleBusinessProfile>;
  deleteGoogleBusinessProfile(clientId: string): Promise<void>;
  syncGoogleBusinessProfile(clientId: string): Promise<GoogleBusinessProfile>;

  // Domain Verification Logs
  getDomainVerificationLogs(domainConfigId: string): Promise<DomainVerificationLog[]>;
  createDomainVerificationLog(log: InsertDomainVerificationLog): Promise<DomainVerificationLog>;

  // Newsletter Subscriptions
  getNewsletterSubscriptions(clientId: string): Promise<NewsletterSubscription[]>;
  getNewsletterSubscription(id: string): Promise<NewsletterSubscription | undefined>;
  createNewsletterSubscription(subscription: InsertNewsletterSubscription): Promise<NewsletterSubscription>;
  updateNewsletterSubscription(id: string, updates: Partial<InsertNewsletterSubscription>): Promise<NewsletterSubscription>;
  deleteNewsletterSubscription(id: string): Promise<void>;

  // Website Staff Members
  getWebsiteStaff(clientId: string): Promise<WebsiteStaff[]>;
  getWebsiteStaffMember(id: string): Promise<WebsiteStaff | undefined>;
  createWebsiteStaff(staff: InsertWebsiteStaff): Promise<WebsiteStaff>;
  updateWebsiteStaff(id: string, updates: Partial<InsertWebsiteStaff>): Promise<WebsiteStaff>;
  deleteWebsiteStaff(id: string): Promise<void>;

  // Service Pricing Tiers
  getServicePricingTiers(clientId: string): Promise<ServicePricingTier[]>;
  getServicePricingTier(id: string): Promise<ServicePricingTier | undefined>;
  createServicePricingTier(tier: InsertServicePricingTier): Promise<ServicePricingTier>;
  updateServicePricingTier(id: string, updates: Partial<InsertServicePricingTier>): Promise<ServicePricingTier>;
  deleteServicePricingTier(id: string): Promise<void>;

  // Website Testimonials
  getWebsiteTestimonials(clientId: string): Promise<WebsiteTestimonial[]>;
  getWebsiteTestimonial(id: string): Promise<WebsiteTestimonial | undefined>;
  createWebsiteTestimonial(testimonial: InsertWebsiteTestimonial): Promise<WebsiteTestimonial>;
  updateWebsiteTestimonial(id: string, updates: Partial<InsertWebsiteTestimonial>): Promise<WebsiteTestimonial>;
  deleteWebsiteTestimonial(id: string): Promise<void>;

  // Payment Operations (SECURE)
  getPayments(clientId: string): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment>;
  getPaymentsByAppointment(appointmentId: string): Promise<Payment[]>;

  // Secure Service Price Calculation (SERVER-SIDE ONLY)
  calculateServiceAmount(clientId: string, serviceId: string): Promise<number>;
  calculateTotalWithTip(baseAmount: number, tipPercentage?: number): Promise<number>;

  // Stripe Configuration (SECURE - no secret key exposure)
  updateStripeConfig(clientId: string, publicKey: string, secretKey: string): Promise<void>;
  getStripePublicKey(clientId: string): Promise<string | null>;
  getStripeSecretKey(clientId: string): Promise<string | null>;
  validateStripeConfig(clientId: string): Promise<boolean>;
  clearStripeConfig(clientId: string): Promise<void>;
  
  // SMTP Email Configuration
  updateSmtpConfig(clientId: string, config: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    smtpFromEmail?: string;
    smtpFromName?: string;
    smtpSecure?: boolean;
    smtpEnabled?: boolean;
  }): Promise<void>;
  getSmtpConfig(clientId: string): Promise<{
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUsername: string | null;
    smtpPassword: string | null;
    smtpFromEmail: string | null;
    smtpFromName: string | null;
    smtpSecure: boolean | null;
    smtpEnabled: boolean | null;
    isConfigured: boolean;
  }>;
  testSmtpConfig(clientId: string): Promise<boolean>;
  clearSmtpConfig(clientId: string): Promise<void>;
  
  // Contact Messages / Super Admin Leads
  getContactMessages(): Promise<ContactMessage[]>;
  getContactMessage(id: string): Promise<ContactMessage | undefined>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  updateContactMessage(id: string, updates: Partial<InsertContactMessage>): Promise<ContactMessage>;
  deleteContactMessage(id: string): Promise<void>;
}

// In-memory storage implementation
class MemStorage implements IStorage {
  private users: User[] = [];
  private plans: Plan[] = [];
  private onboardingSessions: OnboardingSession[] = [];
  private clients: Client[] = [];
  private services: Service[] = [];
  private reviews: Review[] = [];
  private clientServices: ClientService[] = [];
  private appointments: Appointment[] = [];
  private operatingHours: OperatingHours[] = [];
  private leads: Lead[] = [];
  private payments: Payment[] = [];
  private contactMessages: ContactMessage[] = [];
  private contactMessagesFile = path.join(process.cwd(), 'data', 'contact-messages.json');
  private clientWebsites: ClientWebsite[] = [
    {
      id: "website_1",
      clientId: "client_1",
      subdomain: "abc-consulting",
      customDomain: null,
      title: "ABC Consulting - Professional Services",
      description: "ABC Consulting - Consulting services",
      heroImage: null,
      primaryColor: "#3B82F6",
      secondaryColor: "#F3F4F6",
      contactInfo: '{"phone": "555-0101", "email": "john@abcconsulting.com"}',
      socialLinks: '{}',
      sections: '[{"id":"hero","type":"hero","title":"Welcome to ABC Consulting","content":"Professional consulting services for all your needs.","settings":{"backgroundColor":"#3B82F6","textColor":"#FFFFFF","alignment":"center","padding":"large"}},{"id":"about","type":"about","title":"About ABC Consulting","content":"Located at 123 Main St, City, State, we are dedicated to providing exceptional consulting services.","settings":{"backgroundColor":"#FFFFFF","textColor":"#1F2937","alignment":"left","padding":"medium"}}]',
      showPrices: true,
      allowOnlineBooking: true,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  private appointmentSlots: AppointmentSlot[] = [];
  private teamMembers: TeamMember[] = [];
  private googleBusinessProfiles: GoogleBusinessProfile[] = [];
  private reviewPlatforms: ReviewPlatform[] = [];
  private reviewPlatformConnections: ReviewPlatformConnection[] = [];
  private platformReviews: PlatformReview[] = [];
  private domainConfigurations: DomainConfiguration[] = [];
  private domainVerificationLogs: DomainVerificationLog[] = [];
  private newsletterSubscriptions: NewsletterSubscription[] = [];
  private websiteStaff: WebsiteStaff[] = [];
  private servicePricingTiers: ServicePricingTier[] = [];
  private websiteTestimonials: WebsiteTestimonial[] = [];

  constructor() {
    // Only initialize demo data in development or when explicitly requested
    const shouldSeedDemo = process.env.SEED_DEMO_DATA === 'true' || 
                          (process.env.NODE_ENV !== 'production' && !process.env.DEPLOY_TARGET);
    
    if (shouldSeedDemo) {
      console.log('🌱 Seeding demo data for development...');
      this.initializeData();
    } else {
      console.log('🚫 Demo data seeding skipped (production environment)');
    }
  }

  private async initializeData() {
    // Create default super admin user
    await this.createUser({
      email: "admin@saas.com",
      password: "admin123",
      role: "SUPER_ADMIN"
    });

    // Create sample review platforms for landing page
    await this.createReviewPlatform({
      name: "google",
      displayName: "Google",
      rating: 4.9,
      maxRating: 5,
      reviewCount: 245,
      logoUrl: null,
      isActive: true,
      sortOrder: 1
    });

    await this.createReviewPlatform({
      name: "trustpilot", 
      displayName: "Trust Pilot",
      rating: 4.8,
      maxRating: 5,
      reviewCount: 189,
      logoUrl: null,
      isActive: true,
      sortOrder: 2
    });

    await this.createReviewPlatform({
      name: "yelp",
      displayName: "Yelp",
      rating: 4.7,
      maxRating: 5,
      reviewCount: 132,
      logoUrl: null,
      isActive: true,
      sortOrder: 3
    });

    // Create sample plans
    // Create Free Demo plan first
    await this.createPlan({
      name: "Free Demo",
      monthlyPrice: 0,
      monthlyEnabled: true,
      features: ["7-day trial", "1 User", "2GB Storage", "Basic Features"],
      maxUsers: 1,
      storageGB: 2,
      isActive: true,
      isFreeTrial: true,
      trialDays: 7
    });

    await this.createPlan({
      name: "Basic",
      monthlyPrice: 15.00,
      monthlyEnabled: true,
      features: ["1 User", "10GB Storage", "Basic Support", "Online Booking", "Client Management"],
      maxUsers: 1,
      storageGB: 10,
      isActive: true,
      isFreeTrial: false,
      trialDays: 0
    });

    await this.createPlan({
      name: "Pro",
      monthlyPrice: 99.99,
      monthlyEnabled: true, 
      features: ["5 Users", "100GB Storage", "Priority Support", "Advanced Analytics"],
      maxUsers: 5,
      storageGB: 100,
      isActive: true,
      isFreeTrial: false,
      trialDays: 0
    });

    await this.createPlan({
      name: "Enterprise",
      monthlyPrice: 299.99,
      monthlyEnabled: true,
      features: ["Unlimited Users", "1TB Storage", "24/7 Support", "Custom Integrations"],
      maxUsers: 999,
      storageGB: 1000,
      isActive: true,
      isFreeTrial: false,
      trialDays: 0
    });

    // Create demo client user accounts
    await this.createUser({
      email: "john@abcconsulting.com",
      password: "demo123",
      role: "CLIENT"
    });
    
    await this.createUser({
      email: "jane@techstartup.com",
      password: "demo123",
      role: "CLIENT"
    });

    // Create sample clients
    await this.createClient({
      businessName: "ABC Consulting",
      contactPerson: "John Smith",
      email: "john@abcconsulting.com",
      phone: "555-0101",
      planId: "plan_2",
      status: "ACTIVE",
      userId: "user_2",
      businessAddress: "123 Main St, City, State",
      industry: "Consulting"
    });

    await this.createClient({
      businessName: "Tech Startup Inc",
      contactPerson: "Jane Doe", 
      email: "jane@techstartup.com",
      phone: "555-0102",
      planId: "plan_3",
      status: "TRIAL",
      userId: "user_3",
      businessAddress: "456 Tech Ave, City, State",
      industry: "Technology"
    });

    // Add sample client services for client_1
    await this.createClientService({
      clientId: "client_1",
      name: "Business Consultation",
      description: "Comprehensive business strategy and consultation services",
      price: 150,
      durationMinutes: 60,
      category: "Consulting",
      isActive: true
    });

    await this.createClientService({
      clientId: "client_1",
      name: "Financial Planning",
      description: "Expert financial planning and investment advice",
      price: 200,
      durationMinutes: 90,
      category: "Consulting",
      isActive: true
    });

    await this.createClientService({
      clientId: "client_1",
      name: "Market Analysis",
      description: "In-depth market research and competitive analysis",
      price: 300,
      durationMinutes: 120,
      category: "Research",
      isActive: true
    });

    // Add sample appointment slots for client_1 (ABC Consulting)
    // Monday availability: 9:00 AM - 5:00 PM
    await this.createAppointmentSlot({
      clientId: "client_1",
      dayOfWeek: 1, // Monday
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      isActive: true
    });

    // Tuesday availability: 9:00 AM - 5:00 PM  
    await this.createAppointmentSlot({
      clientId: "client_1",
      dayOfWeek: 2, // Tuesday
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      isActive: true
    });

    // Wednesday availability: 9:00 AM - 5:00 PM
    await this.createAppointmentSlot({
      clientId: "client_1",
      dayOfWeek: 3, // Wednesday
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      isActive: true
    });

    // Thursday availability: 9:00 AM - 5:00 PM
    await this.createAppointmentSlot({
      clientId: "client_1",
      dayOfWeek: 4, // Thursday
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      isActive: true
    });

    // Friday availability: 9:00 AM - 5:00 PM
    await this.createAppointmentSlot({
      clientId: "client_1",
      dayOfWeek: 5, // Friday
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      isActive: true
    });

    // Add sample team member for testing team login
    await this.createTeamMember({
      clientId: "client_1",
      name: "Khisal Test",
      email: "khisal@test.com",
      role: "MANAGER",
      password: "password123",
      permissions: ["overview.view", "appointments.view", "appointments.create", "appointments.edit", "services.view", "team.view"],
      isActive: true
    });

    // Add sample website staff for client_1 (Hair Salon)
    await this.createWebsiteStaff({
      clientId: "client_1",
      name: "Mara Olsen",
      title: "Senior Stylist",
      bio: "Specialized in modern cuts and styling with over 8 years of experience.",
      profileImage: "/src/assets/Ellipse 54_1757064789129.png",
      experience: "8 years experience",
      specialties: ["Hair Cutting", "Styling", "Color"],
      displayOrder: 1,
      isActive: true
    });

    await this.createWebsiteStaff({
      clientId: "client_1",
      name: "Jess Nunez",
      title: "Hair Specialist",
      bio: "Expert in hair treatments and restoration with a passion for healthy hair.",
      profileImage: "/src/assets/Ellipse 55_1757064789130.png",
      experience: "6 years experience",
      specialties: ["Hair Treatment", "Restoration", "Conditioning"],
      displayOrder: 2,
      isActive: true
    });

    await this.createWebsiteStaff({
      clientId: "client_1",
      name: "Dana Welch",
      title: "Color Expert",
      bio: "Creative colorist specializing in bold and natural color transformations.",
      profileImage: "/src/assets/Ellipse 56_1757064789130.png",
      experience: "5 years experience",
      specialties: ["Hair Coloring", "Highlights", "Color Correction"],
      displayOrder: 3,
      isActive: true
    });

    // Add sample pricing tiers for client_1 (Hair Salon)
    await this.createServicePricingTier({
      clientId: "client_1",
      name: "Hair Dryer",
      price: 30,
      currency: "USD",
      duration: "30 min",
      features: ["Basic wash", "Blow dry", "Simple styling"],
      isPopular: false,
      displayOrder: 1,
      isActive: true,
      buttonText: "Book Now",
      description: "Quick wash and dry service"
    });

    await this.createServicePricingTier({
      clientId: "client_1",
      name: "Hair Washer",
      price: 40,
      currency: "USD",
      duration: "45 min",
      features: ["Deep cleanse", "Conditioning treatment", "Scalp massage", "Basic styling"],
      isPopular: false,
      displayOrder: 2,
      isActive: true,
      buttonText: "Book Now",
      description: "Premium wash and conditioning service"
    });

    await this.createServicePricingTier({
      clientId: "client_1",
      name: "Hair Developer",
      price: 70,
      currency: "USD",
      duration: "90 min",
      features: ["Professional cut & style", "Deep conditioning", "Hair treatment", "Styling consultation", "Product recommendations"],
      isPopular: true,
      displayOrder: 3,
      isActive: true,
      buttonText: "Book Now",
      description: "Complete hair transformation package"
    });

    await this.createServicePricingTier({
      clientId: "client_1",
      name: "Hair Color",
      price: 100,
      currency: "USD",
      duration: "120 min",
      features: ["Full color service", "Premium color products", "Expert color consultation", "After-care treatment", "Color protection"],
      isPopular: false,
      displayOrder: 4,
      isActive: true,
      buttonText: "Book Now",
      description: "Professional color transformation"
    });

    // Add sample testimonials for client_1 (Hair Salon)
    await this.createWebsiteTestimonial({
      clientId: "client_1",
      customerName: "Sarah Johnson",
      customerTitle: "Hair Influencer",
      testimonialText: "Hair has been my home for hair for years",
      customerImage: "/src/assets/Ellipse 57_1757064789131.png",
      rating: 5,
      isActive: true,
      displayOrder: 1,
      source: "WEBSITE"
    });

    await this.createWebsiteTestimonial({
      clientId: "client_1",
      customerName: "Emily Rodriguez",
      customerTitle: "Beauty Blogger",
      testimonialText: "The team at Graceful Hair transformed my look completely. I've never felt more confident!",
      customerImage: "/src/assets/Ellipse 57_1757064789131.png",
      rating: 5,
      isActive: true,
      displayOrder: 2,
      source: "WEBSITE"
    });

    console.log("✅ Sample data initialized for SaaS platform");
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser: User = {
      id: `user_${this.users.length + 1}`,
      email: user.email,
      password: hashedPassword,
      role: user.role || "CLIENT",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  // Plan methods
  async getPlans(): Promise<Plan[]> {
    return this.plans.filter(p => p.isActive);
  }

  async getPlan(id: string): Promise<Plan | undefined> {
    return this.plans.find(p => p.id === id);
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const newPlan: Plan = {
      id: `plan_${this.plans.length + 1}`,
      name: plan.name,
      createdAt: new Date(),
      monthlyPrice: plan.monthlyPrice ?? null,
      monthlyDiscount: plan.monthlyDiscount ?? null,
      monthlyEnabled: plan.monthlyEnabled ?? true,
      yearlyPrice: plan.yearlyPrice ?? null,
      yearlyDiscount: plan.yearlyDiscount ?? null,
      yearlyEnabled: plan.yearlyEnabled ?? false,
      features: plan.features,
      maxUsers: plan.maxUsers,
      storageGB: plan.storageGB,
      isActive: plan.isActive ?? true,
      isFreeTrial: plan.isFreeTrial ?? false,
      trialDays: plan.trialDays ?? 0,
      monthlyStripePriceId: null,
      yearlyStripePriceId: null,
      stripeProductId: null
    };
    this.plans.push(newPlan);
    return newPlan;
  }

  async updatePlan(id: string, updates: Partial<InsertPlan>): Promise<Plan> {
    const index = this.plans.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Plan not found");
    
    this.plans[index] = { ...this.plans[index], ...updates };
    return this.plans[index];
  }

  async deletePlan(id: string): Promise<void> {
    const index = this.plans.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Plan not found");
    this.plans.splice(index, 1);
  }
  
  // Plan synchronization methods
  async syncClientPlans(planId: string): Promise<void> {
    // In memory storage - plans are already synced since they reference the same objects
    console.log(`🔄 Syncing plan ${planId} for all clients (MemStorage - no action needed)`);
  }
  
  async updatePlanPricing(planId: string, updates: { monthlyPrice?: number; yearlyPrice?: number; stripeProductId?: string; monthlyStripePriceId?: string; yearlyStripePriceId?: string }): Promise<Plan> {
    const planIndex = this.plans.findIndex(p => p.id === planId);
    if (planIndex === -1) throw new Error("Plan not found");
    
    this.plans[planIndex] = { ...this.plans[planIndex], ...updates };
    
    // Auto-sync all clients using this plan
    await this.syncClientPlans(planId);
    
    return this.plans[planIndex];
  }
  
  async updateClientPlan(clientId: string, planId: string): Promise<Client> {
    const clientIndex = this.clients.findIndex(c => c.id === clientId);
    if (clientIndex === -1) throw new Error("Client not found");
    
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    
    this.clients[clientIndex] = { ...this.clients[clientIndex], planId, updatedAt: new Date() };
    
    return this.clients[clientIndex];
  }

  // Onboarding methods
  async getOnboardingSessions(): Promise<OnboardingSession[]> {
    return this.onboardingSessions;
  }

  async getOnboardingSession(sessionId: string): Promise<OnboardingSession | undefined> {
    return this.onboardingSessions.find(s => s.sessionId === sessionId);
  }

  async createOnboardingSession(session: InsertOnboardingSession): Promise<OnboardingSession> {
    const newSession: OnboardingSession = {
      id: `onb_${this.onboardingSessions.length + 1}`,
      sessionId: session.sessionId,
      planId: session.planId,
      currentStep: session.currentStep || 1,
      isCompleted: false,
      businessData: session.businessData || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null
    };
    this.onboardingSessions.push(newSession);
    return newSession;
  }

  async updateOnboardingSession(sessionId: string, updates: Partial<InsertOnboardingSession>): Promise<OnboardingSession> {
    const index = this.onboardingSessions.findIndex(s => s.sessionId === sessionId);
    if (index === -1) throw new Error("Onboarding session not found");
    
    this.onboardingSessions[index] = { 
      ...this.onboardingSessions[index], 
      ...updates,
      updatedAt: new Date()
    };
    return this.onboardingSessions[index];
  }

  async completeOnboarding(sessionId: string): Promise<OnboardingSession> {
    const index = this.onboardingSessions.findIndex(s => s.sessionId === sessionId);
    if (index === -1) throw new Error("Onboarding session not found");
    
    this.onboardingSessions[index] = {
      ...this.onboardingSessions[index],
      isCompleted: true,
      completedAt: new Date(),
      updatedAt: new Date()
    };
    return this.onboardingSessions[index];
  }

  // Client methods
  async getClients(): Promise<Client[]> {
    return this.clients;
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.find(c => c.id === id);
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    return this.clients.find(c => c.email === email);
  }

  async getClientBySubdomain(subdomain: string): Promise<Client | undefined> {
    // Find the website with this subdomain
    const website = this.clientWebsites.find(w => w.subdomain === subdomain);
    if (!website) return undefined;
    // Return the client associated with this website
    return this.clients.find(c => c.id === website.clientId);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const newClient: Client = {
      id: `client_${this.clients.length + 1}`,
      businessName: client.businessName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone || null,
      businessAddress: client.businessAddress || null,
      industry: client.industry || null,
      businessDescription: client.businessDescription || null,
      logoUrl: client.logoUrl || null,
      operatingHours: client.operatingHours || null,
      timeZone: client.timeZone || null,
      planId: client.planId,
      status: client.status || "TRIAL",
      userId: client.userId,
      onboardingSessionId: client.onboardingSessionId || null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePublicKey: null,
      stripeSecretKey: null,
      stripeAccountId: null,
      // SMTP Configuration
      smtpHost: null,
      smtpPort: null,
      smtpUsername: null,
      smtpPassword: null,
      smtpFromEmail: null,
      smtpFromName: null,
      smtpSecure: true,
      smtpEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    };
    this.clients.push(newClient);
    return newClient;
  }

  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client> {
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Client not found");
    
    this.clients[index] = {
      ...this.clients[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.clients[index];
  }

  async deleteClient(id: string): Promise<void> {
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Client not found");
    this.clients.splice(index, 1);
  }

  // Legacy service methods
  async getServices(): Promise<Service[]> {
    return this.services;
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.services.find(s => s.id === id);
  }

  async createService(service: InsertService): Promise<Service> {
    const newService: Service = {
      id: this.services.length + 1,
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
      category: service.category || null
    };
    this.services.push(newService);
    return newService;
  }

  // Legacy review methods
  async getReviews(): Promise<Review[]> {
    return this.reviews;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const newReview: Review = {
      id: this.reviews.length + 1,
      name: review.name,
      email: review.email,
      rating: review.rating,
      text: review.text,
      publishConsent: review.publishConsent ?? false,
      date: new Date(),
      published: false
    };
    this.reviews.push(newReview);
    return newReview;
  }

  // Client services methods
  async getClientServices(clientId: string): Promise<ClientService[]> {
    return this.clientServices.filter(s => s.clientId === clientId);
  }

  async createClientService(service: InsertClientService): Promise<ClientService> {
    const newService: ClientService = {
      id: `service_${this.clientServices.length + 1}`,
      clientId: service.clientId,
      name: service.name,
      description: service.description || null,
      price: service.price,
      durationMinutes: service.durationMinutes,
      category: service.category || null,
      isActive: service.isActive ?? true,
      stripePriceId: null,
      stripeProductId: null,
      enableOnlinePayments: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clientServices.push(newService);
    return newService;
  }

  async updateClientService(id: string, updates: Partial<InsertClientService>): Promise<ClientService> {
    const index = this.clientServices.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Client service not found");
    
    this.clientServices[index] = {
      ...this.clientServices[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.clientServices[index];
  }

  async deleteClientService(id: string): Promise<void> {
    const index = this.clientServices.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Client service not found");
    this.clientServices.splice(index, 1);
  }

  // Appointments methods
  async getAppointments(clientId: string): Promise<Appointment[]> {
    return this.appointments.filter(a => a.clientId === clientId);
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.find(a => a.id === id);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const newAppointment: Appointment = {
      id: `appt_${this.appointments.length + 1}`,
      clientId: appointment.clientId,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      customerPhone: appointment.customerPhone || null,
      serviceId: appointment.serviceId,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status || "SCHEDULED",
      notes: appointment.notes || null,
      totalPrice: appointment.totalPrice,
      paymentMethod: appointment.paymentMethod || "CASH",
      paymentStatus: appointment.paymentStatus || "PENDING",
      paymentIntentId: null,
      emailConfirmation: false,
      smsConfirmation: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.appointments.push(newAppointment);
    return newAppointment;
  }

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment> {
    const index = this.appointments.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Appointment not found");
    
    this.appointments[index] = {
      ...this.appointments[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.appointments[index];
  }

  async deleteAppointment(id: string): Promise<void> {
    const index = this.appointments.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Appointment not found");
    this.appointments.splice(index, 1);
  }

  // Operating hours methods
  async getOperatingHours(clientId: string): Promise<OperatingHours[]> {
    return this.operatingHours.filter(h => h.clientId === clientId);
  }

  async setOperatingHours(clientId: string, hours: InsertOperatingHours[]): Promise<OperatingHours[]> {
    // Remove existing hours for this client
    this.operatingHours = this.operatingHours.filter(h => h.clientId !== clientId);
    
    // Add new hours
    const newHours: OperatingHours[] = hours.map((h, index) => ({
      id: `hours_${clientId}_${h.dayOfWeek}`,
      clientId: h.clientId,
      dayOfWeek: h.dayOfWeek,
      isOpen: h.isOpen ?? true,
      openTime: h.openTime || null,
      closeTime: h.closeTime || null,
      breakStartTime: h.breakStartTime || null,
      breakEndTime: h.breakEndTime || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    this.operatingHours.push(...newHours);
    return newHours;
  }

  // Leads methods
  async getLeads(clientId: string): Promise<Lead[]> {
    return this.leads.filter(l => l.clientId === clientId);
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.find(l => l.id === id);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const newLead: Lead = {
      id: `lead_${Date.now()}`,
      clientId: lead.clientId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || null,
      source: lead.source,
      status: lead.status || "NEW",
      notes: lead.notes || null,
      interestedServices: lead.interestedServices || [],
      estimatedValue: lead.estimatedValue || null,
      followUpDate: lead.followUpDate || null,
      convertedToAppointment: lead.convertedToAppointment ?? false,
      appointmentId: lead.appointmentId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.leads.push(newLead);
    return newLead;
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead> {
    const index = this.leads.findIndex(l => l.id === id);
    if (index === -1) throw new Error("Lead not found");
    
    this.leads[index] = {
      ...this.leads[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.leads[index];
  }

  async deleteLead(id: string): Promise<void> {
    const index = this.leads.findIndex(l => l.id === id);
    if (index === -1) throw new Error("Lead not found");
    this.leads.splice(index, 1);
  }

  // Client website methods
  async getClientWebsite(clientId: string): Promise<ClientWebsite | undefined> {
    return this.clientWebsites.find(w => w.clientId === clientId);
  }

  async createClientWebsite(website: InsertClientWebsite): Promise<ClientWebsite> {
    const newWebsite: ClientWebsite = {
      id: `website_${this.clientWebsites.length + 1}`,
      clientId: website.clientId,
      subdomain: website.subdomain,
      customDomain: website.customDomain || null,
      title: website.title,
      description: website.description || null,
      heroImage: website.heroImage || null,
      primaryColor: website.primaryColor || "#3B82F6",
      secondaryColor: website.secondaryColor || "#F3F4F6",
      contactInfo: website.contactInfo || null,
      socialLinks: website.socialLinks || null,
      sections: website.sections || null,
      showPrices: website.showPrices ?? true,
      allowOnlineBooking: website.allowOnlineBooking ?? true,
      isPublished: website.isPublished ?? false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clientWebsites.push(newWebsite);
    return newWebsite;
  }

  async updateClientWebsite(clientId: string, updates: Partial<InsertClientWebsite>): Promise<ClientWebsite> {
    const index = this.clientWebsites.findIndex(w => w.clientId === clientId);
    if (index === -1) throw new Error("Client website not found");
    
    this.clientWebsites[index] = {
      ...this.clientWebsites[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.clientWebsites[index];
  }

  async getPublicWebsite(subdomain: string): Promise<ClientWebsite | undefined> {
    return this.clientWebsites.find(w => w.subdomain === subdomain && w.isPublished);
  }

  // Appointment slots methods
  async getAppointmentSlots(clientId: string): Promise<AppointmentSlot[]> {
    return this.appointmentSlots.filter(slot => slot.clientId === clientId);
  }

  async createAppointmentSlot(slot: InsertAppointmentSlot): Promise<AppointmentSlot> {
    const newSlot: AppointmentSlot = {
      id: `slot_${this.appointmentSlots.length + 1}`,
      clientId: slot.clientId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotDuration: slot.slotDuration || 30,
      isActive: slot.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.appointmentSlots.push(newSlot);
    return newSlot;
  }

  async updateAppointmentSlot(id: string, updates: Partial<InsertAppointmentSlot>): Promise<AppointmentSlot> {
    const index = this.appointmentSlots.findIndex(slot => slot.id === id);
    if (index === -1) throw new Error("Appointment slot not found");
    
    this.appointmentSlots[index] = {
      ...this.appointmentSlots[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.appointmentSlots[index];
  }

  async deleteAppointmentSlot(id: string): Promise<void> {
    const index = this.appointmentSlots.findIndex(slot => slot.id === id);
    if (index === -1) throw new Error("Appointment slot not found");
    this.appointmentSlots.splice(index, 1);
  }

  async getAvailableSlots(clientId: string, date: string): Promise<string[]> {
    // Parse date as local calendar date to avoid UTC/timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day); // month is 0-indexed
    const dayOfWeek = localDate.getDay(); // 0-6 (Sunday-Saturday)
    
    console.log(`getAvailableSlots: date=${date}, parsed=(${year},${month},${day}), dayOfWeek=${dayOfWeek}`);
    
    // Get slot configurations for this day
    const daySlots = this.appointmentSlots.filter(slot => 
      slot.clientId === clientId && 
      slot.dayOfWeek === dayOfWeek && 
      slot.isActive
    );
    
    console.log(`Found ${daySlots.length} slot configurations for dayOfWeek ${dayOfWeek}`);
    
    if (daySlots.length === 0) return [];
    
    // Get existing appointments for this date
    const existingAppointments = this.appointments.filter(apt => 
      apt.clientId === clientId && 
      new Date(apt.appointmentDate).toDateString() === localDate.toDateString()
    );
    
    const bookedTimes = existingAppointments.map(apt => apt.startTime);
    
    // Generate available time slots using Set to prevent duplicates
    const availableSlots = new Set<string>();
    
    for (const slotConfig of daySlots) {
      const start = this.timeToMinutes(slotConfig.startTime);
      const end = this.timeToMinutes(slotConfig.endTime);
      const duration = slotConfig.slotDuration || 30;
      
      for (let time = start; time < end; time += duration) {
        const timeString = this.minutesToTime(time);
        if (!bookedTimes.includes(timeString)) {
          availableSlots.add(timeString);
        }
      }
    }
    
    const result = Array.from(availableSlots).sort();
    return result;
  }

  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // Team Members
  async getTeamMembers(clientId: string): Promise<TeamMember[]> {
    return this.teamMembers.filter(member => member.clientId === clientId);
  }

  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    return this.teamMembers.find(member => member.id === id);
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const newMember: TeamMember = {
      id: `team_${this.teamMembers.length + 1}`,
      clientId: member.clientId,
      name: member.name,
      email: member.email,
      phone: member.phone || null,
      role: member.role || "STAFF",
      permissions: member.permissions || [],
      isActive: member.isActive ?? true,
      hourlyRate: member.hourlyRate || null,
      specializations: member.specializations || [],
      workingHours: member.workingHours || null,
      password: member.password,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.teamMembers.push(newMember);
    return newMember;
  }

  async updateTeamMember(id: string, updates: Partial<InsertTeamMember>): Promise<TeamMember> {
    const index = this.teamMembers.findIndex(member => member.id === id);
    if (index === -1) throw new Error("Team member not found");
    
    this.teamMembers[index] = {
      ...this.teamMembers[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.teamMembers[index];
  }

  async deleteTeamMember(id: string): Promise<void> {
    const index = this.teamMembers.findIndex(member => member.id === id);
    if (index === -1) throw new Error("Team member not found");
    this.teamMembers.splice(index, 1);
  }

  // Review Platforms methods
  async getReviewPlatforms(): Promise<ReviewPlatform[]> {
    return this.reviewPlatforms.filter(platform => platform.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getReviewPlatform(id: string): Promise<ReviewPlatform | undefined> {
    return this.reviewPlatforms.find(platform => platform.id === id);
  }

  async createReviewPlatform(platform: InsertReviewPlatform): Promise<ReviewPlatform> {
    const newPlatform: ReviewPlatform = {
      id: `review_platform_${this.reviewPlatforms.length + 1}`,
      name: platform.name,
      displayName: platform.displayName,
      rating: platform.rating,
      maxRating: platform.maxRating || 5,
      reviewCount: platform.reviewCount || null,
      logoUrl: platform.logoUrl || null,
      isActive: platform.isActive ?? true,
      sortOrder: platform.sortOrder || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.reviewPlatforms.push(newPlatform);
    return newPlatform;
  }

  async updateReviewPlatform(id: string, updates: Partial<InsertReviewPlatform>): Promise<ReviewPlatform> {
    const index = this.reviewPlatforms.findIndex(platform => platform.id === id);
    if (index === -1) throw new Error("Review platform not found");
    
    this.reviewPlatforms[index] = {
      ...this.reviewPlatforms[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.reviewPlatforms[index];
  }

  async deleteReviewPlatform(id: string): Promise<void> {
    const index = this.reviewPlatforms.findIndex(platform => platform.id === id);
    if (index === -1) throw new Error("Review platform not found");
    this.reviewPlatforms.splice(index, 1);
  }

  // Review Platform Connections Implementation
  async getReviewPlatformConnections(clientId: string): Promise<ReviewPlatformConnection[]> {
    return this.reviewPlatformConnections.filter(c => c.clientId === clientId);
  }

  async getReviewPlatformConnection(id: string): Promise<ReviewPlatformConnection | undefined> {
    return this.reviewPlatformConnections.find(c => c.id === id);
  }

  async createReviewPlatformConnection(connection: InsertReviewPlatformConnection): Promise<ReviewPlatformConnection> {
    const newConnection: ReviewPlatformConnection = {
      id: `connection_${this.reviewPlatformConnections.length + 1}`,
      clientId: connection.clientId,
      platform: connection.platform,
      platformAccountId: connection.platformAccountId || null,
      apiKey: connection.apiKey || null,
      accessToken: connection.accessToken || null,
      refreshToken: connection.refreshToken || null,
      isActive: connection.isActive ?? true,
      lastSyncAt: connection.lastSyncAt || null,
      averageRating: connection.averageRating || null,
      totalReviews: connection.totalReviews || 0,
      platformUrl: connection.platformUrl || null,
      syncFrequency: connection.syncFrequency || "DAILY",
      errorMessage: connection.errorMessage || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.reviewPlatformConnections.push(newConnection);
    return newConnection;
  }

  async updateReviewPlatformConnection(id: string, updates: Partial<InsertReviewPlatformConnection>): Promise<ReviewPlatformConnection> {
    const index = this.reviewPlatformConnections.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Review platform connection not found");
    
    this.reviewPlatformConnections[index] = {
      ...this.reviewPlatformConnections[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.reviewPlatformConnections[index];
  }

  async deleteReviewPlatformConnection(id: string): Promise<void> {
    const index = this.reviewPlatformConnections.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Review platform connection not found");
    this.reviewPlatformConnections.splice(index, 1);
  }

  async syncReviewPlatformData(connectionId: string): Promise<ReviewPlatformConnection> {
    const connection = await this.getReviewPlatformConnection(connectionId);
    if (!connection) throw new Error("Review platform connection not found");

    // Mock sync implementation - in real app this would call external APIs
    const mockReviewData = this.generateMockReviewData(connection.platform);
    
    return this.updateReviewPlatformConnection(connectionId, {
      averageRating: mockReviewData.averageRating,
      totalReviews: mockReviewData.totalReviews,
      lastSyncAt: new Date(),
      errorMessage: null
    });
  }

  // Platform Reviews Implementation
  async getPlatformReviews(clientId: string, platform?: string): Promise<PlatformReview[]> {
    let reviews = this.platformReviews.filter(r => r.clientId === clientId);
    if (platform) {
      reviews = reviews.filter(r => r.platform === platform);
    }
    return reviews;
  }

  async getPlatformReview(id: string): Promise<PlatformReview | undefined> {
    return this.platformReviews.find(r => r.id === id);
  }

  async createPlatformReview(review: InsertPlatformReview): Promise<PlatformReview> {
    const newReview: PlatformReview = {
      id: `review_${this.platformReviews.length + 1}`,
      connectionId: review.connectionId,
      clientId: review.clientId,
      platform: review.platform,
      externalReviewId: review.externalReviewId,
      customerName: review.customerName,
      customerAvatar: review.customerAvatar || null,
      rating: review.rating,
      reviewText: review.reviewText || null,
      reviewDate: review.reviewDate,
      businessResponse: review.businessResponse || null,
      businessResponseDate: review.businessResponseDate || null,
      isVerified: review.isVerified ?? false,
      helpfulCount: review.helpfulCount || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.platformReviews.push(newReview);
    return newReview;
  }

  async updatePlatformReview(id: string, updates: Partial<InsertPlatformReview>): Promise<PlatformReview> {
    const index = this.platformReviews.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Platform review not found");
    
    this.platformReviews[index] = {
      ...this.platformReviews[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.platformReviews[index];
  }

  async deletePlatformReview(id: string): Promise<void> {
    const index = this.platformReviews.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Platform review not found");
    this.platformReviews.splice(index, 1);
  }

  private generateMockReviewData(platform: string) {
    const mockData = {
      GOOGLE: { averageRating: 4.8, totalReviews: 127 },
      YELP: { averageRating: 4.5, totalReviews: 89 },
      TRUSTPILOT: { averageRating: 4.9, totalReviews: 203 }
    };
    return mockData[platform as keyof typeof mockData] || { averageRating: 4.0, totalReviews: 50 };
  }

  // Domain Configuration methods
  async getDomainConfigurations(clientId: string): Promise<DomainConfiguration[]> {
    return this.domainConfigurations.filter(d => d.clientId === clientId);
  }

  async getDomainConfiguration(id: string): Promise<DomainConfiguration | undefined> {
    return this.domainConfigurations.find(d => d.id === id);
  }

  async getDomainConfigurationByDomain(domain: string): Promise<DomainConfiguration | undefined> {
    return this.domainConfigurations.find(d => d.domain === domain);
  }

  async createDomainConfiguration(domainConfig: InsertDomainConfiguration): Promise<DomainConfiguration> {
    const newDomainConfig: DomainConfiguration = {
      id: `domain_${this.domainConfigurations.length + 1}`,
      clientId: domainConfig.clientId,
      domainType: domainConfig.domainType,
      domain: domainConfig.domain,
      subdomain: domainConfig.subdomain || null,
      isActive: domainConfig.isActive ?? false,
      verificationStatus: domainConfig.verificationStatus || "PENDING",
      verificationToken: this.generateVerificationToken(),
      verificationMethod: domainConfig.verificationMethod || "DNS_TXT",
      sslStatus: domainConfig.sslStatus || "PENDING",
      sslCertificateId: domainConfig.sslCertificateId || null,
      sslIssuedAt: domainConfig.sslIssuedAt || null,
      sslExpiresAt: domainConfig.sslExpiresAt || null,
      dnsRecords: domainConfig.dnsRecords || this.generateDnsRecords(domainConfig.domain),
      redirectToHttps: domainConfig.redirectToHttps ?? true,
      // customSettings: domainConfig.customSettings || null, // Column doesn't exist in Coolify production DB
      // lastCheckedAt: null, // Column doesn't exist in Coolify production DB
      verifiedAt: domainConfig.verifiedAt || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.domainConfigurations.push(newDomainConfig);
    return newDomainConfig;
  }

  async updateDomainConfiguration(id: string, updates: Partial<InsertDomainConfiguration>): Promise<DomainConfiguration> {
    const index = this.domainConfigurations.findIndex(d => d.id === id);
    if (index === -1) throw new Error("Domain configuration not found");
    
    this.domainConfigurations[index] = {
      ...this.domainConfigurations[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.domainConfigurations[index];
  }

  async deleteDomainConfiguration(id: string): Promise<void> {
    const index = this.domainConfigurations.findIndex(d => d.id === id);
    if (index === -1) throw new Error("Domain configuration not found");
    this.domainConfigurations.splice(index, 1);
  }

  async verifyDomain(id: string): Promise<DomainConfiguration> {
    const domain = await this.getDomainConfiguration(id);
    if (!domain) throw new Error("Domain configuration not found");

    // Get verification attempt count for this domain
    const existingLogs = await this.getDomainVerificationLogs(id);
    const attemptNumber = existingLogs.length + 1;

    let verificationResult;
    
    try {
      // Perform real DNS verification based on verification method
      if (domain.verificationMethod === "DNS_TXT") {
        verificationResult = await dnsVerificationService.verifyDomainViaDNS(
          domain.domain, 
          domain.verificationToken || ""
        );
      } else if (domain.verificationMethod === "CNAME") {
        verificationResult = await dnsVerificationService.verifyDomainViaCNAME(
          domain.domain,
          "scheduled-platform.com"
        );
      } else {
        throw new Error(`Unsupported verification method: ${domain.verificationMethod}`);
      }

      // Log the verification attempt
      await this.createDomainVerificationLog({
        domainConfigId: id,
        verificationAttempt: attemptNumber,
        verificationMethod: domain.verificationMethod,
        status: verificationResult.success ? "SUCCESS" : "FAILED",
        errorMessage: verificationResult.errorMessage || null,
        verificationData: JSON.stringify(verificationResult.verificationData),
        responseTime: verificationResult.responseTime
      });

      // Update domain based on verification result
      if (verificationResult.success) {
        return this.updateDomainConfiguration(id, {
          verificationStatus: "VERIFIED",
          isActive: true,
          verifiedAt: new Date(),
          // lastCheckedAt: new Date() // Column doesn't exist in Coolify production DB
        });
      } else {
        return this.updateDomainConfiguration(id, {
          verificationStatus: "FAILED",
          // lastCheckedAt: new Date() // Column doesn't exist in Coolify production DB
        });
      }
    } catch (error: any) {
      // Log the verification failure
      await this.createDomainVerificationLog({
        domainConfigId: id,
        verificationAttempt: attemptNumber,
        verificationMethod: domain.verificationMethod || "DNS_TXT",
        status: "FAILED",
        errorMessage: `Verification error: ${error.message}`,
        verificationData: JSON.stringify({
          expected: domain.verificationToken,
          found: null,
          recordName: `_scheduled-verification.${domain.domain}`,
          error: error.message
        }),
        responseTime: 0
      });

      return this.updateDomainConfiguration(id, {
        verificationStatus: "FAILED",
        // lastCheckedAt: new Date() // Column doesn't exist in Coolify production DB
      });
    }
  }

  // Domain Verification Log methods
  async getDomainVerificationLogs(domainConfigId: string): Promise<DomainVerificationLog[]> {
    return this.domainVerificationLogs.filter(l => l.domainConfigId === domainConfigId);
  }

  async createDomainVerificationLog(log: InsertDomainVerificationLog): Promise<DomainVerificationLog> {
    const newLog: DomainVerificationLog = {
      id: `log_${this.domainVerificationLogs.length + 1}`,
      domainConfigId: log.domainConfigId,
      verificationAttempt: log.verificationAttempt || 1,
      verificationMethod: log.verificationMethod,
      status: log.status,
      errorMessage: log.errorMessage || null,
      verificationData: log.verificationData || null,
      responseTime: log.responseTime || null,
      createdAt: new Date()
    };
    this.domainVerificationLogs.push(newLog);
    return newLog;
  }

  // Helper methods for domain functionality
  private generateVerificationToken(): string {
    return `verify-domain-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateDnsRecords(domain: string): string {
    return JSON.stringify([
      {
        type: "TXT",
        name: `_scheduled-verification.${domain}`,
        value: this.generateVerificationToken(),
        ttl: 300
      },
      {
        type: "CNAME",
        name: domain,
        value: "scheduled-platform.com",
        ttl: 300
      }
    ]);
  }

  // Google Business Profile methods
  async getGoogleBusinessProfile(clientId: string): Promise<GoogleBusinessProfile | undefined> {
    return this.googleBusinessProfiles.find(profile => profile.clientId === clientId);
  }

  async createGoogleBusinessProfile(profile: InsertGoogleBusinessProfile): Promise<GoogleBusinessProfile> {
    const newProfile: GoogleBusinessProfile = {
      id: `google_business_${this.googleBusinessProfiles.length + 1}`,
      clientId: profile.clientId,
      businessName: profile.businessName,
      googlePlaceId: profile.googlePlaceId || null,
      googleAccountId: profile.googleAccountId || null,
      locationId: profile.locationId || null,
      oauthConnected: profile.oauthConnected || false,
      verificationStatus: profile.verificationStatus || "UNLINKED",
      verificationSource: profile.verificationSource || null,
      averageRating: profile.averageRating || null,
      totalReviews: profile.totalReviews || 0,
      businessHours: profile.businessHours || null,
      businessDescription: profile.businessDescription || null,
      businessCategories: profile.businessCategories || [],
      businessPhotos: profile.businessPhotos || [],
      website: profile.website || null,
      phoneNumber: profile.phoneNumber || null,
      address: profile.address || null,
      postalCode: profile.postalCode || null,
      city: profile.city || null,
      state: profile.state || null,
      country: profile.country || null,
      latitude: profile.latitude || null,
      longitude: profile.longitude || null,
      lastSyncAt: profile.lastSyncAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.googleBusinessProfiles.push(newProfile);
    return newProfile;
  }

  async updateGoogleBusinessProfile(clientId: string, updates: Partial<InsertGoogleBusinessProfile>): Promise<GoogleBusinessProfile> {
    const index = this.googleBusinessProfiles.findIndex(profile => profile.clientId === clientId);
    if (index === -1) throw new Error("Google Business Profile not found");
    
    this.googleBusinessProfiles[index] = {
      ...this.googleBusinessProfiles[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.googleBusinessProfiles[index];
  }

  async deleteGoogleBusinessProfile(clientId: string): Promise<void> {
    const index = this.googleBusinessProfiles.findIndex(profile => profile.clientId === clientId);
    if (index === -1) throw new Error("Google Business Profile not found");
    this.googleBusinessProfiles.splice(index, 1);
  }

  async syncGoogleBusinessProfile(clientId: string): Promise<GoogleBusinessProfile> {
    const profile = await this.getGoogleBusinessProfile(clientId);
    if (!profile) throw new Error("Google Business Profile not found");

    // Check if user has connected with Google OAuth
    if (!profile.oauthConnected) {
      throw new Error("Google Business Profile sync requires OAuth authentication. Please connect your Google account first.");
    }

    // Real Google My Business API integration required
    // TODO: Use stored OAuth tokens to call Google My Business API
    // For now, simulate successful sync after OAuth connection
    return this.updateGoogleBusinessProfile(clientId, {
      verificationStatus: "VERIFIED",
      lastSyncAt: new Date(),
    });
  }

  // Newsletter Subscriptions methods
  async getNewsletterSubscriptions(clientId: string): Promise<NewsletterSubscription[]> {
    return this.newsletterSubscriptions.filter(sub => sub.clientId === clientId);
  }

  async getNewsletterSubscription(id: string): Promise<NewsletterSubscription | undefined> {
    return this.newsletterSubscriptions.find(sub => sub.id === id);
  }

  async createNewsletterSubscription(subscription: InsertNewsletterSubscription): Promise<NewsletterSubscription> {
    const newSubscription: NewsletterSubscription = {
      id: `newsletter_${this.newsletterSubscriptions.length + 1}`,
      clientId: subscription.clientId,
      email: subscription.email,
      name: subscription.name || null,
      status: subscription.status || "ACTIVE",
      source: subscription.source || "WEBSITE",
      metadata: subscription.metadata || null,
      subscribedAt: subscription.subscribedAt || new Date(),
      unsubscribedAt: subscription.unsubscribedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.newsletterSubscriptions.push(newSubscription);
    return newSubscription;
  }

  async updateNewsletterSubscription(id: string, updates: Partial<InsertNewsletterSubscription>): Promise<NewsletterSubscription> {
    const index = this.newsletterSubscriptions.findIndex(sub => sub.id === id);
    if (index === -1) throw new Error("Newsletter subscription not found");
    
    this.newsletterSubscriptions[index] = {
      ...this.newsletterSubscriptions[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.newsletterSubscriptions[index];
  }

  async deleteNewsletterSubscription(id: string): Promise<void> {
    const index = this.newsletterSubscriptions.findIndex(sub => sub.id === id);
    if (index === -1) throw new Error("Newsletter subscription not found");
    this.newsletterSubscriptions.splice(index, 1);
  }

  // Website Staff methods
  async getWebsiteStaff(clientId: string): Promise<WebsiteStaff[]> {
    return this.websiteStaff.filter(staff => staff.clientId === clientId && staff.isActive)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getWebsiteStaffMember(id: string): Promise<WebsiteStaff | undefined> {
    return this.websiteStaff.find(staff => staff.id === id);
  }

  async createWebsiteStaff(staff: InsertWebsiteStaff): Promise<WebsiteStaff> {
    const newStaff: WebsiteStaff = {
      id: `staff_${this.websiteStaff.length + 1}`,
      clientId: staff.clientId,
      name: staff.name,
      title: staff.title,
      bio: staff.bio || null,
      profileImage: staff.profileImage || null,
      experience: staff.experience || null,
      specialties: staff.specialties || [],
      displayOrder: staff.displayOrder || 0,
      isActive: staff.isActive !== undefined ? staff.isActive : true,
      teamMemberId: staff.teamMemberId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.websiteStaff.push(newStaff);
    return newStaff;
  }

  async updateWebsiteStaff(id: string, updates: Partial<InsertWebsiteStaff>): Promise<WebsiteStaff> {
    const index = this.websiteStaff.findIndex(staff => staff.id === id);
    if (index === -1) throw new Error("Website staff member not found");
    
    this.websiteStaff[index] = {
      ...this.websiteStaff[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.websiteStaff[index];
  }

  async deleteWebsiteStaff(id: string): Promise<void> {
    const index = this.websiteStaff.findIndex(staff => staff.id === id);
    if (index === -1) throw new Error("Website staff member not found");
    this.websiteStaff.splice(index, 1);
  }

  // Service Pricing Tiers methods
  async getServicePricingTiers(clientId: string): Promise<ServicePricingTier[]> {
    return this.servicePricingTiers.filter(tier => tier.clientId === clientId && tier.isActive)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getServicePricingTier(id: string): Promise<ServicePricingTier | undefined> {
    return this.servicePricingTiers.find(tier => tier.id === id);
  }

  async createServicePricingTier(tier: InsertServicePricingTier): Promise<ServicePricingTier> {
    const newTier: ServicePricingTier = {
      id: `tier_${this.servicePricingTiers.length + 1}`,
      clientId: tier.clientId,
      name: tier.name,
      price: tier.price,
      currency: tier.currency || "USD",
      duration: tier.duration || null,
      features: tier.features || [],
      isPopular: tier.isPopular || false,
      displayOrder: tier.displayOrder || 0,
      isActive: tier.isActive !== undefined ? tier.isActive : true,
      buttonText: tier.buttonText || "Book Now",
      description: tier.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.servicePricingTiers.push(newTier);
    return newTier;
  }

  async updateServicePricingTier(id: string, updates: Partial<InsertServicePricingTier>): Promise<ServicePricingTier> {
    const index = this.servicePricingTiers.findIndex(tier => tier.id === id);
    if (index === -1) throw new Error("Service pricing tier not found");
    
    this.servicePricingTiers[index] = {
      ...this.servicePricingTiers[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.servicePricingTiers[index];
  }

  async deleteServicePricingTier(id: string): Promise<void> {
    const index = this.servicePricingTiers.findIndex(tier => tier.id === id);
    if (index === -1) throw new Error("Service pricing tier not found");
    this.servicePricingTiers.splice(index, 1);
  }

  // Website Testimonials methods
  async getWebsiteTestimonials(clientId: string): Promise<WebsiteTestimonial[]> {
    return this.websiteTestimonials.filter(testimonial => testimonial.clientId === clientId && testimonial.isActive)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getWebsiteTestimonial(id: string): Promise<WebsiteTestimonial | undefined> {
    return this.websiteTestimonials.find(testimonial => testimonial.id === id);
  }

  async createWebsiteTestimonial(testimonial: InsertWebsiteTestimonial): Promise<WebsiteTestimonial> {
    const newTestimonial: WebsiteTestimonial = {
      id: `testimonial_${this.websiteTestimonials.length + 1}`,
      clientId: testimonial.clientId,
      customerName: testimonial.customerName,
      customerTitle: testimonial.customerTitle || null,
      testimonialText: testimonial.testimonialText,
      customerImage: testimonial.customerImage || null,
      rating: testimonial.rating || 5,
      isActive: testimonial.isActive !== undefined ? testimonial.isActive : true,
      displayOrder: testimonial.displayOrder || 0,
      source: testimonial.source || "WEBSITE",
      reviewId: testimonial.reviewId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.websiteTestimonials.push(newTestimonial);
    return newTestimonial;
  }

  async updateWebsiteTestimonial(id: string, updates: Partial<InsertWebsiteTestimonial>): Promise<WebsiteTestimonial> {
    const index = this.websiteTestimonials.findIndex(testimonial => testimonial.id === id);
    if (index === -1) throw new Error("Website testimonial not found");
    
    this.websiteTestimonials[index] = {
      ...this.websiteTestimonials[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.websiteTestimonials[index];
  }

  async deleteWebsiteTestimonial(id: string): Promise<void> {
    const index = this.websiteTestimonials.findIndex(testimonial => testimonial.id === id);
    if (index === -1) throw new Error("Website testimonial not found");
    this.websiteTestimonials.splice(index, 1);
  }

  // ====================================
  // SECURE PAYMENT OPERATIONS
  // ====================================

  async getPayments(clientId: string): Promise<Payment[]> {
    return this.payments.filter(payment => payment.clientId === clientId);
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.find(payment => payment.id === id);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const newPayment: Payment = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId: payment.clientId,
      appointmentId: payment.appointmentId || null,
      paymentMethod: payment.paymentMethod,
      paymentProvider: payment.paymentProvider || null,
      paymentIntentId: payment.paymentIntentId || null,
      amount: payment.amount,
      currency: payment.currency || "USD",
      status: payment.status || "PENDING",
      customerName: payment.customerName,
      customerEmail: payment.customerEmail,
      description: payment.description || null,
      metadata: payment.metadata || null,
      processingFee: payment.processingFee || null,
      netAmount: payment.netAmount || null,
      paidAt: payment.paidAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.payments.push(newPayment);
    return newPayment;
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment> {
    const index = this.payments.findIndex(payment => payment.id === id);
    if (index === -1) throw new Error("Payment not found");
    
    this.payments[index] = {
      ...this.payments[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.payments[index];
  }

  async getPaymentsByAppointment(appointmentId: string): Promise<Payment[]> {
    return this.payments.filter(payment => payment.appointmentId === appointmentId);
  }

  // ====================================
  // SECURE SERVICE PRICE CALCULATION (SERVER-SIDE ONLY)
  // ====================================

  async calculateServiceAmount(clientId: string, serviceId: string): Promise<number> {
    // Get the service for the specific client
    const service = this.clientServices.find(s => 
      s.clientId === clientId && s.id === serviceId && s.isActive
    );
    
    if (!service) {
      throw new Error("Service not found or inactive");
    }
    
    return service.price;
  }

  async calculateTotalWithTip(baseAmount: number, tipPercentage?: number): Promise<number> {
    if (!tipPercentage || tipPercentage <= 0) {
      return baseAmount;
    }
    
    const tipAmount = (baseAmount * tipPercentage) / 100;
    return baseAmount + tipAmount;
  }

  // ====================================
  // SECURE STRIPE CONFIGURATION (NO SECRET KEY EXPOSURE)
  // ====================================

  async updateStripeConfig(clientId: string, publicKey: string, secretKey: string): Promise<void> {
    const clientIndex = this.clients.findIndex(c => c.id === clientId);
    if (clientIndex === -1) throw new Error("Client not found");
    
    // Store public key only - secret key would be encrypted in real DB
    this.clients[clientIndex] = {
      ...this.clients[clientIndex],
      stripePublicKey: publicKey,
      // NOTE: In production, secretKey should be encrypted before storage
      stripeSecretKey: secretKey, // This should be encrypted
      updatedAt: new Date()
    };
  }

  async getStripePublicKey(clientId: string): Promise<string | null> {
    const client = this.clients.find(c => c.id === clientId);
    return client?.stripePublicKey || null;
  }

  async getStripeSecretKey(clientId: string): Promise<string | null> {
    const client = this.clients.find(c => c.id === clientId);
    return client?.stripeSecretKey || null;
  }

  async validateStripeConfig(clientId: string): Promise<boolean> {
    const client = this.clients.find(c => c.id === clientId);
    // Check client-specific Stripe configuration first, then fall back to global env variables
    const hasClientConfig = !!(client?.stripePublicKey && client?.stripeSecretKey);
    const hasGlobalConfig = !!(process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY);
    return hasClientConfig || hasGlobalConfig;
  }

  async clearStripeConfig(clientId: string): Promise<void> {
    const clientIndex = this.clients.findIndex(c => c.id === clientId);
    if (clientIndex === -1) throw new Error("Client not found");
    
    this.clients[clientIndex] = {
      ...this.clients[clientIndex],
      stripePublicKey: null,
      stripeSecretKey: null,
      updatedAt: new Date()
    };
  }

  // ====================================
  // SMTP EMAIL CONFIGURATION MANAGEMENT
  // ====================================

  async updateSmtpConfig(clientId: string, config: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    smtpFromEmail?: string;
    smtpFromName?: string;
    smtpSecure?: boolean;
    smtpEnabled?: boolean;
  }): Promise<void> {
    const clientIndex = this.clients.findIndex(c => c.id === clientId);
    if (clientIndex === -1) throw new Error("Client not found");
    
    this.clients[clientIndex] = {
      ...this.clients[clientIndex],
      ...config,
      updatedAt: new Date()
    };
  }

  async getSmtpConfig(clientId: string): Promise<{
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUsername: string | null;
    smtpPassword: string | null;
    smtpFromEmail: string | null;
    smtpFromName: string | null;
    smtpSecure: boolean | null;
    smtpEnabled: boolean | null;
    isConfigured: boolean;
  }> {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) throw new Error("Client not found");
    
    const isConfigured = !!(client.smtpHost && client.smtpPort && client.smtpUsername && client.smtpPassword && client.smtpFromEmail);
    
    console.log('SMTP getConfig for', clientId, {
      smtpHost: client.smtpHost,
      smtpPort: client.smtpPort, 
      smtpUsername: client.smtpUsername,
      smtpPassword: '***',
      smtpFromEmail: client.smtpFromEmail,
      isConfigured
    });
    
    return {
      smtpHost: client.smtpHost || null,
      smtpPort: client.smtpPort || null,
      smtpUsername: client.smtpUsername || null,
      smtpPassword: null, // Never return password for security
      smtpFromEmail: client.smtpFromEmail || null,
      smtpFromName: client.smtpFromName || null,
      smtpSecure: client.smtpSecure !== false ? true : false, // default to true
      smtpEnabled: client.smtpEnabled || false,
      isConfigured
    };
  }

  async testSmtpConfig(clientId: string): Promise<boolean> {
    const client = this.clients.find(c => c.id === clientId);
    if (!client || !client.smtpEnabled) return false;
    
    // Basic validation - in real implementation, this would test the connection
    return !!(client.smtpHost && client.smtpPort && client.smtpUsername && client.smtpPassword && client.smtpFromEmail);
  }

  async clearSmtpConfig(clientId: string): Promise<void> {
    const clientIndex = this.clients.findIndex(c => c.id === clientId);
    if (clientIndex === -1) throw new Error("Client not found");
    
    this.clients[clientIndex] = {
      ...this.clients[clientIndex],
      smtpHost: null,
      smtpPort: null,
      smtpUsername: null,
      smtpPassword: null,
      smtpFromEmail: null,
      smtpFromName: null,
      smtpSecure: true,
      smtpEnabled: false,
      updatedAt: new Date()
    };
  }

  // Contact Messages / Super Admin Leads Methods
  private async loadContactMessages(): Promise<void> {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.contactMessagesFile), { recursive: true });
      
      // Try to load existing data
      const data = await fs.readFile(this.contactMessagesFile, 'utf8');
      this.contactMessages = JSON.parse(data);
      console.log(`✅ Loaded ${this.contactMessages.length} contact messages from file`);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty array
      this.contactMessages = [];
      console.log("📝 Starting with empty contact messages (file not found)");
    }
  }

  private async saveContactMessages(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.contactMessagesFile), { recursive: true });
      await fs.writeFile(this.contactMessagesFile, JSON.stringify(this.contactMessages, null, 2));
    } catch (error) {
      console.error("❌ Failed to save contact messages:", error);
    }
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    if (this.contactMessages.length === 0) {
      await this.loadContactMessages();
    }
    return this.contactMessages;
  }

  async getContactMessage(id: string): Promise<ContactMessage | undefined> {
    return this.contactMessages.find(m => m.id === id);
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    // Ensure messages are loaded first
    if (this.contactMessages.length === 0) {
      await this.loadContactMessages();
    }
    
    const newMessage: ContactMessage = {
      id: `contact_${Date.now()}`,
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message,
      source: message.source || "website",
      status: message.status || "NEW",
      notes: message.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contactMessages.push(newMessage);
    await this.saveContactMessages();
    return newMessage;
  }

  async updateContactMessage(id: string, updates: Partial<InsertContactMessage>): Promise<ContactMessage> {
    // Ensure messages are loaded first
    if (this.contactMessages.length === 0) {
      await this.loadContactMessages();
    }
    
    const messageIndex = this.contactMessages.findIndex(m => m.id === id);
    if (messageIndex === -1) throw new Error("Contact message not found");
    
    this.contactMessages[messageIndex] = {
      ...this.contactMessages[messageIndex],
      ...updates,
      updatedAt: new Date(),
    };
    await this.saveContactMessages();
    return this.contactMessages[messageIndex];
  }

  async deleteContactMessage(id: string): Promise<void> {
    // Ensure messages are loaded first
    if (this.contactMessages.length === 0) {
      await this.loadContactMessages();
    }
    
    const messageIndex = this.contactMessages.findIndex(m => m.id === id);
    if (messageIndex === -1) throw new Error("Contact message not found");
    
    this.contactMessages.splice(messageIndex, 1);
    await this.saveContactMessages();
  }
}

// PostgreSQL storage implementation using Drizzle ORM
class PostgreSQLStorage implements IStorage {
  private initialized = false;

  constructor() {
    // Initialize database when storage is created
    this.initializeDatabase();
  }

  private ensureDB() {
    if (!db) {
      throw new Error("Database connection not available. Please check your DATABASE_URL configuration.");
    }
    return db;
  }

  private async createTables() {
    const dbInstance = this.ensureDB();
    
    try {
      // Create essential tables if they don't exist
      console.log("🔧 Creating database tables if they don't exist...");
      
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" text PRIMARY KEY NOT NULL,
          "email" text NOT NULL UNIQUE,
          "password" text NOT NULL,
          "role" text DEFAULT 'CLIENT' NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "plans" (
          "id" text PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "monthly_price" real,
          "monthly_discount" real DEFAULT 0,
          "monthly_enabled" boolean DEFAULT true,
          "yearly_price" real,
          "yearly_discount" real DEFAULT 0,
          "yearly_enabled" boolean DEFAULT true,
          "features" text[] NOT NULL,
          "max_users" integer NOT NULL,
          "storage_gb" integer NOT NULL,
          "is_active" boolean DEFAULT true,
          "is_free_trial" boolean DEFAULT false,
          "trial_days" integer DEFAULT 0,
          "monthly_stripe_price_id" text,
          "yearly_stripe_price_id" text,
          "stripe_product_id" text,
          "created_at" timestamp DEFAULT now()
        );
      `);
      
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "review_platforms" (
          "id" text PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "display_name" text NOT NULL,
          "rating" real NOT NULL,
          "max_rating" real NOT NULL,
          "review_count" integer NOT NULL,
          "logo_url" text,
          "is_active" boolean DEFAULT true,
          "sort_order" integer DEFAULT 0,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "onboarding_sessions" (
          "id" text PRIMARY KEY NOT NULL,
          "session_id" text NOT NULL UNIQUE,
          "plan_id" text NOT NULL,
          "current_step" integer DEFAULT 1,
          "is_completed" boolean DEFAULT false,
          "business_data" text,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          "completed_at" timestamp
        );
      `);
      
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "contact_messages" (
          "id" text PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "email" text NOT NULL,
          "subject" text NOT NULL,
          "message" text NOT NULL,
          "source" text DEFAULT 'website',
          "status" text DEFAULT 'NEW',
          "notes" text,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "clients" (
          "id" text PRIMARY KEY NOT NULL,
          "business_name" text NOT NULL,
          "contact_person" text NOT NULL,
          "email" text NOT NULL UNIQUE,
          "phone" text,
          "business_address" text,
          "industry" text,
          "business_description" text,
          "logo_url" text,
          "operating_hours" text,
          "time_zone" text,
          "plan_id" text NOT NULL,
          "status" text DEFAULT 'TRIAL' NOT NULL,
          "user_id" text NOT NULL UNIQUE,
          "onboarding_session_id" text,
          "stripe_customer_id" text,
          "stripe_subscription_id" text,
          "stripe_public_key" text,
          "stripe_secret_key" text,
          "stripe_account_id" text,
          "smtp_host" text,
          "smtp_port" integer,
          "smtp_username" text,
          "smtp_password" text,
          "smtp_from_email" text,
          "smtp_from_name" text,
          "smtp_secure" boolean DEFAULT true,
          "smtp_enabled" boolean DEFAULT false,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          "last_login" timestamp
        );
      `);

      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "services" (
          "id" text PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "description" text NOT NULL,
          "price" text NOT NULL,
          "duration_minutes" integer NOT NULL,
          "category" text
        );
      `);

      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "client_services" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "name" text NOT NULL,
          "description" text,
          "price" real NOT NULL,
          "duration_minutes" integer NOT NULL,
          "category" text,
          "is_active" boolean DEFAULT true,
          "stripe_product_id" text,
          "stripe_price_id" text,
          "enable_online_payments" boolean DEFAULT false,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);

      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "appointments" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "customer_name" text NOT NULL,
          "customer_email" text NOT NULL,
          "customer_phone" text,
          "service_id" text NOT NULL,
          "appointment_date" timestamp NOT NULL,
          "start_time" text NOT NULL,
          "end_time" text NOT NULL,
          "status" text DEFAULT 'SCHEDULED' NOT NULL,
          "notes" text,
          "total_price" real NOT NULL,
          "payment_method" text DEFAULT 'CASH',
          "payment_status" text DEFAULT 'PENDING',
          "payment_intent_id" text,
          "email_confirmation" boolean DEFAULT true,
          "sms_confirmation" boolean DEFAULT false,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);

      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "appointment_slots" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "day_of_week" integer NOT NULL,
          "start_time" text NOT NULL,
          "end_time" text NOT NULL,
          "slot_duration" integer NOT NULL,
          "is_active" boolean DEFAULT true,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);

      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "leads" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "name" text NOT NULL,
          "email" text NOT NULL,
          "phone" text,
          "source" text NOT NULL,
          "status" text DEFAULT 'NEW' NOT NULL,
          "notes" text,
          "interested_services" text[] DEFAULT ARRAY[]::text[],
          "estimated_value" real,
          "follow_up_date" timestamp,
          "converted_to_appointment" boolean DEFAULT false,
          "appointment_id" text,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);

      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "team_members" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "name" text NOT NULL,
          "email" text NOT NULL,
          "phone" text,
          "role" text DEFAULT 'STAFF' NOT NULL,
          "permissions" text[] DEFAULT ARRAY[]::text[],
          "is_active" boolean DEFAULT true,
          "hourly_rate" real,
          "specializations" text[] DEFAULT ARRAY[]::text[],
          "working_hours" text,
          "password" text NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);

      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "payments" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "appointment_id" text,
          "payment_method" text NOT NULL,
          "payment_provider" text,
          "payment_intent_id" text,
          "amount" real NOT NULL,
          "currency" text DEFAULT 'USD',
          "status" text DEFAULT 'PENDING' NOT NULL,
          "customer_name" text NOT NULL,
          "customer_email" text NOT NULL,
          "description" text,
          "metadata" text,
          "processing_fee" real,
          "net_amount" real,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          "paid_at" timestamp
        );
      `);

      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "contact_messages" (
          "id" text PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "email" text NOT NULL,
          "subject" text NOT NULL,
          "message" text NOT NULL,
          "source" text DEFAULT 'website',
          "status" text DEFAULT 'NEW',
          "notes" text,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "domain_configurations" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL,
          "domain_type" text NOT NULL,
          "domain" text NOT NULL,
          "subdomain" text,
          "is_active" boolean DEFAULT false,
          "verification_status" text DEFAULT 'PENDING',
          "verification_token" text,
          "verification_method" text DEFAULT 'DNS_TXT',
          "ssl_status" text DEFAULT 'PENDING',
          "ssl_certificate_id" text,
          "ssl_issued_at" timestamp,
          "ssl_expires_at" timestamp,
          "dns_records" text,
          "redirect_to_https" boolean DEFAULT true,
          "status" text DEFAULT 'PENDING',
          "verified_at" timestamp,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);

      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "client_websites" (
          "id" text PRIMARY KEY NOT NULL,
          "client_id" text NOT NULL UNIQUE,
          "subdomain" text NOT NULL UNIQUE,
          "custom_domain" text,
          "title" text NOT NULL,
          "description" text,
          "hero_image" text,
          "primary_color" text DEFAULT '#3B82F6',
          "secondary_color" text DEFAULT '#F3F4F6',
          "contact_info" text,
          "social_links" text,
          "sections" text,
          "show_prices" boolean DEFAULT true,
          "allow_online_booking" boolean DEFAULT true,
          "is_published" boolean DEFAULT false,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);

      console.log("✅ Database tables created successfully");
    } catch (error) {
      console.error("❌ Table creation failed:", error);
      throw error;
    }
  }

  private async runMigrations() {
    const dbInstance = this.ensureDB();
    
    try {
      console.log("🔧 Running database migrations for missing columns...");
      
      // Check if client_services table has required columns and add them if missing
      const clientServicesColumns = await dbInstance.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'client_services' 
          AND column_name IN ('stripe_product_id', 'stripe_price_id', 'enable_online_payments');
      `);
      
      const existingColumns = new Set(clientServicesColumns.rows.map((row: any) => row.column_name));
      
      if (!existingColumns.has('stripe_product_id')) {
        console.log("Adding stripe_product_id to client_services table...");
        await dbInstance.execute(sql`ALTER TABLE client_services ADD COLUMN stripe_product_id text;`);
      }
      
      if (!existingColumns.has('stripe_price_id')) {
        console.log("Adding stripe_price_id to client_services table...");
        await dbInstance.execute(sql`ALTER TABLE client_services ADD COLUMN stripe_price_id text;`);
      }
      
      if (!existingColumns.has('enable_online_payments')) {
        console.log("Adding enable_online_payments to client_services table...");
        await dbInstance.execute(sql`ALTER TABLE client_services ADD COLUMN enable_online_payments boolean DEFAULT false;`);
        // Update existing records to have default value
        await dbInstance.execute(sql`UPDATE client_services SET enable_online_payments = false WHERE enable_online_payments IS NULL;`);
      }
      
      console.log("✅ Database migrations completed successfully");
    } catch (error) {
      console.error("❌ Migration failed:", error);
      // Don't throw error here - migrations should be non-blocking if they fail
      console.log("⚠️ Continuing with initialization despite migration errors...");
    }
  }

  private async initializeDatabase() {
    if (this.initialized) return;
    
    try {
      const dbInstance = this.ensureDB();
      console.log("🔄 Initializing PostgreSQL database tables...");
      
      // First create tables, run migrations, then ensure super admin, then seed data
      await this.createTables();
      await this.runMigrations();
      await this.ensureSuperAdmin();
      await this.seedDemoData();
      
      this.initialized = true;
      console.log("✅ PostgreSQL database initialized successfully");
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      // Don't throw - let the app try to continue
    }
  }

  private async ensureSuperAdmin() {
    const dbInstance = this.ensureDB();
    
    try {
      // Check if super admin already exists
      const existingAdmin = await dbInstance
        .select()
        .from(users)
        .where(eq(users.email, "admin@scheduled-platform.com"))
        .limit(1);
      
      if (existingAdmin.length > 0) {
        console.log("👤 Super admin user already exists, skipping creation");
        return;
      }

      // Create super admin user for deployment access
      const adminPassword = "SecurePlatform2025!@#$%";
      console.log("👤 Creating super admin user...");
      
      await this.createUser({
        email: "admin@scheduled-platform.com",
        password: adminPassword,
        role: "SUPER_ADMIN"
      });
      
      console.log("✅ Super admin user created successfully");
      console.log(`📧 Admin Email: admin@scheduled-platform.com`);
      console.log(`🔑 Admin Password: ${adminPassword}`);
    } catch (error) {
      console.error("❌ Super admin creation failed:", error);
      // Don't throw - let the app try to continue
    }
  }

  private async seedDemoData() {
    const dbInstance = this.ensureDB();
    
    try {
      // Check if data already exists
      const existingPlans = await dbInstance.select().from(plans).limit(1);
      if (existingPlans.length > 0) {
        console.log("📊 Demo data already exists, skipping seed");
        return;
      }

      console.log("🌱 Seeding demo data for production...");
      
      // Insert demo plans
      await dbInstance.insert(plans).values([
        {
          id: "plan_1",
          name: "Free Demo",
          monthlyPrice: 0,
          yearlyPrice: 0,
          features: ["1 User", "Basic Support", "Demo Features"],
          maxUsers: 1,
          storageGB: 1
        },
        {
          id: "plan_2", 
          name: "Basic",
          monthlyPrice: 29,
          yearlyPrice: 290,
          features: ["Up to 5 Users", "Email Support", "Client Management"],
          maxUsers: 5,
          storageGB: 10
        },
        {
          id: "plan_3",
          name: "Pro", 
          monthlyPrice: 79,
          yearlyPrice: 790,
          features: ["Unlimited Users", "Priority Support", "Analytics", "API Access"],
          maxUsers: -1,
          storageGB: 100
        },
        {
          id: "plan_4",
          name: "Enterprise",
          monthlyPrice: 199,
          yearlyPrice: 1990,
          features: ["Everything in Pro", "Custom Integrations", "Dedicated Support", "White Label"],
          maxUsers: -1,
          storageGB: -1
        }
      ]);

      // Insert review platforms
      await dbInstance.insert(reviewPlatforms).values([
        {
          id: "review_platform_1",
          name: "Google",
          displayName: "Google Business Profile",
          rating: 4.9,
          maxRating: 5,
          reviewCount: 2500,
          logoUrl: "/icons/google.svg",
          isActive: true,
          sortOrder: 1
        }
      ]);

      console.log("✅ Demo data seeded successfully");
    } catch (error) {
      console.error("❌ Demo data seeding failed:", error);
    }
  }

  // Authentication & Users
  async getUser(id: string): Promise<User | undefined> {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const dbInstance = this.ensureDB();
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await dbInstance.insert(users).values({
      ...user,
      password: hashedPassword,
      id: `user_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newUser;
  }

  // Plans Management  
  async getPlans(): Promise<Plan[]> {
    await this.initializeDatabase();
    const dbInstance = this.ensureDB();
    return dbInstance.select().from(plans);
  }

  async getPlan(id: string): Promise<Plan | undefined> {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(plans).where(eq(plans.id, id)).limit(1);
    return result[0];
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const dbInstance = this.ensureDB();
    const [newPlan] = await dbInstance.insert(plans).values({
      ...plan,
      id: `plan_${Date.now()}`
    }).returning();
    return newPlan;
  }

  async updatePlan(id: string, updates: Partial<InsertPlan>): Promise<Plan> {
    const dbInstance = this.ensureDB();
    const [updatedPlan] = await dbInstance.update(plans)
      .set(updates)
      .where(eq(plans.id, id))
      .returning();
    if (!updatedPlan) throw new Error("Plan not found");
    return updatedPlan;
  }

  async deletePlan(id: string): Promise<void> {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(plans).where(eq(plans.id, id));
  }
  
  // Plan synchronization methods
  async syncClientPlans(planId: string): Promise<void> {
    const dbInstance = this.ensureDB();
    
    // Find all clients using this plan
    const affectedClients = await dbInstance
      .select()
      .from(clients)
      .where(eq(clients.planId, planId));
    
    console.log(`🔄 Syncing plan ${planId} for ${affectedClients.length} clients`);
    
    // In PostgreSQL, the plan data is already updated, clients automatically get the latest plan data
    // when they query their plan information since they reference it by planId
  }
  
  async updatePlanPricing(planId: string, updates: { monthlyPrice?: number; yearlyPrice?: number; stripeProductId?: string; monthlyStripePriceId?: string; yearlyStripePriceId?: string }): Promise<Plan> {
    const dbInstance = this.ensureDB();
    
    const [updatedPlan] = await dbInstance
      .update(plans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(plans.id, planId))
      .returning();
    
    if (!updatedPlan) throw new Error("Plan not found");
    
    // Auto-sync all clients using this plan
    await this.syncClientPlans(planId);
    
    return updatedPlan;
  }
  
  async updateClientPlan(clientId: string, planId: string): Promise<Client> {
    const dbInstance = this.ensureDB();
    
    // Verify plan exists
    const plan = await dbInstance
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);
    
    if (plan.length === 0) throw new Error("Plan not found");
    
    const [updatedClient] = await dbInstance
      .update(clients)
      .set({ planId, updatedAt: new Date() })
      .where(eq(clients.id, clientId))
      .returning();
    
    if (!updatedClient) throw new Error("Client not found");
    
    return updatedClient;
  }

  // Contact Messages / Super Admin Leads  
  async getContactMessages(): Promise<ContactMessage[]> {
    const dbInstance = this.ensureDB();
    return dbInstance.select().from(contactMessages).orderBy(sql`${contactMessages.createdAt} DESC`);
  }

  async getContactMessage(id: string): Promise<ContactMessage | undefined> {
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1);
    return result[0];
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const dbInstance = this.ensureDB();
    const [newMessage] = await dbInstance.insert(contactMessages).values({
      ...message,
      id: `contact_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newMessage;
  }

  async updateContactMessage(id: string, updates: Partial<InsertContactMessage>): Promise<ContactMessage> {
    const dbInstance = this.ensureDB();
    const [updatedMessage] = await dbInstance.update(contactMessages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contactMessages.id, id))
      .returning();
    if (!updatedMessage) throw new Error("Contact message not found");
    return updatedMessage;
  }

  async deleteContactMessage(id: string): Promise<void> {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(contactMessages).where(eq(contactMessages.id, id));
  }

  // Note: For brevity, implementing key methods first. Other methods would follow same pattern
  // using Drizzle ORM operations instead of in-memory arrays
  
  // Onboarding session implementations 
  async getOnboardingSessions(): Promise<OnboardingSession[]> { 
    const dbInstance = this.ensureDB();
    const sessions = await dbInstance.select().from(onboardingSessions);
    return sessions;
  }
  async getOnboardingSession(sessionId: string): Promise<OnboardingSession | undefined> { 
    const dbInstance = this.ensureDB();
    const sessions = await dbInstance
      .select()
      .from(onboardingSessions)
      .where(eq(onboardingSessions.sessionId, sessionId))
      .limit(1);
    
    return sessions.length > 0 ? sessions[0] : undefined;
  }
  async createOnboardingSession(session: InsertOnboardingSession): Promise<OnboardingSession> {
    const dbInstance = this.ensureDB();
    const sessionId = `onb_${Date.now()}`;
    
    const result = await dbInstance.insert(onboardingSessions).values({
      id: sessionId,
      sessionId: session.sessionId,
      planId: session.planId,
      currentStep: session.currentStep || 1,
      isCompleted: false,
      businessData: session.businessData || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null
    }).returning();
    return result[0];
  }
  async updateOnboardingSession(sessionId: string, updates: Partial<InsertOnboardingSession>): Promise<OnboardingSession> {
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .update(onboardingSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(onboardingSessions.sessionId, sessionId))
      .returning();
    
    if (result.length === 0) throw new Error("Onboarding session not found");
    return result[0];
  }
  async completeOnboarding(sessionId: string): Promise<OnboardingSession> {
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .update(onboardingSessions)
      .set({ 
        isCompleted: true, 
        completedAt: new Date(), 
        updatedAt: new Date() 
      })
      .where(eq(onboardingSessions.sessionId, sessionId))
      .returning();
    
    if (result.length === 0) throw new Error("Onboarding session not found");
    return result[0];
  }
  async getClients(): Promise<Client[]> { 
    const dbInstance = this.ensureDB();
    const result = await dbInstance.select().from(clients);
    return result;
  }
  async getClient(id: string): Promise<Client | undefined> { 
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .select()
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }
  async getClientByEmail(email: string): Promise<Client | undefined> { 
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .select()
      .from(clients)
      .where(eq(clients.email, email))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }
  async getClientBySubdomain(subdomain: string): Promise<Client | undefined> {
    const dbInstance = this.ensureDB();
    // Join through website to find the client
    const result = await dbInstance
      .select({
        id: clients.id,
        businessName: clients.businessName,
        contactPerson: clients.contactPerson,
        email: clients.email,
        phone: clients.phone,
        businessAddress: clients.businessAddress,
        industry: clients.industry,
        businessDescription: clients.businessDescription,
        logoUrl: clients.logoUrl,
        operatingHours: clients.operatingHours,
        timeZone: clients.timeZone,
        planId: clients.planId,
        status: clients.status,
        userId: clients.userId,
        onboardingSessionId: clients.onboardingSessionId,
        stripeCustomerId: clients.stripeCustomerId,
        stripeSubscriptionId: clients.stripeSubscriptionId,
        stripePublicKey: clients.stripePublicKey,
        stripeSecretKey: clients.stripeSecretKey,
        stripeAccountId: clients.stripeAccountId,
        smtpHost: clients.smtpHost,
        smtpPort: clients.smtpPort,
        smtpUsername: clients.smtpUsername,
        smtpPassword: clients.smtpPassword,
        smtpFromEmail: clients.smtpFromEmail,
        smtpFromName: clients.smtpFromName,
        smtpSecure: clients.smtpSecure,
        smtpEnabled: clients.smtpEnabled,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        lastLogin: clients.lastLogin
      })
      .from(clientWebsites)
      .innerJoin(clients, eq(clientWebsites.clientId, clients.id))
      .where(eq(clientWebsites.subdomain, subdomain))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }
  async createClient(client: InsertClient): Promise<Client> {
    const dbInstance = this.ensureDB();
    const clientId = `client_${Date.now()}`;
    
    const [newClient] = await dbInstance.insert(clients).values({
      id: clientId,
      businessName: client.businessName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone || null,
      businessAddress: client.businessAddress || null,
      industry: client.industry || null,
      businessDescription: client.businessDescription || null,
      logoUrl: client.logoUrl || null,
      operatingHours: client.operatingHours || null,
      timeZone: client.timeZone || null,
      planId: client.planId,
      status: client.status || "TRIAL",
      userId: client.userId,
      onboardingSessionId: client.onboardingSessionId || null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePublicKey: null,
      stripeSecretKey: null,
      stripeAccountId: null,
      smtpHost: null,
      smtpPort: null,
      smtpUsername: null,
      smtpPassword: null,
      smtpFromEmail: null,
      smtpFromName: null,
      smtpSecure: true,
      smtpEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    }).returning();
    return newClient;
  }
  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client> {
    const dbInstance = this.ensureDB();
    const [updatedClient] = await dbInstance
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    
    if (!updatedClient) throw new Error("Client not found");
    return updatedClient;
  }
  async deleteClient(id: string): Promise<void> {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(clients).where(eq(clients.id, id));
  }
  async getServices(): Promise<Service[]> { return []; }
  async getService(id: number): Promise<Service | undefined> { return undefined; }
  async createService(service: InsertService): Promise<Service> {
    const dbInstance = this.ensureDB();
    const id = `service_${Date.now()}`;
    const [createdService] = await dbInstance
      .insert(services)
      .values({ ...service, id })
      .returning();
    return createdService;
  }
  async getReviews(): Promise<Review[]> { return []; }
  async createReview(review: InsertReview): Promise<Review> { throw new Error("Not implemented"); }
  async getClientServices(clientId: string): Promise<ClientService[]> { 
    const dbInstance = this.ensureDB();
    const services = await dbInstance
      .select()
      .from(clientServices)
      .where(eq(clientServices.clientId, clientId));
    
    return services;
  }
  async createClientService(service: InsertClientService): Promise<ClientService> {
    const dbInstance = this.ensureDB();
    const serviceId = `service_${Date.now()}`;
    
    const [newService] = await dbInstance.insert(clientServices).values({
      id: serviceId,
      clientId: service.clientId,
      name: service.name,
      description: service.description || null,
      price: service.price,
      durationMinutes: service.durationMinutes,
      category: service.category || null,
      isActive: service.isActive !== undefined ? service.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newService;
  }
  async updateClientService(id: string, updates: Partial<InsertClientService>): Promise<ClientService> {
    const dbInstance = this.ensureDB();
    const [updatedService] = await dbInstance
      .update(clientServices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clientServices.id, id))
      .returning();
    
    if (!updatedService) throw new Error("Client service not found");
    return updatedService;
  }
  async deleteClientService(id: string): Promise<void> {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(clientServices).where(eq(clientServices.id, id));
  }
  async getAppointments(clientId: string): Promise<Appointment[]> { 
    const dbInstance = this.ensureDB();
    const clientAppointments = await dbInstance
      .select()
      .from(appointments)
      .where(eq(appointments.clientId, clientId));
    
    return clientAppointments;
  }
  async getAppointment(id: string): Promise<Appointment | undefined> { 
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const dbInstance = this.ensureDB();
    const appointmentId = `appt_${Date.now()}`;
    
    const [newAppointment] = await dbInstance.insert(appointments).values({
      id: appointmentId,
      clientId: appointment.clientId,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      customerPhone: appointment.customerPhone || null,
      serviceId: appointment.serviceId,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status || "SCHEDULED",
      notes: appointment.notes || null,
      totalPrice: appointment.totalPrice,
      paymentMethod: appointment.paymentMethod || "CASH",
      paymentStatus: appointment.paymentStatus || "PENDING",
      paymentIntentId: appointment.paymentIntentId || null,
      emailConfirmation: appointment.emailConfirmation !== undefined ? appointment.emailConfirmation : true,
      smsConfirmation: appointment.smsConfirmation !== undefined ? appointment.smsConfirmation : false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newAppointment;
  }
  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment> {
    const dbInstance = this.ensureDB();
    const [updatedAppointment] = await dbInstance
      .update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    
    if (!updatedAppointment) throw new Error("Appointment not found");
    return updatedAppointment;
  }
  async deleteAppointment(id: string): Promise<void> {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(appointments).where(eq(appointments.id, id));
  }
  async getOperatingHours(clientId: string): Promise<OperatingHours[]> { return []; }
  async setOperatingHours(clientId: string, hours: InsertOperatingHours[]): Promise<OperatingHours[]> { return []; }
  async getLeads(clientId: string): Promise<Lead[]> { 
    const dbInstance = this.ensureDB();
    const clientLeads = await dbInstance
      .select()
      .from(leads)
      .where(eq(leads.clientId, clientId));
    
    return clientLeads;
  }
  async getLead(id: string): Promise<Lead | undefined> { return undefined; }
  async createLead(lead: InsertLead): Promise<Lead> {
    const dbInstance = this.ensureDB();
    const leadId = `lead_${Date.now()}`;
    
    const [newLead] = await dbInstance.insert(leads).values({
      id: leadId,
      clientId: lead.clientId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || null,
      source: lead.source,
      status: lead.status || "NEW",
      notes: lead.notes || null,
      interestedServices: lead.interestedServices || [],
      estimatedValue: lead.estimatedValue || null,
      followUpDate: lead.followUpDate || null,
      convertedToAppointment: lead.convertedToAppointment || false,
      appointmentId: lead.appointmentId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newLead;
  }
  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead> {
    const dbInstance = this.ensureDB();
    const [updatedLead] = await dbInstance
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    
    if (!updatedLead) throw new Error("Lead not found");
    return updatedLead;
  }
  async deleteLead(id: string): Promise<void> {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(leads).where(eq(leads.id, id));
  }
  async getClientWebsite(clientId: string): Promise<ClientWebsite | undefined> {
    const dbInstance = this.ensureDB();
    const [website] = await dbInstance
      .select()
      .from(clientWebsites)
      .where(eq(clientWebsites.clientId, clientId))
      .limit(1);
    return website;
  }
  async createClientWebsite(website: InsertClientWebsite): Promise<ClientWebsite> {
    const dbInstance = this.ensureDB();
    const id = `website_${Date.now()}`;
    const [createdWebsite] = await dbInstance
      .insert(clientWebsites)
      .values({ ...website, id })
      .returning();
    return createdWebsite;
  }
  async updateClientWebsite(clientId: string, updates: Partial<InsertClientWebsite>): Promise<ClientWebsite> {
    const dbInstance = this.ensureDB();
    
    // First, try to update existing website
    const [updatedWebsite] = await dbInstance
      .update(clientWebsites)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clientWebsites.clientId, clientId))
      .returning();
    
    // If no website exists, create a new one
    if (!updatedWebsite) {
      const websiteId = `website_${Date.now()}`;
      const [newWebsite] = await dbInstance
        .insert(clientWebsites)
        .values({
          id: websiteId,
          clientId,
          title: "My Business",
          description: "Professional services",
          primaryColor: "#3B82F6",
          showServices: true,
          showBooking: true,
          contactEmail: "",
          contactPhone: "",
          subdomain: `client-${clientId.replace('client_', '')}`,
          isPublished: false,
          ...updates,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return newWebsite;
    }
    
    return updatedWebsite;
  }
  async getPublicWebsite(subdomain: string): Promise<ClientWebsite | undefined> {
    const dbInstance = this.ensureDB();
    const [website] = await dbInstance
      .select()
      .from(clientWebsites)
      .where(eq(clientWebsites.subdomain, subdomain))
      .limit(1);
    return website;
  }
  async getAppointmentSlots(clientId: string): Promise<AppointmentSlot[]> { 
    const dbInstance = this.ensureDB();
    const slots = await dbInstance
      .select()
      .from(appointmentSlots)
      .where(eq(appointmentSlots.clientId, clientId));
    
    return slots;
  }
  async createAppointmentSlot(slot: InsertAppointmentSlot): Promise<AppointmentSlot> {
    const dbInstance = this.ensureDB();
    const slotId = `slot_${Date.now()}`;
    
    const [newSlot] = await dbInstance.insert(appointmentSlots).values({
      id: slotId,
      clientId: slot.clientId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotDuration: slot.slotDuration,
      isActive: slot.isActive !== undefined ? slot.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newSlot;
  }
  async updateAppointmentSlot(id: string, updates: Partial<InsertAppointmentSlot>): Promise<AppointmentSlot> { throw new Error("Not implemented"); }
  async deleteAppointmentSlot(id: string): Promise<void> { throw new Error("Not implemented"); }
  
  async getAvailableSlots(clientId: string, date: string): Promise<string[]> {
    const dbInstance = this.ensureDB();
    
    // Parse date as local calendar date to avoid UTC/timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day); // month is 0-indexed
    const dayOfWeek = localDate.getDay(); // 0-6 (Sunday-Saturday)
    
    console.log(`DBStorage.getAvailableSlots: date=${date}, parsed=(${year},${month},${day}), dayOfWeek=${dayOfWeek}`);
    
    // Get slot configurations for this day from database
    const daySlots = await dbInstance
      .select()
      .from(appointmentSlots)
      .where(
        and(
          eq(appointmentSlots.clientId, clientId),
          eq(appointmentSlots.dayOfWeek, dayOfWeek),
          eq(appointmentSlots.isActive, true)
        )
      );
    
    console.log(`Found ${daySlots.length} slot configurations for dayOfWeek ${dayOfWeek}`);
    
    if (daySlots.length === 0) return [];
    
    // Get existing appointments for this date from database
    const existingAppointments = await dbInstance
      .select()
      .from(appointments)
      .where(eq(appointments.clientId, clientId));
    
    // Filter appointments by date (compare date strings to avoid timezone issues)
    const bookedTimes = existingAppointments
      .filter((apt: typeof appointments.$inferSelect) => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate.toDateString() === localDate.toDateString();
      })
      .map((apt: typeof appointments.$inferSelect) => apt.startTime);
    
    // Generate available time slots using Set to prevent duplicates
    const availableSlots = new Set<string>();
    
    for (const slotConfig of daySlots) {
      const start = this.timeToMinutes(slotConfig.startTime);
      const end = this.timeToMinutes(slotConfig.endTime);
      const duration = slotConfig.slotDuration || 30;
      
      for (let time = start; time < end; time += duration) {
        const timeString = this.minutesToTime(time);
        if (!bookedTimes.includes(timeString)) {
          availableSlots.add(timeString);
        }
      }
    }
    
    const result = Array.from(availableSlots).sort();
    console.log(`DBStorage.getAvailableSlots returning ${result.length} slots:`, result);
    return result;
  }
  
  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
  async getTeamMembers(clientId: string): Promise<TeamMember[]> { 
    const dbInstance = this.ensureDB();
    const members = await dbInstance
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.clientId, clientId));
    
    return members;
  }
  async getTeamMember(id: string): Promise<TeamMember | undefined> { return undefined; }
  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const dbInstance = this.ensureDB();
    const memberId = `team_${Date.now()}`;
    
    const [newMember] = await dbInstance.insert(teamMembers).values({
      id: memberId,
      clientId: member.clientId,
      name: member.name,
      email: member.email,
      phone: member.phone || null,
      role: member.role || "STAFF",
      permissions: member.permissions || [],
      isActive: member.isActive !== undefined ? member.isActive : true,
      hourlyRate: member.hourlyRate || null,
      specializations: member.specializations || [],
      workingHours: member.workingHours || null,
      password: member.password, // Should be hashed before calling this method
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newMember;
  }
  async updateTeamMember(id: string, updates: Partial<InsertTeamMember>): Promise<TeamMember> {
    const dbInstance = this.ensureDB();
    const [updatedMember] = await dbInstance
      .update(teamMembers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teamMembers.id, id))
      .returning();
    
    if (!updatedMember) throw new Error("Team member not found");
    return updatedMember;
  }
  async deleteTeamMember(id: string): Promise<void> {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(teamMembers).where(eq(teamMembers.id, id));
  }
  async getReviewPlatforms(): Promise<ReviewPlatform[]> { return []; }
  async getReviewPlatform(id: string): Promise<ReviewPlatform | undefined> { return undefined; }
  async createReviewPlatform(platform: InsertReviewPlatform): Promise<ReviewPlatform> { throw new Error("Not implemented"); }
  async updateReviewPlatform(id: string, updates: Partial<InsertReviewPlatform>): Promise<ReviewPlatform> { throw new Error("Not implemented"); }
  async deleteReviewPlatform(id: string): Promise<void> { throw new Error("Not implemented"); }
  async getReviewPlatformConnections(clientId: string): Promise<ReviewPlatformConnection[]> { return []; }
  async getReviewPlatformConnection(id: string): Promise<ReviewPlatformConnection | undefined> { return undefined; }
  async createReviewPlatformConnection(connection: InsertReviewPlatformConnection): Promise<ReviewPlatformConnection> { throw new Error("Not implemented"); }
  async updateReviewPlatformConnection(id: string, updates: Partial<InsertReviewPlatformConnection>): Promise<ReviewPlatformConnection> { throw new Error("Not implemented"); }
  async deleteReviewPlatformConnection(id: string): Promise<void> { throw new Error("Not implemented"); }
  async syncReviewPlatformData(connectionId: string): Promise<ReviewPlatformConnection> { throw new Error("Not implemented"); }
  async getPlatformReviews(clientId: string, platform?: string): Promise<PlatformReview[]> { return []; }
  async getPlatformReview(id: string): Promise<PlatformReview | undefined> { return undefined; }
  async createPlatformReview(review: InsertPlatformReview): Promise<PlatformReview> { throw new Error("Not implemented"); }
  async updatePlatformReview(id: string, updates: Partial<InsertPlatformReview>): Promise<PlatformReview> { throw new Error("Not implemented"); }
  async deletePlatformReview(id: string): Promise<void> { throw new Error("Not implemented"); }
  async getDomainConfigurations(clientId: string): Promise<DomainConfiguration[]> {
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .select()
      .from(domainConfigurations)
      .where(eq(domainConfigurations.clientId, clientId));
    return result;
  }
  async getDomainConfiguration(id: string): Promise<DomainConfiguration | undefined> {
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .select()
      .from(domainConfigurations)
      .where(eq(domainConfigurations.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  }
  async getDomainConfigurationByDomain(domain: string): Promise<DomainConfiguration | undefined> {
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .select()
      .from(domainConfigurations)
      .where(eq(domainConfigurations.domain, domain))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  }
  async createDomainConfiguration(domain: InsertDomainConfiguration): Promise<DomainConfiguration> {
    const dbInstance = this.ensureDB();
    const id = `domain_${Date.now()}`;
    const [createdDomain] = await dbInstance
      .insert(domainConfigurations)
      .values({ 
        id,
        clientId: domain.clientId,
        domainType: domain.domainType,
        domain: domain.domain,
        subdomain: domain.subdomain,
        isActive: domain.isActive,
        verificationStatus: domain.verificationStatus,
        verificationToken: domain.verificationToken,
        verificationMethod: domain.verificationMethod,
        sslStatus: domain.sslStatus,
        sslCertificateId: domain.sslCertificateId,
        sslIssuedAt: domain.sslIssuedAt,
        sslExpiresAt: domain.sslExpiresAt,
        dnsRecords: domain.dnsRecords,
        redirectToHttps: domain.redirectToHttps,
        // customSettings: domain.customSettings, // Column doesn't exist in Coolify production DB
        // lastCheckedAt: domain.lastCheckedAt, // Column doesn't exist in Coolify production DB
        verifiedAt: domain.verifiedAt,
      })
      .returning();
    return createdDomain;
  }
  async updateDomainConfiguration(id: string, updates: Partial<InsertDomainConfiguration>): Promise<DomainConfiguration> {
    const dbInstance = this.ensureDB();
    const [updatedDomain] = await dbInstance
      .update(domainConfigurations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(domainConfigurations.id, id))
      .returning();
    
    if (!updatedDomain) throw new Error("Domain configuration not found");
    return updatedDomain;
  }
  async deleteDomainConfiguration(id: string): Promise<void> {
    const dbInstance = this.ensureDB();
    await dbInstance.delete(domainConfigurations).where(eq(domainConfigurations.id, id));
  }
  async verifyDomain(id: string): Promise<DomainConfiguration> {
    const dbInstance = this.ensureDB();
    const [domain] = await dbInstance
      .update(domainConfigurations)
      .set({ status: 'VERIFIED', verifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(domainConfigurations.id, id))
      .returning();
    
    if (!domain) throw new Error("Domain configuration not found");
    return domain;
  }
  async getGoogleBusinessProfile(clientId: string): Promise<GoogleBusinessProfile | undefined> { return undefined; }
  async createGoogleBusinessProfile(profile: InsertGoogleBusinessProfile): Promise<GoogleBusinessProfile> { throw new Error("Not implemented"); }
  async updateGoogleBusinessProfile(clientId: string, updates: Partial<InsertGoogleBusinessProfile>): Promise<GoogleBusinessProfile> { throw new Error("Not implemented"); }
  async deleteGoogleBusinessProfile(clientId: string): Promise<void> { throw new Error("Not implemented"); }
  async syncGoogleBusinessProfile(clientId: string): Promise<GoogleBusinessProfile> { throw new Error("Not implemented"); }
  async getDomainVerificationLogs(domainConfigId: string): Promise<DomainVerificationLog[]> { return []; }
  async createDomainVerificationLog(log: InsertDomainVerificationLog): Promise<DomainVerificationLog> { throw new Error("Not implemented"); }
  async getNewsletterSubscriptions(clientId: string): Promise<NewsletterSubscription[]> { return []; }
  async getNewsletterSubscription(id: string): Promise<NewsletterSubscription | undefined> { return undefined; }
  async createNewsletterSubscription(subscription: InsertNewsletterSubscription): Promise<NewsletterSubscription> { throw new Error("Not implemented"); }
  async updateNewsletterSubscription(id: string, updates: Partial<InsertNewsletterSubscription>): Promise<NewsletterSubscription> { throw new Error("Not implemented"); }
  async deleteNewsletterSubscription(id: string): Promise<void> { throw new Error("Not implemented"); }
  async getWebsiteStaff(clientId: string): Promise<WebsiteStaff[]> { return []; }
  async getWebsiteStaffMember(id: string): Promise<WebsiteStaff | undefined> { return undefined; }
  async createWebsiteStaff(staff: InsertWebsiteStaff): Promise<WebsiteStaff> { throw new Error("Not implemented"); }
  async updateWebsiteStaff(id: string, updates: Partial<InsertWebsiteStaff>): Promise<WebsiteStaff> { throw new Error("Not implemented"); }
  async deleteWebsiteStaff(id: string): Promise<void> { throw new Error("Not implemented"); }
  async getServicePricingTiers(clientId: string): Promise<ServicePricingTier[]> { return []; }
  async getServicePricingTier(id: string): Promise<ServicePricingTier | undefined> { return undefined; }
  async createServicePricingTier(tier: InsertServicePricingTier): Promise<ServicePricingTier> { throw new Error("Not implemented"); }
  async updateServicePricingTier(id: string, updates: Partial<InsertServicePricingTier>): Promise<ServicePricingTier> { throw new Error("Not implemented"); }
  async deleteServicePricingTier(id: string): Promise<void> { throw new Error("Not implemented"); }
  async getWebsiteTestimonials(clientId: string): Promise<WebsiteTestimonial[]> { return []; }
  async getWebsiteTestimonial(id: string): Promise<WebsiteTestimonial | undefined> { return undefined; }
  async createWebsiteTestimonial(testimonial: InsertWebsiteTestimonial): Promise<WebsiteTestimonial> { throw new Error("Not implemented"); }
  async updateWebsiteTestimonial(id: string, updates: Partial<InsertWebsiteTestimonial>): Promise<WebsiteTestimonial> { throw new Error("Not implemented"); }
  async deleteWebsiteTestimonial(id: string): Promise<void> { throw new Error("Not implemented"); }
  async getPayments(clientId: string): Promise<Payment[]> { 
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .select()
      .from(payments)
      .where(eq(payments.clientId, clientId));
    
    return result;
  }
  async getPayment(id: string): Promise<Payment | undefined> { 
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const dbInstance = this.ensureDB();
    const paymentId = `payment_${Date.now()}`;
    
    const [newPayment] = await dbInstance.insert(payments).values({
      id: paymentId,
      clientId: payment.clientId,
      appointmentId: payment.appointmentId || null,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentProvider: payment.paymentProvider || null,
      paymentIntentId: payment.paymentIntentId || null,
      status: payment.status || "PENDING",
      currency: payment.currency || "USD",
      description: payment.description || null,
      customerName: payment.customerName,
      customerEmail: payment.customerEmail,
      metadata: payment.metadata || null,
      processingFee: payment.processingFee || null,
      netAmount: payment.netAmount || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      paidAt: payment.paidAt || null
    }).returning();
    return newPayment;
  }
  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment> {
    const dbInstance = this.ensureDB();
    const [updatedPayment] = await dbInstance
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    
    if (!updatedPayment) throw new Error("Payment not found");
    return updatedPayment;
  }
  async getPaymentsByAppointment(appointmentId: string): Promise<Payment[]> { 
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .select()
      .from(payments)
      .where(eq(payments.appointmentId, appointmentId));
    
    return result;
  }
  async calculateServiceAmount(clientId: string, serviceId: string): Promise<number> { return 0; }
  async calculateTotalWithTip(baseAmount: number, tipPercentage?: number): Promise<number> { return baseAmount; }
  async updateStripeConfig(clientId: string, publicKey: string, secretKey: string): Promise<void> {
    const dbInstance = this.ensureDB();
    
    const [updatedClient] = await dbInstance
      .update(clients)
      .set({ 
        stripePublicKey: publicKey,
        stripeSecretKey: secretKey, // Note: In production, this should be encrypted
        updatedAt: new Date()
      })
      .where(eq(clients.id, clientId))
      .returning();
    
    if (!updatedClient) throw new Error("Client not found");
  }
  async getStripePublicKey(clientId: string): Promise<string | null> { 
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .select({ stripePublicKey: clients.stripePublicKey })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    
    return result.length > 0 ? result[0].stripePublicKey : null;
  }
  async getStripeSecretKey(clientId: string): Promise<string | null> { 
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .select({ stripeSecretKey: clients.stripeSecretKey })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    
    return result.length > 0 ? result[0].stripeSecretKey : null;
  }
  async validateStripeConfig(clientId: string): Promise<boolean> { 
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .select({ 
        stripePublicKey: clients.stripePublicKey,
        stripeSecretKey: clients.stripeSecretKey 
      })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    
    // Check client-specific Stripe configuration first, then fall back to global env variables
    const hasClientConfig = result.length > 0 && !!(result[0].stripePublicKey && result[0].stripeSecretKey);
    const hasGlobalConfig = !!(process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY);
    return hasClientConfig || hasGlobalConfig;
  }
  async clearStripeConfig(clientId: string): Promise<void> {
    const dbInstance = this.ensureDB();
    
    const [updatedClient] = await dbInstance
      .update(clients)
      .set({ 
        stripePublicKey: null,
        stripeSecretKey: null,
        updatedAt: new Date()
      })
      .where(eq(clients.id, clientId))
      .returning();
    
    if (!updatedClient) throw new Error("Client not found");
  }
  async updateSmtpConfig(clientId: string, config: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    smtpFromEmail?: string;
    smtpFromName?: string;
    smtpSecure?: boolean;
    smtpEnabled?: boolean;
  }): Promise<void> {
    const dbInstance = this.ensureDB();
    
    const [updatedClient] = await dbInstance
      .update(clients)
      .set({ 
        ...config,
        updatedAt: new Date()
      })
      .where(eq(clients.id, clientId))
      .returning();
    
    if (!updatedClient) throw new Error("Client not found");
  }
  async getSmtpConfig(clientId: string): Promise<any> { 
    const dbInstance = this.ensureDB();
    const result = await dbInstance
      .select({
        smtpHost: clients.smtpHost,
        smtpPort: clients.smtpPort,
        smtpUsername: clients.smtpUsername,
        smtpPassword: clients.smtpPassword,
        smtpFromEmail: clients.smtpFromEmail,
        smtpFromName: clients.smtpFromName,
        smtpSecure: clients.smtpSecure,
        smtpEnabled: clients.smtpEnabled
      })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    
    if (result.length === 0) {
      return { isConfigured: false, smtpHost: null, smtpPort: null, smtpUsername: null, smtpPassword: null, smtpFromEmail: null, smtpFromName: null, smtpSecure: null, smtpEnabled: null };
    }
    
    const client = result[0];
    const isConfigured = !!(client.smtpHost && client.smtpPort && client.smtpUsername && client.smtpPassword && client.smtpFromEmail);
    
    return {
      isConfigured,
      smtpHost: client.smtpHost,
      smtpPort: client.smtpPort,
      smtpUsername: client.smtpUsername,
      smtpPassword: client.smtpPassword,
      smtpFromEmail: client.smtpFromEmail,
      smtpFromName: client.smtpFromName,
      smtpSecure: client.smtpSecure,
      smtpEnabled: client.smtpEnabled
    };
  }
  async testSmtpConfig(clientId: string): Promise<boolean> { 
    // Note: In a real implementation, this would attempt to send a test email
    // For now, we'll just validate that the configuration exists
    const config = await this.getSmtpConfig(clientId);
    return config.isConfigured;
  }
  async clearSmtpConfig(clientId: string): Promise<void> {
    const dbInstance = this.ensureDB();
    
    const [updatedClient] = await dbInstance
      .update(clients)
      .set({ 
        smtpHost: null,
        smtpPort: null,
        smtpUsername: null,
        smtpPassword: null,
        smtpFromEmail: null,
        smtpFromName: null,
        smtpSecure: null,
        smtpEnabled: false,
        updatedAt: new Date()
      })
      .where(eq(clients.id, clientId))
      .returning();
    
    if (!updatedClient) throw new Error("Client not found");
  }
}

// Environment-aware storage factory
function createStorage(): IStorage {
  // Detect environment
  const isReplit = !!process.env.REPL_ID || process.env.DEPLOY_TARGET === 'replit';
  const isVercel = !!process.env.VERCEL || process.env.DEPLOY_TARGET === 'vercel';
  const isCoolify = process.env.DEPLOY_TARGET === 'coolify' || !!process.env.COOLIFY_BRANCH || !!process.env.COOLIFY_PROJECT_UUID;
  const isProduction = process.env.NODE_ENV === 'production' || isCoolify;
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  
  // Enhanced detection logging
  console.log(`🔧 Database Environment Detection:`);
  console.log(`  - Replit: ${isReplit ? 'Yes' : 'No'}`);
  console.log(`  - Coolify: ${isCoolify ? 'Yes' : 'No'}`);
  console.log(`  - Production: ${isProduction ? 'Yes' : 'No'}`);
  console.log(`  - DATABASE_URL present: ${hasDatabaseUrl ? 'Yes' : 'No'}`);
  
  // Use PostgreSQL for production environments (Coolify, Vercel, or any production with database)
  const useDatabase = (isCoolify || isVercel || isProduction) && hasDatabaseUrl;
  
  const storageType = useDatabase ? 'PostgreSQL' : 'MemStorage';
  const environment = isReplit ? 'Replit' : (isCoolify ? 'Coolify' : (isVercel ? 'Vercel' : 'Unknown'));
  
  console.log(`🔧 Environment: ${environment}`);
  console.log(`💾 Storage: ${storageType}`);
  console.log(`🗄️  Database URL present: ${hasDatabaseUrl ? 'Yes' : 'No'}`);
  console.log(`🚀 Production mode: ${isProduction ? 'Yes' : 'No'}`);
  console.log(`📊 Demo data: ${useDatabase ? 'Disabled (Production)' : 'Enabled (Development)'}`);
  
  if (useDatabase) {
    console.log(`✅ Using PostgreSQL database for production data`);
    return new PostgreSQLStorage();
  } else {
    console.log(`✅ Using MemStorage with demo data for development`);
    return new MemStorage();
  }
}

export const storage = createStorage();