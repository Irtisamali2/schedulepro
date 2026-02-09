import { Switch, Route, useLocation } from "wouter";
import { lazy, Suspense } from "react";
import LandingPage from "@/pages/LandingPage";
import ClientLogin from "@/pages/ClientLogin";
import TeamLogin from "@/pages/TeamLogin";
import SuperAdminLogin from "@/pages/SuperAdminLogin";
import NotFound from "@/pages/not-found";

// Lazy-load heavy pages to reduce initial bundle size and improve iOS app startup
const SuperAdminDashboard = lazy(() => import("@/pages/SuperAdminDashboard"));
const OnboardingFlow = lazy(() => import("@/pages/OnboardingFlow"));
const ClientDashboard = lazy(() => import("@/pages/ClientDashboard"));
const TeamDashboard = lazy(() => import("@/pages/TeamDashboard"));
const AdvancedWebsiteBuilder = lazy(() => import("@/pages/AdvancedWebsiteBuilder"));
const WYSIWYGWebsiteBuilder = lazy(() => import("@/pages/WYSIWYGWebsiteBuilder"));
const ElementorStyleBuilder = lazy(() => import("@/pages/ElementorStyleBuilder"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const ClientWebsite = lazy(() => import("@/pages/ClientWebsite"));
const ReviewPlatformConnections = lazy(() => import("@/pages/ReviewPlatformConnections"));
const MultiStepBooking = lazy(() => import("@/pages/MultiStepBooking"));
const TermsAndConditions = lazy(() => import("@/pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  const [location] = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 safe-top safe-bottom">
      <main className="flex-grow">
        <Suspense fallback={<LoadingFallback />}>
          <Switch>
            {/* Public Landing Page */}
            <Route path="/" component={LandingPage} />

            {/* Super Admin Routes */}
            <Route path="/admin" component={SuperAdminLogin} />
            <Route path="/admin/login" component={SuperAdminLogin} />
            <Route path="/admin/dashboard" component={SuperAdminDashboard} />

            {/* Onboarding Flow */}
            <Route path="/onboarding/:sessionId?" component={OnboardingFlow} />

            {/* Client Login & Dashboard */}
            <Route path="/client-login" component={ClientLogin} />
            <Route path="/client-dashboard" component={ClientDashboard} />

            {/* Review Platform Management */}
            <Route path="/review-platforms" component={ReviewPlatformConnections} />

            {/* Team Member Login & Dashboard */}
            <Route path="/team-login" component={TeamLogin} />
            <Route path="/team-dashboard" component={TeamDashboard} />

            {/* Website Builder */}
            <Route path="/website-builder" component={ElementorStyleBuilder} />
            <Route path="/wysiwyg-builder" component={WYSIWYGWebsiteBuilder} />
            <Route path="/elementor-builder" component={ElementorStyleBuilder} />
            <Route path="/advanced-builder" component={AdvancedWebsiteBuilder} />

            {/* Checkout */}
            <Route path="/checkout" component={CheckoutPage} />

            {/* Multi-Step Booking */}
            <Route path="/booking" component={MultiStepBooking} />

            {/* Public Client Booking with Client ID */}
            <Route path="/booking/:clientId" component={MultiStepBooking} />

            {/* Client-specific booking route (for URLs like /5000/booking) */}
            <Route path="/:clientId/booking" component={MultiStepBooking} />

            {/* Legal Pages */}
            <Route path="/terms-and-conditions" component={TermsAndConditions} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />

            {/* Public Client Websites - using subdomain for security */}
            <Route path="/site/:subdomain" component={ClientWebsite} />
            {/* Legacy route for backward compatibility */}
            <Route path="/client-website/:clientId" component={ClientWebsite} />

            {/* Fallback */}
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
