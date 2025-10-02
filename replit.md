# Scheduled - Business Management Platform

## Overview
Scheduled is a comprehensive business management platform designed for service-based entrepreneurs. It provides dynamic, customizable tools for growth and operational efficiency, including appointment management, predictive AI insights, executive dashboards, and extensive industry-specific customization. The platform aims to empower businesses with seamless data migration from existing scheduling platforms, targeting iOS App Store deployment with a premium pricing model. Its core vision is to offer a robust, reliable, and user-friendly solution that minimizes adoption barriers and maximizes operational efficiency for service-based businesses.

## User Preferences
- Focus on practical solutions that remove adoption barriers
- Prioritize data migration capabilities over additional features
- Emphasize clear user flows and intuitive navigation
- Target professional operators who need reliable business tools

## System Architecture

### UI/UX Decisions
- React.js with TypeScript for frontend, Tailwind CSS for responsive design with a clean slate/blue color scheme.
- Custom UI components (e.g., AlertDialogs), step-by-step progress indicators, and simplified navigation.
- Consistent design language with dynamic industry-specific color theming and premium card styling for AI insights.

### Technical Implementations
- **Frontend:** React.js with TypeScript, Capacitor for mobile, Wouter for routing, TanStack Query for server state, React Context for industry/theme management.
- **Backend:** Express with Node.js for API routes (Appointments, Services, Staff, AI insights, Data import).
- **Database:** Drizzle ORM with PostgreSQL for permanent data persistence.
- **Data Management:** In-memory storage (MemStorage) for flexibility, aggressive cache invalidation for real-time updates.
- **Core Features:**
    - **Multi-Industry Support:** Pre-configured templates for various service industries with dynamic UI updates.
    - **Appointment Management:** Comprehensive booking flow with 30-minute slots and operator approval.
    - **Client Management:** Full CRUD operations, search, and filtering.
    - **AI-Powered Insights:** Industry-specific recommendations for optimization and predictive insights.
    - **Payment System:** Multi-payment options (Stripe, PayPal, Zelle, Venmo) with professional tipping and invoice generation.
    - **Data Import:** Comprehensive system with platform-specific export instructions and CSV field mapping for 12+ scheduling platforms.
    - **Business Tools:** Photo documentation, Google Business setup, review request system, material cost tracker, job estimation & quoting.
    - **Error Handling:** Robust error handling with UI feedback and zero TypeScript errors.
    - **Website Builder:** Elementor-style WYSIWYG builder with inline editing, real-time preview, and secure content synchronization.

### System Design Choices
- **Modular Architecture:** Reusable and maintainable components and pages.
- **Mobile-First Design:** Optimized for iOS App Store deployment.
- **"No Fluff" Implementation:** All features are fully functional and production-ready.
- **Focus on Core Business Management:** Prioritizing essential features for operational efficiency.
- **Secure Authentication:** Ensures users complete setup before accessing the dashboard and implements server-side permission validation for all API operations.

## External Dependencies
- **Capacitor:** For cross-platform mobile development (iOS App Store).
- **Drizzle ORM:** For database interactions with PostgreSQL.
- **Stripe:** For payment processing.
- **PayPal, Zelle, Venmo:** Additional payment options.
- **Resend API:** For reliable email delivery.
- **Google Business Profile API (implied):** For Google Business setup assistant.
- **Third-party scheduling platforms:** (e.g., Vagaro, Booksy, GlossGenius, Square Appointments, Fresha, MindBody, Acuity Scheduling, Schedulicity, Jobber, ServiceTitan, Housecall Pro, FieldEdge, Gingr, Pet Sitter Plus, PawLoyalty, Kennel Connection, HoneyBook, Pixieset, Studio Ninja, Calendly, Setmore, SimplyBook.me, Appointy) for data import functionality.

## Recent Changes

### Website Builder Auto-Initialization with Race Condition Fix (October 2, 2025)
- **CRITICAL PRODUCTION FIX**: Website builder no longer fails with 404 or duplicate key errors on Coolify
- **Root Cause**: New clients on Coolify don't have website records in PostgreSQL, causing "Loading website..." to hang
- **Race Condition**: Multiple concurrent requests tried to create the same website, causing duplicate key errors
- **Solution**: Modified `/api/public/client/:clientId/website` to auto-initialize with race condition handling
- **Implementation**: 
  - Auto-creates default website using client's business info when missing
  - Try-catch wraps creation: if duplicate key error (PostgreSQL code 23505), fetches existing website instead
  - Guarantees unique subdomains with clientId suffix appended to business name
- **Result**: Website builder works instantly for all clients, handles concurrent requests gracefully
- **Deployment-Ready**: Production fix ready for Coolify deployment