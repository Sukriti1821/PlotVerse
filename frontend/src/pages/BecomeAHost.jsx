import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaShieldAlt,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaArrowRight,
  FaCheckCircle,
  FaTree,
  FaStar,
  FaSpinner,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";

const BecomeAHost = () => {
  const { user, openAuthModal, upgradeToHost } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const navigate = useNavigate();

  const isOwner = user && (user.role === "owner" || user.role === "admin");

  const handleHostAction = async () => {
    if (isOwner) {
      navigate("/owner/spots");
      return;
    }

    if (user && user.role === "customer") {
      try {
        setUpgrading(true);
        await upgradeToHost();
        toast.success("Welcome, Host! Your account is now upgraded with host listing privileges.");
        navigate("/owner/spots");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to upgrade account. Please try again.");
      } finally {
        setUpgrading(false);
      }
      return;
    }

    openAuthModal("register");
  };

  const benefits = [
    {
      icon: FaMoneyBillWave,
      title: "Earn Flexible Revenue",
      description:
        "Set your own base hourly prices and charge for custom amenity add-ons like bonfire setups, tents, WiFi, and guided tours.",
    },
    {
      icon: FaCalendarCheck,
      title: "Complete Schedule Control",
      description:
        "Accept or reject guest reservation requests in real-time. Block dates whenever your property is unavailable.",
    },
    {
      icon: FaShieldAlt,
      title: "Verified Guests & Security",
      description:
        "Every traveler is registered with verified contact info. Our double-booking engine prevents overlapping reservations.",
    },
    {
      icon: FaTree,
      title: "Celebrate Nature Stays",
      description:
        "Join a growing community of eco-conscious land owners, orchard managers, and campground hosts across the country.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Host Profile",
      description: "Sign up in seconds and choose your Host role to unlock property listing and approval tools.",
    },
    {
      number: "02",
      title: "Showcase Your Plot",
      description: "Upload photos, set your location, define base hourly rates, and customize your amenity catalog.",
    },
    {
      number: "03",
      title: "Review & Accept Bookings",
      description: "Receive booking requests with selected amenity breakdowns, approve slots, and welcome guests.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero Section */}
        <section className="relative isolate overflow-hidden bg-slate-950 text-white">
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1920&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-slate-950/40" />

          <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400 backdrop-blur-md mb-6">
                <FaStar /> Partner with Thikana
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
                Turn Your Scenic Land Into a Rewarding Nature Retreat
              </h1>

              <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                Whether you own a mountain orchard, a tranquil riverside campsite, a farm stay, or an open valley plot — Thikana makes it easy to host verified travelers and earn flexible income.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button
                  onClick={handleHostAction}
                  disabled={upgrading}
                  className="flex items-center gap-3 rounded-full bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-60"
                >
                  {upgrading && <FaSpinner className="animate-spin" size={16} />}
                  {isOwner
                    ? "Open Host Dashboard"
                    : user
                    ? upgrading
                      ? "Activating Host Account..."
                      : "Upgrade Account to Host"
                    : "Get Started as Host"}{" "}
                  <FaArrowRight size={14} />
                </button>

                <Link
                  to="/listings"
                  className="rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-md hover:bg-white/15 transition"
                >
                  Explore Current Listings
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-4 sm:gap-8 border-t border-white/10 pt-8 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-400 text-sm" /> 100% Free Listing Setup
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-400 text-sm" /> Real-time Double Booking Protection
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-400 text-sm" /> You Set the Pricing
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">
              Why Host With Us
            </h2>
            <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything You Need to Host with Confidence
            </p>
            <p className="mt-3 text-slate-500 text-sm">
              We provide the full technology stack so you can focus on welcoming travelers to your scenic location.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -6 }}
                  className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all"
                >
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl mb-6">
                    <Icon />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* How It Works Steps */}
        <section className="bg-slate-900 text-white py-20 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
                Simple Onboarding
              </h2>
              <p className="text-3xl lg:text-4xl font-extrabold tracking-tight">
                How Becoming a Host Works
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm relative"
                >
                  <span className="text-4xl font-extrabold text-emerald-400/40 block mb-4">
                    {step.number}
                  </span>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom CTA Box */}
            <div className="mt-16 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-8 lg:p-12 text-center text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left">
                <h3 className="text-2xl lg:text-3xl font-extrabold">
                  Ready to welcome your first guests?
                </h3>
                <p className="mt-1 text-sm text-emerald-100 max-w-lg">
                  Join Thikana today as a host and start monetizing your scenic properties.
                </p>
              </div>

              <button
                onClick={handleHostAction}
                disabled={upgrading}
                className="flex items-center gap-2 rounded-full bg-slate-950 px-8 py-4 text-sm font-bold text-white shadow-xl hover:bg-slate-900 transition whitespace-nowrap disabled:opacity-60"
              >
                {upgrading && <FaSpinner className="animate-spin" size={14} />}
                {isOwner
                  ? "Access Host Dashboard"
                  : user
                  ? upgrading
                    ? "Activating..."
                    : "Upgrade Account to Host"
                  : "Register as Host Now"}
                <FaArrowRight size={12} />
              </button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default BecomeAHost;
