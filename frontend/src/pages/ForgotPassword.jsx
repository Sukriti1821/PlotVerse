import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaEnvelope,
  FaArrowLeft,
  FaSpinner,
  FaCheckCircle,
  FaLock,
  FaPaperPlane,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const ForgotPassword = () => {
  const { openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await API.post("/auth/forgot-password", {
        email: email.trim(),
      });

      setSubmitted(true);
      toast.info(
        response.data?.message ||
          "If an account exists with that email, a password reset link has been sent."
      );
    } catch (err) {
      console.error("Forgot password error:", err);
      // Still show generic message or friendly prompt
      const msg =
        err.response?.data?.message ||
        "Unable to process your request. Please check your connection and try again.";
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
            {/* Logo & Header */}
            <div className="text-center mb-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 p-2 text-emerald-600 mb-4 shadow-sm">
                <FaLock className="text-2xl" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Forgot Your Password?
              </h1>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                No worries! Enter the email address associated with your Thikana account and we'll send you a recovery link.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition">
                    <FaEnvelope className="text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Sending Link...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane size={13} /> Send Reset Link
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Confirmation Screen */
              <div className="text-center py-2">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-4">
                  <FaCheckCircle />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Check Your Inbox
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  If an account exists for <span className="font-bold text-slate-800">{email}</span>, you will receive an email shortly with instructions to reset your password.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Try Another Email
                  </button>
                </div>
              </div>
            )}

            {/* Back to Login Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  navigate("/");
                  openAuthModal("login");
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
              >
                <FaArrowLeft size={10} /> Back to Sign In
              </button>
            </div>
          </motion.div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
