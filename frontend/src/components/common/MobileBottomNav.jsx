import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaCompass,
  FaFire,
  FaCalendarCheck,
  FaUserTie,
  FaDownload,
  FaHome,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { triggerPWAInstall } from "./PWAInstallPrompt";

const MobileBottomNav = () => {
  const location = useLocation();
  const { user, openAuthModal } = useAuth();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
  }, []);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/listings") return location.pathname === "/listings" || location.pathname.startsWith("/plot/");
    if (path === "/experiences") return location.pathname === "/experiences" || location.pathname.startsWith("/experience/");
    if (path === "/my-bookings") return location.pathname === "/my-bookings";
    if (path.startsWith("/owner/")) return location.pathname.startsWith("/owner");
    return false;
  };

  const isHost = user && (user.role === "owner" || user.role === "admin");

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-2xl md:hidden pb-[max(0.35rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5 items-center justify-around px-2 py-1.5">
        {/* 1. Explore Stays */}
        <Link
          to="/listings"
          className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-2xl py-1 px-1 transition active:scale-95 ${
            isActive("/listings")
              ? "text-emerald-600 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className="relative">
            <FaCompass size={18} />
            {isActive("/listings") && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Explore</span>
        </Link>

        {/* 2. Experiences */}
        <Link
          to="/experiences"
          className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-2xl py-1 px-1 transition active:scale-95 ${
            isActive("/experiences")
              ? "text-emerald-600 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className="relative">
            <FaFire size={18} />
            {isActive("/experiences") && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Experiences</span>
        </Link>

        {/* 3. My Bookings */}
        {user ? (
          <Link
            to="/my-bookings"
            className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-2xl py-1 px-1 transition active:scale-95 ${
              isActive("/my-bookings")
                ? "text-emerald-600 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className="relative">
              <FaCalendarCheck size={17} />
              {isActive("/my-bookings") && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-600" />
              )}
            </div>
            <span className="text-[10px] tracking-tight">Bookings</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-2xl py-1 px-1 text-slate-500 hover:text-slate-800 transition active:scale-95"
          >
            <FaCalendarCheck size={17} />
            <span className="text-[10px] tracking-tight">Sign In</span>
          </button>
        )}

        {/* 4. Admin / Host Portal / Become a Host */}
        <Link
          to={user?.role === "admin" ? "/admin" : (isHost ? "/owner/spots" : "/become-a-host")}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-2xl py-1 px-1 transition active:scale-95 ${
            isActive(user?.role === "admin" ? "/admin" : (isHost ? "/owner/" : "/become-a-host"))
              ? "text-emerald-600 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className="relative">
            <FaUserTie size={17} />
            {isActive(user?.role === "admin" ? "/admin" : (isHost ? "/owner/" : "/become-a-host")) && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">
            {user?.role === "admin" ? "Admin" : (isHost ? "Host Hub" : "Host")}
          </span>
        </Link>

        {/* 5. Home or Install App trigger */}
        {isStandalone ? (
          <Link
            to="/"
            className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-2xl py-1 px-1 transition active:scale-95 ${
              isActive("/")
                ? "text-emerald-600 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FaHome size={18} />
            <span className="text-[10px] tracking-tight">Home</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={triggerPWAInstall}
            className="flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-2xl py-1 px-1 text-emerald-700 hover:text-emerald-800 transition active:scale-95"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <FaDownload size={10} />
            </div>
            <span className="text-[10px] font-bold tracking-tight">Install</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
