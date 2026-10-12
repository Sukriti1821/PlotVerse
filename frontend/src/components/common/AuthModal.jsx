import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaLock,
  FaSpinner,
  FaUserShield,
  FaUserCheck,
  FaGift,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { getReferralCode, removeReferralCode } from "../../utils/storage";
import Logo from "./Logo";

const AuthModal = () => {
  const { showAuthModal, authMode, closeAuthModal, openAuthModal, login, register } =
    useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [referralCode, setReferralCode] = useState(() => {
    return getReferralCode() || "";
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync referral code if set in localStorage or URL
  useEffect(() => {
    if (showAuthModal) {
      const stored = getReferralCode();
      if (stored && !referralCode) {
        setReferralCode(stored);
      }
    }
  }, [showAuthModal, referralCode]);

  if (!showAuthModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (authMode === "register" && !role) {
      setError("Please choose whether you are a Customer or Plot Owner.");
      return;
    }

    if (authMode === "register" && !agreedToTerms) {
      setError("Please accept the Terms of Service and Privacy Policy to register.");
      return;
    }

    setLoading(true);

    try {
      if (authMode === "login") {
        const user = await login(email, password);
        toast.success(`Welcome back, ${user.name || user.email}!`);
      } else {
        const user = await register(name, email, password, role, referralCode);
        removeReferralCode();
        toast.success(
          `Account registered as ${user.role === "owner" ? "Plot Owner / Host" : "Customer"}! Welcome to Thikana!`
        );
      }
      // Reset fields
      setName("");
      setEmail("");
      setPassword("");
      setReferralCode("");
      setAgreedToTerms(false);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK" || !err.response
          ? "Unable to connect to server. Please ensure the backend is running."
          : authMode === "login"
          ? "Invalid email or password. Please try again."
          : "Registration failed. Please check your details and try again.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-mist"
        >
          {/* Close Button */}
          <button
            onClick={closeAuthModal}
            className="absolute right-6 top-6 rounded-full p-2 text-slate-brand hover:bg-snow hover:text-navy transition cursor-pointer"
          >
            <FaTimes size={18} />
          </button>

          {/* Modal Header */}
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-snow p-1.5 shadow-sm border border-mist">
              <Logo variant="icon" className="h-full w-full" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy">
                {authMode === "login" ? "Welcome to Thikana" : "Join Thikana"}
              </h2>
              <p className="mt-1 text-xs text-slate-brand">
                {authMode === "login"
                  ? "Sign in to reserve unique plots and nature stays."
                  : "Create your account to discover properties or list your plots."}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-snow border border-mist p-1">
            <button
              type="button"
              onClick={() => {
                setError(null);
                openAuthModal("login");
              }}
              className={`rounded-xl py-2 text-sm font-semibold transition cursor-pointer ${
                authMode === "login"
                  ? "bg-navy text-snow shadow-sm"
                  : "text-slate-brand hover:text-navy"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                openAuthModal("register");
              }}
              className={`rounded-xl py-2 text-sm font-semibold transition cursor-pointer ${
                authMode === "register"
                  ? "bg-navy text-snow shadow-sm"
                  : "text-slate-brand hover:text-navy"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 rounded-xl border border-danger/20 bg-danger-mist p-3 text-xs font-medium text-danger">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === "register" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-brand uppercase tracking-wider">
                  Full Name
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-mist bg-white px-4 py-3 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/15">
                  <FaUser className="text-slate-brand" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sukriti Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-sm text-navy border-none outline-none focus:outline-none focus:ring-0 placeholder:text-light-slate"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-brand uppercase tracking-wider">
                Email Address
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-mist bg-white px-4 py-3 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/15">
                <FaEnvelope className="text-slate-brand" />
                <input
                  type="email"
                  required
                  placeholder="e.g. you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-navy border-none outline-none focus:outline-none focus:ring-0 placeholder:text-light-slate"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-brand uppercase tracking-wider">
                Password
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-mist bg-white px-4 py-3 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/15">
                <FaLock className="text-slate-brand" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-navy border-none outline-none focus:outline-none focus:ring-0 placeholder:text-light-slate"
                />
              </div>
              {authMode === "login" && (
                <div className="mt-1.5 flex justify-end">
                  <Link
                    to="/forgot-password"
                    onClick={closeAuthModal}
                    className="text-xs font-semibold text-navy hover:text-saffron-text hover:underline transition"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            {/* Explicit Role Toggle for Registration */}
            {authMode === "register" && (
              <div>
                <label className="mb-2 block text-xs font-bold text-navy uppercase tracking-wider">
                  I want to join Thikana as:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("customer")}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3.5 text-center transition cursor-pointer ${
                      role === "customer"
                        ? "border-pine bg-pine-mist/50 text-pine shadow-sm ring-2 ring-pine/20"
                        : "border-mist bg-white text-slate-brand hover:bg-snow"
                    }`}
                  >
                    <FaUserCheck className={role === "customer" ? "text-pine" : "text-slate-brand"} />
                    <span className="text-xs font-bold">Customer</span>
                    <span className="text-[10px] text-slate-brand">Book scenic plots</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("owner")}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3.5 text-center transition cursor-pointer ${
                      role === "owner"
                        ? "border-pine bg-pine-mist/50 text-pine shadow-sm ring-2 ring-pine/20"
                        : "border-mist bg-white text-slate-brand hover:bg-snow"
                    }`}
                  >
                    <FaUserShield className={role === "owner" ? "text-pine" : "text-slate-brand"} />
                    <span className="text-xs font-bold">Plot Owner / Host</span>
                    <span className="text-[10px] text-slate-brand">List & host stays</span>
                  </button>
                </div>
              </div>
            )}

            {/* Referral Code (Optional) */}
            {authMode === "register" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-brand uppercase tracking-wider">
                    Referral Code (Optional)
                  </label>
                  {referralCode.trim() && (
                    <span className="text-[10px] font-bold text-pine bg-pine-mist border border-pine/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FaGift size={10} /> ₹200 Bonus Applied
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-mist bg-white px-4 py-3 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/15">
                  <FaGift className={referralCode ? "text-saffron-text" : "text-slate-brand"} />
                  <input
                    type="text"
                    placeholder="e.g. FRIEND200"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full bg-transparent text-sm font-semibold tracking-wider text-navy uppercase border-none outline-none focus:outline-none focus:ring-0 placeholder:normal-case placeholder:font-normal placeholder:text-light-slate"
                  />
                </div>
                {referralCode.trim() && (
                  <p className="mt-1 text-[11px] text-pine font-medium">
                    🎁 You and your friend will each receive ₹200 credit after your first completed booking!
                  </p>
                )}
              </div>
            )}

            {/* Terms and Privacy Agreement Checkbox for Registration */}
            {authMode === "register" && (
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-mist bg-snow p-3.5">
                <input
                  type="checkbox"
                  id="auth-agree-terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-mist text-navy focus:ring-navy cursor-pointer"
                />
                <label
                  htmlFor="auth-agree-terms"
                  className="text-xs text-slate-brand leading-relaxed cursor-pointer select-none"
                >
                  I agree to Thikana&apos;s{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-navy hover:text-saffron-text underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-navy hover:text-saffron-text underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron hover:bg-saffron-hover py-3.5 text-sm font-bold text-navy shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading && <FaSpinner className="animate-spin" />}
              {authMode === "login" ? "Sign In" : `Register as ${role === "owner" ? "Host" : "Customer"}`}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
