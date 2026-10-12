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
        if (err.response?.status === 401) {
          openAuthModal("login");
        } else {
          toast.error(err.response?.data?.message || "Failed to upgrade account. Please try again.");
        }
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
    <div className="min-h-screen bg-snow text-navy flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero Section */}
        <section className="relative isolate overflow-hidden bg-navy text-snow">
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1920&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/90 via-navy/70 to-navy-deep/50" />

          <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-saffron/30 bg-saffron/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-saffron backdrop-blur-md mb-6">
                <FaStar /> Partner with Thikana
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-tight text-snow">
                Turn Your Scenic Land Into a Rewarding Nature Retreat
              </h1>

              <p className="mt-6 text-lg text-light-slate leading-relaxed">
                Whether you own a mountain orchard, a tranquil riverside campsite, a farm stay, or an open valley plot — Thikana makes it easy to host verified travelers and earn flexible income.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button
                  onClick={handleHostAction}
                  disabled={upgrading}
                  className="flex items-center gap-3 rounded-full bg-saffron px-8 py-4 text-base font-bold text-navy shadow-xl hover:bg-saffron-hover transition hover:-translate-y-0.5 disabled:opacity-60"
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
                  className="rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-snow backdrop-blur-md hover:bg-white/15 transition"
                >
                  Explore Current Listings
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-4 sm:gap-8 border-t border-white/10 pt-8 text-xs text-light-slate">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-saffron text-sm" /> 100% Free Listing Setup
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-saffron text-sm" /> Real-time Double Booking Protection
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-saffron text-sm" /> You Set the Pricing
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-saffron-text mb-2">
              Why Host With Us
            </h2>
            <p className="text-3xl lg:text-4xl font-extrabold text-navy tracking-tight">
              Everything You Need to Host with Confidence
            </p>
            <p className="mt-3 text-slate-brand text-sm">
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
                  className="rounded-3xl border border-mist bg-white p-8 shadow-sm transition-all"
                >
                  <div className="h-12 w-12 rounded-2xl bg-pine-mist text-pine flex items-center justify-center text-xl mb-6">
                    <Icon />
                  </div>
                  <h3 className="text-lg font-bold text-navy mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-brand leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* How It Works Steps */}
        <section className="bg-navy-deep text-snow py-20 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-saffron mb-2">
                Simple Onboarding
              </h2>
              <p className="text-3xl lg:text-4xl font-extrabold tracking-tight text-snow">
                How Becoming a Host Works
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm relative"
                >
                  <span className="text-4xl font-extrabold text-saffron/40 block mb-4">
                    {step.number}
                  </span>
                  <h3 className="text-xl font-bold mb-3 text-snow">{step.title}</h3>
                  <p className="text-xs text-light-slate leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom CTA Box */}
            <div className="mt-16 rounded-3xl bg-dusk border border-white/10 p-8 lg:p-12 text-center text-snow shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left">
                <h3 className="text-2xl lg:text-3xl font-extrabold text-snow">
                  Ready to welcome your first guests?
                </h3>
                <p className="mt-1 text-sm text-light-slate max-w-lg">
                  Join Thikana today as a host and start monetizing your scenic properties.
                </p>
              </div>

              <button
                onClick={handleHostAction}
                disabled={upgrading}
                className="flex items-center gap-2 rounded-full bg-saffron px-8 py-4 text-sm font-bold text-navy shadow-xl hover:bg-saffron-hover transition whitespace-nowrap disabled:opacity-60"
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
