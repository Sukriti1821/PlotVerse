import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaLock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { openAuthModal } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is missing. Please use the link sent to your email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(`/auth/reset-password/${token}`, {
        password,
      });

      setResetSuccess(true);
      toast.success(
        response.data?.message || "Your password has been successfully reset!"
      );

      // If token returned, optionally store it or redirect to login
      setTimeout(() => {
        navigate("/");
        openAuthModal("login");
      }, 2500);
    } catch (err) {
      console.error("Password reset error:", err);
      const msg =
        err.response?.data?.message ||
        "Invalid or expired reset link. Please request a new password reset email.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="py-16 px-6 lg:px-8 max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 p-2 text-emerald-600 mb-4 shadow-sm">
                <FaLock className="text-2xl" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Create New Password
              </h1>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Your new password must be at least 6 characters long.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{error}</p>
                    {error.toLowerCase().includes("expired") || error.toLowerCase().includes("invalid") ? (
                      <Link
                        to="/forgot-password"
                        className="mt-2 inline-block font-semibold text-rose-800 underline hover:text-rose-900"
                      >
                        Request a new password reset link &rarr;
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {!resetSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition">
                    <FaLock className="text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition">
                    <FaLock className="text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Updating Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            ) : (
              /* Success State */
              <div className="text-center py-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-4">
                  <FaCheckCircle />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Password Reset Complete!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Your password has been securely updated. Redirecting you to sign in...
                </p>
                <button
                  onClick={() => {
                    navigate("/");
                    openAuthModal("login");
                  }}
                  className="w-full rounded-2xl bg-slate-900 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-600 transition"
                >
                  Sign In Now
                </button>
              </div>
            )}

            {/* Back link */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-600 transition"
              >
                <FaArrowLeft size={10} /> Request another reset link
              </Link>
            </div>
          </motion.div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ResetPassword;
