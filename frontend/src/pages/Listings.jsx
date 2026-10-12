import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaFilter,
  FaCalendarAlt,
  FaClock,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaSlidersH,
  FaRedo,
  FaCheck,
  FaTree,
  FaTag,
  FaExclamationTriangle,
  FaUsers,
  FaThLarge,
  FaMapMarkedAlt,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ListingCard from "../components/cards/ListingCard";
import SmartRecommendations from "../components/recommendations/SmartRecommendations";
import { SpotGridSkeleton } from "../components/common/SkeletonLoader";
import API from "../services/api";
import { FALLBACK_SPOTS, filterFallbackSpots } from "../data/fallbackData";
import MountainMap from "../components/map/MountainMap";

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "Grassland Plot", label: "Grassland Plot" },
  { id: "Date Night Setup", label: "Date Night Setup" },
  { id: "Hillside Hut", label: "Hillside Hut" },
  { id: "Get Together Setup", label: "Get Together Setup" },
  { id: "Mountain Cafe", label: "Mountain Cafe" },
  { id: "Riverside Meadow", label: "Riverside Meadow" },
  { id: "Empty Plot", label: "Empty Plot" },
  { id: "Campfire Stays", label: "Campfire Stays" },
];

const DEFAULT_AMENITIES = [
  "Bonfire Setup & Firewood",
  "Alpine Waterproof Tent",
  "Solar Lanterns & Power",
  "WiFi Access",
  "Barbecue Grill & Coal",
  "Stargazing Telescope",
  "Riverside Access",
  "Guided Nature Trail",
];

const TIME_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00",
];

const Listings = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query values
  const urlLocation = searchParams.get("location") || "";
  const urlMinPrice = searchParams.get("minPrice") || "";
  const urlMaxPrice = searchParams.get("maxPrice") || "";
  const urlCategory = searchParams.get("category") || "all";
  const rawAmenities = searchParams.get("amenities") || "";
  const urlAmenities = useMemo(() => {
    return rawAmenities
      ? rawAmenities.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  }, [rawAmenities]);
  const urlDate = searchParams.get("date") || "";
  const urlStartTime = searchParams.get("startTime") || "";
  const urlEndTime = searchParams.get("endTime") || "";
  const urlGuests = searchParams.get("guests") || "";
  const urlSort = searchParams.get("sort") || "newest";
  const urlPage = parseInt(searchParams.get("page"), 10) || 1;

  // Local inputs state for debouncing
  const [locationInput, setLocationInput] = useState(urlLocation);
  const [minPriceInput, setMinPriceInput] = useState(urlMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(urlMaxPrice);

  // Filter drawer toggle (mobile & expand)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Available amenities list fetched from backend
  const [availableAmenities, setAvailableAmenities] = useState(DEFAULT_AMENITIES);

  // Spots data and pagination state
  const [spots, setSpots] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "map"

  // Synchronize local input state when URL changes externally (e.g. back/forward navigation)
  const [prevUrlParams, setPrevUrlParams] = useState({ urlLocation, urlMinPrice, urlMaxPrice, urlPage });
  if (
    prevUrlParams.urlLocation !== urlLocation ||
    prevUrlParams.urlMinPrice !== urlMinPrice ||
    prevUrlParams.urlMaxPrice !== urlMaxPrice ||
    prevUrlParams.urlPage !== urlPage
  ) {
    setPrevUrlParams({ urlLocation, urlMinPrice, urlMaxPrice, urlPage });
    setLocationInput(urlLocation);
    setMinPriceInput(urlMinPrice);
    setMaxPriceInput(urlMaxPrice);
    setCurrentPage(urlPage);
  }

  // Fetch available amenities from backend
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const res = await API.get("/spots/amenities");
        const list = res.data?.data || res.data;
        if (Array.isArray(list) && list.length > 0) {
          // Merge with defaults to ensure rich selection
          const merged = Array.from(new Set([...list, ...DEFAULT_AMENITIES]));
          setAvailableAmenities(merged);
        }
      } catch (err) {
        console.warn("Using default amenities list:", err.message);
      }
    };
    fetchAmenities();
  }, []);

  // Update URL search parameters
  const updateUrlParams = useCallback(
    (updates, resetPage = true) => {
      const current = Object.fromEntries(searchParams.entries());
      const merged = { ...current, ...updates };

      if (resetPage) {
        merged.page = "1";
      }

      // Clean empty keys
      Object.keys(merged).forEach((key) => {
        if (!merged[key] || merged[key] === "all" || (Array.isArray(merged[key]) && merged[key].length === 0)) {
          delete merged[key];
        }
      });

      setSearchParams(merged, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Debounce text inputs (location, minPrice, maxPrice) -> sync to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const updates = {};
      let changed = false;

      if (locationInput !== urlLocation) {
        updates.location = locationInput.trim();
        changed = true;
      }
      if (minPriceInput !== urlMinPrice) {
        updates.minPrice = minPriceInput;
        changed = true;
      }
      if (maxPriceInput !== urlMaxPrice) {
        updates.maxPrice = maxPriceInput;
        changed = true;
      }

      if (changed) {
        updateUrlParams(updates, true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [locationInput, minPriceInput, maxPriceInput, urlLocation, urlMinPrice, urlMaxPrice, updateUrlParams]);

  // Fetch spots from backend whenever URL search params change
  useEffect(() => {
    let cancelled = false;

    const fetchSpots = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams(searchParams);
        if (!params.get("page")) params.set("page", "1");
        if (!params.get("limit")) params.set("limit", "9");

        const response = await API.get(`/spots?${params.toString()}`);
        if (cancelled) return;
        const responseData = response.data;

        const spotList = Array.isArray(responseData)
          ? responseData
          : responseData.data || responseData.spots || [];

        // If backend returned spots, use live DB spots
        if (spotList.length > 0) {
          setSpots(spotList);
          setTotalCount(responseData.totalCount !== undefined ? responseData.totalCount : spotList.length);
          setTotalPages(responseData.totalPages || Math.ceil(spotList.length / 9) || 1);
          setCurrentPage(responseData.currentPage || parseInt(params.get("page"), 10) || 1);
          return;
        }

        // Check if user specifically applied filters that yielded 0 live results
        const hasFilters = Boolean(
          urlLocation ||
            urlMinPrice ||
            urlMaxPrice ||
            (urlCategory && urlCategory !== "all") ||
            urlAmenities.length > 0 ||
            urlGuests
        );

        if (!hasFilters) {
          // Empty DB on default view: populate fallback inventory seamlessly
          setSpots(FALLBACK_SPOTS.slice(0, 9));
          setTotalCount(FALLBACK_SPOTS.length);
          setTotalPages(Math.ceil(FALLBACK_SPOTS.length / 9));
          setCurrentPage(1);
        } else {
          // Check fallback inventory against user's filters
          const filteredFallbacks = filterFallbackSpots(FALLBACK_SPOTS, {
            category: urlCategory,
            location: urlLocation,
            minPrice: urlMinPrice,
            maxPrice: urlMaxPrice,
            amenities: urlAmenities,
            guests: urlGuests,
            sort: urlSort,
          });

          if (filteredFallbacks.length > 0) {
            setSpots(filteredFallbacks.slice(0, 9));
            setTotalCount(filteredFallbacks.length);
            setTotalPages(Math.ceil(filteredFallbacks.length / 9));
          } else {
            setSpots([]);
            setTotalCount(0);
            setTotalPages(1);
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.warn("Backend error on /spots, using resilient fallback:", err.message);

        // Auto-retry once after 1s if Render backend is waking up from sleep
        if (retryCount < 1) {
          setTimeout(() => {
            if (!cancelled) fetchSpots(retryCount + 1);
          }, 1000);
          return;
        }

        // Resilient fallback: calculate matches so the user never sees a broken red error box
        const filteredFallbacks = filterFallbackSpots(FALLBACK_SPOTS, {
          category: urlCategory,
          location: urlLocation,
          minPrice: urlMinPrice,
          maxPrice: urlMaxPrice,
          amenities: urlAmenities,
          guests: urlGuests,
          sort: urlSort,
        });

        setSpots(filteredFallbacks.slice(0, 9));
        setTotalCount(filteredFallbacks.length);
        setTotalPages(Math.max(1, Math.ceil(filteredFallbacks.length / 9)));
        setCurrentPage(1);
        setError(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSpots();

    return () => {
      cancelled = true;
    };
  }, [searchParams, urlCategory, urlLocation, urlMinPrice, urlMaxPrice, urlAmenities, urlGuests, urlSort]);

  // Handlers for specific filter changes
  const handleCategoryChange = (catId) => {
    updateUrlParams({ category: catId }, true);
  };

  const handleSortChange = (e) => {
    updateUrlParams({ sort: e.target.value }, false);
  };

  const handleToggleAmenity = (amenityName) => {
    let updated;
    if (urlAmenities.includes(amenityName)) {
      updated = urlAmenities.filter((a) => a !== amenityName);
    } else {
      updated = [...urlAmenities, amenityName];
    }
    updateUrlParams({ amenities: updated.join(",") }, true);
  };

  const handleDateChange = (e) => {
    updateUrlParams({ date: e.target.value }, true);
  };

  const handleStartTimeChange = (e) => {
    updateUrlParams({ startTime: e.target.value }, true);
  };

  const handleEndTimeChange = (e) => {
    updateUrlParams({ endTime: e.target.value }, true);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    updateUrlParams({ page: newPage.toString() }, false);
    window.scrollTo({ top: 320, behavior: "smooth" });
  };

  // Clear single filters
  const handleClearFilter = (filterKey) => {
    if (filterKey === "location") setLocationInput("");
    if (filterKey === "minPrice") setMinPriceInput("");
    if (filterKey === "maxPrice") setMaxPriceInput("");
    updateUrlParams({ [filterKey]: "" }, true);
  };

  const handleClearAmenity = (name) => {
    const updated = urlAmenities.filter((a) => a !== name);
    updateUrlParams({ amenities: updated.join(",") }, true);
  };

  const handleClearDateTime = () => {
    updateUrlParams({ date: "", startTime: "", endTime: "" }, true);
  };

  // Reset ALL filters
  const handleResetAll = () => {
    setLocationInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    setSearchParams({}, { replace: true });
  };

  // Determine if any filters are currently active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      urlLocation ||
      urlMinPrice ||
      urlMaxPrice ||
      (urlCategory && urlCategory !== "all") ||
      rawAmenities ||
      urlDate ||
      urlStartTime ||
      urlEndTime ||
      urlGuests
    );
  }, [urlLocation, urlMinPrice, urlMaxPrice, urlCategory, rawAmenities, urlDate, urlStartTime, urlEndTime, urlGuests]);

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (urlLocation) count++;
    if (urlMinPrice || urlMaxPrice) count++;
    if (urlCategory && urlCategory !== "all") count++;
    if (urlAmenities.length > 0) count += urlAmenities.length;
    if (urlDate) count++;
    if (urlGuests) count++;
    return count;
  }, [urlLocation, urlMinPrice, urlMaxPrice, urlCategory, urlAmenities, urlDate, urlGuests]);

  return (
    <div className="min-h-screen bg-snow text-navy flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero Banner & Search Bar */}
        <section className="bg-navy text-snow pt-12 pb-16 px-6 lg:px-8 border-b border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-saffron/30 bg-saffron/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-saffron mb-4">
                <FaTree size={11} /> Verified Nature Plots & Stays
              </div>
              <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-snow leading-tight">
                Find Your Perfect Nature Escape
              </h1>
              <p className="mt-2 text-sm lg:text-base text-light-slate leading-relaxed">
                Filter by location, hourly rate, custom amenities, and real-time reservation availability across Himachal Pradesh, Uttarakhand, and beyond.
              </p>
            </div>

            {/* Primary Search & Availability Filter Bar */}
            <div className="mt-8 rounded-3xl bg-dusk/90 border border-white/10 p-4 shadow-2xl backdrop-blur-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Location / Keyword Input */}
                <div className="relative flex items-center rounded-2xl bg-navy-deep/80 border border-white/15 px-3.5 py-2.5 focus-within:border-saffron transition">
                  <FaMapMarkerAlt className="text-saffron text-sm flex-shrink-0 mr-2.5" />
                  <input
                    type="text"
                    placeholder="Where? (e.g. Manali, Shimla)"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-snow placeholder-light-slate/60 outline-none"
                  />
                  {locationInput && (
                    <button
                      onClick={() => {
                        setLocationInput("");
                        updateUrlParams({ location: "" }, true);
                      }}
                      className="text-light-slate hover:text-snow p-1"
                    >
                      <FaTimes size={11} />
                    </button>
                  )}
                </div>

                {/* 2. Date Picker */}
                <div className="relative flex items-center rounded-2xl bg-navy-deep/80 border border-white/15 px-3.5 py-2.5 focus-within:border-saffron transition">
                  <FaCalendarAlt className="text-saffron text-sm flex-shrink-0 mr-2.5" />
                  <input
                    type="date"
                    value={urlDate}
                    onChange={handleDateChange}
                    className="w-full bg-transparent text-xs sm:text-sm text-snow placeholder-light-slate/60 outline-none cursor-pointer [color-scheme:dark]"
                  />
                  {urlDate && (
                    <button
                      onClick={() => updateUrlParams({ date: "" }, true)}
                      className="text-light-slate hover:text-snow p-1"
                    >
                      <FaTimes size={11} />
                    </button>
                  )}
                </div>

                {/* 3. Time Slot Window */}
                <div className="flex items-center gap-1.5 rounded-2xl bg-navy-deep/80 border border-white/15 px-3 py-2">
                  <FaClock className="text-saffron text-xs flex-shrink-0" />
                  <select
                    value={urlStartTime}
                    onChange={handleStartTimeChange}
                    className="w-full bg-transparent text-xs text-snow outline-none cursor-pointer [&>option]:bg-navy-deep"
                  >
                    <option value="">Start: Any</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={`start-${t}`} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="text-light-slate/60 text-xs font-bold">-</span>
                  <select
                    value={urlEndTime}
                    onChange={handleEndTimeChange}
                    className="w-full bg-transparent text-xs text-snow outline-none cursor-pointer [&>option]:bg-navy-deep"
                  >
                    <option value="">End: Any</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={`end-${t}`} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Controls: Filter Drawer Toggle & Sort */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFilterDrawerOpen((prev) => !prev)}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition shadow-sm border ${
                      isFilterDrawerOpen || activeFilterCount > 0
                        ? "bg-saffron/20 border-saffron text-saffron hover:bg-saffron/30"
                        : "bg-white/10 border-white/15 text-snow hover:bg-white/20"
                    }`}
                  >
                    <FaSlidersH size={12} />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="h-5 w-5 rounded-full bg-saffron text-navy text-[10px] font-extrabold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <select
                    value={urlSort}
                    onChange={handleSortChange}
                    className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2.5 text-xs font-semibold text-snow outline-none cursor-pointer hover:bg-white/20 transition [&>option]:bg-navy-deep"
                  >
                    <option value="newest">Newest</option>
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Collapsible Advanced Filters (Price Range, Amenities, Category) */}
              <AnimatePresence>
                {isFilterDrawerOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden border-t border-white/10 mt-4 pt-5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-snow">
                      {/* Price Range Filter */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-saffron mb-2.5 flex items-center gap-1.5">
                          Hourly Rate (₹/hr)
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-light-slate text-xs font-bold">₹</span>
                            <input
                              type="number"
                              placeholder="Min price"
                              value={minPriceInput}
                              onChange={(e) => setMinPriceInput(e.target.value)}
                              className="w-full rounded-xl bg-navy-deep/80 border border-white/15 pl-7 pr-3 py-2 text-xs text-snow outline-none focus:border-saffron"
                            />
                          </div>
                          <span className="text-light-slate/60 text-xs font-bold">to</span>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-light-slate text-xs font-bold">₹</span>
                            <input
                              type="number"
                              placeholder="Max price"
                              value={maxPriceInput}
                              onChange={(e) => setMaxPriceInput(e.target.value)}
                              className="w-full rounded-xl bg-navy-deep/80 border border-white/15 pl-7 pr-3 py-2 text-xs text-snow outline-none focus:border-saffron"
                            />
                          </div>
                        </div>

                        {/* Price presets */}
                        <div className="flex items-center gap-1.5 mt-2.5">
                          {[
                            { label: "Under ₹600", min: "", max: "600" },
                            { label: "₹600 - ₹1500", min: "600", max: "1500" },
                            { label: "₹1500+", min: "1500", max: "" },
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setMinPriceInput(preset.min);
                                setMaxPriceInput(preset.max);
                                updateUrlParams({ minPrice: preset.min, maxPrice: preset.max }, true);
                              }}
                              className="rounded-lg bg-white/10 hover:bg-white/20 px-2 py-1 text-[11px] text-light-slate transition border border-white/10"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amenities Filter (Checks for ALL selected) */}
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-saffron flex items-center gap-1.5">
                            Required Amenities (Must have all selected)
                          </p>
                          {urlAmenities.length > 0 && (
                            <button
                              type="button"
                              onClick={() => updateUrlParams({ amenities: "" }, true)}
                              className="text-[11px] text-light-slate hover:text-saffron underline"
                            >
                              Clear amenities
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                          {availableAmenities.map((amenity) => {
                            const isSelected = urlAmenities.includes(amenity);
                            return (
                              <button
                                key={amenity}
                                type="button"
                                onClick={() => handleToggleAmenity(amenity)}
                                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-left transition border ${
                                  isSelected
                                    ? "bg-saffron/20 border-saffron text-saffron font-bold"
                                    : "bg-navy-deep/60 border-white/10 text-light-slate hover:border-white/20"
                                }`}
                              >
                                <span
                                  className={`h-3.5 w-3.5 rounded flex items-center justify-center text-[9px] flex-shrink-0 border ${
                                    isSelected
                                      ? "bg-saffron border-saffron text-navy"
                                      : "border-white/30"
                                  }`}
                                >
                                  {isSelected && <FaCheck size={7} />}
                                </span>
                                <span className="line-clamp-1">{amenity}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Drawer Footer */}
                    <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                      <p className="text-[11px] text-light-slate">
                        Listing results automatically update as you customize your filters.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetAll}
                        className="flex items-center gap-1.5 text-xs text-danger hover:text-danger/80 font-semibold"
                      >
                        <FaRedo size={10} /> Reset All Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Category Pills Slider */}
            <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                    urlCategory === cat.id
                      ? "bg-saffron text-navy font-bold shadow-md shadow-saffron/20"
                      : "bg-dusk text-snow hover:bg-white/10 hover:text-snow border border-white/10"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Main Body */}
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-8 bg-white p-3.5 rounded-2xl border border-mist shadow-sm">
              <span className="text-xs font-bold text-slate-brand mr-1 flex items-center gap-1">
                <FaFilter size={10} /> Active Filters:
              </span>

              {/* Location chip */}
              {urlLocation && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pine-mist border border-pine/20 px-3 py-1 text-xs font-semibold text-pine">
                  <FaMapMarkerAlt size={10} className="text-pine" />
                  <span>Location: "{urlLocation}"</span>
                  <button
                    onClick={() => handleClearFilter("location")}
                    className="hover:text-navy p-0.5"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}

              {/* Price chip */}
              {(urlMinPrice || urlMaxPrice) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pine-mist border border-pine/20 px-3 py-1 text-xs font-semibold text-pine">
                  <FaTag size={10} className="text-pine" />
                  <span>
                    Price: {urlMinPrice ? `₹${urlMinPrice}` : "₹0"} - {urlMaxPrice ? `₹${urlMaxPrice}` : "Any"}
                  </span>
                  <button
                    onClick={() => {
                      setMinPriceInput("");
                      setMaxPriceInput("");
                      updateUrlParams({ minPrice: "", maxPrice: "" }, true);
                    }}
                    className="hover:text-navy p-0.5"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}

              {/* Category chip */}
              {urlCategory && urlCategory !== "all" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-mist border border-mist px-3 py-1 text-xs font-semibold text-navy">
                  <span>Category: {urlCategory}</span>
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="hover:text-navy p-0.5"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}

              {/* Date chip */}
              {urlDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pine-mist border border-pine/20 px-3 py-1 text-xs font-semibold text-pine">
                  <FaCalendarAlt size={10} className="text-pine" />
                  <span>
                    {urlDate}
                    {urlStartTime || urlEndTime
                      ? ` (${urlStartTime || "00:00"} - ${urlEndTime || "24:00"})`
                      : ""}
                  </span>
                  <button onClick={handleClearDateTime} className="hover:text-navy p-0.5">
                    <FaTimes size={10} />
                  </button>
                </span>
              )}

              {/* Guests chip */}
              {urlGuests && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pine-mist border border-pine/20 px-3 py-1 text-xs font-semibold text-pine">
                  <FaUsers size={10} className="text-pine" />
                  <span>Guests: {urlGuests}+</span>
                  <button
                    onClick={() => updateUrlParams({ guests: "" }, true)}
                    className="hover:text-navy p-0.5"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}

              {/* Amenity chips */}
              {urlAmenities.map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1.5 rounded-full bg-mist border border-mist px-3 py-1 text-xs font-semibold text-navy"
                >
                  <FaCheck size={9} className="text-pine" />
                  <span>{amenity}</span>
                  <button
                    onClick={() => handleClearAmenity(amenity)}
                    className="hover:text-danger p-0.5"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              ))}

              {/* Clear All button */}
              <button
                type="button"
                onClick={handleResetAll}
                className="ml-auto text-xs font-bold text-danger hover:text-danger/80 transition"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Results Summary Bar & View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-semibold text-slate-brand">
                {loading ? (
                  "Searching listings..."
                ) : (
                  <>
                    Showing <span className="font-extrabold text-navy">{spots.length}</span> of{" "}
                    <span className="font-extrabold text-navy">{totalCount}</span> plots found
                  </>
                )}
              </p>
              {totalPages > 1 && (
                <p className="text-xs text-slate-brand font-medium">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>

            {/* View Mode Toggle: Grid vs Mountain Map */}
            <div className="inline-flex items-center p-1 bg-white border border-mist rounded-2xl shadow-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-navy text-white shadow-xs"
                    : "text-slate-600 hover:text-navy hover:bg-snow"
                }`}
              >
                <FaThLarge size={11} />
                <span>Grid View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewMode === "map"
                    ? "bg-saffron text-navy shadow-xs"
                    : "text-slate-600 hover:text-navy hover:bg-snow"
                }`}
              >
                <FaMapMarkedAlt size={12} />
                <span>Mountain Map</span>
              </button>
            </div>
          </div>

          {/* Loading Skeleton State */}
          {loading && (
            <div className="py-6">
              <SpotGridSkeleton count={6} />
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="rounded-3xl border border-danger/20 bg-danger-mist p-8 text-center my-8 max-w-lg mx-auto">
              <FaExclamationTriangle className="mx-auto text-3xl text-danger mb-2" />
              <h3 className="text-lg font-bold text-danger">Failed to Load Listings</h3>
              <p className="mt-1 text-xs text-danger mb-4">{error}</p>
              <button
                onClick={() => updateUrlParams({}, false)}
                className="rounded-full border-2 border-danger px-6 py-2.5 text-xs font-bold text-danger hover:bg-danger hover:text-white transition"
              >
                Retry Search
              </button>
            </div>
          )}

          {/* Distinct Empty State: Filters Applied but No Matches */}
          {!loading && !error && spots.length === 0 && hasActiveFilters && (
            <div className="space-y-12 my-8">
              <div className="rounded-3xl border border-mist bg-white p-12 text-center shadow-sm max-w-xl mx-auto">
                <div className="h-16 w-16 rounded-3xl bg-saffron/15 text-saffron-text flex items-center justify-center text-2xl mx-auto mb-4 border border-saffron/30">
                  <FaSearch />
                </div>
                <h3 className="text-xl font-bold text-navy">No Exact Matches for These Filters</h3>
                <p className="mt-2 text-xs text-slate-brand leading-relaxed max-w-md mx-auto">
                  No properties match all selected criteria simultaneously. Try clearing specific filters, or explore our recommended alternative plots below:
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleResetAll}
                    className="rounded-full bg-saffron text-navy hover:bg-saffron-hover px-6 py-2.5 text-xs font-bold transition shadow cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                  {urlLocation && (
                    <button
                      onClick={() => handleClearFilter("location")}
                      className="rounded-full border-2 border-navy text-navy hover:bg-navy hover:text-snow px-5 py-2.5 text-xs font-semibold transition cursor-pointer"
                    >
                      Clear Location Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Recommended Alternative Plots */}
              <SmartRecommendations
                title="Recommended Alternative Plots"
                subtitle="Curated available nature spots matching your general preferences"
                limit={4}
              />
            </div>
          )}

          {/* Distinct Empty State: No spots exist in DB yet */}
          {!loading && !error && spots.length === 0 && !hasActiveFilters && (
            <div className="rounded-3xl border border-mist bg-white p-12 text-center shadow-sm my-8 max-w-md mx-auto">
              <div className="h-16 w-16 rounded-3xl bg-pine-mist text-pine flex items-center justify-center text-2xl mx-auto mb-4 border border-pine/20">
                <FaTree />
              </div>
              <h3 className="text-xl font-bold text-navy">No Spots Published Yet</h3>
              <p className="mt-2 text-xs text-slate-brand">
                Be the first to list a private nature plot, campsite, or hillside retreat!
              </p>
              <Link
                to="/become-a-host"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-saffron text-navy hover:bg-saffron-hover px-6 py-3 text-xs font-bold shadow transition"
              >
                Become a Host
              </Link>
            </div>
          )}

          {/* Spots Display: Grid or Map View */}
          {!loading && !error && spots.length > 0 && (
            <>
              {viewMode === "map" ? (
                <div className="space-y-8 animate-fadeIn">
                  <MountainMap
                    spots={spots}
                    className="w-full h-[520px] rounded-3xl overflow-hidden shadow-lg border border-mist/80"
                  />

                  <div>
                    <h3 className="font-heading font-extrabold text-lg text-navy mb-4">
                      All Plots on This Map
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                      {spots.map((spot) => (
                        <ListingCard
                          key={spot._id || spot.id}
                          plot={spot}
                          actionLabel="View Details"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                  {spots.map((spot) => (
                    <ListingCard
                      key={spot._id || spot.id}
                      plot={spot}
                      actionLabel="View Details"
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pagination Controls */}
          {!loading && !error && totalPages > 1 && (
            <div className="mt-14 pt-8 border-t border-mist flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-brand font-medium">
                Page <span className="font-bold text-navy">{currentPage}</span> of{" "}
                <span className="font-bold text-navy">{totalPages}</span> ({totalCount} total spots)
              </p>

              <div className="flex items-center gap-2">
                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 rounded-xl border border-mist bg-white px-3.5 py-2 text-xs font-semibold text-navy hover:bg-snow transition disabled:bg-mist disabled:text-slate-brand disabled:cursor-not-allowed shadow-sm"
                >
                  <FaChevronLeft size={10} /> Prev
                </button>

                {/* Numbered Page Buttons */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => {
                    // Show first, last, and window around current page
                    if (
                      p === 1 ||
                      p === totalPages ||
                      (p >= currentPage - 1 && p <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={`page-${p}`}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`h-9 w-9 rounded-xl text-xs font-bold transition flex items-center justify-center shadow-sm ${
                            currentPage === p
                              ? "bg-navy text-snow"
                              : "bg-white border border-mist text-navy hover:bg-snow"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    } else if (
                      (p === currentPage - 2 && currentPage > 3) ||
                      (p === currentPage + 2 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span key={`ellipsis-${p}`} className="px-1 text-slate-brand text-xs">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 rounded-xl border border-mist bg-white px-3.5 py-2 text-xs font-semibold text-navy hover:bg-snow transition disabled:bg-mist disabled:text-slate-brand disabled:cursor-not-allowed shadow-sm"
                >
                  Next <FaChevronRight size={10} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Listings;
