const CACHE_NAME = "thikana-pwa-v1";

// Static assets to pre-cache on install (App Shell & Branding)
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/manifest.json",
  "/favicon.svg",
  "/logo-icon.svg",
  "/logo-icon-white.svg",
  "/logo-full.svg",
  "/logo-white.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
];

// 1. Install Event: Cache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Purge old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Secure caching policy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // A. SECURITY GUARD: NEVER cache non-GET requests (POST, PUT, DELETE, PATCH)
  if (request.method !== "GET") {
    return; // Pass through directly to network
  }

  // B. SECURITY GUARD: NEVER cache /api/ endpoints (auth, users, bookings, payments, pricing, owner data)
  if (url.pathname.startsWith("/api/") || url.pathname.includes("/api")) {
    return; // Strict Network-Only: No sensitive personal or payment data stored in cache
  }

  // C. Navigation Requests (HTML pages): Network-First, fallback to cached App Shell or offline.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          // Cache successful navigation HTML shell
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          // Offline fallback
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          const cachedShell = await caches.match("/index.html");
          if (cachedShell) return cachedShell;

          const offlinePage = await caches.match("/offline.html");
          return offlinePage || new Response("Offline — Thikana", { status: 503 });
        })
    );
    return;
  }

  // D. Static Assets (JS, CSS, WebFonts, SVGs, Images)
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".webp"));

  const isGoogleFont =
    url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";

  if (isStaticAsset || isGoogleFont) {
    // Stale-While-Revalidate for static assets
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              (networkResponse.status === 200 || networkResponse.type === "opaque")
            ) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network with Cache Fallback for other GET requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(() => caches.match(request))
  );
});
