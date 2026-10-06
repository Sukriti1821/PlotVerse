import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaSearch,
  FaCompass,
  FaHeart,
  FaUsers,
  FaFire,
  FaFilter,
  FaPlus,
  FaArrowRight,
} from "react-icons/fa";
import API from "../services/api";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ExperienceCard from "../components/cards/ExperienceCard";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  { id: "all", label: "All Experiences", icon: FaCompass },
  { id: "Romantic Date", label: "Romantic Date", icon: FaHeart },
  { id: "Group Gathering", label: "Friends' Escape", icon: FaUsers },
  { id: "Stargazing Retreat", label: "Stargazing Retreat", icon: FaCompass },
  { id: "Sunset Campfire", label: "Sunset Campfire", icon: FaFire },
];

const Experiences = () => {
  const { user } = useAuth();
  const isOwner = user && (user.role === "owner" || user.role === "admin");

  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [maxDuration, setMaxDuration] = useState("");
  const [sortBy, setSortBy] = useState("recommended");

  useEffect(() => {
    let ignore = false;
    const fetchExperiences = async () => {
      try {
        setLoading(true);
        const params = {};
        if (selectedCategory !== "all") params.category = selectedCategory;
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (maxDuration) params.duration = maxDuration;
        if (sortBy) params.sort = sortBy;

        const res = await API.get("/experiences", { params });
        if (!ignore) {
          setExperiences(res.data?.data || []);
        }
      } catch (err) {
        console.error("Error loading experiences:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchExperiences();
    return () => {
      ignore = true;
    };
  }, [selectedCategory, searchQuery, maxDuration, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero Section */}
        <section className="relative isolate overflow-hidden bg-slate-950 text-white py-16 sm:py-24">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1920&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400 backdrop-blur-md mb-4">
                ✨ Thikana Experiences
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                Don’t Just Book Land. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  Book an Unforgettable Experience.
                </span>
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
                Handcrafted packages bundled with romantic dinners, stargazing telescopes, bonfire setups, and private valley lounges. Choose your experience, customize add-ons, and escape.
              </p>

              {isOwner && (
                <div className="mt-6 flex justify-center">
                  <Link
                    to="/owner/experiences"
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition"
                  >
                    <FaPlus size={10} /> Host Experience Console
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Filter & Discovery Controls Bar */}
        <section className="sticky top-[72px] z-30 border-y border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
          <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                        isSelected
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Icon className={isSelected ? "text-emerald-400" : "text-slate-400"} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search, Duration & Sort Inputs */}
              <div className="flex items-center gap-3">
                {/* Keyword Search */}
                <div className="relative flex-1 md:w-56">
                  <FaSearch className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Search experiences..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border border-slate-200 pl-9 pr-3 py-1.5 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white"
                  />
                </div>

                {/* Duration Filter */}
                <select
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(e.target.value)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="">Any Duration</option>
                  <option value="4">Up to 4 Hours</option>
                  <option value="6">Up to 6 Hours</option>
                  <option value="8">Up to 8 Hours</option>
                </select>

                {/* Sort Order */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="recommended">Recommended</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                  <option value="durationAsc">Duration: Short to Long</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Experience Cards Grid */}
        <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {selectedCategory === "all" ? "All Experience Packages" : selectedCategory}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {loading
                  ? "Loading curated packages..."
                  : `Showing ${experiences.length} experience${experiences.length === 1 ? "" : "s"} ready for booking`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-80 rounded-3xl bg-slate-200 animate-pulse"
                />
              ))}
            </div>
          ) : experiences.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center my-8">
              <FaFilter size={32} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Experiences Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No experience packages matched your selected category or filters. Try adjusting your search keywords or duration.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                  setMaxDuration("");
                }}
                className="mt-4 rounded-full bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {experiences.map((exp) => (
                <ExperienceCard key={exp._id} experience={exp} />
              ))}
            </div>
          )}

          {/* Host an Experience Callout */}
          <div className="mt-20 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-8 sm:p-12 relative overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
                For Plot Owners & Hosts
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Own Scenic Land? Turn It Into a Curated Experience.
              </h3>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Bundle your property with bonfires, music setups, dinner tables, and BBQ equipment. Guests love ready-made outdoor retreats, and packages typically earn 40% higher revenue per reservation.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  to={isOwner ? "/owner/experiences" : "/become-a-host"}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-400 transition"
                >
                  {isOwner ? "Create an Experience" : "Become a Host"}
                  <FaArrowRight size={11} />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Experiences;
