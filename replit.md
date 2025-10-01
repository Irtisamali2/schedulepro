# Scheduled - Business Management Platform

## Overview
Scheduled is a comprehensive business management platform designed for service-based entrepreneurs. It provides dynamic, customizable tools for growth and operational efficiency, including appointment management, predictive AI insights, executive dashboards, and extensive industry-specific customization. The platform aims to empower businesses with seamless data migration from existing scheduling platforms and is targeted for iOS App Store deployment with a premium pricing model. Its core vision is to offer a robust, reliable, and user-friendly solution that minimizes adoption barriers and maximizes operational efficiency for service-based businesses.

## User Preferences
- Focus on practical solutions that remove adoption barriers
- Prioritize data migration capabilities over additional features
- Emphasize clear user flows and intuitive navigation
- Target professional operators who need reliable business tools

## System Architecture

### UI/UX Decisions
- React.js with TypeScript for frontend development.
- Tailwind CSS for responsive design, utilizing a clean slate/blue color scheme and professional, gender-neutral aesthetic.
- All UI components are custom (e.g., AlertDialogs instead of native browser prompts).
- Emphasis on clear step-by-step progress indicators and simplified navigation.
- Consistent design language with dynamic industry-specific color theming and premium card styling for AI insights.

### Technical Implementations
- **Frontend:** React.js with TypeScript, Capacitor for cross-platform mobile development, Wouter for client-side routing, TanStack Query for server state, and React Context for industry/theme management.
- **Backend:** Express with Node.js for API routes (Appointments, Services, Staff, AI insights, Data import).
- **Database:** Drizzle ORM for database interactions, utilizing PostgreSQL for permanent data persistence ensuring zero data loss.
- **Data Management:** In-memory storage (MemStorage) is used for development flexibility, with an interface for easy database migration. Aggressive cache invalidation ensures real-time updates.
- **Core Features:**
    - **Multi-Industry Support:** Pre-configured templates for Beauty, Wellness, Home Services, Pet Care, Creative Services, and Custom. Industry switching dynamically regenerates services and updates UI.
    - **Appointment Management:** Comprehensive booking flow with 30-minute time slots, operator approval workflow, and automatic client creation.
    - **Client Management:** Dedicated database with full CRUD operations, search, filtering, and contact information storage.
    - **AI-Powered Insights:** Industry-specific recommendations for scheduling optimization, marketing automation, and predictive insights, displayed with premium design.
    - **Payment System:** Comprehensive multi-payment options (Stripe, PayPal, Zelle, Venmo) integrated with professional tipping interface and hardware recommendations. Estimates convert to invoices with payment links.
    - **Data Import:** Comprehensive system with platform-specific export instructions and CSV field mapping for 12+ scheduling platforms.
    - **Business Tools:** Photo documentation, Google Business setup assistant, review request email system, material cost tracker, professional job estimation & quoting system (contractor-focused).
    - **Error Handling:** Robust error handling, UI feedback instead of browser alerts, and zero TypeScript errors for production builds.

### System Design Choices
- **Modular Architecture:** Pages and components are modular for reusability and maintainability.
- **Mobile-First Design:** Responsive across all devices, optimized for iOS App Store deployment.
- **"No Fluff" Implementation:** All features are fully functional and production-ready, eliminating "coming soon" placeholders.
- **Focus on Core Business Management:** Non-functional or less critical features (e.g., 3D visualization, detailed vehicle/equipment tracking) were removed to streamline the application and enhance user experience.
- **Secure Authentication:** Proper authentication flow ensures users complete setup before accessing the dashboard.

## External Dependencies
- **Capacitor:** For cross-platform mobile development, enabling iOS App Store deployment.
- **Drizzle ORM:** For database interactions with PostgreSQL.
- **Stripe:** For payment processing, including direct referrals for Stripe Terminal hardware.
- **PayPal, Zelle, Venmo:** Integrated as additional payment options.
- **Resend API:** For reliable email delivery, specifically for review request emails and appointment confirmations.
- **Google Business Profile API (implied):** For the Google Business setup assistant and SEO optimization.
- **Third-party scheduling platforms (for data import):** Vagaro, Booksy, GlossGenius, Square Appointments, Fresha, MindBody, Acuity Scheduling, Schedulicity, Jobber, ServiceTitan, Housecall Pro, FieldEdge, Gingr, Pet Sitter Plus, PawLoyalty, Kennel Connection, HoneyBook, Pixieset, Studio Ninja, Calendly, Setmore, SimplyBook.me, Appointy.

## Recent Changes

### Elementor-Style WYSIWYG Website Builder - In Progress (October 1, 2025)
- **Created New Builder**: `/elementor-builder?clientId={id}` - True WYSIWYG builder that embeds actual client website
- **Components Created**:
  - `EditableWebsiteContext` - Shared editing state across components
  - `EditableSection` - Wrapper component that adds hover controls (blue border, drag handle, settings, delete buttons)
  - `ElementorStyleBuilder` - Main builder page with sidebar controls and embedded FigmaDesignedWebsite
- **Current Functionality**: ✅ Works
  - Website embedded in builder with visual editing overlays
  - Hover over sections shows blue border and control buttons
  - Sidebar controls for website title and theme colors (primary/secondary)
  - Color changes update gradients immediately
  - Preview button opens actual client website in new tab
  - Save button persists changes with toast notification
- **Partially Implemented**:
  - Section add buttons in sidebar (structure exists but rendering not data-driven)
  - Section delete buttons (handlers exist but not connected to actual rendering)
- **Not Yet Implemented**:
  - Inline text editing (double-click text elements to edit)
  - Drag-and-drop section reordering
  - Auto-save debouncing (currently saves on every keystroke)
  - Dynamic section rendering (sections are hardcoded, not driven by data)
  - Query key consistency between builder and preview
- **Architecture Note**: Current FigmaDesignedWebsite renders static sections (hero, staff, pricing). To fully support dynamic section add/delete, need to refactor to render sections from data array.
- **Test Status**: ✅ Basic functionality tested and working (hover effects, colors, preview, save)

### Website Builder Content Sync Verification (October 1, 2025)
- **Comprehensive Testing**: Verified website builder save/preview functionality works correctly end-to-end
- **Test Results**: ✅ Users can edit content in sidebar textarea, save changes, and see updates in preview immediately
- **False Positive Resolution**: Original bug report was due to test methodology (page.evaluate() bypassing React state)
- **Data Flow Confirmed**: Content textarea → updateElement() → websiteData state → handleSave() → API PUT → database → preview
- **Development Logging**: Added gated debug logging (DEV only) to track section/element content during save operations
- **Route Verification**: Website builder correctly served at `/website-builder?clientId={id}`
- **Conclusion**: Website builder content synchronization is fully functional with no data loss or sync issues

### Domain Configuration Database Fix (October 1, 2025)
- **CRITICAL PRODUCTION FIX**: Fixed domain configuration not persisting/displaying in Coolify production
- **Root Cause**: `getDomainConfigurations()` method in DBStorage was a stub returning empty array instead of querying database
- **Fix Applied**: Implemented proper Drizzle ORM database queries for:
  - `getDomainConfigurations(clientId)` - Retrieves all domains for a client
  - `getDomainConfiguration(id)` - Retrieves single domain by ID
  - `getDomainConfigurationByDomain(domain)` - Retrieves domain by domain name
- **Verification**: End-to-end test confirmed domains now save to database and appear in UI with DNS instructions
- **Impact**: Clients can now successfully add custom domains for admin panels and client websites on Coolify production

### Database Schema & Production Deployment Fixes (September 29, 2025)
- **CRITICAL PRODUCTION FIX**: Resolved database schema mismatches preventing CRUD operations in Coolify deployment
- Fixed missing columns in `client_services` table: `stripe_product_id`, `stripe_price_id`, `enable_online_payments`
- Corrected `payments` table schema to match shared/schema.ts definitions (amount vs tip/totalAmount, status vs paymentStatus, etc.)
- Added missing table creation statements for `domain_configurations` and `client_websites` with proper IF NOT EXISTS handling
- Enhanced Coolify environment detection with additional environment variable checks (COOLIFY_CONTAINER_NAME, COOLIFY_APP_NAME)
- **Plan Synchronization System**: Implemented complete plan management with `syncClientPlans`, `updatePlanPricing`, and `updateClientPlan` methods
- Added new API routes: `/api/plans/:id/pricing`, `/api/plans/:id/sync`, `/api/clients/:clientId/plan`
- All table creation now uses `CREATE TABLE IF NOT EXISTS` to prevent data loss on redeployment

### Security & Permissions Implementation (September 1, 2025)
- **CRITICAL SECURITY FIX**: Implemented comprehensive server-side permission validation system
- Added `requirePermission()` middleware that validates team member permissions before API execution
- Fixed critical vulnerability where team members could perform unauthorized actions despite UI restrictions
- All CRUD operations now validate permissions at the API level before processing
- Team member authentication now includes clientId validation and session management
- Permission enforcement implemented across services, appointments, leads, and team management endpoints

### Feature Documentation (September 1, 2025)
- Created comprehensive `FEATURES_DOCUMENTATION.md` documenting all fully developed platform features
- Organized documentation by user roles: Super Admin, Business Client Admin, Team Members, Public Users
- Documented complete security framework, technical infrastructure, and deployment readiness
- Listed 100+ fully functional features across the entire platform ecosystem