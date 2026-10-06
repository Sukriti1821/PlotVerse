import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaCompass,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaDollarSign,
  FaSearch,
  FaStar,
  FaCheck,
  FaBolt,
} from "react-icons/fa";
import API from "../../services/api";
import { getImageUrl } from "../../utils/imageHelper";

const CATEGORIES = [
  "All Types",
  "Grassland Plot",
  "Date Night Setup",
  "Campfire Stays",
  "Mountain Cafe",
  "Riverside Meadow",
  "Get Together Setup",
  "Hillside Hut",
];

const POPULAR_AMENITIES = [
  "Bonfire Setup",
  "Alpine Tent",
  "WiFi Access",
  "Stargazing Telescope",
  "Barbecue Grill",
  "Picnic Rugs",
];

const QUICK_PRESETS = [
  {
    label: "🔥 Mountain Campfire for 6 (under ₹3,500)",
    location: "mountain",
    guests: 6,
    duration: 4,
    budget: 3500,
    amenities: "bonfire",
    category: "Campfire Stays",
  },
  {
    label: "🍷 Romantic Sunset Date Night",
    location: "ridge",
    guests: 2,
    duration: 3,
    budget: 4500,
    amenities: "bonfire",
    category: "Date Night Setup",
  },
  {
    label: "👥 Group Gathering for 8 Friends",
    location: "meadow",
    guests: 8,
    duration: 5,
    budget: 7000,
    amenities: "music, seating",
    category: "Get Together Setup",
  },
  {
    label: "☕ Mountain Cafe & Workation",
    location: "terrace",
    guests: 2,
    duration: 4,
    budget: 2500,
    amenities: "wifi",
    category: "Mountain Cafe",
  },
];

export default function SmartRecommendationFinder() {
  // Form criteria state
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [duration, setDuration] = useState(4);
  const [guests, setGuests] = useState(6);
  const [budget, setBudget] = useState("");
  const [category, setCategory] = useState("All Types");
  const [selectedAmenities, setSelectedAmenities] = useState(["Bonfire Setup"]);

  // Results state
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [appliedCriteria, setAppliedCriteria] = useState(null);

  const toggleAmenity = (name) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const applyPreset = (preset) => {
    if (preset.location !== undefined) setLocation(preset.location);
    if (preset.guests !== undefined) setGuests(preset.guests);
    if (preset.duration !== undefined) setDuration(preset.duration);
    if (preset.budget !== undefined) setBudget(preset.budget.toString());
    if (preset.category !== undefined) setCategory(preset.category);
    if (preset.amenities) {
      setSelectedAmenities(preset.amenities.split(",").map((s) => s.trim()));
    }
  };

  const executeRecommendationQuery = useCallback(async () => {
    try {
      const params = {
        duration,
        limit: 6,
      };

      if (location.trim()) params.location = location.trim();
      if (date) params.date = date;
      if (startTime) params.startTime = startTime;
      if (guests) params.guests = guests;
      if (budget) params.budget = budget;
      if (category && category !== "All Types") params.category = category;
      if (selectedAmenities.length > 0) {
        params.amenities = selectedAmenities.join(",");
      }

      const res = await API.get("/spots/recommendations", { params });
      const list = res.data?.data || res.data?.spots || [];
      setResults(list);
      setAppliedCriteria({
        location,
        guests,
        duration,
        budget,
        category,
        amenities: selectedAmenities,
      });
    } catch (err) {
      console.error("[SmartRecommendationFinder] Error:", err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [location, date, startTime, duration, guests, budget, category, selectedAmenities]);

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setSearched(true);
    executeRecommendationQuery();
  };

  // Initial fetch on mount
  useEffect(() => {
    let ignore = false;
    const initialRun = async () => {
      try {
        const res = await API.get("/spots/recommendations", {
          params: { duration: 4, limit: 6 },
        });
        if (!ignore) {
          const list = res.data?.data || res.data?.spots || [];
          setResults(list);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error("[SmartRecommendationFinder] Initial load error:", err.message);
          setLoading(false);
        }
      }
    };

    initialRun();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section id="smart-recommender" className="py-16 bg-slate-900 text-white relative isolate overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15)_0%,_transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12)_0%,_transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-950/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300 shadow-md backdrop-blur-md mb-4">
            <FaCompass className="text-emerald-400" /> Smart Recommendation System
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading">
            Find Your Ideal Private Outdoor Space
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base font-sans">
            Tell our intelligent rule engine your party size, duration, budget, and must-have amenities — we&apos;ll match you with verified, available plots in seconds.
          </p>

          {/* Quick Preset Prompts */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-1 uppercase tracking-wider">
              Try a preset:
            </span>
            {QUICK_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-emerald-600 hover:text-white border border-slate-700 hover:border-emerald-500 text-slate-300 transition-all cursor-pointer shadow-xs"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Customizer Panel */}
        <form
          onSubmit={handleSearch}
          className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl mb-12"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Location */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-emerald-400" /> Location / Region
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mountain, Manali, Solang"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {/* 2. Date & Time */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FaCalendarAlt className="text-emerald-400" /> Date & Start Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer [color-scheme:dark]"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer [color-scheme:dark]"
                />
              </div>
            </div>

            {/* 3. Duration & Guests */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FaClock className="text-emerald-400" /> Hours & Guests
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5">
                  <span className="text-xs text-slate-400 mr-2 flex-shrink-0">Hrs:</span>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                  >
                    {[2, 3, 4, 5, 6, 8, 12].map((h) => (
                      <option key={h} value={h} className="bg-slate-900 text-white">
                        {h} hours
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5">
                  <FaUsers className="text-slate-400 text-xs mr-2 flex-shrink-0" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                  >
                    {[1, 2, 4, 6, 8, 10, 15].map((g) => (
                      <option key={g} value={g} className="bg-slate-900 text-white">
                        {g} {g === 1 ? "Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Total Budget */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FaDollarSign className="text-emerald-400" /> Max Budget (₹ Total)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 3000, 5000 (Any)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Secondary Row: Experience Type & Amenities */}
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Experience Type Dropdown */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Experience Type
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Amenity Pills */}
            <div className="lg:col-span-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Must-Have Outdoor Features
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {POPULAR_AMENITIES.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-500 font-bold shadow-xs"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {isSelected ? <FaCheck className="text-[10px]" /> : null}
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Find Matches Button */}
            <div className="lg:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                <FaSearch />
                <span>{loading ? "Matching..." : "Find Matches"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Results Showcase */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading">
                {searched ? "Best Matches for You" : "Recommended for you"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {appliedCriteria
                  ? `Ranked for ${appliedCriteria.guests || 6} guests • ${appliedCriteria.duration || 4} hours ${
                      appliedCriteria.budget ? `• under ₹${Number(appliedCriteria.budget).toLocaleString()}` : ""
                    }`
                  : "Transparent rule-based matching considering capacity, budget, amenities, and availability"}
              </p>
            </div>

            {results.length > 0 && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full">
                {results.length} Matches Found
              </span>
            )}
          </div>

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-slate-800 bg-slate-950 p-4 animate-pulse h-96 flex flex-col justify-between"
                >
                  <div className="h-48 bg-slate-800 rounded-2xl w-full" />
                  <div className="space-y-3 mt-4">
                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                    <div className="h-3 bg-slate-800/40 rounded w-2/3" />
                  </div>
                  <div className="h-8 bg-slate-800/60 rounded-xl mt-4" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && (
            <div className="text-center py-16 bg-slate-950/60 rounded-3xl border border-slate-800 p-8">
              <span className="text-4xl block mb-3">🏔️</span>
              <h4 className="text-lg font-bold text-white">No exact matching plots found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No active plots match all of these strict criteria simultaneously. Try relaxing your budget, reducing duration, or clearing specific amenities.
              </p>
              <button
                type="button"
                onClick={() => {
                  setBudget("");
                  setLocation("");
                  setSelectedAmenities([]);
                  setCategory("All Types");
                }}
                className="mt-5 px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Reset Filters & Show Popular
              </button>
            </div>
          )}

          {/* Recommendations Cards Grid */}
          {!loading && results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((spot, index) => {
                const imageUrl = getImageUrl(spot.images?.[0] || spot.image, spot.category || spot.title);
                const hourlyPrice = spot.price || 1000;
                const totalForDuration = spot.estimatedTotal || hourlyPrice * duration;
                const rating = Number(spot.rating) || 4.8;
                const isBestMatch = index === 0;

                return (
                  <div
                    key={spot._id}
                    className={`flex flex-col justify-between overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 bg-slate-950 shadow-xl ${
                      isBestMatch ? "border-emerald-500/60 ring-1 ring-emerald-500/30" : "border-slate-800 hover:border-emerald-500/30"
                    }`}
                  >
                    {/* Top Image Banner */}
                    <div className="relative h-52 overflow-hidden bg-slate-900">
                      <img
                        src={imageUrl}
                        alt={spot.title}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />

                      {/* Best Match Badge */}
                      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-3 py-1 text-xs font-extrabold shadow-md">
                        {isBestMatch ? <FaBolt className="text-xs text-amber-300" /> : <FaCheck className="text-xs" />}
                        <span>{isBestMatch ? "Best match" : "Recommended for you"}</span>
                      </div>

                      {/* Category */}
                      <div className="absolute right-3 top-3 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white border border-slate-700">
                        {spot.category}
                      </div>

                      {/* Highlights Pill Array */}
                      {spot.highlights && spot.highlights.length > 0 && (
                        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
                          {spot.highlights.map((h, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30"
                            >
                              ✓ {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex flex-col justify-between flex-grow">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                          <span className="flex items-center gap-1 truncate max-w-[70%] text-slate-300">
                            <FaMapMarkerAlt className="text-emerald-400 flex-shrink-0" />
                            <span className="truncate">{spot.location}</span>
                          </span>
                          <span className="flex items-center gap-1 font-bold text-white">
                            <FaStar className="text-amber-400 text-xs" />
                            {rating.toFixed(1)}
                          </span>
                        </div>

                        <h4 className="text-lg font-bold text-white font-heading line-clamp-1 hover:text-emerald-400 transition">
                          {spot.title}
                        </h4>

                        {/* Primary Match Reason */}
                        <div className="mt-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 p-2.5 text-xs text-emerald-300 flex items-start gap-2">
                          <FaCompass className="text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span className="leading-snug">{spot.matchReason}</span>
                        </div>
                      </div>

                      {/* Pricing & Booking CTA */}
                      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-400 font-medium">
                            ₹{hourlyPrice.toLocaleString()}/hr
                          </div>
                          <div className="text-base font-extrabold text-white">
                            ₹{totalForDuration.toLocaleString()}{" "}
                            <span className="text-[11px] font-normal text-slate-400">
                              ({duration} hrs)
                            </span>
                          </div>
                        </div>

                        <Link
                          to={`/plot/${spot._id}`}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition shadow-md hover:shadow-emerald-500/25 flex items-center gap-1.5"
                        >
                          <span>View Plot</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
