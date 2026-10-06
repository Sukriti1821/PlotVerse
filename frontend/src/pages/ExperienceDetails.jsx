import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaClock,
  FaMapMarkerAlt,
  FaCheck,
  FaPlus,
  FaArrowLeft,
  FaStar,
  FaShieldAlt,
  FaCheckCircle,
  FaSpinner,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaTree,
  FaTag,
  FaBullhorn,
  FaGift,
  FaWallet,
} from "react-icons/fa";
import API from "../services/api";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../utils/imageHelper";
import BuyAsGiftModal from "../components/gifts/BuyAsGiftModal";

// Helper to convert "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const parts = timeStr.split(":");
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
};

// Helper to compute end time string from start time + duration hours
const computeEndTime = (startTime, durationHours) => {
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + (Number(durationHours) || 1) * 60;
  const endH = Math.floor(endMins / 60) % 24;
  const endM = endMins % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
};

const ExperienceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal, refreshUser } = useAuth();

  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAddOnNames, setSelectedAddOnNames] = useState([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Booking parameters
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [bookingDate, setBookingDate] = useState(tomorrow.toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("14:00");
  const [submitting, setSubmitting] = useState(false);

  // Availability validation state
  const [slotAvailable, setSlotAvailable] = useState(true);
  const [slotChecking, setSlotChecking] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");

  // Feature 9: Buy as Gift State
  const [showGiftModal, setShowGiftModal] = useState(false);

  // 1. Fetch Experience details
  useEffect(() => {
    let ignore = false;
    const fetchExperience = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/experiences/${id}`);
        if (!ignore) {
          setExperience(res.data?.data || res.data);
        }
      } catch (err) {
        console.error("Error loading experience details:", err);
        toast.error("Failed to load experience details");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchExperience();
    return () => {
      ignore = true;
    };
  }, [id]);

  // Derived end time based on fixed duration
  const endTime = experience ? computeEndTime(startTime, experience.durationHours) : "18:00";

  // 2. Preflight Slot Conflict Check on the underlying spot
  useEffect(() => {
    if (!experience || !experience.spot?._id || !bookingDate || !startTime) return;

    let ignore = false;
    const checkSlot = async () => {
      try {
        setSlotChecking(true);
        const res = await API.post(`/spots/${experience.spot._id}/check-slot`, {
          date: bookingDate,
          startTime,
          endTime,
          durationHours: experience.durationHours,
        });

        if (!ignore) {
          if (res.data?.available) {
            setSlotAvailable(true);
            setConflictMessage("");
          } else {
            setSlotAvailable(false);
            setConflictMessage(res.data?.message || "Slot unavailable for reservation");
          }
        }
      } catch (err) {
        if (!ignore) {
          setSlotAvailable(false);
          setConflictMessage(
            err.response?.data?.message || "Time slot is unavailable on the host plot schedule"
          );
        }
      } finally {
        if (!ignore) {
          setSlotChecking(false);
        }
      }
    };

    checkSlot();
    return () => {
      ignore = true;
    };
  }, [experience, bookingDate, startTime, endTime]);

  // Handle Add-on checkbox toggle
  const handleToggleAddOn = (addonName) => {
    setSelectedAddOnNames((prev) =>
      prev.includes(addonName) ? prev.filter((name) => name !== addonName) : [...prev, addonName]
    );
  };

  // Price Calculation
  const basePackagePrice = experience ? experience.price : 0;
  const selectedAddOnsObjects = experience
    ? (experience.optionalAddOns || []).filter((opt) => selectedAddOnNames.includes(opt.name))
    : [];
  const addOnsTotal = selectedAddOnsObjects.reduce((sum, item) => sum + item.price, 0);
  const grandTotal = basePackagePrice + addOnsTotal;

  // Landowner Growth Tools: Promotions & Coupons State
  const [spotPromotions, setSpotPromotions] = useState([]);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState(null);
  const [isPromoAccordionOpen, setIsPromoAccordionOpen] = useState(false);

  // Feature 8: Thikana Wallet Credit Checkout State
  const [useWalletCredits, setUseWalletCredits] = useState(false);

  // Fetch active promotions for the underlying plot
  useEffect(() => {
    let ignore = false;
    const fetchPromos = async () => {
      const spotId = experience?.spot?._id;
      if (!spotId) return;
      try {
        const res = await API.get(`/promotions/spot/${spotId}`);
        if (!ignore && res.data?.data) {
          setSpotPromotions(res.data.data);
        }
      } catch (err) {
        console.warn("Could not load promotions for experience spot:", err);
      }
    };

    fetchPromos();
    return () => {
      ignore = true;
    };
  }, [experience]);

  // Active promotional banners
  const activeBanners = (spotPromotions || []).filter(
    (p) => p.promotionType === "banner_announcement" && p.bannerText
  );

  // Available coupon codes
  const availableCoupons = (spotPromotions || []).filter(
    (p) => p.promotionType === "coupon_code" && p.code
  );

  // Dynamic promo discount calculation
  const effectiveDiscount = (() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.discountType === "percentage") {
      return Math.min(
        grandTotal,
        Math.round((grandTotal * Number(appliedPromo.discountValue || 0)) / 100)
      );
    }
    return Math.min(
      grandTotal,
      Number(appliedPromo.discountAmount || appliedPromo.discountValue || 0)
    );
  })();

  const subtotalAfterPromo = Math.max(0, grandTotal - effectiveDiscount);
  const availableWalletBalance = user?.walletBalance || 0;
  const effectiveWalletCredit =
    useWalletCredits && availableWalletBalance > 0
      ? Math.min(availableWalletBalance, subtotalAfterPromo)
      : 0;
  const finalPayableTotal = Math.max(0, subtotalAfterPromo - effectiveWalletCredit);

  const handleApplyPromo = async (codeToApply) => {
    const rawCode = typeof codeToApply === "string" ? codeToApply : promoCodeInput;
    const code = (rawCode || "").trim().toUpperCase();

    if (!code) {
      setPromoMessage({ type: "error", text: "Please enter a promotional code." });
      return;
    }

    try {
      setValidatingPromo(true);
      setPromoMessage(null);
      const spotId = experience?.spot?._id;

      const res = await API.post("/promotions/validate", {
        code,
        spotId,
        experienceId: experience?._id,
        subtotal: grandTotal,
        bookingDate,
        durationHours: experience?.durationHours,
      });

      if (res.data?.success && res.data?.data) {
        setAppliedPromo(res.data.data);
        setPromoCodeInput(code);
        setPromoMessage({
          type: "success",
          text: `Coupon "${code}" applied! Saved ₹${res.data.data.discountAmount.toLocaleString("en-IN")}`,
        });
        toast.success(
          `Promo "${code}" applied! -₹${res.data.data.discountAmount.toLocaleString("en-IN")}`
        );
      }
    } catch (err) {
      console.error("Promo validation error:", err);
      const errMsg =
        err.response?.data?.message || "Invalid or ineligible promotional code.";
      setPromoMessage({ type: "error", text: errMsg });
      setAppliedPromo(null);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoMessage(null);
    toast.info("Promotional code removed");
  };

  // Handle Booking Submission
  const handleBookExperience = async () => {
    if (!user) {
      toast.info("Please log in to reserve your experience");
      openAuthModal("login");
      return;
    }

    if (!slotAvailable) {
      toast.error(conflictMessage || "Please select an available time slot");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        experienceId: experience._id,
        date: bookingDate,
        startTime,
        endTime,
        durationHours: experience.durationHours,
        selectedAddOns: selectedAddOnsObjects.map((a) => ({ name: a.name, price: a.price })),
        guests: experience.maxGuests || 2,
      };

      if (appliedPromo?.code) {
        payload.promoCode = appliedPromo.code;
      }

      // Feature 8: Attach wallet credit deduction if customer opted in
      if (useWalletCredits && effectiveWalletCredit > 0) {
        payload.useWalletCredits = true;
        payload.appliedWalletCredits = effectiveWalletCredit;
      }

      const res = await API.post("/bookings", payload);

      if (refreshUser) {
        refreshUser();
      }

      toast.success("Experience booked successfully! Slot reserved.");
      navigate("/my-bookings", { state: { newBookingId: res.data?._id || res.data?.data?._id } });
    } catch (err) {
      console.error("Booking error:", err);
      toast.error(err.response?.data?.message || "Failed to book experience. Please try another slot.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24">
          <FaSpinner className="animate-spin text-emerald-600 text-3xl" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="mx-auto max-w-xl text-center py-24 px-6">
          <h2 className="text-2xl font-bold text-slate-900">Experience Not Found</h2>
          <p className="mt-2 text-sm text-slate-500">The requested experience package was not found or is currently unavailable.</p>
          <Link
            to="/experiences"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            <FaArrowLeft size={10} /> Browse All Experiences
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const galleryImages = experience.images && experience.images.length > 0
    ? experience.images
    : experience.spot?.images && experience.spot.images.length > 0
    ? experience.spot.images
    : [experience.image || experience.spot?.image];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Back Link & Breadcrumb Bar */}
        <div className="border-b border-slate-200/80 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-3.5 lg:px-8 flex items-center justify-between">
            <Link
              to="/experiences"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-600 transition"
            >
              <FaArrowLeft size={11} /> Back to Experiences
            </Link>

            <span className="text-xs font-medium text-slate-400">
              {experience.category} • {experience.durationHours} Hours Package
            </span>
          </div>
        </div>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          {/* Header Title & Badges */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-0.5 text-xs font-bold">
                {experience.category}
              </span>
              <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-0.5 text-xs font-bold flex items-center gap-1">
                <FaClock size={10} className="text-emerald-600" />
                {experience.durationHours} Hours Duration
              </span>
              {experience.rating && (
                <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 px-3 py-0.5 text-xs font-bold flex items-center gap-1">
                  <FaStar size={10} className="text-amber-500" />
                  {experience.rating.toFixed(1)} Rating
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {experience.title}
            </h1>

            <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
              <FaMapMarkerAlt className="text-emerald-600" />
              <span>Hosted at {experience.spot?.title || "Scenic Private Plot"}, {experience.spot?.location}</span>
            </div>
          </div>

          {/* Photo Showcase Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-10 rounded-3xl overflow-hidden shadow-lg bg-slate-900">
            {/* Primary Main Image */}
            <div className="md:col-span-3 aspect-[16/10] md:aspect-[16/9] overflow-hidden relative">
              <img
                src={getImageUrl(galleryImages[activePhotoIdx] || galleryImages[0])}
                alt={experience.title}
                className="w-full h-full object-cover transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <span className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium">
                Photo {activePhotoIdx + 1} of {galleryImages.length}
              </span>
            </div>

            {/* Thumbnail Stack */}
            <div className="flex md:flex-col gap-2 p-2 overflow-x-auto md:overflow-y-auto max-h-[480px]">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative rounded-xl overflow-hidden aspect-video w-24 md:w-full shrink-0 border-2 transition ${
                    activePhotoIdx === idx ? "border-emerald-400 scale-[1.02]" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={getImageUrl(img)} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column Layout: Left Narrative & Customization, Right Booking Card */}
          <div className="grid lg:grid-cols-12 gap-10">
            {/* Left Column: 7 Cols */}
            <div className="lg:col-span-7 space-y-8">
              {/* About the Experience */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-3">About This Experience</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {experience.description}
                </p>

                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Ideal For</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{experience.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Package Duration</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{experience.durationHours} Hours</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Guest Capacity</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">Up to {experience.maxGuests || 6} Guests</span>
                  </div>
                </div>
              </div>

              {/* What's Included (Bundled at Zero Extra Charge) */}
              <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/40 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    <FaCheck />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">What’s Included in This Package</h2>
                </div>
                <p className="text-xs text-slate-600 mb-5">
                  All items below are completely free of charge and fully prepared by your host prior to your arrival.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {experience.includedAmenities.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm flex items-start gap-3"
                    >
                      <div className="mt-0.5 rounded-full bg-emerald-100 text-emerald-700 p-1 shrink-0">
                        <FaCheck size={11} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                        {item.description && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-normal">{item.description}</p>
                        )}
                        <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Included • ₹0
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customizable Optional Add-Ons */}
              {experience.optionalAddOns && experience.optionalAddOns.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FaPlus className="text-emerald-600" />
                      <h2 className="text-xl font-bold text-slate-900">Customize With Optional Add-Ons</h2>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      {selectedAddOnNames.length} selected
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-5">
                    Select any optional enhancements you would like your host to prepare for your booking.
                  </p>

                  <div className="space-y-3">
                    {experience.optionalAddOns.map((addon, idx) => {
                      const isSelected = selectedAddOnNames.includes(addon.name);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleAddOn(addon.name)}
                          className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 flex items-center justify-between gap-4 ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/60 shadow-sm ring-1 ring-emerald-500"
                              : "border-slate-200 bg-slate-50/40 hover:bg-slate-100/70"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Controlled via card click
                              className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{addon.name}</h4>
                              {addon.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{addon.description}</p>
                              )}
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            +₹{addon.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* The Venue / Underlying Plot Details */}
              {experience.spot && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <FaTree className="text-emerald-600" />
                    <h3 className="text-lg font-bold text-slate-900">About the Host Venue</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{experience.spot.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{experience.spot.location}</p>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">{experience.spot.description}</p>
                    </div>
                    <Link
                      to={`/plot/${experience.spot._id}`}
                      className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shrink-0"
                    >
                      View Plot Profile
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: 5 Cols Sticky Reservation Card */}
            <div id="experience-booking-section" className="lg:col-span-5 sticky top-24">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
                {/* Active Host Promotional Banners */}
                {activeBanners.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {activeBanners.map((banner) => (
                      <div
                        key={banner._id}
                        className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/80 p-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5">
                            <FaBullhorn size={11} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-amber-950 truncate">
                              {banner.title}
                            </h5>
                            <p className="text-[11px] text-amber-900 leading-snug mt-0.5">
                              {banner.bannerText}
                            </p>
                            {banner.code && (
                              <button
                                type="button"
                                onClick={() => handleApplyPromo(banner.code)}
                                className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-white border border-amber-400 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800 hover:bg-amber-50 transition"
                              >
                                <FaTag size={8} /> Apply {banner.code}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Package Price Header */}
                <div className="flex items-baseline justify-between border-b border-slate-100 pb-5 mb-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      All-Inclusive Package
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-900">
                        ₹{finalPayableTotal.toLocaleString("en-IN")}
                      </span>
                      {appliedPromo && effectiveDiscount > 0 && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{grandTotal.toLocaleString("en-IN")}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-medium">total for stay</span>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                    {experience.durationHours} Hours Fixed
                  </span>
                </div>

                {/* Reservation Inputs */}
                <div className="space-y-4 mb-6">
                  {/* Date Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <FaCalendarAlt className="text-emerald-600" /> Select Date
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-medium"
                    />
                  </div>

                  {/* Start Time & Automatic End Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Start Time
                      </label>
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white font-medium"
                      >
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">01:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                        <option value="17:00">05:00 PM</option>
                        <option value="18:00">06:00 PM</option>
                        <option value="19:00">07:00 PM</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        End Time ({experience.durationHours}h)
                      </label>
                      <div className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3 py-2.5 text-sm font-bold text-slate-700 flex items-center justify-center">
                        {endTime}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pre-Flight Slot Availability Indicator */}
                <div className="mb-5">
                  {slotChecking ? (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 flex items-center gap-2">
                      <FaSpinner className="animate-spin text-emerald-600" />
                      <span>Checking host plot schedule...</span>
                    </div>
                  ) : slotAvailable ? (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                      <FaCheckCircle className="text-emerald-600 shrink-0" />
                      <span>Time slot is open and available for reservation!</span>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2 font-medium">
                      <FaExclamationTriangle className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span>{conflictMessage || "Selected slot overlaps with an existing reservation."}</span>
                        <p className="text-[11px] text-rose-600 mt-1">Please pick an earlier or later start time.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Promo / Coupon Code Collapsible Section */}
                <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 transition-all">
                  <div
                    onClick={() => setIsPromoAccordionOpen(!isPromoAccordionOpen)}
                    className="flex cursor-pointer items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FaTag className="text-emerald-600" size={12} />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Have a promo code?
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                      {isPromoAccordionOpen ? "Hide" : appliedPromo ? "Applied ✓" : "Enter Code"}
                    </span>
                  </div>

                  {isPromoAccordionOpen && (
                    <div className="mt-3 border-t border-slate-200 pt-3 space-y-2">
                      {appliedPromo ? (
                        <div className="flex items-center justify-between rounded-xl bg-emerald-100/80 p-2.5 border border-emerald-300">
                          <div>
                            <span className="font-mono text-xs font-black text-emerald-950">
                              {appliedPromo.code}
                            </span>
                            <p className="text-[10px] text-emerald-800">
                              -₹{effectiveDiscount.toLocaleString("en-IN")} discount saved!
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemovePromo}
                            className="rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="PROMO CODE"
                              value={promoCodeInput}
                              onChange={(e) => {
                                setPromoCodeInput(e.target.value.toUpperCase());
                                setPromoMessage(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleApplyPromo();
                                }
                              }}
                              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-slate-800 outline-none focus:border-emerald-500"
                            />
                            <button
                              type="button"
                              disabled={validatingPromo || !promoCodeInput.trim()}
                              onClick={() => handleApplyPromo()}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-bold transition disabled:opacity-50"
                            >
                              {validatingPromo ? "..." : "Apply"}
                            </button>
                          </div>
                          {promoMessage && (
                            <p
                              className={`text-[11px] font-medium ${
                                promoMessage.type === "success" ? "text-emerald-700" : "text-rose-600"
                              }`}
                            >
                              {promoMessage.text}
                            </p>
                          )}
                          {availableCoupons.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {availableCoupons.map((c) => (
                                <button
                                  key={c._id}
                                  type="button"
                                  onClick={() => handleApplyPromo(c.code)}
                                  className="inline-flex items-center gap-1 rounded-md border border-dashed border-emerald-300 bg-white px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800 hover:bg-emerald-50 transition"
                                >
                                  {c.code}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Transparent Itemized Price Breakdown */}
                <div className="border-t border-slate-100 pt-4 mb-6 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Transparent Price Breakdown
                  </span>

                  <div className="flex justify-between text-xs text-slate-700">
                    <span>{experience.title} ({experience.durationHours}h Package)</span>
                    <span className="font-semibold">₹{basePackagePrice.toLocaleString("en-IN")}</span>
                  </div>

                  {experience.includedAmenities.map((inc, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-emerald-700">
                      <span>✓ {inc.name}</span>
                      <span>Included</span>
                    </div>
                  ))}

                  {selectedAddOnsObjects.map((addon, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-800 font-medium">
                      <span>+ {addon.name}</span>
                      <span>₹{addon.price.toLocaleString("en-IN")}</span>
                    </div>
                  ))}

                  {/* Promo Code Line */}
                  {appliedPromo && effectiveDiscount > 0 && (
                    <div className="flex justify-between text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <FaTag size={10} /> Coupon ({appliedPromo.code}):
                      </span>
                      <span>-₹{effectiveDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  {/* Wallet Credit Line */}
                  {useWalletCredits && effectiveWalletCredit > 0 && (
                    <div className="flex justify-between text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2 py-1.5 rounded-lg border border-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <FaWallet size={10} /> Wallet Credit:
                      </span>
                      <span>-₹{effectiveWalletCredit.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  {/* Wallet Credit Toggle Card */}
                  {user && availableWalletBalance > 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 my-2">
                      <label className="flex items-center justify-between gap-2 cursor-pointer select-none">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={useWalletCredits}
                            onChange={(e) => setUseWalletCredits(e.target.checked)}
                            className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-900 block flex items-center gap-1">
                              <FaWallet className="text-emerald-600" size={10} /> Use Wallet Credit
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Available: ₹{availableWalletBalance.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                        {useWalletCredits && effectiveWalletCredit > 0 && (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-md">
                            -₹{effectiveWalletCredit.toLocaleString("en-IN")}
                          </span>
                        )}
                      </label>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-3 mt-2 flex justify-between items-baseline text-sm font-extrabold text-slate-900">
                    <span>Grand Total</span>
                    <div className="text-right">
                      {appliedPromo && effectiveDiscount > 0 && (
                        <span className="text-xs text-slate-400 line-through block font-medium">
                          ₹{grandTotal.toLocaleString("en-IN")}
                        </span>
                      )}
                      <span className="text-emerald-700">₹{finalPayableTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Book Action Button */}
                <button
                  type="button"
                  onClick={handleBookExperience}
                  disabled={submitting || slotChecking || !slotAvailable}
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" /> Securing Experience...
                    </>
                  ) : !slotAvailable ? (
                    "Slot Unavailable — Adjust Time"
                  ) : (
                    `Confirm & Reserve (₹${finalPayableTotal.toLocaleString("en-IN")})`
                  )}
                </button>

                {/* Feature 9: Buy as a Gift Button */}
                <button
                  type="button"
                  onClick={() => setShowGiftModal(true)}
                  className="w-full mt-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-900/50 px-6 py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <FaGift className="text-amber-500 text-sm" />
                  Buy this Experience as a Gift 🎁
                </button>

                {/* Trust Footer */}
                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <FaShieldAlt className="text-emerald-500" />
                  <span>Real-time slot lock prevents double bookings</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Floating Bottom Experience Reservation Bar */}
          {experience && (
            <div className="fixed bottom-14 left-0 right-0 z-20 border-t border-slate-200/90 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md lg:hidden flex items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-extrabold text-slate-900">
                    ₹{finalPayableTotal.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">package</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold">
                  {experience.durationHours} Hours Fixed Experience
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("experience-booking-section");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95"
              >
                Book Package
              </button>
            </div>
          )}

          {/* Feature 9: Buy as Gift Modal */}
          {experience && (
            <BuyAsGiftModal
              isOpen={showGiftModal}
              onClose={() => setShowGiftModal(false)}
              spot={experience.spot}
              experience={experience}
              selectedAddOns={selectedAddOnsObjects}
              durationHours={experience.durationHours}
            />
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ExperienceDetails;
