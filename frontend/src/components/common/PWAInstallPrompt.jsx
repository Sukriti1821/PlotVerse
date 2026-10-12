import { useState, useEffect } from "react";
import { FaDownload, FaTimes, FaShieldAlt, FaBolt } from "react-icons/fa";

// Global holder for deferred beforeinstallprompt event
let deferredInstallPrompt = null;

export function triggerPWAInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(() => {
      deferredInstallPrompt = null;
      window.dispatchEvent(new Event("pwa-prompt-changed"));
    });
  } else {
    // If browser does not support or already installed, show browser instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      alert("To install Thikana on iOS: tap the 'Share' icon in Safari and select 'Add to Home Screen'.");
    } else {
      alert("Thikana is ready to install! Look for the install icon in your browser address bar.");
    }
  }
}

export function isPWAInstallable() {
  return Boolean(deferredInstallPrompt);
}

const PWAInstallPrompt = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already running as installed standalone PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check recent dismissal
    const dismissedUntil = localStorage.getItem("thikana_pwa_dismissed") || localStorage.getItem("thikana_pwa_dismissed");
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      setIsDismissed(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      setCanInstall(true);
      window.dispatchEvent(new Event("pwa-prompt-changed"));
    };

    const handleAppInstalled = () => {
      deferredInstallPrompt = null;
      setCanInstall(false);
      setIsInstalled(true);
    };

    const handlePromptChanged = () => {
      setCanInstall(Boolean(deferredInstallPrompt));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("pwa-prompt-changed", handlePromptChanged);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("pwa-prompt-changed", handlePromptChanged);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    setCanInstall(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 7 days
    localStorage.setItem(
      "thikana_pwa_dismissed",
      String(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
  };

  // Don't show if already installed, dismissed, or no prompt available
  if (isInstalled || isDismissed || !canInstall) {
    return null;
  }

  return (
    <aside
      aria-label="PWA install prompt"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-40 animate-fade-in-up"
    >
      <div className="relative overflow-hidden rounded-3xl bg-dusk/95 border border-white/10 p-4 sm:p-5 text-snow shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
        {/* Dismiss Button */}
        <button
          type="button"
          aria-label="Close install prompt"
          onClick={handleDismiss}
          className="absolute top-3 right-3 rounded-full p-1.5 text-light-slate hover:text-snow transition"
        >
          <FaTimes size={12} />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-deep border border-white/10 p-2 shadow-lg">
            <img
              src="/favicon.svg"
              alt="Thikana App Icon"
              className="h-full w-full object-contain rounded-xl"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-saffron/20 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-saffron">
                PWA Ready
              </span>
              <h4 className="text-sm font-bold text-snow truncate">
                Install Thikana App
              </h4>
            </div>
            <p className="mt-1 text-xs text-light-slate leading-snug">
              Thikana — Fast, app-like outdoor plot booking experience with offline viewing.
            </p>

            <div className="mt-2.5 flex items-center gap-3 text-[11px] text-saffron font-medium">
              <span className="flex items-center gap-1">
                <FaBolt size={10} /> 1-Tap Launch
              </span>
              <span className="flex items-center gap-1">
                <FaShieldAlt size={10} /> Zero App Store Fees
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-saffron hover:bg-saffron-hover px-4 py-2.5 text-xs font-bold text-navy shadow-md transition active:scale-95"
          >
            <FaDownload size={11} /> Install Application
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl px-3 py-2.5 text-xs font-semibold text-light-slate hover:text-snow transition"
          >
            Not Now
          </button>
        </div>
      </div>
    </aside>
  );
};

export default PWAInstallPrompt;
