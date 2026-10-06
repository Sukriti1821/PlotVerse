// Service Worker Registration Helper for Thikana PWA
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[Thikana PWA] ServiceWorker registered with scope:", registration.scope);

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  console.log("[Thikana PWA] New content is available; please refresh.");
                } else {
                  console.log("[Thikana PWA] Content is cached for offline use.");
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn("[Thikana PWA] ServiceWorker registration failed:", error);
      });
  });
}
