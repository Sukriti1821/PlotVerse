import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBars,
  FaTimes,
  FaUserCircle,
  FaSignOutAlt,
  FaDownload,
  FaGift,
  FaWallet,
  FaTicketAlt,
  FaShieldAlt,
  FaChevronDown,
  FaSuitcase,
  FaBuilding,
  FaThList,
  FaCalendarCheck,
  FaChartLine,
  FaBullhorn,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { triggerPWAInstall } from "./PWAInstallPrompt";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, logout, openAuthModal } = useAuth();
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 12);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState);
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  // Close menus on route navigation
  useEffect(() => {
    setUserDropdownOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const isHostOrAdmin = user && (user.role === "owner" || user.role === "admin");

  return (
    <header className="sticky top-0 z-40 w-full">
      <nav
        className={`border-b border-white/10 transition-all duration-300 bg-navy ${
          scrolled ? "shadow-lg shadow-navy-deep/80 backdrop-blur-xl py-2.5" : "backdrop-blur-xl py-3.5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center shrink-0 group transition-transform duration-200 hover:scale-[1.02] focus:outline-none"
            aria-label="Thikana Home"
          >
            <img
              src="/logo-navbar.svg"
              alt="Thikana - Your Place. Your Escape."
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-7">
            <Link
              to="/"
              className={`text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
                isActive("/") ? "text-saffron font-bold" : "text-snow/90 hover:text-saffron"
              }`}
            >
              Home
            </Link>
            <Link
              to="/listings"
              className={`text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
                isActive("/listings") ? "text-saffron font-bold" : "text-snow/90 hover:text-saffron"
              }`}
            >
              Explore Stays
            </Link>
            <Link
              to="/experiences"
              className={`text-sm font-semibold whitespace-nowrap flex items-center gap-2 transition-colors duration-150 ${
                isActive("/experiences") ? "text-saffron font-bold" : "text-snow/90 hover:text-saffron"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-saffron"></span>
              </span>
              <span>Experiences</span>
            </Link>
            <Link
              to="/corporate"
              className={`text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors duration-150 ${
                location.pathname.startsWith("/corporate")
                  ? "text-saffron font-bold"
                  : "text-snow/90 hover:text-saffron"
              }`}
            >
              <span>Corporate</span>
              <span className="rounded-md bg-dusk text-saffron border border-saffron/25 text-[10px] font-bold px-1.5 py-0.5 leading-none">
                B2B
              </span>
            </Link>
            {user && (
              <Link
                to="/my-bookings"
                className={`text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
                  isActive("/my-bookings") ? "text-saffron font-bold" : "text-snow/90 hover:text-saffron"
                }`}
              >
                My Bookings
              </Link>
            )}
          </div>

          {/* Desktop Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {/* Host Call-to-Action */}
            {!isHostOrAdmin ? (
              <Link
                to="/become-a-host"
                className={`text-xs font-semibold whitespace-nowrap rounded-full px-3.5 py-1.5 transition border ${
                  isActive("/become-a-host")
                    ? "border-saffron text-saffron bg-saffron/10 font-bold"
                    : "border-white/15 text-snow/90 hover:border-saffron/60 hover:text-saffron hover:bg-white/5"
                }`}
              >
                Become a Host
              </Link>
            ) : (
              <Link
                to="/owner/spots"
                className={`text-xs font-bold whitespace-nowrap rounded-full px-3.5 py-1.5 transition border ${
                  isActive("/owner/spots")
                    ? "border-saffron text-saffron bg-saffron/15"
                    : "border-white/20 text-snow hover:border-saffron hover:text-saffron bg-dusk/70"
                }`}
              >
                Host Dashboard
              </Link>
            )}

            {/* Authenticated User Menu & Wallet */}
            {user ? (
              <div className="flex items-center gap-2.5">
                {/* Wallet Chip */}
                <Link
                  to="/referrals"
                  title="Thikana Wallet Balance — Click to view referral credits"
                  className="flex items-center gap-1.5 rounded-full bg-dusk border border-white/15 px-3 py-1.5 text-xs font-bold text-saffron hover:border-saffron/50 hover:bg-dusk/90 transition shadow-xs whitespace-nowrap group"
                >
                  <FaWallet className="text-saffron transition-transform group-hover:scale-110" size={12} />
                  <span>₹{user.walletBalance ?? 0}</span>
                </Link>

                {/* Profile Pill Dropdown Toggle */}
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none ${
                      userDropdownOpen
                        ? "bg-dusk border-saffron shadow-sm text-saffron"
                        : "bg-dusk/80 border-white/15 hover:border-white/30 hover:bg-dusk text-snow"
                    }`}
                    aria-expanded={userDropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-saffron/20 text-saffron font-bold text-[10px]">
                      {user.name ? user.name.charAt(0).toUpperCase() : <FaUserCircle size={14} />}
                    </div>
                    <span className="max-w-[110px] truncate font-semibold text-snow">
                      {user.name || user.email?.split("@")[0]}
                    </span>
                    <FaChevronDown
                      size={9}
                      className={`text-light-slate transition-transform duration-200 ${
                        userDropdownOpen ? "rotate-180 text-saffron" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu Modal */}
                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-white/15 bg-navy-deep p-2 shadow-2xl shadow-black/70 backdrop-blur-2xl z-50 text-snow"
                      >
                        {/* Dropdown Header */}
                        <div className="border-b border-white/10 px-3.5 py-3">
                          <p className="text-xs font-bold text-snow truncate">{user.name || "Explorer"}</p>
                          <p className="text-[11px] text-light-slate truncate">{user.email}</p>
                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="rounded-full bg-saffron/15 border border-saffron/30 px-2 py-0.5 text-[10px] font-bold text-saffron uppercase tracking-wider">
                              {user.role === "admin" ? "Admin" : user.role === "owner" ? "Host" : "Traveler"}
                            </span>
                            <span className="text-[11px] font-semibold text-saffron flex items-center gap-1">
                              <FaWallet size={10} /> ₹{user.walletBalance ?? 0} Credits
                            </span>
                          </div>
                        </div>

                        {/* Guest / Traveler Links */}
                        <div className="py-1.5 space-y-0.5">
                          <Link
                            to="/my-bookings"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-snow hover:bg-dusk hover:text-saffron transition"
                          >
                            <FaSuitcase className="text-saffron" size={13} />
                            <span>My Bookings</span>
                          </Link>
                          <Link
                            to="/referrals"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-snow hover:bg-dusk hover:text-saffron transition"
                          >
                            <span className="flex items-center gap-2.5">
                              <FaGift className="text-saffron" size={13} />
                              <span>Refer & Earn</span>
                            </span>
                            <span className="rounded-full bg-saffron/20 border border-saffron/30 px-1.5 py-0.5 text-[9px] font-extrabold text-saffron">
                              ₹200
                            </span>
                          </Link>
                          <Link
                            to="/my-gifts"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-snow hover:bg-dusk hover:text-saffron transition"
                          >
                            <FaGift className="text-saffron" size={13} />
                            <span>My Gifts & Vouchers</span>
                          </Link>
                          <Link
                            to="/redeem"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-snow hover:bg-dusk hover:text-saffron transition"
                          >
                            <FaTicketAlt className="text-light-slate" size={13} />
                            <span>Redeem Voucher</span>
                          </Link>
                        </div>

                        {/* Host / Admin Management Links */}
                        {isHostOrAdmin && (
                          <div className="border-t border-white/10 pt-1.5 pb-1 space-y-0.5">
                            <p className="px-3 py-1 text-[10px] font-bold tracking-wider text-light-slate uppercase">
                              Host Operations
                            </p>
                            <Link
                              to="/owner/spots"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-medium text-snow hover:bg-dusk hover:text-saffron transition"
                            >
                              <FaThList className="text-saffron" size={12} />
                              <span>My Listings</span>
                            </Link>
                            <Link
                              to="/owner/experiences"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-medium text-snow hover:bg-dusk hover:text-saffron transition"
                            >
                              <FaCalendarCheck className="text-saffron" size={12} />
                              <span>Host Experiences</span>
                            </Link>
                            <Link
                              to="/owner/bookings"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-medium text-snow hover:bg-dusk hover:text-saffron transition"
                            >
                              <FaSuitcase className="text-saffron" size={12} />
                              <span>Host Bookings</span>
                            </Link>
                            <Link
                              to="/owner/analytics"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-medium text-snow hover:bg-dusk hover:text-saffron transition"
                            >
                              <FaChartLine className="text-saffron" size={12} />
                              <span>Host Analytics</span>
                            </Link>
                            <Link
                              to="/owner/promotions"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-medium text-snow hover:bg-dusk hover:text-saffron transition"
                            >
                              <FaBullhorn className="text-saffron" size={12} />
                              <span>Growth & Promos</span>
                            </Link>
                            {user.role === "admin" && (
                              <Link
                                to="/admin"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-saffron/15 text-saffron border border-saffron/30 hover:bg-saffron hover:text-navy transition mt-1"
                              >
                                <FaShieldAlt size={12} />
                                <span>Admin Control Panel</span>
                              </Link>
                            )}
                          </div>
                        )}

                        {/* Sign Out Action */}
                        <div className="border-t border-white/10 pt-1.5">
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              logout();
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-danger hover:bg-danger-mist/20 transition cursor-pointer"
                          >
                            <FaSignOutAlt size={12} />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              /* Guest Login & Sign Up */
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => openAuthModal("login")}
                  className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-snow transition hover:border-saffron hover:text-saffron cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => openAuthModal("register")}
                  className="rounded-full bg-saffron px-4 py-1.5 text-xs font-bold text-navy shadow-md transition hover:bg-saffron-hover hover:-translate-y-0.5 cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            aria-label="Toggle menu"
            className="rounded-full border border-white/15 p-2 text-snow transition hover:border-saffron hover:text-saffron md:hidden cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-white/10 bg-navy-deep px-5 py-4 shadow-xl backdrop-blur-xl md:hidden"
            >
              <div className="flex flex-col gap-1 text-sm font-medium text-snow">
                {/* PWA Install Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    triggerPWAInstall();
                  }}
                  className="flex items-center justify-between min-h-[44px] rounded-2xl bg-dusk border border-white/10 px-3.5 py-2.5 text-snow font-bold text-xs active:scale-95 transition mb-2"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-saffron text-navy shadow-xs font-bold">
                      <FaDownload size={11} />
                    </span>
                    <span>Install Thikana App</span>
                  </span>
                  <span className="rounded-full bg-saffron px-2 py-0.5 text-[10px] font-bold text-navy shadow-xs">
                    Fast PWA
                  </span>
                </button>

                {/* Primary Exploration Links */}
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center min-h-[42px] rounded-xl px-3 py-2 transition ${
                    isActive("/") ? "bg-dusk text-saffron font-bold" : "hover:bg-dusk/60 hover:text-saffron text-snow"
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/listings"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center min-h-[42px] rounded-xl px-3 py-2 transition ${
                    isActive("/listings") ? "bg-dusk text-saffron font-bold" : "hover:bg-dusk/60 hover:text-saffron text-snow"
                  }`}
                >
                  Explore Stays
                </Link>
                <Link
                  to="/experiences"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between min-h-[42px] rounded-xl px-3 py-2 transition ${
                    isActive("/experiences") ? "bg-dusk text-saffron font-bold" : "hover:bg-dusk/60 hover:text-saffron text-snow"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-saffron"></span>
                    </span>
                    <span>Experiences</span>
                  </span>
                  <span className="rounded-full bg-saffron/20 border border-saffron/40 text-saffron text-[10px] font-bold px-2 py-0.5">
                    Curated
                  </span>
                </Link>
                <Link
                  to="/corporate"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between min-h-[42px] rounded-xl px-3 py-2 hover:bg-dusk text-snow transition"
                >
                  <span className="flex items-center gap-2.5">
                    <FaBuilding className="text-saffron text-xs" />
                    <span>Corporate Off-sites & Teams</span>
                  </span>
                  <span className="text-[10px] bg-dusk text-saffron border border-saffron/20 px-2 py-0.5 rounded-full font-bold">
                    B2B
                  </span>
                </Link>

                {/* Traveler Account Section */}
                {user && (
                  <div className="border-t border-white/10 pt-2 mt-1 space-y-1">
                    <p className="px-3 text-[10px] font-bold tracking-wider text-light-slate uppercase">
                      My Account
                    </p>
                    <Link
                      to="/my-bookings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 min-h-[42px] rounded-xl px-3 py-2 hover:bg-dusk hover:text-saffron text-snow transition"
                    >
                      <FaSuitcase className="text-saffron" size={13} />
                      <span>My Bookings</span>
                    </Link>
                    <Link
                      to="/referrals"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between min-h-[42px] rounded-xl px-3 py-2 hover:bg-dusk text-snow transition"
                    >
                      <span className="flex items-center gap-2.5">
                        <FaGift className="text-saffron" size={13} />
                        <span>Refer & Earn ₹200</span>
                      </span>
                      <span className="text-xs bg-saffron/20 border border-saffron/30 text-saffron px-2 py-0.5 rounded-full font-bold">
                        ₹{user.walletBalance ?? 0}
                      </span>
                    </Link>
                    <Link
                      to="/my-gifts"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 min-h-[42px] rounded-xl px-3 py-2 hover:bg-dusk text-snow transition"
                    >
                      <FaGift className="text-saffron" size={13} />
                      <span>My Gifts & Vouchers</span>
                    </Link>
                    <Link
                      to="/redeem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 min-h-[42px] rounded-xl px-3 py-2 hover:bg-dusk text-snow transition"
                    >
                      <FaTicketAlt className="text-light-slate" size={13} />
                      <span>Redeem Gift Voucher</span>
                    </Link>
                  </div>
                )}

                {/* Host Tools Section */}
                {isHostOrAdmin ? (
                  <div className="border-t border-white/10 pt-2 mt-1 space-y-1">
                    <p className="px-3 text-[10px] font-bold tracking-wider text-light-slate uppercase">
                      Host Dashboard
                    </p>
                    <Link
                      to="/owner/spots"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 min-h-[42px] rounded-xl px-3 py-2 hover:bg-dusk text-snow transition"
                    >
                      <FaThList className="text-saffron" size={12} />
                      <span>My Listings</span>
                    </Link>
                    <Link
                      to="/owner/experiences"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 min-h-[42px] rounded-xl px-3 py-2 hover:bg-dusk text-snow transition"
                    >
                      <FaCalendarCheck className="text-saffron" size={12} />
                      <span>Host Experiences</span>
                    </Link>
                    <Link
                      to="/owner/bookings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 min-h-[42px] rounded-xl px-3 py-2 hover:bg-dusk text-snow transition"
                    >
                      <FaSuitcase className="text-saffron" size={12} />
                      <span>Host Bookings</span>
                    </Link>
                    <Link
                      to="/owner/analytics"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 min-h-[42px] rounded-xl px-3 py-2 hover:bg-dusk text-snow transition"
                    >
                      <FaChartLine className="text-saffron" size={12} />
                      <span>Host Analytics</span>
                    </Link>
                    <Link
                      to="/owner/promotions"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 min-h-[42px] rounded-xl px-3 py-2 hover:bg-dusk text-saffron transition"
                    >
                      <FaBullhorn className="text-saffron" size={12} />
                      <span>Growth & Promos</span>
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 min-h-[42px] rounded-xl px-3 py-2 bg-saffron text-navy font-bold mt-1"
                      >
                        <FaShieldAlt size={13} />
                        <span>Admin Control Panel</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-white/10 pt-2 mt-1">
                    <Link
                      to="/become-a-host"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center min-h-[42px] rounded-xl px-3 py-2 hover:bg-dusk text-snow transition"
                    >
                      Become a Host
                    </Link>
                  </div>
                )}

                {/* Auth Controls in Mobile Menu */}
                <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-white/10">
                  {user ? (
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 rounded-full border border-danger/30 bg-danger-mist/10 px-4 py-2.5 text-center font-bold text-danger text-xs hover:bg-danger-mist/20 transition cursor-pointer"
                    >
                      <FaSignOutAlt size={13} />
                      <span>Sign Out ({user.name || user.email})</span>
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          openAuthModal("login");
                          setMenuOpen(false);
                        }}
                        className="rounded-full border border-white/20 px-4 py-2.5 text-center font-semibold text-snow hover:border-saffron hover:text-saffron transition cursor-pointer"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          openAuthModal("register");
                          setMenuOpen(false);
                        }}
                        className="rounded-full bg-saffron px-4 py-2.5 text-center font-bold text-navy hover:bg-saffron-hover transition cursor-pointer"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

export default Navbar;