import { useState, useEffect } from "react";
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
    setLocation(preset.location);
    setGuests(preset.guests);
    setDuration(preset.duration);
    setBudget(preset.budget);
    setCategory(preset.category);
    if (preset.amenities.includes("bonfire")) {
      setSelectedAmenities(["Bonfire Setup"]);
    } else if (preset.amenities.includes("wifi")) {
      setSelectedAmenities(["WiFi Access"]);
    } else {
      setSelectedAmenities([]);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const params = {
        limit: 6,
        guests,
        duration,
      };

      if (location.trim()) params.location = location.trim();
      if (date) params.date = date;
      if (startTime) params.startTime = startTime;
      if (budget && Number(budget) > 0) params.budget = Number(budget);
      if (category && category !== "All Types") params.category = category;
      if (selectedAmenities.length > 0) params.amenities = selectedAmenities.join(",");

      const response = await API.get("/spots/recommendations", { params });
      const rawData = response.data;
      const spotList = rawData?.data || rawData?.spots || [];

      setResults(spotList);
      setAppliedCriteria({ location, guests, duration, budget, category });
    } catch (err) {
      console.error("[SmartRecommendationFinder] Search failed:", err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const initialRun = async () => {
      try {
        const response = await API.get("/spots/recommendations", {
          params: { limit: 3, guests: 6, duration: 4 },
        });
        if (!ignore) {
          const rawData = response.data;
          setResults(rawData?.data || rawData?.spots || []);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.warn("[SmartRecommendationFinder] Initial recommendations fetch:", err.message);
          setResults([]);
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
    <section id="smart-recommender" className="py-16 bg-navy text-snow relative isolate overflow-hidden border-t border-white/10">
      {/* Background ambient lighting in dusk tones */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-deep via-navy to-dusk opacity-90 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-dusk px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-snow shadow-md backdrop-blur-md mb-4">
            <FaCompass className="text-saffron" /> Smart Recommendation System
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading text-snow">
            Find Your Ideal Private Outdoor Space
          </h2>
          <p className="mt-3 text-light-slate text-sm sm:text-base font-sans">
            Tell our intelligent rule engine your party size, duration, budget, and must-have amenities — we&apos;ll match you with verified, available plots in seconds.
          </p>

          {/* Quick Preset Prompts */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-bold text-light-slate/70 mr-1 uppercase tracking-wider">
              Try a preset:
            </span>
            {QUICK_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-dusk hover:bg-saffron hover:text-navy border border-white/10 text-snow transition-all cursor-pointer shadow-xs"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Customizer Panel */}
        <form
          onSubmit={handleSearch}
          className="bg-dusk/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl mb-12"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Location */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-light-slate mb-1.5 flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-saffron" /> Location / Region
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mountain, Manali, Solang"
                className="w-full bg-navy border border-white/10 rounded-xl px-4 py-2.5 text-sm text-snow placeholder:text-light-slate/50 focus:border-saffron focus:ring-1 focus:ring-saffron outline-none transition"
              />
            </div>

            {/* 2. Date & Time */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-light-slate mb-1.5 flex items-center gap-1.5">
                <FaCalendarAlt className="text-saffron" /> Date & Start Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-navy border border-white/10 rounded-xl px-3 py-2.5 text-xs text-snow outline-none focus:border-saffron cursor-pointer"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-navy border border-white/10 rounded-xl px-3 py-2.5 text-xs text-snow outline-none focus:border-saffron cursor-pointer"
                />
              </div>
            </div>

            {/* 3. Duration & Guests */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-light-slate mb-1.5 flex items-center gap-1.5">
                <FaClock className="text-saffron" /> Hours & Guests
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-navy border border-white/10 rounded-xl px-3 py-2.5">
                  <span className="text-xs text-light-slate mr-2 flex-shrink-0">Hrs:</span>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-transparent text-xs font-bold text-snow outline-none cursor-pointer"
                  >
                    {[2, 3, 4, 5, 6, 8, 12].map((h) => (
                      <option key={h} value={h} className="bg-navy text-snow">
                        {h} hours
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center bg-navy border border-white/10 rounded-xl px-3 py-2.5">
                  <FaUsers className="text-light-slate text-xs mr-2 flex-shrink-0" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full bg-transparent text-xs font-bold text-snow outline-none cursor-pointer"
                  >
                    {[1, 2, 4, 6, 8, 10, 15].map((g) => (
                      <option key={g} value={g} className="bg-navy text-snow">
                        {g} {g === 1 ? "Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Total Budget */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-light-slate mb-1.5 flex items-center gap-1.5">
                <FaDollarSign className="text-saffron" /> Max Budget (₹ Total)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 3000, 5000 (Any)"
                className="w-full bg-navy border border-white/10 rounded-xl px-4 py-2.5 text-sm text-snow placeholder:text-light-slate/50 focus:border-saffron focus:ring-1 focus:ring-saffron outline-none transition"
              />
            </div>
          </div>

          {/* Secondary Row: Experience Type & Amenities */}
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Experience Type Dropdown */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-light-slate mb-1.5">
                Experience Type
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-navy border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-snow outline-none focus:border-saffron cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-navy text-snow">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Amenity Pills */}
            <div className="lg:col-span-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-light-slate mb-1.5">
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
                          ? "bg-saffron text-navy border-saffron font-bold shadow-xs"
                          : "bg-navy text-snow border-white/10 hover:border-white/30"
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
            <div className="lg:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-saffron hover:bg-saffron-hover text-navy font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
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
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading text-snow">
                {searched ? "Best Matches for You" : "Recommended for you"}
              </h3>
              <p className="text-xs text-light-slate mt-0.5">
                {appliedCriteria
                  ? `Ranked for ${appliedCriteria.guests || 6} guests • ${appliedCriteria.duration || 4} hours ${
                      appliedCriteria.budget ? `• under ₹${Number(appliedCriteria.budget).toLocaleString()}` : ""
                    }`
                  : "Transparent rule-based matching considering capacity, budget, amenities, and availability"}
              </p>
            </div>

            {results.length > 0 && (
              <span className="text-xs font-bold text-saffron bg-dusk border border-white/10 px-3 py-1 rounded-full">
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
                  className="rounded-3xl border border-white/10 bg-dusk p-4 animate-pulse h-96 flex flex-col justify-between"
                >
                  <div className="h-48 bg-navy rounded-2xl w-full" />
                  <div className="space-y-3 mt-4">
                    <div className="h-4 bg-navy rounded w-3/4" />
                    <div className="h-3 bg-navy/60 rounded w-1/2" />
                    <div className="h-3 bg-navy/40 rounded w-2/3" />
                  </div>
                  <div className="h-8 bg-navy/60 rounded-xl mt-4" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && (
            <div className="text-center py-16 bg-dusk/60 rounded-3xl border border-white/10 p-8">
              <span className="text-4xl block mb-3">🏔️</span>
              <h4 className="text-lg font-bold text-snow">No exact matching plots found</h4>
              <p className="text-xs text-light-slate mt-1 max-w-md mx-auto">
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
                className="mt-5 px-6 py-2.5 rounded-full bg-saffron hover:bg-saffron-hover text-navy font-bold text-xs transition cursor-pointer"
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
                    className={`flex flex-col justify-between overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 bg-dusk shadow-xl ${
                      isBestMatch ? "border-saffron/60 ring-1 ring-saffron/30" : "border-white/10 hover:border-saffron/30"
                    }`}
                  >
                    {/* Top Image Banner */}
                    <div className="relative h-52 overflow-hidden bg-navy">
                      <img
                        src={imageUrl}
                        alt={spot.title}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />

                      {/* Best Match Badge */}
                      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-saffron text-navy px-3 py-1 text-xs font-extrabold shadow-md">
                        {isBestMatch ? <FaBolt className="text-xs" /> : <FaCheck className="text-xs" />}
                        <span>{isBestMatch ? "Best match" : "Recommended for you"}</span>
                      </div>

                      {/* Category */}
                      <div className="absolute right-3 top-3 rounded-full bg-navy-deep/80 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-snow border border-white/10">
                        {spot.category}
                      </div>

                      {/* Highlights Pill Array */}
                      {spot.highlights && spot.highlights.length > 0 && (
                        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
                          {spot.highlights.map((h, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-navy-deep/80 backdrop-blur-md text-snow border border-white/10"
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
                        <div className="flex items-center justify-between text-xs text-light-slate mb-1.5">
                          <span className="flex items-center gap-1 truncate max-w-[70%] text-light-slate">
                            <FaMapMarkerAlt className="text-saffron flex-shrink-0" />
                            <span className="truncate">{spot.location}</span>
                          </span>
                          <span className="flex items-center gap-1 font-bold text-snow">
                            <FaStar className="text-saffron text-xs" />
                            {rating.toFixed(1)}
                          </span>
                        </div>

                        <h4 className="text-lg font-bold text-snow font-heading line-clamp-1 hover:text-saffron transition">
                          {spot.title}
                        </h4>

                        {/* Primary Match Reason */}
                        <div className="mt-2 rounded-xl bg-navy border border-white/10 p-2.5 text-xs text-light-slate flex items-start gap-2">
                          <FaCompass className="text-saffron mt-0.5 flex-shrink-0" />
                          <span className="leading-snug">{spot.matchReason}</span>
                        </div>
                      </div>

                      {/* Pricing & Booking CTA */}
                      <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-light-slate font-medium">
                            ₹{hourlyPrice.toLocaleString()}/hr
                          </div>
                          <div className="text-base font-extrabold text-snow">
                            ₹{totalForDuration.toLocaleString()}{" "}
                            <span className="text-[11px] font-normal text-light-slate">
                              ({duration} hrs)
                            </span>
                          </div>
                        </div>

                        <Link
                          to={`/plot/${spot._id}`}
                          className="px-5 py-2.5 rounded-xl border border-white/30 text-snow hover:bg-white/10 hover:border-white font-bold text-xs transition shadow-md flex items-center gap-1.5"
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
