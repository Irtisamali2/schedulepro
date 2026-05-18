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

// On mobile devices the virtual keyboard can cover inputs near the bottom of the
// screen. Attach a lightweight global handler that scrolls the focused input
// into view when the keyboard appears (focusin) or when viewport resizes.
function enableInputAutoScroll() {
  if (typeof window === "undefined") return;

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouchDevice) return; // only enable on touch devices

  window.addEventListener('focusin', (ev: FocusEvent) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    const tag = target.tagName?.toUpperCase?.();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      // Delay slightly so iOS/Android keyboard layout settles
      setTimeout(() => {
        try {
          // Adjust scroll container height to visual viewport (if available)
          updateForVisualViewport();
          // Add a class so CSS can add extra bottom padding while keyboard is open
          document.documentElement.classList.add('keyboard-open');
          // Ensure the target is visible within the resized container
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {
          // ignore
        }
      }, 300);
    }
  });

  // When the viewport resizes (keyboard show/hide) re-align the active element
  let resizeTimeout: number | undefined;
  window.addEventListener('resize', () => {
    if (resizeTimeout) window.clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
        try {
          active.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // On resize (keyboard likely shown) ensure class is present
          document.documentElement.classList.add('keyboard-open');
        } catch (e) {}
      } else {
        // If nothing active, remove keyboard-open
        document.documentElement.classList.remove('keyboard-open');
      }
    }, 150);
  });

  // Helper to set scroll-container height (use visualViewport when available)
  const setScrollContainerHeight = (h: number | null) => {
    const els = document.querySelectorAll<HTMLElement>('.scroll-container');
    els.forEach(el => {
      if (h === null) {
        el.style.height = '';
      } else {
        el.style.height = `${h}px`;
      }
    });
  };

  // Use visualViewport if available for accurate keyboard height on mobile
  const updateForVisualViewport = () => {
    const vv = (window as any).visualViewport;
    if (vv) {
      const height = Math.max(200, Math.floor(vv.height));
      setScrollContainerHeight(height);
    } else {
      setScrollContainerHeight(window.innerHeight);
    }
  };

  // Adjust dialogs to be centered within the visual viewport and scrollable
  const adjustDialogsToViewport = () => {
    const vv = (window as any).visualViewport;
    const dialogs = document.querySelectorAll<HTMLElement>('.dialog-content');
    dialogs.forEach(d => {
      if (vv) {
        const offsetTop = vv.offsetTop || 0;
        const centerY = Math.floor(offsetTop + vv.height / 2);
        const maxH = Math.max(120, Math.floor(vv.height - 120));
        d.style.top = `${centerY}px`;
        d.style.maxHeight = `${maxH}px`;
        d.style.overflowY = 'auto';
        // keep centered horizontally
        d.style.transform = 'translateX(-50%) translateY(-50%)';
      } else {
        d.style.top = '';
        d.style.maxHeight = '';
        d.style.overflowY = '';
        d.style.transform = '';
      }
    });
  };

  // Listen to visualViewport resize/scroll to adapt when keyboard appears
  if ((window as any).visualViewport) {
    const vv = (window as any).visualViewport;
    vv.addEventListener('resize', () => {
      updateForVisualViewport();
      adjustDialogsToViewport();
      // keep focused element visible
      const active = document.activeElement as HTMLElement | null;
      if (active) {
        setTimeout(() => active.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      }
    });
    vv.addEventListener('scroll', () => {
      adjustDialogsToViewport();
      const active = document.activeElement as HTMLElement | null;
      if (active) {
        setTimeout(() => active.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      }
    });
  }

  // Remove keyboard-open when focus leaves inputs
  window.addEventListener('focusout', (ev: FocusEvent) => {
    const target = ev.target as HTMLElement | null;
    const tag = target?.tagName?.toUpperCase?.();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      // Delay to allow keyboard hide animation
      setTimeout(() => {
        document.documentElement.classList.remove('keyboard-open');
        setScrollContainerHeight(null);
        adjustDialogsToViewport();
      }, 200);
    }
  });
}

enableInputAutoScroll();

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
