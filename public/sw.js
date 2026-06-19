const CACHE_NAME = "orey-tecnica-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/orey-logo.jpg",
  "/globals.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("Asset caching warning:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only cache GET requests and bypass api routes / next internal files
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("/_next/")
  ) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Silent catch for offline network failure
        });
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "scheduleNotification") {
    const { title, body, timestamp } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title, { body });
    }, Math.max(0, timestamp - Date.now()));
  }
});
