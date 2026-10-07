import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaGift,
  FaTicketAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaCheck,
  FaUserCheck,
  FaLock,
  FaArrowRight,
  FaSpinner,
  FaEnvelope,
  FaStar,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { getImageUrl } from "../utils/imageHelper";

const RedeemGift = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setShowAuthModal, setAuthMode } = useAuth();

  const [inputCode, setInputCode] = useState(
    (searchParams.get("code") || "").toUpperCase().trim()
  );
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [voucherData, setVoucherData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Scheduling State
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("11:00");
  const [slotChecking, setSlotChecking] = useState(false);
  const [slotAvailable, setSlotAvailable] = useState(true);
  const [slotConflictMsg, setSlotConflictMsg] = useState("");

  // Redemption Result
  const [redemptionSuccess, setRedemptionSuccess] = useState(null);

  // Auto-lookup if code present in URL on mount
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl && codeFromUrl.trim()) {
      handleLookup(codeFromUrl.trim().toUpperCase());
    }
  }, [searchParams]);

  // Set default date to tomorrow or scheduledDate
  useEffect(() => {
    if (voucherData) {
      if (voucherData.scheduledDate) {
        const d = new Date(voucherData.scheduledDate).toISOString().split("T")[0];
        setSelectedDate(d);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split("T")[0]);
      }

      if (voucherData.scheduledStartTime) {
        setSelectedStartTime(voucherData.scheduledStartTime);
      }
    }
  }, [voucherData]);

  const handleLookup = async (codeToLookup) => {
    const code = (codeToLookup || inputCode || "").toUpperCase().trim();
    if (!code) {
      toast.warn("Please enter a voucher code.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setVoucherData(null);
      setRedemptionSuccess(null);

      const res = await API.get(`/gifts/voucher/${code}`);
      if (res.data?.success && res.data?.data) {
        setVoucherData(res.data.data);
      } else {
        setErrorMessage("Voucher not found. Please verify the code.");
      }
    } catch (err) {
      console.error("Voucher lookup failed:", err);
      const msg =
        err.response?.data?.message || "Invalid voucher code or voucher expired.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Check slot availability when date/time changes
  useEffect(() => {
    const checkSlot = async () => {
      if (!voucherData?.spot?._id || !selectedDate || !selectedStartTime) return;

      const duration = voucherData.durationHours || 2;
      const [sh, sm] = selectedStartTime.split(":").map(Number);
      const eh = sh + duration;
      const endTime = `${String(eh).padStart(2, "0")}:${String(sm || 0).padStart(2, "0")}`;

      try {
        setSlotChecking(true);
        const res = await API.post(`/spots/${voucherData.spot._id}/check-slot`, {
          date: selectedDate,
          startTime: selectedStartTime,
          endTime,
          durationHours: duration,
        });

        if (res.data?.available) {
          setSlotAvailable(true);
          setSlotConflictMsg("");
        } else {
          setSlotAvailable(false);
          setSlotConflictMsg(res.data?.message || "This time slot is unavailable.");
        }
      } catch (err) {
        setSlotAvailable(false);
        setSlotConflictMsg(
          err.response?.data?.message || "Time slot is unavailable on the host schedule."
        );
      } finally {
        setSlotChecking(false);
      }
    };

    if (voucherData && voucherData.status === "active") {
      checkSlot();
    }
  }, [voucherData, selectedDate, selectedStartTime]);

  // Handle Redemption
  const handleRedeem = async () => {
    if (!user) {
      if (setAuthMode) setAuthMode("login");
      if (setShowAuthModal) setShowAuthModal(true);
      toast.info("Please sign in or register to confirm your booking.");
      return;
    }

    if (!selectedDate || !selectedStartTime) {
      toast.warn("Please pick your reservation date and start time.");
      return;
    }

    if (!slotAvailable) {
      toast.error(slotConflictMsg || "Selected time slot is unavailable. Please pick another.");
      return;
    }

    try {
      setRedeeming(true);
      const res = await API.post("/gifts/redeem", {
        voucherCode: voucherData.voucherCode,
        selectedDate,
        selectedStartTime,
      });

      if (res.data?.success) {
        setRedemptionSuccess(res.data.data);
        toast.success("Voucher redeemed successfully! Your reservation is confirmed.");
      }
    } catch (err) {
      console.error("Redemption error:", err);
      const msg = err.response?.data?.message || "Failed to redeem gift voucher.";
      toast.error(msg);
    } finally {
      setRedeeming(false);
    }
  };

  const itemTitle =
    voucherData?.experience?.title ||
    voucherData?.spot?.title ||
    "Private Outdoor Escape";

  const itemImg =
    voucherData?.experience?.image ||
    voucherData?.spot?.images?.[0] ||
    "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=60";

  const locationStr =
    typeof voucherData?.spot?.location === "object"
      ? `${voucherData.spot.location.city || ""}, ${voucherData.spot.location.state || ""}`.replace(/^, |, $/g, "")
      : voucherData?.spot?.location || "Thikana Private Plot";

  // Calculate End Time for display
  const duration = voucherData?.durationHours || 2;
  const [sh, sm] = (selectedStartTime || "11:00").split(":").map(Number);
  const calculatedEndTime = `${String(sh + duration).padStart(2, "0")}:${String(sm || 0).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3 border border-emerald-300/40">
            <FaTicketAlt />
            Gift Voucher Redemption
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Redeem Your Thikana Experience
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Enter your unique gift voucher code below to unlock your prepaid outdoor experience and schedule your reservation.
          </p>

          {/* Lookup Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="mt-6 flex items-center max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-lg border border-slate-200 dark:border-slate-800"
          >
            <input
              type="text"
              placeholder="e.g. GIFT-PLOT-A1B2-C3D4"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-3 bg-transparent text-sm sm:text-base font-mono uppercase font-bold tracking-wider text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <FaSpinner className="animate-spin text-sm" />
              ) : (
                <FaTicketAlt />
              )}
              Lookup
            </button>
          </form>

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 max-w-md mx-auto"
            >
              <FaExclamationTriangle />
              {errorMessage}
            </motion.div>
          )}
        </div>

        {/* Success Screen after redemption */}
        {redemptionSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-emerald-500/30 shadow-2xl text-center max-w-xl mx-auto"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner animate-bounce">
              <FaCheckCircle />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
              RESERVATION LOCKED & CONFIRMED
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              You're Going on an Escape!
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Your gift voucher has been redeemed. We have locked in your slot with the landowner.
            </p>

            {/* Booking Details Pill */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Reference:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {redemptionSuccess.booking?._id || redemptionSuccess.bookingId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Experience / Plot:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {itemTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reserved Date:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {new Date(selectedDate).toLocaleDateString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Window:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedStartTime} – {calculatedEndTime} ({duration} hrs)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-600">
                  ₹0 (Prepaid via Gift Voucher)
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/my-bookings")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <FaCalendarAlt />
                View in My Bookings
              </button>
              <button
                onClick={() => navigate("/my-gifts")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all"
              >
                Go to My Gifts
              </button>
            </div>
          </motion.div>
        ) : voucherData ? (
          /* Voucher Details & Redemption Interface */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Card: Gift Voucher Showcase */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
                {/* Image Showcase */}
                <div className="relative h-60 w-full overflow-hidden bg-slate-800">
                  <img
                    src={getImageUrl(itemImg)}
                    alt={itemTitle}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=60";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                  {/* Ribbon */}
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white font-bold text-xs shadow-lg">
                    <FaGift className="text-white text-xs" />
                    Verified Gift Voucher
                  </div>

                  <div className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white font-bold text-xs border border-white/20">
                    Value: ₹{(voucherData.giftAmount || 0).toLocaleString("en-IN")}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                      {voucherData.experience ? "Curated Experience Package" : "Private Plot Rental"}
                    </span>
                    <h2 className="text-2xl font-black">{itemTitle}</h2>
                    {locationStr && (
                      <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                        <FaMapMarkerAlt className="text-emerald-400" />
                        {locationStr}
                      </p>
                    )}
                  </div>
                </div>

                {/* Voucher Content & Sender Note */}
                <div className="p-6 space-y-6">
                  {/* Sender Greeting Message Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/60 dark:border-amber-900/40">
                    <div className="flex items-center justify-between text-xs text-amber-900/80 dark:text-amber-200/80 mb-2 font-medium">
                      <span>
                        Gifted to <strong className="text-amber-900 dark:text-amber-100">{voucherData.recipientName}</strong>
                      </span>
                      <span>
                        From <strong className="text-amber-900 dark:text-amber-100">{voucherData.senderName || "A Loved One"}</strong>
                      </span>
                    </div>

                    <div className="text-sm font-medium italic text-slate-800 dark:text-slate-100 relative pl-4 border-l-2 border-amber-400 my-2">
                      “{voucherData.personalMessage || "Enjoy this peaceful outdoor escape on Thikana!"}”
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                      <FaEnvelope className="text-[10px]" />
                      Locked to recipient email: <strong className="font-mono">{voucherData.recipientEmailMasked}</strong>
                    </div>
                  </div>

                  {/* Included Perks & Amenities */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                      Included With This Gift
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200/60 dark:border-emerald-900/50">
                        <FaClock className="text-emerald-500" />
                        {voucherData.durationHours} Hours Dedicated Access
                      </span>

                      {/* Experience Included Amenities */}
                      {(voucherData.experience?.includedAmenities || []).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1"
                        >
                          <FaCheck className="text-emerald-500 text-[10px]" />
                          {amenity}
                        </span>
                      ))}

                      {/* Bundled Add-ons */}
                      {(voucherData.selectedAddOns || []).map((addon, idx) => (
                        <span
                          key={`addon-${idx}`}
                          className="px-3 py-1 rounded-xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1 border border-amber-300/40"
                        >
                          <FaStar className="text-amber-500 text-[10px]" />
                          + {addon.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Voucher Rules / Expiration */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <FaCalendarAlt className="text-emerald-500" />
                      Valid through:{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {new Date(voucherData.validUntil).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </strong>
                    </span>

                    <span className="font-mono text-slate-400 text-[11px]">
                      {voucherData.voucherCode}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Scheduling & Instant Confirmation */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <FaCalendarAlt className="text-emerald-500" />
                    Select Date & Time Slot
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Prepaid: ₹0 Due
                  </span>
                </div>

                {voucherData.status !== "active" ? (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
                    <strong className="block font-bold mb-1">
                      This voucher is {voucherData.status.replace("_", " ")}.
                    </strong>
                    {voucherData.status === "redeemed"
                      ? "This voucher has already been redeemed for a booking."
                      : "This voucher has expired or is no longer redeemable."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Date Selector */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Reservation Date
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        max={new Date(voucherData.validUntil).toISOString().split("T")[0]}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Any available day before{" "}
                        {new Date(voucherData.validUntil).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Start Time Selector */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Start Time
                      </label>
                      <select
                        value={selectedStartTime}
                        onChange={(e) => setSelectedStartTime(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {[
                          "08:00",
                          "09:00",
                          "10:00",
                          "11:00",
                          "12:00",
                          "13:00",
                          "14:00",
                          "15:00",
                          "16:00",
                          "17:00",
                          "18:00",
                          "19:00",
                        ].map((time) => (
                          <option key={time} value={time}>
                            {time} (Session ends at{" "}
                            {String(Number(time.split(":")[0]) + duration).padStart(2, "0")}:00)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Slot Availability Live Indicator */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                      {slotChecking ? (
                        <div className="flex items-center gap-2 text-slate-500">
                          <FaSpinner className="animate-spin text-emerald-500" />
                          Checking landowner availability calendar...
                        </div>
                      ) : slotAvailable ? (
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                          <FaCheckCircle className="text-emerald-500 shrink-0" />
                          <span>
                            Slot Available! <strong>{selectedStartTime} – {calculatedEndTime}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
                          <FaExclamationTriangle className="text-rose-500 shrink-0" />
                          <span>{slotConflictMsg}</span>
                        </div>
                      )}
                    </div>

                    {/* Recipient Account Check Warning */}
                    {!user ? (
                      <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 space-y-2">
                        <div className="flex items-center gap-2 font-bold">
                          <FaLock className="text-blue-500" />
                          Sign In with Recipient Email
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          To protect against unauthorized voucher use, sign in with your account linked to:{" "}
                          <strong className="font-mono">{voucherData.recipientEmailMasked}</strong>.
                        </p>
                        <button
                          onClick={() => {
                            if (setAuthMode) setAuthMode("login");
                            if (setShowAuthModal) setShowAuthModal(true);
                          }}
                          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-sm"
                        >
                          Sign In / Register
                        </button>
                      </div>
                    ) : user.email.toLowerCase().trim() !== voucherData.recipientEmailMasked &&
                      !voucherData.recipientEmailMasked.includes(user.email.slice(-4)) ? (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                        <FaUserCheck className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Logged in as {user.email}</span>
                          <span className="text-[11px]">
                            Make sure your account email matches the gift recipient: {voucherData.recipientEmailMasked}.
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Redemption Action Button */}
                    <button
                      onClick={handleRedeem}
                      disabled={redeeming || !slotAvailable || slotChecking}
                      className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {redeeming ? (
                        <>
                          <FaSpinner className="animate-spin text-base" />
                          Locking in your Reservation...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="text-base" />
                          Confirm & Lock Reservation (₹0 Due)
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-center text-slate-400">
                      No credit card or payment needed. Instant host slot confirmation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default RedeemGift;
