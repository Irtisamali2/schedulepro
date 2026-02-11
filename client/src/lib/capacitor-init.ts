// Capacitor initialization and API URL rewriting
// This module intercepts fetch calls to rewrite relative /api/ URLs
// so they point to the production server when running inside Capacitor.

const isCapacitor = (): boolean => {
  return !!(
    import.meta.env.VITE_CAPACITOR === 'true' ||
    (window as any).Capacitor?.isNativePlatform?.()
  );
};

// Set this to your production API server URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function initCapacitor(): void {
  if (!isCapacitor()) return;

  // Disable service worker in Capacitor - it conflicts with native webview
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }

  // Only intercept fetch if we have a base URL to prepend
  if (!API_BASE_URL) return;

  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let rewritten = false;

    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = `${API_BASE_URL}${input}`;
      rewritten = true;
    } else if (input instanceof Request) {
      // Request.url is always absolute (e.g. capacitor://localhost/api/...)
      // so we need to extract the pathname and check that
      try {
        const url = new URL(input.url);
        if (url.pathname.startsWith('/api/')) {
          input = new Request(`${API_BASE_URL}${url.pathname}${url.search}`, input);
          rewritten = true;
        }
      } catch {
        // If URL parsing fails, fall through to original fetch
      }
    }

    // For rewritten API calls, remove credentials: "include" since auth is
    // localStorage-based and wildcard CORS (*) rejects credentialed requests.
    if (rewritten && init?.credentials === 'include') {
      init = { ...init, credentials: 'omit' };
    }

    return originalFetch.call(window, input, init);
  };
}
