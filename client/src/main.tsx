import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/designSystem.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initCapacitor } from "@/lib/capacitor-init";
import "@/lib/auth-setup"; // Initialize test auth session

// Initialize Capacitor fetch interceptor (no-op when not in Capacitor)
initCapacitor();

// Register service worker for PWA support (skip in Capacitor native app)
const isCapacitorApp = !!(
  import.meta.env.VITE_CAPACITOR === 'true' ||
  (window as any).Capacitor?.isNativePlatform?.()
);

if ('serviceWorker' in navigator && import.meta.env.PROD && !isCapacitorApp) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => {
        // Service worker registered successfully
      })
      .catch(() => {
        // Service worker registration failed
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <App />
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>
);
