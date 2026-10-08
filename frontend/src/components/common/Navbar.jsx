import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaTimes, FaUserCircle, FaSignOutAlt, FaDownload, FaGift, FaWallet, FaTicketAlt, FaShieldAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { triggerPWAInstall } from "./PWAInstallPrompt";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, logout, openAuthModal } = useAuth();

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 12);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState);
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  const isActive = (to) => {
    if (to === "/") return location.pathname === "/";
    if (to === "/listings") return location.pathname === "/listings";
    if (to === "/experiences") return location.pathname === "/experiences" || location.pathname.startsWith("/experience/");
    if (to === "/my-bookings") return location.pathname === "/my-bookings";
    if (to === "/owner/spots") return location.pathname === "/owner/spots" || location.pathname === "/owner/listings";
    if (to === "/owner/experiences") return location.pathname === "/owner/experiences";
    if (to === "/owner/bookings") return location.pathname === "/owner/bookings";
    if (to === "/admin") return location.pathname.startsWith("/admin");
    return false;
  };

  return (
    <header className="sticky top-0 z-40">
      <nav
        className={`border-b border-white/40 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 shadow-lg shadow-slate-200/70 backdrop-blur-xl"
            : "bg-white/80 backdrop-blur-xl"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 lg:px-8">
          <Link
            to="/"
            className="flex items-center group transition-transform duration-200 hover:scale-[1.02] focus:outline-none"
            aria-label="Thikana Home"
          >
            <img src="/logo-navbar.svg" alt="Thikana" className="h-10 sm:h-11 w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-7 md:flex">
            <Link
              to="/"
              className={`text-sm font-semibold transition ${
                isActive("/") ? "text-emerald-600" : "text-slate-700 hover:text-emerald-600"
              }`}
            >
              Home
            </Link>
            <Link
              to="/experiences"
              className={`text-sm font-semibold flex items-center gap-1.5 transition ${
                isActive("/experiences") ? "text-emerald-600 font-bold" : "text-slate-700 hover:text-emerald-600"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Experiences
            </Link>
            <Link
              to="/listings"
              className={`text-sm font-semibold transition ${
                isActive("/listings") ? "text-emerald-600" : "text-slate-700 hover:text-emerald-600"
              }`}
            >
              Explore Stays
            </Link>
            <Link
              to="/corporate"
              className={`text-sm font-semibold flex items-center gap-1.5 transition ${
                location.pathname.startsWith("/corporate")
                  ? "text-emerald-600 font-bold"
                  : "text-slate-700 hover:text-emerald-600"
              }`}
            >
              <span>Corporate</span>
              <span className="rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[9px] font-extrabold px-1.5 py-0.5">
                B2B
              </span>
            </Link>

            {user && (
              <>
                <Link
                  to="/my-bookings"
                  className={`text-sm font-semibold transition ${
                    isActive("/my-bookings") ? "text-emerald-600 font-bold" : "text-slate-700 hover:text-emerald-600"
                  }`}
                >
                  My Bookings
                </Link>
                <Link
                  to="/referrals"
                  className={`text-sm font-semibold flex items-center gap-1.5 transition ${
                    isActive("/referrals") ? "text-emerald-600 font-bold" : "text-slate-700 hover:text-emerald-600"
                  }`}
                >
                  <FaGift className="text-emerald-500" />
                  <span>Refer & Earn</span>
                </Link>
                <Link
                  to="/my-gifts"
                  className={`text-sm font-semibold flex items-center gap-1.5 transition ${
                    location.pathname === "/my-gifts" ? "text-emerald-600 font-bold" : "text-slate-700 hover:text-emerald-600"
                  }`}
                >
                  <span className="text-xs">🎁</span>
                  <span>My Gifts</span>
                </Link>
              </>
            )}

            {user && (user.role === "owner" || user.role === "admin") ? (
              <>
                <Link
                  to="/owner/spots"
                  className={`text-sm font-bold flex items-center gap-1.5 transition ${
                    isActive("/owner/spots")
                      ? "text-emerald-600"
                      : "text-slate-700 hover:text-emerald-600"
                  }`}
                >
                  My Listings
                </Link>
                <Link
                  to="/owner/experiences"
                  className={`text-sm font-bold flex items-center gap-1.5 transition ${
                    isActive("/owner/experiences")
                      ? "text-emerald-600"
                      : "text-slate-700 hover:text-emerald-600"
                  }`}
                >
                  Host Experiences
                </Link>
                <Link
                  to="/owner/bookings"
                  className={`text-sm font-bold flex items-center gap-1.5 transition ${
                    isActive("/owner/bookings")
                      ? "text-emerald-600"
                      : "text-slate-700 hover:text-emerald-600"
                  }`}
                >
                  Host Bookings
                </Link>
                <Link
                  to="/owner/analytics"
                  className={`text-sm font-bold flex items-center gap-1.5 transition ${
                    isActive("/owner/analytics")
                      ? "text-emerald-600"
                      : "text-slate-700 hover:text-emerald-600"
                  }`}
                >
                  Host Analytics
                </Link>
                <Link
                  to="/owner/promotions"
                  className={`text-sm font-bold flex items-center gap-1.5 transition ${
                    isActive("/owner/promotions")
                      ? "text-emerald-600"
                      : "text-emerald-700 hover:text-emerald-500"
                  }`}
                >
                  Growth & Promos
                </Link>
                {/* Admin Nav Entry — visible strictly when user.role === 'admin' */}
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className={`text-sm font-extrabold flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
                      isActive("/admin")
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    <FaShieldAlt className={isActive("/admin") ? "text-white" : "text-emerald-600"} size={13} />
                    <span>Admin Panel</span>
                  </Link>
                )}
              </>
            ) : (
              <Link
                to="/become-a-host"
                className={`text-sm font-semibold transition ${
                  isActive("/become-a-host")
                    ? "text-emerald-600"
                    : "text-slate-700 hover:text-emerald-600"
                }`}
              >
                Become a Host
              </Link>
            )}

            {/* Auth Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/referrals"
                    title="Available Thikana Credits — Click to view wallet"
                    className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
                  >
                    <FaWallet className="text-emerald-600" size={11} />
                    <span>₹{user.walletBalance ?? 0}</span>
                  </Link>
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800">
                    <FaUserCircle className="text-emerald-600 text-sm" />
                    <span>{user.name || user.email}</span>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="rounded-full border border-slate-200 p-2 text-slate-600 hover:border-rose-300 hover:text-rose-600 transition"
                  >
                    <FaSignOutAlt size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal("login")}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-600"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => openAuthModal("register")}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-500"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            aria-label="Toggle menu"
            className="rounded-full border border-slate-200 p-2 text-slate-700 transition hover:border-emerald-300 hover:text-emerald-600 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="border-t border-slate-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur md:hidden">
            <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              {/* PWA Install Banner Button inside Mobile Menu */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  triggerPWAInstall();
                }}
                className="flex items-center justify-between min-h-[44px] rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/10 border border-emerald-300/80 px-3.5 py-2.5 text-emerald-900 font-bold text-xs active:scale-95 transition mb-1"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                    <FaDownload size={10} />
                  </span>
                  Install Thikana App
                </span>
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                  Fast PWA
                </span>
              </button>

              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 hover:text-emerald-600 font-semibold transition"
              >
                Home
              </Link>
              <Link
                to="/experiences"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 hover:text-emerald-600 font-semibold transition"
              >
                <span>Experiences</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                  Popular
                </span>
              </Link>
              <Link
                to="/listings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 hover:text-emerald-600 font-semibold transition"
              >
                Explore Stays
              </Link>
              <Link
                to="/corporate"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 text-slate-700 font-semibold transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xs">🏢</span> Corporate Off-sites & Teams
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  B2B
                </span>
              </Link>
              {user && (
                <>
                  <Link
                    to="/my-bookings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 hover:text-emerald-600 font-semibold transition"
                  >
                    My Bookings
                  </Link>
                  <Link
                    to="/referrals"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 text-emerald-700 font-bold transition"
                  >
                    <span className="flex items-center gap-2">
                      <FaGift className="text-emerald-500" /> Refer & Earn ₹200
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      ₹{user.walletBalance ?? 0}
                    </span>
                  </Link>
                  <Link
                    to="/my-gifts"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 text-slate-700 font-semibold transition"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs">🎁</span> My Gifts & Vouchers
                    </span>
                  </Link>
                </>
              )}
              <Link
                to="/redeem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 text-slate-700 font-semibold transition"
              >
                <span className="flex items-center gap-2">
                  <FaTicketAlt className="text-emerald-500 text-xs" /> Redeem Gift Voucher
                </span>
              </Link>
              {user && (user.role === "owner" || user.role === "admin") ? (
                <>
                  <Link
                    to="/owner/spots"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 text-slate-800 font-bold transition"
                  >
                    My Listings
                  </Link>
                  <Link
                    to="/owner/experiences"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 text-slate-800 font-bold transition"
                  >
                    Host Experiences
                  </Link>
                  <Link
                    to="/owner/bookings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 text-slate-800 font-bold transition"
                  >
                    Host Bookings
                  </Link>
                  <Link
                    to="/owner/analytics"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 text-slate-800 font-bold transition"
                  >
                    Host Analytics
                  </Link>
                  <Link
                    to="/owner/promotions"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 text-emerald-700 font-bold transition"
                  >
                    Growth & Promos
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 min-h-[44px] rounded-xl px-3 py-2 bg-emerald-50 text-emerald-900 font-extrabold border border-emerald-200 mt-1"
                    >
                      <FaShieldAlt className="text-emerald-600" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  to="/become-a-host"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center min-h-[44px] rounded-xl px-3 py-2 hover:bg-emerald-50 text-slate-700 font-semibold transition"
                >
                  Become a Host
                </Link>
              )}

              <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-slate-100">
                {user ? (
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-center font-semibold text-rose-700 text-xs"
                  >
                    Sign Out ({user.name})
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        openAuthModal("login");
                        setMenuOpen(false);
                      }}
                      className="rounded-full border border-slate-200 px-4 py-2 text-center font-semibold text-slate-700"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        openAuthModal("register");
                        setMenuOpen(false);
                      }}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-center font-semibold text-white"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;