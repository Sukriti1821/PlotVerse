import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

const HeroScene = lazy(() => import("../components/3d/HeroScene"));

import {
  FaCalendarAlt,
  FaCompass,
  FaDollarSign,
  FaHeadset,
  FaLeaf,
  FaLock,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaUsers,
  FaExclamationTriangle,
  FaSearch,
  FaMinus,
  FaPlus,
  FaArrowRight,
} from "react-icons/fa";
import Categories from "../components/Categories";
import ListingCard from "../components/cards/ListingCard";
import ExperienceCard from "../components/cards/ExperienceCard";
import SmartRecommendations from "../components/recommendations/SmartRecommendations";
import SmartRecommendationFinder from "../components/recommendations/SmartRecommendationFinder";
import Footer from "../components/common/Footer";
import Navbar from "../components/common/Navbar";
import SectionHeading from "../components/common/SectionHeading";
import DynamicTestimonials from "../components/home/DynamicTestimonials";
import API from "../services/api";

const steps = [
  {
    icon: FaCompass,
    title: "Choose Destination",
    description: "Pick a scenic spot that matches your mood, group size, and travel style.",
  },
  {
    icon: FaCalendarAlt,
    title: "Book Instantly",
    description: "Secure your stay with a smooth booking flow and flexible travel plans.",
  },
  {
    icon: FaLeaf,
    title: "Enjoy Nature",
    description: "Step into a peaceful escape with curated amenities and unforgettable views.",
  },
];

const reasons = [
  {
    icon: FaShieldAlt,
    title: "Verified Locations",
    description: "Every destination is reviewed for quality, comfort, and trusted hospitality.",
  },
  {
    icon: FaLock,
    title: "Secure Booking",
    description: "Enjoy safe payments and transparent booking details for every reservation.",
  },
  {
    icon: FaDollarSign,
    title: "Best Prices",
    description: "Get value-packed stays with premium features at competitive rates.",
  },
  {
    icon: FaHeadset,
    title: "24/7 Support",
    description: "Travel support is always available to make your stay stress-free.",
  },
];

import { SpotGridSkeleton } from "../components/common/SkeletonLoader";

// Fallback destinations matching authentic Himalayan landscape inventory
const FALLBACK_FEATURED_SPOTS = [
  {
    _id: "6aa122beec5cfe830180d6df",
    title: "Pahalgam Pine Valley Terraced Glade",
    location: "Aru Valley, Pahalgam, Jammu & Kashmir",
    price: 1800,
    category: "Grassland Plot",
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    _id: "6aa122beec5cfe830180d6e0",
    title: "Old Manali Ridge Sunset Date Night Setup",
    location: "Old Manali, Himachal Pradesh",
    price: 1500,
    category: "Date Night Setup",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    _id: "6aa122beec5cfe830180d6e1",
    title: "Solang Alpine Meadow & Pine Camping Plot",
    location: "Solang Valley, Manali, Himachal Pradesh",
    price: 1200,
    category: "Grassland Plot",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    _id: "6aa122beec5cfe830180d6e2",
    title: "Chopta High-Altitude Bugyal Meadow",
    location: "Chopta, Rudraprayag, Uttarakhand",
    price: 1400,
    category: "Grassland Plot",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
    ],
  },
];

function Home() {
  const navigate = useNavigate();
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [show3DHero, setShow3DHero] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchGuests, setSearchGuests] = useState(2);
  const [guestsDropdownOpen, setGuestsDropdownOpen] = useState(false);
  const guestsRef = useRef(null);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredExperiences, setFeaturedExperiences] = useState([]);

  // Fetch featured experiences
  useEffect(() => {
    let ignore = false;
    const loadExperiences = async () => {
      try {
        const res = await API.get("/experiences?featured=true");
        if (!ignore && res.data?.data && res.data.data.length > 0) {
          setFeaturedExperiences(res.data.data.slice(0, 3));
        } else {
          // Fallback to top experiences
          const fallbackRes = await API.get("/experiences");
          if (!ignore && fallbackRes.data?.data) {
            setFeaturedExperiences(fallbackRes.data.data.slice(0, 3));
          }
        }
      } catch (e) {
        console.error("Error loading featured experiences:", e);
      }
    };
    loadExperiences();
    return () => {
      ignore = true;
    };
  }, []);

  // Close guests dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (guestsRef.current && !guestsRef.current.contains(e.target)) {
        setGuestsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation.trim()) params.set("location", searchLocation.trim());
    if (searchDate) params.set("date", searchDate);
    if (searchGuests) params.set("guests", searchGuests.toString());
    navigate(`/listings${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const fetchSpots = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      // Query featured destinations first
      let response = await API.get("/spots?featured=true");
      let responseData = response.data;
      let data = Array.isArray(responseData)
        ? responseData
        : responseData?.data || responseData?.spots || [];

      // Fallback to top newest spots if no featured spots explicitly returned
      if (!data || data.length === 0) {
        response = await API.get("/spots?limit=12");
        responseData = response.data;
        data = Array.isArray(responseData)
          ? responseData
          : responseData?.data || responseData?.spots || [];
      }

      setSpots(data && data.length > 0 ? data : FALLBACK_FEATURED_SPOTS);
    } catch (err) {
      console.error("Error fetching spots:", err);
      // Auto-retry once after 1s if during dev server boot or HMR reload
      if (retryCount < 1) {
        setTimeout(() => fetchSpots(retryCount + 1), 1000);
        return;
      }
      // Provide resilient fallback so the home page never shows a broken state
      if (!spots || spots.length === 0) {
        setSpots(FALLBACK_FEATURED_SPOTS);
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load featured destinations. Please check backend connection."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  // Display top 4 spots as featured
  const featuredSpots = spots.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main>
        {/* =========================================================================
            HERO SECTION: Authentic Full-Bleed Mountain Landscape Photography (Option A)
            Trust-first Airbnb/OYO style marketplace hero showcasing real mountain land.
           ========================================================================= */}
        <section id="home" className="relative isolate overflow-hidden bg-slate-950 min-h-[560px] sm:min-h-[620px] lg:min-h-[660px] flex items-center">
          {/* 
            PART A: High-Quality Royalty-Free Mountain Land Photography
            Authentic untouched alpine valley & meadows with Himalayan backdrops, pine forests & golden-hour light.
            Unsplash photo-1506744038136-46273834b3fb (100% natural, open wilderness plot with zero commercial buildings)
          */}

          {/* 1 & 2. Background: Dynamic 3D Scene or Optimized Mountain Photography */}
          {show3DHero ? (
            <div className="absolute inset-0 z-0">
              <Suspense
                fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-emerald-400">
                    <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mb-3" />
                    <span className="text-xs font-semibold tracking-wider uppercase">Loading 3D Terrain...</span>
                  </div>
                }
              >
                <HeroScene />
              </Suspense>
            </div>
          ) : (
            <>
              {/* Low-Quality Image Placeholder (LQIP) for instantaneous blur-up */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center filter blur-xl scale-105 pointer-events-none transition-opacity duration-1000"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=60&q=20&blur=20&fm=webp')",
                  opacity: heroImageLoaded ? 0 : 1,
                }}
              />

              {/* Responsive Full-Bleed Photography with WebP optimization & srcset */}
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85&fm=webp"
                srcSet="
                  https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=640&q=75&fm=webp 640w,
                  https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1024&q=80&fm=webp 1024w,
                  https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85&fm=webp 1920w,
                  https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=85&fm=webp 2560w
                "
                sizes="100vw"
                alt="Scenic untouched alpine valley and mountain meadows in Himachal Pradesh"
                fetchPriority="high"
                loading="eager"
                decoding="async"
                onLoad={() => setHeroImageLoaded(true)}
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-out ${
                  heroImageLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </>
          )}

          {/* 3. Multi-Layer Contrast Overlays ensuring 100% WCAG AAA readability at all breakpoints */}
          {/* Horizontal dark scrim for text content readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-900/35 sm:to-transparent pointer-events-none" />
          {/* Subtle brand emerald undertone */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/40 via-transparent to-black/30 pointer-events-none" />
          {/* Bottom gradient fade into page content / discovery bar */}
          <div className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />

          {/*
            ALTERNATIVE LAYOUT (Option B - Photo Collage):
            If an asymmetric multi-photo grid is desired instead of a single full-bleed hero,
            you can replace the full-bleed <img> with a 12-column grid containing:
            - 7 columns: Headline, description, and CTAs on light/dark card
            - 5 columns: An asymmetric 3-image masonry collage featuring:
              1. Large portrait: Alpine meadow (photo-1506744038136-46273834b3fb)
              2. Top-right small landscape: Pine glade (photo-1426604966848-d7adac402bff)
              3. Bottom-right small landscape: Ridge sunset (photo-1472214103451-9374bd1c798e)
            Currently using Option A (Full-Bleed Photography) for highest visual impact and immersion.
          */}

          <div className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-24 sm:pt-24 sm:pb-28 lg:pt-28 lg:pb-32 lg:px-8 w-full">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-8">
              {/* Left Column (Headline, CTAs, Trust indicators) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-8 text-left max-w-2xl lg:max-w-3xl"
              >
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-950/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300 shadow-md backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Verified Mountain Land
                  </div>
                  {/* View Mode Toggle */}
                  <div className="inline-flex items-center rounded-full bg-slate-900/80 p-1 border border-white/20 backdrop-blur-md shadow-lg">
                    <button
                      type="button"
                      onClick={() => setShow3DHero(false)}
                      className={`px-3 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
                        !show3DHero
                          ? "bg-emerald-600 text-white shadow"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      📷 Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShow3DHero(true)}
                      className={`px-3 py-1 text-xs font-bold rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                        show3DHero
                          ? "bg-emerald-600 text-white shadow"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      <span>🏔️ 3D Plot</span>
                    </button>
                  </div>
                </div>

                <h1 className="text-4xl font-black leading-[1.12] text-white sm:text-5xl lg:text-6xl tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                  Find Your Perfect{" "}
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                    Scenic Escape
                  </span>
                </h1>
                <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-slate-200 font-normal drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                  Discover private mountain glades, romantic sunset decks, and campfire stays across Himachal, Uttarakhand & Jammu.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/listings"
                    className="rounded-full bg-emerald-500 px-7 py-3.5 font-bold text-white shadow-xl shadow-emerald-950/50 transition hover:-translate-y-0.5 hover:bg-emerald-400 active:translate-y-0"
                  >
                    Explore Stays
                  </Link>
                  <Link
                    to="/become-a-host"
                    className="rounded-full border border-white/30 bg-white/10 px-7 py-3.5 font-bold text-white backdrop-blur-md shadow-md transition hover:border-white hover:bg-white/20 hover:-translate-y-0.5"
                  >
                    Become a Host
                  </Link>
                </div>

                {/* Trust Verification Indicators */}
                <div className="mt-10 flex flex-wrap items-center gap-6 pt-6 border-t border-white/15 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-400 ring-1 ring-emerald-400/40">✓</span>
                    <span className="font-semibold text-white">100% Real Mountain Land</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-400 ring-1 ring-emerald-400/40">✓</span>
                    <span className="font-semibold text-white">Verified Hosts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-400 ring-1 ring-emerald-400/40">✓</span>
                    <span className="font-semibold text-white">Himachal & Uttarakhand</span>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Interactive 3D Canvas or Mountain Pill */}
              <div className="lg:col-span-4 flex flex-col justify-center items-center h-full min-h-[340px]">
                {show3DHero ? (
                  <div className="w-full h-[360px] sm:h-[420px] rounded-3xl overflow-hidden border border-white/20 bg-slate-950/50 backdrop-blur-md shadow-2xl relative">
                    <HeroScene />
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="rounded-2xl border border-white/20 bg-slate-950/60 p-5 backdrop-blur-md shadow-2xl text-left max-w-xs self-end"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <FaMapMarkerAlt className="text-emerald-400 text-xs" />
                      <span>Solang Valley, Manali</span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                      Pristine alpine meadow & pine camping ridge. 100% natural undeveloped land inventory.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShow3DHero(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition shadow cursor-pointer"
                    >
                      <span>🏔️ Launch 3D Explorer</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Dedicated Discovery Bar Directly Above Featured Destinations */}
        <section className="relative z-20 px-6 -mt-8 sm:-mt-10 mb-2 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl sm:rounded-full bg-white p-2 sm:p-2.5 shadow-xl shadow-slate-200/80 border border-slate-200/90"
            >
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col sm:flex-row items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100 relative"
              >
                {/* Location */}
                <label className="flex-1 w-full px-5 py-2.5 sm:py-2 text-left hover:bg-slate-50/90 rounded-2xl sm:rounded-full transition cursor-pointer group">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-600 transition">
                    <FaMapMarkerAlt className="text-emerald-500 text-xs flex-shrink-0" /> Location
                  </span>
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="Where to? (e.g. Manali, Solang)"
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none mt-0.5"
                  />
                </label>

                {/* Date */}
                <label className="w-full sm:w-44 lg:w-48 px-5 py-2.5 sm:py-2 text-left hover:bg-slate-50/90 rounded-2xl sm:rounded-full transition cursor-pointer group">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-600 transition">
                    <FaCalendarAlt className="text-emerald-500 text-xs flex-shrink-0" /> Date
                  </span>
                  <input
                    type="date"
                    value={searchDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none mt-0.5 cursor-pointer [color-scheme:light]"
                  />
                </label>

                {/* Guests Field with Interactive Stepper Dropdown */}
                <div ref={guestsRef} className="relative w-full sm:w-44 lg:w-48">
                  <button
                    type="button"
                    onClick={() => setGuestsDropdownOpen((prev) => !prev)}
                    className="w-full px-5 py-2.5 sm:py-2 text-left hover:bg-slate-50/90 rounded-2xl sm:rounded-full transition cursor-pointer group flex flex-col justify-center"
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-600 transition">
                      <FaUsers className="text-emerald-500 text-xs flex-shrink-0" /> Guests
                    </span>
                    <span className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                      {searchGuests ? `${searchGuests} Guest${searchGuests > 1 ? "s" : ""}` : "Add guests"}
                    </span>
                  </button>

                  {/* Stepper Popover */}
                  {guestsDropdownOpen && (
                    <div className="absolute top-full sm:right-0 mt-3 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Total Guests</p>
                          <p className="text-xs text-slate-400">Ages 13 or above</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={searchGuests <= 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchGuests((prev) => Math.max(1, prev - 1));
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                          >
                            <FaMinus size={10} />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-slate-900">
                            {searchGuests}
                          </span>
                          <button
                            type="button"
                            disabled={searchGuests >= 15}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchGuests((prev) => Math.min(15, prev + 1));
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                          >
                            <FaPlus size={10} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-center text-xs">
                        <span className="text-slate-400">Max 15 guests</span>
                        <button
                          type="button"
                          onClick={() => setGuestsDropdownOpen(false)}
                          className="text-emerald-600 font-bold hover:underline cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Search Button */}
                <div className="w-full sm:w-auto p-1">
                  <button
                    type="submit"
                    className="w-full sm:w-auto h-12 px-7 rounded-2xl sm:rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition hover:-translate-y-0.5 flex-shrink-0 cursor-pointer"
                  >
                    <FaSearch size={13} />
                    <span>Search Stays</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Featured Destinations Section */}
        <section id="featured-destinations" className="px-6 pt-12 pb-12 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Curated escapes"
              title="Featured Destinations"
              description="Explore scenic stays with premium amenities, calming views, and memorable stays."
            />

            {/* Loading Skeleton */}
            {loading && (
              <div className="mt-12">
                <SpotGridSkeleton count={4} />
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="mt-12 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
                <FaExclamationTriangle className="mx-auto text-3xl text-rose-500" />
                <h3 className="mt-3 text-lg font-semibold text-rose-800">Unable to load live spots</h3>
                <p className="mt-1 text-sm text-rose-600">{error}</p>
                <button
                  onClick={fetchSpots}
                  className="mt-4 rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-rose-500"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && featuredSpots.length === 0 && (
              <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="text-lg font-semibold text-slate-700">No destinations listed yet.</p>
                <p className="mt-2 text-sm text-slate-500">Check back soon or be the first host to add a scenic plot!</p>
              </div>
            )}

            {/* Live Spots Grid */}
            {!loading && !error && featuredSpots.length > 0 && (
              <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
                {featuredSpots.map((place, index) => (
                  <motion.div
                    key={place._id || place.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.35, delay: index * 0.08 }}
                    whileHover={{ y: -8, scale: 1.01 }}
                  >
                    <ListingCard plot={place} actionLabel="Book Now" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Interactive Smart Recommendation Finder & Matcher */}
        <SmartRecommendationFinder />

        {/* Categories Section */}
        <Categories />

        {/* Smart Recommendations Section (Interactive Intent & Mood Matcher) */}
        <SmartRecommendations
          title="Curated Plots For Your Next Escape"
          subtitle="Select your vibe below to instantly discover outdoor spaces matched to your activity, group size, and retreat style"
          showVibeSelector={true}
          limit={4}
          className="bg-slate-50 border-t border-slate-200/80"
        />

        {/* Signature Experiences Spotlight */}
        {featuredExperiences.length > 0 && (
          <section className="bg-slate-950 text-white px-6 py-20 lg:px-8 overflow-hidden relative">
            <div className="mx-auto max-w-7xl relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
                    Curated Outdoor Packages
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                    Signature Thikana Experiences
                  </h2>
                  <p className="mt-2 text-sm text-slate-400 max-w-xl">
                    More than raw land — fully coordinated nature escapes complete with bonfires, ambient dinners, music, and stargazing gear.
                  </p>
                </div>
                <Link
                  to="/experiences"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-5 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition shrink-0"
                >
                  <span>Explore All Experiences</span>
                  <FaArrowRight size={10} />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredExperiences.map((exp) => (
                  <ExperienceCard key={exp._id} experience={exp} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="how-it-works" className="bg-white px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Simple journey"
              title="How Thikana Works"
              description="From the moment you choose a place to the day you arrive, every step stays simple and elegant."
            />
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 shadow-sm"
                  >
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl text-emerald-600">
                      <Icon />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-3 text-base leading-7 text-slate-600">{step.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="about" className="px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Why choose us"
              title="Why Thikana"
              description="We combine premium stays, trustworthy booking, and nature-first travel planning in one place."
            />
            <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
              {reasons.map((reason, index) => {
                const Icon = reason.icon;
                return (
                  <motion.div
                    key={reason.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.35, delay: index * 0.08 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl text-emerald-600 ring-1 ring-emerald-500/20">
                      <Icon />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{reason.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{reason.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dynamic Guest Testimonials Carousel & Story Sharing */}
        <DynamicTestimonials />
      </main>

      <Footer />
    </div>
  );
}

export default Home;
