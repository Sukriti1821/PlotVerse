import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaCompass, FaMapMarkerAlt, FaStar, FaBolt } from "react-icons/fa";
import API from "../../services/api";
import { getImageUrl } from "../../utils/imageHelper";

const VIBE_PILLS = [
  { id: "all", label: "All Curated", icon: "🌿" },
  { id: "campfire", label: "Campfire Stays", icon: "🏕️" },
  { id: "date_night", label: "Date Night", icon: "🍷" },
  { id: "group", label: "Group Gathering", icon: "👥" },
  { id: "riverside", label: "Riverside Glade", icon: "🌊" },
  { id: "cafe", label: "Mountain Cafe", icon: "☕" },
];

export default function SmartRecommendations({
  spotId = null,
  title = "Curated Plots For Your Next Escape",
  subtitle = "Intelligently tailored outdoor spaces matching your vibe, group size, and retreat style",
  showVibeSelector = false,
  limit = 4,
  className = "",
}) {
  const [selectedVibe, setSelectedVibe] = useState("all");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const runFetch = async () => {
      try {
        const params = { limit };
        if (spotId) params.spotId = spotId;
        if (showVibeSelector && selectedVibe !== "all") {
          params.intent = selectedVibe;
        }

        const response = await API.get("/spots/recommendations", { params });
        if (!ignore) {
          const rawData = response.data;
          const spotList = rawData?.data || rawData?.spots || [];
          setRecommendations(spotList);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error("[SmartRecommendations] Failed to load recommendations:", err.message);
          setRecommendations([]);
          setLoading(false);
        }
      }
    };

    runFetch();

    return () => {
      ignore = true;
    };
  }, [spotId, selectedVibe, showVibeSelector, limit]);

  // If no recommendations and not loading, don't show empty box unless vibe filter is active
  if (!loading && recommendations.length === 0 && !showVibeSelector) {
    return null;
  }

  return (
    <section className={`py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">
              <FaCompass className="text-emerald-500" /> Smart Recommendations
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500 font-sans max-w-xl">
                {subtitle}
              </p>
            )}
          </div>

          <Link
            to="/listings"
            className="self-start md:self-auto text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 transition hover:translate-x-0.5"
          >
            Explore All Plots →
          </Link>
        </div>

        {/* Interactive Vibe Filter Pills */}
        {showVibeSelector && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
            {VIBE_PILLS.map((vibe) => {
              const isActive = selectedVibe === vibe.id;
              return (
                <button
                  key={vibe.id}
                  onClick={() => {
                    setLoading(true);
                    setSelectedVibe(vibe.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/30"
                  }`}
                >
                  <span>{vibe.icon}</span>
                  <span>{vibe.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Recommendations Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(limit)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-slate-200 bg-white p-4 animate-pulse shadow-sm h-80 flex flex-col justify-between"
                >
                  <div className="h-44 bg-slate-200 rounded-2xl w-full" />
                  <div className="space-y-2 mt-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-1/4 mt-3" />
                </div>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <span className="text-3xl mb-2 block">🏕️</span>
              <h3 className="text-base font-bold text-slate-800">
                No matching plots found for this vibe
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try selecting &ldquo;All Curated&rdquo; to browse all verified private outdoor escapes.
              </p>
              <button
                onClick={() => {
                  setLoading(true);
                  setSelectedVibe("all");
                }}
                className="mt-4 px-5 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition cursor-pointer"
              >
                Reset Vibe
              </button>
            </div>
          ) : (
            <motion.div
              key={selectedVibe}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {recommendations.map((plot) => {
                const imageUrl = getImageUrl(
                  plot.images?.[0] || plot.image,
                  plot.category || plot.title
                );
                const rawPrice = plot.price;
                const formattedPrice =
                  typeof rawPrice === "number"
                    ? `₹${rawPrice.toLocaleString()}/hr`
                    : rawPrice || "Price on Request";
                const rating = Number(plot.rating) || 4.8;
                const matchScore = plot.matchScore || 90;
                const matchReason = plot.matchReason || "Top Pick";

                return (
                  <Link
                    key={plot._id}
                    to={`/plot/${plot._id}`}
                    className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200"
                  >
                    {/* Image Area */}
                    <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
                      <img
                        src={imageUrl}
                        alt={plot.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Category Badge */}
                      <div className="absolute left-3 top-3 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                        {plot.category}
                      </div>

                      {/* Match Score Glowing Pill */}
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 text-white px-2.5 py-1 text-[11px] font-extrabold shadow-md shadow-emerald-500/30">
                        <FaBolt className="text-[10px]" />
                        <span>{matchScore}% Match</span>
                      </div>

                      {/* Contextual Match Reason Pill */}
                      <div className="absolute bottom-2.5 left-3 right-3">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/75 backdrop-blur-md px-3 py-1 text-[10px] font-semibold text-emerald-300 shadow-sm border border-emerald-500/20 truncate max-w-full">
                          <span className="truncate">{matchReason}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 sm:p-5 flex flex-col justify-between flex-grow">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="flex items-center gap-1 text-slate-600 font-medium truncate max-w-[70%]">
                            <FaMapMarkerAlt className="text-emerald-500 flex-shrink-0" />
                            <span className="truncate">{plot.location}</span>
                          </span>
                          <span className="flex items-center gap-1 font-bold text-slate-800">
                            <FaStar className="text-amber-400 text-xs" />
                            {rating.toFixed(1)}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 font-heading">
                          {plot.title}
                        </h3>

                        {plot.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-sans">
                            {plot.description}
                          </p>
                        )}
                      </div>

                      {/* Price & Action */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-base font-extrabold text-slate-900">
                            {formattedPrice}
                          </span>
                        </div>

                        <span className="inline-flex items-center text-xs font-bold text-emerald-600 group-hover:text-emerald-700 transition">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
