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
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ListingCard from "../components/cards/ListingCard";
import SmartRecommendations from "../components/recommendations/SmartRecommendations";
import { SpotGridSkeleton } from "../components/common/SkeletonLoader";
import API from "../services/api";

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
    const fetchSpots = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams(searchParams);
        if (!params.get("page")) params.set("page", "1");
        if (!params.get("limit")) params.set("limit", "9");

        const response = await API.get(`/spots?${params.toString()}`);
        const responseData = response.data;

        const spotList = Array.isArray(responseData)
          ? responseData
          : responseData.data || responseData.spots || [];

        setSpots(spotList);
        setTotalCount(responseData.totalCount !== undefined ? responseData.totalCount : spotList.length);
        setTotalPages(responseData.totalPages || Math.ceil(spotList.length / 9) || 1);
        setCurrentPage(responseData.currentPage || parseInt(params.get("page"), 10) || 1);
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load property listings. Please check your connection."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
  }, [searchParams]);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero Banner & Search Bar */}
        <section className="bg-slate-950 text-white pt-12 pb-16 px-6 lg:px-8 border-b border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4">
                <FaTree size={11} /> Verified Nature Plots & Stays
              </div>
              <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Find Your Perfect Nature Escape
              </h1>
              <p className="mt-2 text-sm lg:text-base text-slate-300 leading-relaxed">
                Filter by location, hourly rate, custom amenities, and real-time reservation availability across Himachal Pradesh, Uttarakhand, and beyond.
              </p>
            </div>

            {/* Primary Search & Availability Filter Bar */}
            <div className="mt-8 rounded-3xl bg-slate-900/90 border border-slate-800 p-4 shadow-2xl backdrop-blur-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Location / Keyword Input */}
                <div className="relative flex items-center rounded-2xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 focus-within:border-emerald-500 transition">
                  <FaMapMarkerAlt className="text-emerald-400 text-sm flex-shrink-0 mr-2.5" />
                  <input
                    type="text"
                    placeholder="Where? (e.g. Manali, Shimla)"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 outline-none"
                  />
                  {locationInput && (
                    <button
                      onClick={() => {
                        setLocationInput("");
                        updateUrlParams({ location: "" }, true);
                      }}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <FaTimes size={11} />
                    </button>
                  )}
                </div>

                {/* 2. Date Picker */}
                <div className="relative flex items-center rounded-2xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 focus-within:border-emerald-500 transition">
                  <FaCalendarAlt className="text-emerald-400 text-sm flex-shrink-0 mr-2.5" />
                  <input
                    type="date"
                    value={urlDate}
                    onChange={handleDateChange}
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 outline-none cursor-pointer [color-scheme:dark]"
                  />
                  {urlDate && (
                    <button
                      onClick={() => updateUrlParams({ date: "" }, true)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <FaTimes size={11} />
                    </button>
                  )}
                </div>

                {/* 3. Time Slot Window */}
                <div className="flex items-center gap-1.5 rounded-2xl bg-slate-950/70 border border-slate-800 px-3 py-2">
                  <FaClock className="text-emerald-400 text-xs flex-shrink-0" />
                  <select
                    value={urlStartTime}
                    onChange={handleStartTimeChange}
                    className="w-full bg-transparent text-xs text-white outline-none cursor-pointer [&>option]:bg-slate-900"
                  >
                    <option value="">Start: Any</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={`start-${t}`} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-500 text-xs font-bold">-</span>
                  <select
                    value={urlEndTime}
                    onChange={handleEndTimeChange}
                    className="w-full bg-transparent text-xs text-white outline-none cursor-pointer [&>option]:bg-slate-900"
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
                    className={`flex-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                      isFilterDrawerOpen || activeFilterCount > 0
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    <FaSlidersH size={12} />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="h-5 w-5 rounded-full bg-white text-emerald-700 text-[10px] font-extrabold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <select
                    value={urlSort}
                    onChange={handleSortChange}
                    className="rounded-2xl bg-slate-800 border border-slate-700 px-3 py-2.5 text-xs font-semibold text-white outline-none cursor-pointer hover:bg-slate-700 transition [&>option]:bg-slate-900"
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
                    className="overflow-hidden border-t border-slate-800 mt-4 pt-5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-200">
                      {/* Price Range Filter */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5">
                          Hourly Rate (₹/hr)
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                            <input
                              type="number"
                              placeholder="Min price"
                              value={minPriceInput}
                              onChange={(e) => setMinPriceInput(e.target.value)}
                              className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-7 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                            />
                          </div>
                          <span className="text-slate-500 text-xs font-bold">to</span>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                            <input
                              type="number"
                              placeholder="Max price"
                              value={maxPriceInput}
                              onChange={(e) => setMaxPriceInput(e.target.value)}
                              className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-7 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
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
                              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] text-slate-300 transition"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amenities Filter (Checks for ALL selected) */}
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            Required Amenities (Must have all selected)
                          </p>
                          {urlAmenities.length > 0 && (
                            <button
                              type="button"
                              onClick={() => updateUrlParams({ amenities: "" }, true)}
                              className="text-[11px] text-slate-400 hover:text-emerald-400 underline"
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
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                                }`}
                              >
                                <span
                                  className={`h-3.5 w-3.5 rounded flex items-center justify-center text-[9px] flex-shrink-0 border ${
                                    isSelected
                                      ? "bg-emerald-500 border-emerald-500 text-white"
                                      : "border-slate-600"
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
                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <p className="text-[11px] text-slate-400">
                        Listing results automatically update as you customize your filters.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetAll}
                        className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold"
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
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
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
            <div className="flex flex-wrap items-center gap-2 mb-8 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <FaFilter size={10} /> Active Filters:
              </span>

              {/* Location chip */}
              {urlLocation && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <FaMapMarkerAlt size={10} className="text-emerald-600" />
                  <span>Location: "{urlLocation}"</span>
                  <button
                    onClick={() => handleClearFilter("location")}
                    className="hover:text-emerald-950 p-0.5"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}

              {/* Price chip */}
              {(urlMinPrice || urlMaxPrice) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <FaTag size={10} className="text-emerald-600" />
                  <span>
                    Price: {urlMinPrice ? `₹${urlMinPrice}` : "₹0"} - {urlMaxPrice ? `₹${urlMaxPrice}` : "Any"}
                  </span>
                  <button
                    onClick={() => {
                      setMinPriceInput("");
                      setMaxPriceInput("");
                      updateUrlParams({ minPrice: "", maxPrice: "" }, true);
                    }}
                    className="hover:text-emerald-950 p-0.5"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}

              {/* Category chip */}
              {urlCategory && urlCategory !== "all" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-800">
                  <span>Category: {urlCategory}</span>
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="hover:text-slate-950 p-0.5"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}

              {/* Date chip */}
              {urlDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <FaCalendarAlt size={10} className="text-emerald-600" />
                  <span>
                    {urlDate}
                    {urlStartTime || urlEndTime
                      ? ` (${urlStartTime || "00:00"} - ${urlEndTime || "24:00"})`
                      : ""}
                  </span>
                  <button onClick={handleClearDateTime} className="hover:text-emerald-950 p-0.5">
                    <FaTimes size={10} />
                  </button>
                </span>
              )}

              {/* Guests chip */}
              {urlGuests && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <FaUsers size={10} className="text-emerald-600" />
                  <span>Guests: {urlGuests}+</span>
                  <button
                    onClick={() => updateUrlParams({ guests: "" }, true)}
                    className="hover:text-emerald-950 p-0.5"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}

              {/* Amenity chips */}
              {urlAmenities.map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-800"
                >
                  <FaCheck size={9} className="text-emerald-600" />
                  <span>{amenity}</span>
                  <button
                    onClick={() => handleClearAmenity(amenity)}
                    className="hover:text-rose-600 p-0.5"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              ))}

              {/* Clear All button */}
              <button
                type="button"
                onClick={handleResetAll}
                className="ml-auto text-xs font-bold text-rose-600 hover:text-rose-800 transition"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-semibold text-slate-600">
              {loading ? (
                "Searching listings..."
              ) : (
                <>
                  Showing <span className="font-extrabold text-slate-900">{spots.length}</span> of{" "}
                  <span className="font-extrabold text-slate-900">{totalCount}</span> spots found
                </>
              )}
            </p>

            {totalPages > 1 && (
              <p className="text-xs text-slate-400 font-medium">
                Page {currentPage} of {totalPages}
              </p>
            )}
          </div>

          {/* Loading Skeleton State */}
          {loading && (
            <div className="py-6">
              <SpotGridSkeleton count={6} />
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center my-8 max-w-lg mx-auto">
              <FaExclamationTriangle className="mx-auto text-3xl text-rose-500 mb-2" />
              <h3 className="text-lg font-bold text-rose-800">Failed to Load Listings</h3>
              <p className="mt-1 text-xs text-rose-600 mb-4">{error}</p>
              <button
                onClick={() => updateUrlParams({}, false)}
                className="rounded-full bg-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-rose-500 transition"
              >
                Retry Search
              </button>
            </div>
          )}

          {/* Distinct Empty State: Filters Applied but No Matches */}
          {!loading && !error && spots.length === 0 && hasActiveFilters && (
            <div className="space-y-12 my-8">
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm max-w-xl mx-auto">
                <div className="h-16 w-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto mb-4 border border-amber-100">
                  <FaSearch />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No Exact Matches for These Filters</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                  No properties match all selected criteria simultaneously. Try clearing specific filters, or explore our recommended alternative plots below:
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleResetAll}
                    className="rounded-full bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 transition shadow cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                  {urlLocation && (
                    <button
                      onClick={() => handleClearFilter("location")}
                      className="rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
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
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm my-8 max-w-md mx-auto">
              <div className="h-16 w-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-4 border border-emerald-100">
                <FaTree />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Spots Published Yet</h3>
              <p className="mt-2 text-xs text-slate-500">
                Be the first to list a private nature plot, campsite, or hillside retreat!
              </p>
              <Link
                to="/become-a-host"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow hover:bg-emerald-500 transition"
              >
                Become a Host
              </Link>
            </div>
          )}

          {/* Spots Grid */}
          {!loading && !error && spots.length > 0 && (
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

          {/* Pagination Controls */}
          {!loading && !error && totalPages > 1 && (
            <div className="mt-14 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500 font-medium">
                Page <span className="font-bold text-slate-800">{currentPage}</span> of{" "}
                <span className="font-bold text-slate-800">{totalPages}</span> ({totalCount} total spots)
              </p>

              <div className="flex items-center gap-2">
                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
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
                              ? "bg-slate-900 text-white"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
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
                        <span key={`ellipsis-${p}`} className="px-1 text-slate-400 text-xs">
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
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
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
