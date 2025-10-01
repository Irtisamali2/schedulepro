import { Switch, Route, useLocation } from "wouter";
import LandingPage from "@/pages/LandingPage";
import SuperAdminLogin from "@/pages/SuperAdminLogin";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import OnboardingFlow from "@/pages/OnboardingFlow";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientLogin from "@/pages/ClientLogin";
import TeamLogin from "@/pages/TeamLogin";
import TeamDashboard from "@/pages/TeamDashboard";
import AdvancedWebsiteBuilder from "@/pages/AdvancedWebsiteBuilder";
import WYSIWYGWebsiteBuilder from "@/pages/WYSIWYGWebsiteBuilder";
import ElementorStyleBuilder from "@/pages/ElementorStyleBuilder";
import CheckoutPage from "@/pages/CheckoutPage";
import ClientWebsite from "@/pages/ClientWebsite";
import ReviewPlatformConnections from "@/pages/ReviewPlatformConnections";
import MultiStepBooking from "@/pages/MultiStepBooking";
import TermsAndConditions from "@/pages/TermsAndConditions";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import NotFound from "@/pages/not-found";

function App() {
  const [location] = useLocation();
  const isAdminPage = location.startsWith("/admin");
  const isOnboardingPage = location.startsWith("/onboarding");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
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
          <Route path="/website-builder" component={AdvancedWebsiteBuilder} />
          <Route path="/wysiwyg-builder" component={WYSIWYGWebsiteBuilder} />
          <Route path="/elementor-builder" component={ElementorStyleBuilder} />
          
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
          
          {/* Public Client Websites */}
          <Route path="/client-website/:clientId" component={ClientWebsite} />
          
          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

export default App;