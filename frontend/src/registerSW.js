// Service Worker Registration Helper for Thikana PWA
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Check for updates
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content available
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
