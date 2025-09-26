// Service Worker for Scheduled App - Privacy Enhanced Version

const CACHE_NAME = 'scheduled-app-v1';

// Static assets that can be safely cached
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/privacy-policy.html',
  '/terms-of-service.html'
];

// API endpoints that shouldn't be cached
const API_URLS = ['/api/'];
const EXCLUDED_URLS = ['/api/users', '/api/payment'];

// Request URLs that may contain sensitive data and should not be cached
const SENSITIVE_URLS = [
  '/booking',
  '/dashboard',
  '/api/appointments',
  '/api/customers'
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Privacy-enhanced request handling
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isApiRequest = API_URLS.some(endpoint => url.pathname.startsWith(endpoint));
  const isExcludedUrl = EXCLUDED_URLS.some(endpoint => url.pathname.startsWith(endpoint));
  const isSensitiveUrl = SENSITIVE_URLS.some(endpoint => url.pathname.startsWith(endpoint));
  const isGetRequest = event.request.method === 'GET';
  
  // Always skip caching for:
  // 1. POST/PUT/DELETE requests (may contain sensitive data)
  // 2. Excluded API endpoints
  // 3. URLs marked as containing sensitive data
  if (!isGetRequest || isExcludedUrl || isSensitiveUrl) {
    return event.respondWith(fetch(event.request));
  }
  
  // For regular API requests, use network first, cache as fallback
  if (isApiRequest) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For static assets, use cache first, network as fallback
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            
            return response;
          });
      })
  );
});

// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Ensure the service worker takes control immediately
      return self.clients.claim();
    })
  );
});