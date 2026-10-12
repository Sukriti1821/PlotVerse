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
    <div className="min-h-screen bg-snow text-navy flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="py-16 px-6 lg:px-8 max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border border-mist bg-white p-8 shadow-xl"
          >
            {/* Logo & Header */}
            <div className="text-center mb-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron/15 border border-saffron/30 p-2 text-saffron-text mb-4 shadow-sm">
                <FaLock className="text-2xl" />
              </div>
              <h1 className="text-2xl font-extrabold text-navy tracking-tight">
                Forgot Your Password?
              </h1>
              <p className="mt-2 text-xs text-slate-brand leading-relaxed max-w-xs mx-auto">
                No worries! Enter the email address associated with your Thikana account and we'll send you a recovery link.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-2xl border border-danger/30 bg-danger-mist p-3.5 text-xs text-danger font-medium">
                {error}
              </div>
            )}

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-navy uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-mist bg-snow px-4 py-3 focus-within:border-saffron focus-within:bg-white focus-within:ring-2 focus-within:ring-saffron/20 transition">
                    <FaEnvelope className="text-slate-brand" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent text-sm text-navy outline-none placeholder-slate-brand"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-saffron px-6 py-3.5 text-sm font-bold text-navy shadow-lg shadow-saffron/20 hover:bg-saffron-hover transition hover:-translate-y-0.5 disabled:bg-mist disabled:text-slate-brand disabled:cursor-not-allowed"
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
                <div className="h-12 w-12 rounded-full bg-pine-mist text-pine flex items-center justify-center text-2xl mx-auto mb-4 border border-pine/20">
                  <FaCheckCircle />
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">
                  Check Your Inbox
                </h3>
                <p className="text-xs text-slate-brand leading-relaxed mb-6">
                  If an account exists for <span className="font-bold text-navy">{email}</span>, you will receive an email shortly with instructions to reset your password.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                    }}
                    className="w-full rounded-2xl border-2 border-navy px-4 py-2.5 text-xs font-semibold text-navy hover:bg-navy hover:text-snow transition"
                  >
                    Try Another Email
                  </button>
                </div>
              </div>
            )}

            {/* Back to Login Footer */}
            <div className="mt-8 pt-6 border-t border-mist text-center">
              <button
                type="button"
                onClick={() => {
                  navigate("/");
                  openAuthModal("login");
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-navy hover:text-saffron-text transition"
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
