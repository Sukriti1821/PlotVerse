import { useState, useEffect } from "react";
import { FaWifi, FaExclamationCircle } from "react-icons/fa";

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (showReconnected) {
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
        <div className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xl shadow-emerald-600/30 backdrop-blur-md">
          <FaWifi size={12} />
          <span>Connected back online!</span>
        </div>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <aside
      aria-label="Offline status banner"
      className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] sm:max-w-md w-full px-2"
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-500/95 border border-amber-400/50 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-600/30 text-slate-950">
            <FaExclamationCircle size={13} />
          </span>
          <p className="truncate">
            <strong className="font-extrabold">Offline Mode:</strong> Viewing cached views.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 rounded-lg bg-white/90 hover:bg-white px-2.5 py-1 text-[11px] font-bold text-slate-900 transition active:scale-95"
        >
          Retry
        </button>
      </div>
    </aside>
  );
};

export default OfflineIndicator;
