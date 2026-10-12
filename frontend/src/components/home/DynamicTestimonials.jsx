import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaStar,
  FaQuoteRight,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaChevronLeft,
  FaChevronRight,
  FaPen,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import API from "../../services/api";

const TAGS = [
  "All",
  "Camping & Bonfire",
  "Romantic Escapes",
  "Solo & Nature",
  "Stargazing",
  "Group Getaways",
];

const FALLBACK_TESTIMONIALS = [
  {
    _id: "fb-1",
    name: "Aarav Sharma",
    role: "Landscape Photographer",
    spotName: "Solang Alpine Meadow & Pine Camping Plot",
    location: "Solang Valley, Himachal Pradesh",
    review:
      "Thikana made finding an untouched mountain glade effortless. We captured the Milky Way over our tent with zero light pollution, and the bonfire setup with pine wood was ready upon our arrival.",
    rating: 5,
    tag: "Camping & Bonfire",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    stayDate: "October 2025",
    isVerifiedStay: true,
  },
  {
    _id: "fb-2",
    name: "Meera & Tushar Joshi",
    role: "Anniversary Getaway",
    spotName: "Old Manali Romantic Bohemian Stargazing Ridge",
    location: "Old Manali, Himachal Pradesh",
    review:
      "The private candlelit date setup on the apple orchard ridge was magical. Watching the sunset over the valley with warm cider felt like a secluded dream. Host Vikram made our evening unforgettable.",
    rating: 5,
    tag: "Romantic Escapes",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    stayDate: "November 2025",
    isVerifiedStay: true,
  },
  {
    _id: "fb-3",
    name: "Devika Sen",
    role: "Solo Writer & Backpacker",
    spotName: "Chopta High-Altitude Bugyal Meadow",
    location: "Chopta, Uttarakhand",
    review:
      "Finding a private high-altitude meadow where I could pitch my canvas tent in total silence gave me the mental clarity I needed. The telescope provided for night skies was exceptional.",
    rating: 5,
    tag: "Solo & Nature",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    stayDate: "December 2025",
    isVerifiedStay: true,
  },
  {
    _id: "fb-4",
    name: "Karan Singhania",
    role: "Astro-Photography Enthusiast",
    spotName: "Spiti High-Desert Stargazing Plateau",
    location: "Kaza, Spiti Valley, Himachal Pradesh",
    review:
      "Hands down the cleanest night sky experience in India. The host had sub-zero sleeping bags and an Celestron telescope waiting. The booking and payment flow was smooth and reassuring.",
    rating: 5,
    tag: "Stargazing",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    stayDate: "September 2025",
    isVerifiedStay: true,
  },
  {
    _id: "fb-5",
    name: "Sneha & Arjun Roy",
    role: "Honeymoon Travelers",
    spotName: "Naggar Castle Vista Panoramic Sunset Gazebo",
    location: "Naggar, Kullu Valley, Himachal Pradesh",
    review:
      "The private evening deck with panoramic snow peak vistas felt like Europe in the heart of Himachal. Transparent pricing and hassle-free instant reservation.",
    rating: 5,
    tag: "Romantic Escapes",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
    stayDate: "January 2026",
    isVerifiedStay: true,
  },
];

export default function DynamicTestimonials() {
  const [items, setItems] = useState(FALLBACK_TESTIMONIALS);
  const [activeTag, setActiveTag] = useState("All");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form submission state
  const [formData, setFormData] = useState({
    name: "",
    role: "Mountain Traveler",
    spotName: "",
    location: "Himachal Pradesh",
    tag: "Camping & Bonfire",
    rating: 5,
    review: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  // Fetch from backend API
  const fetchTestimonials = async () => {
    try {
      const res = await API.get("/testimonials");
      const list = res.data?.data || res.data;
      if (Array.isArray(list) && list.length > 0) {
        setItems(list);
      }
    } catch (err) {
      console.warn("Using fallback testimonials:", err.message);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Filter items based on active tag
  const filteredItems = useMemo(() => {
    if (activeTag === "All") return items;
    return items.filter((item) => item.tag === activeTag);
  }, [items, activeTag]);

  // Reset current index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTag]);

  // Dynamic items per view (1 on mobile, 2 on md, 3 on lg/xl)
  const [itemsPerPage, setItemsPerPage] = useState(3);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setItemsPerPage(1);
      else if (window.innerWidth < 1024) setItemsPerPage(2);
      else setItemsPerPage(3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  // Auto-play rotation timer
  useEffect(() => {
    if (isPaused || totalPages <= 1 || isModalOpen) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalPages);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, totalPages, isModalOpen]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  // Currently visible items for current page
  const visibleItems = useMemo(() => {
    const start = currentIndex * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentIndex, itemsPerPage]);

  // Handle Review Submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!formData.name.trim() || !formData.review.trim()) {
      setSubmitError("Please provide both your name and review experience.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post("/testimonials", formData);
      const newReview = res.data?.data;

      if (newReview) {
        setItems((prev) => [newReview, ...prev]);
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
          setIsModalOpen(false);
          setFormData({
            name: "",
            role: "Mountain Traveler",
            spotName: "",
            location: "Himachal Pradesh",
            tag: "Camping & Bonfire",
            rating: 5,
            review: "",
          });
        }, 1200);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="testimonials"
      className="bg-snow px-6 py-20 lg:px-8 border-t border-mist overflow-hidden relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header with "Share Experience" Button */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-pine/30 bg-pine-mist px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-pine mb-3">
              <FaCheckCircle className="text-pine" size={12} /> Verified Guest Perspectives
            </div>
            <h2 className="text-3xl font-extrabold text-navy tracking-tight sm:text-4xl">
              What Travelers Are Saying
            </h2>
            <p className="mt-3 text-base text-slate-brand leading-relaxed">
              Authentic stories and reflections from travelers who discovered private mountain retreats across Himachal, Uttarakhand & Jammu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border-2 border-navy text-navy hover:bg-navy hover:text-snow active:scale-95 px-5 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              <FaPen size={11} />
              <span>Share Your Story</span>
            </button>

            {/* Slider Navigation Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={handlePrev}
                aria-label="Previous testimonials"
                disabled={totalPages <= 1}
                className="h-10 w-10 rounded-full border border-mist bg-white flex items-center justify-center text-navy hover:border-navy hover:text-navy active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-sm transition cursor-pointer"
              >
                <FaChevronLeft size={12} />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next testimonials"
                disabled={totalPages <= 1}
                className="h-10 w-10 rounded-full border border-mist bg-white flex items-center justify-center text-navy hover:border-navy hover:text-navy active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-sm transition cursor-pointer"
              >
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Vibe Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-2 scrollbar-none">
          {TAGS.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-navy text-snow shadow-sm"
                    : "bg-white text-slate-brand border border-mist hover:border-navy hover:text-navy"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Dynamic Cards Grid */}
        <div className="mt-8 relative min-h-[360px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTag}-${currentIndex}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {visibleItems.map((item) => (
                <div
                  key={item._id || item.name}
                  className="flex flex-col justify-between rounded-[2rem] border border-mist bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden group"
                >
                  {/* Subtle quote watermark */}
                  <FaQuoteRight
                    size={70}
                    className="absolute -bottom-2 right-4 text-mist group-hover:text-mist/60 transition-colors pointer-events-none"
                  />

                  <div>
                    {/* Top Row: Rating & Verified Stay Pill */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5 text-saffron text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FaStar
                              key={i}
                              className={i < Math.floor(item.rating) ? "text-saffron" : "text-mist"}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-navy ml-1">
                          {Number(item.rating).toFixed(1)}
                        </span>
                      </div>

                      {item.isVerifiedStay && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-pine-mist border border-pine/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-pine">
                          <FaCheckCircle size={9} /> Verified Stay
                        </span>
                      )}
                    </div>

                    {/* Visited Spot Badge */}
                    {item.spotName && (
                      <div
                        title={item.spotName}
                        className="mb-3.5 inline-flex items-center gap-1.5 rounded-lg bg-snow border border-mist px-2.5 py-1 text-[11px] font-semibold text-slate-brand max-w-full"
                      >
                        <FaMapMarkerAlt className="text-saffron-text flex-shrink-0 text-[10px]" />
                        <span className="truncate">{item.spotName}</span>
                      </div>
                    )}

                    {/* Review text */}
                    <p className="text-sm sm:text-base text-navy leading-relaxed font-normal italic relative z-10 line-clamp-4">
                      “{item.review}”
                    </p>
                  </div>

                  {/* Bottom: Guest details */}
                  <div className="mt-6 pt-4 border-t border-mist flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-mist shadow-sm flex-shrink-0"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-navy truncate">{item.name}</p>
                        <p className="text-xs text-slate-brand truncate">{item.role}</p>
                      </div>
                    </div>

                    {item.stayDate && (
                      <span className="text-[11px] text-slate-brand whitespace-nowrap pl-2">
                        {item.stayDate}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Pagination & Arrow Controls */}
        <div className="mt-8 flex items-center justify-between sm:justify-center gap-4">
          <button
            onClick={handlePrev}
            aria-label="Previous testimonials"
            disabled={totalPages <= 1}
            className="sm:hidden h-10 w-10 rounded-full border border-mist bg-white flex items-center justify-center text-navy active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-sm cursor-pointer"
          >
            <FaChevronLeft size={12} />
          </button>

          {/* Dots Indicator */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === idx
                      ? "w-8 bg-navy"
                      : "w-2.5 bg-mist hover:bg-light-slate"
                  }`}
                />
              ))}
            </div>
          )}

          <button
            onClick={handleNext}
            aria-label="Next testimonials"
            disabled={totalPages <= 1}
            className="sm:hidden h-10 w-10 rounded-full border border-mist bg-white flex items-center justify-center text-navy active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-sm cursor-pointer"
          >
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Share Your Story Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-mist max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-5 top-5 h-9 w-9 rounded-full bg-snow hover:bg-mist text-slate-brand flex items-center justify-center transition cursor-pointer"
              >
                <FaTimes size={13} />
              </button>

              <div className="text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-pine-mist px-3 py-1 text-xs font-bold text-pine mb-2">
                  <FaPen size={10} /> Community Stories
                </div>
                <h3 className="text-2xl font-bold text-navy">Share Your Mountain Experience</h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-brand">
                  Tell future travelers about the plot views, bonfire nights, or serenity of your stay.
                </p>
              </div>

              {submitSuccess ? (
                <div className="py-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine-mist text-pine text-2xl mb-4">
                    <FaCheckCircle />
                  </div>
                  <h4 className="text-xl font-bold text-navy">Thank You for Sharing!</h4>
                  <p className="mt-2 text-sm text-slate-brand">Your story has been added to our live guest perspectives.</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4 text-left">
                  {submitError && (
                    <div className="rounded-xl bg-danger-mist border border-danger/20 p-3 text-xs font-semibold text-danger">
                      {submitError}
                    </div>
                  )}

                  {/* Rating Stars */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-brand mb-1.5">
                      Your Rating
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-1 text-2xl text-saffron hover:scale-110 active:scale-95 transition cursor-pointer"
                        >
                          <FaStar
                            className={
                              (hoverRating || formData.rating) >= star
                                ? "text-saffron"
                                : "text-mist"
                            }
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-navy ml-2">
                        {formData.rating} out of 5 Stars
                      </span>
                    </div>
                  </div>

                  {/* Name & Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-brand mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tanvi Joshi"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-xl border border-mist bg-white px-3.5 py-2.5 text-sm font-semibold text-navy placeholder:text-light-slate outline-none focus:ring-2 focus:ring-navy"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-brand mb-1">
                        Traveler Role / Trip Style
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Solo Camper, Couple"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full rounded-xl border border-mist bg-white px-3.5 py-2.5 text-sm font-semibold text-navy placeholder:text-light-slate outline-none focus:ring-2 focus:ring-navy"
                      />
                    </div>
                  </div>

                  {/* Spot & Vibe Tag */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-brand mb-1">
                        Scenic Spot Visited
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Solang Meadow Plot"
                        value={formData.spotName}
                        onChange={(e) => setFormData({ ...formData, spotName: e.target.value })}
                        className="w-full rounded-xl border border-mist bg-white px-3.5 py-2.5 text-sm font-semibold text-navy placeholder:text-light-slate outline-none focus:ring-2 focus:ring-navy"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-brand mb-1">
                        Category Vibe
                      </label>
                      <select
                        value={formData.tag}
                        onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                        className="w-full rounded-xl border border-mist px-3.5 py-2.5 text-sm font-semibold text-navy outline-none focus:ring-2 focus:ring-navy bg-white"
                      >
                        <option value="Camping & Bonfire">Camping & Bonfire</option>
                        <option value="Romantic Escapes">Romantic Escapes</option>
                        <option value="Solo & Nature">Solo & Nature</option>
                        <option value="Stargazing">Stargazing</option>
                        <option value="Group Getaways">Group Getaways</option>
                      </select>
                    </div>
                  </div>

                  {/* Review Experience */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-brand mb-1">
                      Your Experience Story *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="What was your favorite moment? How were the views, campsite amenities, or host service?"
                      value={formData.review}
                      onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                      className="w-full rounded-xl border border-mist p-3.5 text-sm font-medium text-navy placeholder:text-light-slate outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-brand hover:bg-mist transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-full bg-saffron hover:bg-saffron-hover active:scale-95 px-6 py-2.5 text-xs sm:text-sm font-bold text-navy shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <FaSpinner className="animate-spin" /> Submitting...
                        </>
                      ) : (
                        "Publish Story"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
