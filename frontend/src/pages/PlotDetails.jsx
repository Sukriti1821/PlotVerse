import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaArrowLeft,
  FaExclamationTriangle,
  FaCheck,
  FaTag,
  FaUserTie,
  FaEnvelope,
  FaChevronLeft,
  FaChevronRight,
  FaImages,
} from "react-icons/fa";
import API from "../services/api";
import BookingComposer from "../components/BookingComposer";
import SmartRecommendations from "../components/recommendations/SmartRecommendations";
import { getAllImageUrls, PLACEHOLDER_IMAGE } from "../utils/imageHelper";
import { PlotDetailsSkeleton } from "../components/common/SkeletonLoader";
import { FALLBACK_SPOTS } from "../data/fallbackData";

const PlotDetails = () => {
  const { id } = useParams();
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Toggle amenity selection from Amenity Catalog
  const handleToggleAmenity = (amenity) => {
    const name =
      typeof amenity === "string" ? amenity : amenity?.name || amenity?.title || "";
    const price = Number(amenity?.price ?? amenity?.hourlyPrice ?? 0);
    if (!name) return;

    setSelectedAmenities((prev) => {
      const exists = prev.some(
        (a) => a.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) {
        return prev.filter(
          (a) => a.name.toLowerCase() !== name.toLowerCase()
        );
      } else {
        return [...prev, { name, hourlyPrice: price, price }];
      }
    });
  };

  const fetchSpotDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get(`/spots/${id}`);
      setSpot(response.data);
      setActiveImageIndex(0);
    } catch (err) {
      console.warn("Backend error fetching spot details, checking fallbacks:", err.message);
      const fb = FALLBACK_SPOTS.find((s) => s._id === id || s.id === id);
      if (fb) {
        setSpot(fb);
        setActiveImageIndex(0);
        setError(null);
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load property details. Please verify the ID or check backend status."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSpotDetails();
    }
  }, [id]);

  const images = getAllImageUrls(spot);

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  const rawPrice = spot?.price;
  const formattedPrice =
    typeof rawPrice === "number"
      ? `₹${rawPrice.toLocaleString()}/hr`
      : rawPrice || "Price on Request";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-md py-4 px-6 sticky top-0 z-10"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/listings"
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
          >
            <FaArrowLeft size={18} />
            Back to Listings
          </Link>
          {spot?.category && (
            <span className="text-xs uppercase tracking-widest font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              {spot.category}
            </span>
          )}
        </div>
      </motion.div>

      {/* Loading Skeleton */}
      {loading && <PlotDetailsSkeleton />}

      {/* Error State */}
      {!loading && error && (
        <div className="max-w-2xl mx-auto my-16 p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <FaExclamationTriangle className="mx-auto text-4xl text-rose-500 mb-3" />
          <h2 className="text-2xl font-bold text-rose-800 mb-2">Property Not Found</h2>
          <p className="text-rose-600 mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={fetchSpotDetails}
              className="bg-rose-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-rose-500 transition"
            >
              Retry
            </button>
            <Link
              to="/listings"
              className="bg-slate-800 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-slate-700 transition"
            >
              Browse All Listings
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && spot && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto px-6 py-12"
        >
          {/* Interactive Hero Image & Carousel Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="relative h-96 md:h-[480px] rounded-3xl overflow-hidden shadow-2xl bg-slate-900 group">
              <img
                src={images[activeImageIndex] || PLACEHOLDER_IMAGE}
                alt={spot.title}
                className="w-full h-full object-cover transition-all duration-500"
                onError={(e) => {
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />

              {/* Navigation Arrows for Multi-Image Carousel */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    aria-label="Previous photo"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition shadow-lg z-10"
                  >
                    <FaChevronLeft size={18} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    aria-label="Next photo"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition shadow-lg z-10"
                  >
                    <FaChevronRight size={18} />
                  </button>

                  {/* Image Counter Badge */}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md">
                    <FaImages /> {activeImageIndex + 1} / {images.length}
                  </div>
                </>
              )}

              {/* Overlay Details */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end pointer-events-none">
                <div className="text-white p-8">
                  <div className="inline-block bg-emerald-500/90 text-white text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full mb-3 backdrop-blur-sm">
                    {spot.category || "Scenic Plot"}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold mb-2">
                    {spot.title}
                  </h1>
                  <p className="flex items-center gap-2 text-slate-200 text-base md:text-lg">
                    <FaMapMarkerAlt className="text-emerald-400" /> {spot.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Thumbnail Strip Gallery (if more than 1 image) */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-2 scrollbar-thin">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative flex-shrink-0 w-24 h-16 md:w-28 md:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx
                        ? "border-emerald-500 scale-105 shadow-md ring-2 ring-emerald-400/50"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Grid Layout: Left Column Details, Right Column Booking Composer */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Key Info Cards */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {/* Location Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <FaMapMarkerAlt className="text-emerald-600" size={18} />
                    <span className="text-gray-400 font-bold text-[11px] tracking-wider uppercase">
                      Location
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 line-clamp-2">
                    {spot.location}
                  </p>
                </div>

                {/* Category Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <FaTag className="text-sky-600" size={18} />
                    <span className="text-gray-400 font-bold text-[11px] tracking-wider uppercase">
                      Category
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {spot.category || "Nature Retreat"}
                  </p>
                </div>

                {/* Base Rate Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 rounded-2xl text-white shadow-sm">
                  <span className="font-semibold text-[11px] tracking-wider uppercase block mb-1.5 text-emerald-100">
                    Base Spot Rate
                  </span>
                  <p className="text-base font-bold">{formattedPrice}</p>
                </div>
              </motion.div>

              {/* Description Section */}
              <motion.div
                variants={itemVariants}
                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  About this Property
                </h2>
                <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
                  {spot.description || "No description provided for this spot."}
                </p>
              </motion.div>

              {/* Amenity Catalog Section */}
              <motion.div
                variants={itemVariants}
                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
              >
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Amenity Catalog
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Click any amenity card below to add or remove it from your total booking.
                    </p>
                  </div>
                  {selectedAmenities.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800 animate-pulse">
                      <FaCheck size={10} /> {selectedAmenities.length} added to booking
                    </span>
                  )}
                </div>

                {spot.amenities && spot.amenities.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {spot.amenities.map((amenity, index) => {
                      const name =
                        typeof amenity === "string"
                          ? amenity
                          : amenity?.name || amenity?.title || `Amenity #${index + 1}`;

                      const hasPrice =
                        typeof amenity === "object" &&
                        amenity?.price !== undefined &&
                        amenity?.price !== null &&
                        Number(amenity?.price) > 0;

                      const priceVal = hasPrice
                        ? Number(amenity.price || amenity.hourlyPrice)
                        : 0;

                      const priceText = hasPrice
                        ? `+₹${priceVal.toLocaleString()}/hr`
                        : "Included";

                      const isSelected = selectedAmenities.some(
                        (a) => a.name.toLowerCase() === name.toLowerCase()
                      );

                      return (
                        <div
                          key={index}
                          onClick={() => handleToggleAmenity(amenity)}
                          role="button"
                          tabIndex={0}
                          className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/20"
                              : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                                isSelected
                                  ? "bg-emerald-600 text-white scale-105 shadow-xs"
                                  : "border-2 border-slate-300 bg-slate-50 text-transparent group-hover:border-emerald-400 group-hover:text-emerald-500"
                              }`}
                            >
                              <FaCheck size={10} />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800 text-sm block">
                                {name}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                {isSelected
                                  ? "Added to your booking total"
                                  : "Click to add to your booking"}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-xs"
                                : hasPrice
                                ? "bg-amber-100 text-amber-900 group-hover:bg-amber-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {isSelected
                              ? `✓ Added (+₹${priceVal.toLocaleString()}/hr)`
                              : priceText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl text-center text-gray-500 text-sm">
                    Standard basic amenities included with this booking.
                  </div>
                )}
              </motion.div>

              {/* Host/Owner Information */}
              {spot.owner && (
                <motion.div
                  variants={itemVariants}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                      <FaUserTie />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Hosted By
                      </p>
                      <h3 className="text-base font-bold text-gray-900">
                        {spot.owner.name || "Verified Host"}
                      </h3>
                      {spot.owner.email && (
                        <p className="text-xs text-gray-500">{spot.owner.email}</p>
                      )}
                    </div>
                  </div>
                  <a
                    href={`mailto:${spot.owner.email || "support@thikana.com"}`}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
                  >
                    <FaEnvelope /> Contact Host
                  </a>
                </motion.div>
              )}
            </div>

            {/* Right Column: Dynamic Booking Composer (5 cols) */}
            <motion.div variants={itemVariants} id="booking-section" className="lg:col-span-5 sticky top-24">
              <BookingComposer
                spot={spot}
                selectedAmenities={selectedAmenities}
                onToggleAmenity={handleToggleAmenity}
              />
            </motion.div>
          </div>

          {/* Contextual Smart Recommendations ("Similar Plots You May Love") */}
          <SmartRecommendations
            spotId={id}
            title="Similar Plots You May Love"
            subtitle="Curated outdoor spaces sharing similar scenic categories, pricing, and outdoor amenities"
            className="border-t border-slate-200 mt-16 pt-12"
            limit={4}
          />

          {/* Mobile Floating Bottom Reservation Bar */}
          <div className="fixed bottom-[56px] left-0 right-0 z-20 border-t border-slate-200/90 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md lg:hidden flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-slate-900">
                  ₹{Number(spot.price || 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ hour</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold">
                Instant Confirmation
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("booking-section");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95"
            >
              Reserve Slot
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PlotDetails;
