import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaBan,
  FaSpinner,
  FaExclamationTriangle,
  FaCompass,
  FaMagic,
  FaCheck,
  FaTimes,
  FaCreditCard,
  FaGift,
  FaArrowRight,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { getImageUrl } from "../utils/imageHelper";
import { BookingListSkeleton } from "../components/common/SkeletonLoader";
import { openRazorpayModal } from "../utils/razorpay";

const MyBookings = () => {
  const { user, openAuthModal } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [acceptingQuoteKey, setAcceptingQuoteKey] = useState(null);
  const [payingBookingId, setPayingBookingId] = useState(null);

  const fetchBookings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await API.get("/bookings/mine");
      const data = Array.isArray(response.data) ? response.data : [];
      setBookings(data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load your reservations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      setCancellingId(bookingId);
      await API.patch(`/bookings/${bookingId}/status`, {
        status: "cancelled",
      });

      toast.success("Booking cancelled successfully.");

      // Update booking in local state
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: "cancelled" } : b
        )
      );
    } catch (err) {
      console.error("Cancellation error:", err);
      toast.error(
        err.response?.data?.message || "Failed to cancel booking. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleAcceptCustomQuote = async (bookingId, index) => {
    const quoteKey = `${bookingId}-${index}`;
    try {
      setAcceptingQuoteKey(quoteKey);
      const response = await API.patch(
        `/bookings/${bookingId}/custom-request/${index}/accept`
      );

      const updated = response.data?.data || response.data;
      toast.success(
        response.data?.message || "Quote accepted! Booking total has been updated."
      );

      // Update in local state
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? updated : b))
      );
    } catch (err) {
      console.error("Error accepting custom quote:", err);
      toast.error(
        err.response?.data?.message || "Failed to accept quote. Please try again."
      );
    } finally {
      setAcceptingQuoteKey(null);
    }
  };

  // Pay-after-approval: Trigger Razorpay Checkout flow
  const handlePayBooking = async (booking) => {
    try {
      setPayingBookingId(booking._id);

      // 1. Create Razorpay order on server
      const response = await API.post("/payments/create-order", {
        bookingId: booking._id,
      });

      const orderData = response.data;

      // 2. Open Razorpay modal
      await openRazorpayModal({
        orderData,
        onSuccess: async (paymentDetails) => {
          try {
            // 3. Cryptographically verify signature server-side
            const verifyRes = await API.post("/payments/verify", {
              bookingId: booking._id,
              ...paymentDetails,
            });

            toast.success("Payment verified! Your booking is locked in and confirmed.");

            const updatedBooking = verifyRes.data?.data || verifyRes.data;
            setBookings((prev) =>
              prev.map((b) =>
                b._id === booking._id
                  ? {
                      ...b,
                      status: "confirmed",
                      paymentStatus: "paid",
                      amountPaid: updatedBooking.amountPaid || b.totalPrice,
                      paidAt: updatedBooking.paidAt || new Date().toISOString(),
                    }
                  : b
              )
            );
          } catch (verifyErr) {
            console.error("Payment verification error:", verifyErr);
            if (!verifyErr.response) {
              toast.error(
                "Network disconnected during verification. Please do not re-pay immediately — check your connection or refresh the page."
              );
            } else {
              toast.error(
                verifyErr.response?.data?.message ||
                  "Payment verification failed. Please contact support."
              );
            }
            setBookings((prev) =>
              prev.map((b) =>
                b._id === booking._id ? { ...b, paymentStatus: "failed" } : b
              )
            );
          }
        },
        onDismiss: () => {
          toast.info(
            "Payment window closed. Your reservation remains approved, so you can complete payment anytime!"
          );
        },
        onError: (err) => {
          console.error("Razorpay error:", err);
          const failureReason =
            err?.description || err?.message || "Payment was declined or cancelled.";
          toast.error(`${failureReason} You can retry with another payment method or UPI.`);
          setBookings((prev) =>
            prev.map((b) =>
              b._id === booking._id ? { ...b, paymentStatus: "failed" } : b
            )
          );
        },
      });
    } catch (err) {
      console.error("Error initiating payment:", err);
      toast.error(
        err.response?.data?.message ||
          "Could not initialize checkout. Please check host approval and try again."
      );
    } finally {
      setPayingBookingId(null);
    }
  };

  const getStatusBadge = (status, paymentStatus) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            <FaCheckCircle /> Confirmed & Paid
          </span>
        );
      case "approved":
        if (paymentStatus === "failed") {
          return (
            <span className="flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-200">
              <FaExclamationTriangle className="text-rose-600" /> Payment Failed — Retry Available
            </span>
          );
        }
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800 border border-indigo-200">
            <FaCreditCard className="text-indigo-600 animate-pulse" /> Approved — Awaiting Payment
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
            <FaBan /> Cancelled
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
            <FaTimesCircle /> Declined by Host
          </span>
        );
      case "expired":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
            <FaHourglassHalf /> Expired
          </span>
        );
      case "pending":
      default:
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            <FaHourglassHalf /> Pending Host Review
          </span>
        );
    }
  };

  const placeholderImage =
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <Navbar />

        <div className="max-w-6xl mx-auto px-6 py-12 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              My Reservations
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Track, review, and manage your booked plots and scenic outdoor stays.
            </p>
          </div>

          {/* Referral & Wallet Banner Card */}
          {user && (
            <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 p-6 sm:p-7 text-white shadow-xl border border-emerald-500/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xl">
                    <FaGift />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-base sm:text-lg">
                        Invite Friends & Earn ₹200 Each
                      </span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                        Wallet: ₹{user.walletBalance ?? 0}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300 max-w-xl leading-relaxed">
                      Share your unique referral link with friends. When they complete their first outdoor reservation, you both receive ₹200 in Thikana credits!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <Link
                    to="/referrals"
                    className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 shadow-md shadow-emerald-900/40"
                  >
                    <span>View Referral Hub</span>
                    <FaArrowRight size={10} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Not logged in State */}
          {!user && (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <FaCompass className="mx-auto text-4xl text-emerald-500 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900">
                Sign in to view your bookings
              </h2>
              <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                Log into your Thikana account to view your upcoming itineraries, custom amenity add-ons, and payment receipts.
              </p>
              <button
                onClick={() => openAuthModal("login")}
                className="mt-6 rounded-full bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition"
              >
                Sign In / Sign Up
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {user && loading && (
            <div className="py-4">
              <BookingListSkeleton count={3} />
            </div>
          )}

          {/* Error State */}
          {user && !loading && error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center my-6">
              <FaExclamationTriangle className="mx-auto text-3xl text-rose-500" />
              <h3 className="mt-3 text-lg font-semibold text-rose-800">
                Unable to load reservations
              </h3>
              <p className="mt-1 text-sm text-rose-600">{error}</p>
              <button
                onClick={fetchBookings}
                className="mt-4 rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-rose-500"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty Bookings State */}
          {user && !loading && !error && bookings.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
              <FaCalendarAlt className="mx-auto text-5xl text-slate-300 mb-4" />
              <h3 className="text-2xl font-bold text-slate-800">
                No Bookings Yet
              </h3>
              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                You haven't reserved any scenic spots yet. Discover curated nature retreats and book your first stay!
              </p>
              <Link
                to="/listings"
                className="mt-6 inline-block rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-600"
              >
                Explore Destinations
              </Link>
            </div>
          )}

          {/* Bookings List */}
          {user && !loading && !error && bookings.length > 0 && (
            <div className="space-y-6">
              {bookings.map((booking) => {
                const spot = booking.spot;
                const spotTitle = spot?.title || "Scenic Spot";
                const spotLocation = spot?.location || "Location not specified";
                const imageUrl = getImageUrl(spot?.image);

                const bookingDateStr = booking.date
                  ? new Date(booking.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Date not specified";

                const isPending = booking.status === "pending";

                return (
                  <motion.div
                    key={booking._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md lg:p-8"
                  >
                    <div className="grid gap-6 md:grid-cols-12 items-center">
                      {/* Thumbnail Image */}
                      <div className="md:col-span-3">
                        <div className="h-44 w-full overflow-hidden rounded-2xl bg-slate-100">
                          <img
                            src={imageUrl}
                            alt={spotTitle}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src = placeholderImage;
                            }}
                          />
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="md:col-span-6 space-y-3">
                        <div className="flex items-center gap-3">
                          {getStatusBadge(booking.status)}
                          <span className="text-xs text-slate-400">
                            Booked on {new Date(booking.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900">
                          {spotTitle}
                        </h3>

                        <p className="flex items-center gap-1.5 text-xs text-slate-600">
                          <FaMapMarkerAlt className="text-emerald-500" />
                          {spotLocation}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 pt-1">
                          <span className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5">
                            <FaCalendarAlt className="text-emerald-600" />
                            {bookingDateStr}
                          </span>

                          <span className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5">
                            <FaClock className="text-emerald-600" />
                            {booking.startTime} - {booking.endTime} ({booking.durationHours || 1}h)
                          </span>
                        </div>

                        {/* Selected Amenities Pills */}
                        {booking.selectedAmenities &&
                          booking.selectedAmenities.length > 0 && (
                            <div className="pt-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Add-on Amenities:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {booking.selectedAmenities.map((amenity, idx) => {
                                  const name =
                                    typeof amenity === "string"
                                      ? amenity
                                      : amenity.name || `Amenity #${idx + 1}`;
                                  return (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-100"
                                    >
                                      <FaCheckCircle size={10} className="text-emerald-500" />
                                      {name}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                        {/* Attached Food Order (if any) */}
                        {booking.foodOrder &&
                          booking.foodOrder.items &&
                          booking.foodOrder.items.length > 0 && (
                            <div className="pt-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
                                🍽️ Food Order ({booking.foodOrder.restaurantName || "Local Cafe"} • ₹{booking.foodOrder.subtotal}):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {booking.foodOrder.items.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 border border-amber-200"
                                  >
                                    {item.quantity}× {item.name} (₹{item.price * item.quantity})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Custom Requests (Special Requests outside catalog) */}
                        {booking.customRequests &&
                          booking.customRequests.length > 0 && (
                            <div className="pt-3 border-t border-slate-100 mt-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5 mb-2">
                                <FaMagic size={11} /> Special Requests ({booking.customRequests.length}):
                              </span>
                              <div className="space-y-2">
                                {booking.customRequests.map((cr, idx) => {
                                  const quoteKey = `${booking._id}-${idx}`;
                                  const isPending = cr.ownerResponse === "pending";
                                  const isRejected = cr.ownerResponse === "rejected";
                                  const isApproved = cr.ownerResponse === "approved";
                                  const isAccepted = cr.customerAccepted;
                                  const isAccepting = acceptingQuoteKey === quoteKey;

                                  return (
                                    <div
                                      key={idx}
                                      className="rounded-xl border border-purple-200/70 bg-purple-50/40 p-3 text-xs"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div>
                                          <p className="font-bold text-slate-800">
                                            “{cr.description}”
                                          </p>
                                          {isPending && (
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                              Host is reviewing your request. Price will be quoted shortly.
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                          {isPending && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[11px] font-bold animate-pulse">
                                              <FaHourglassHalf size={10} /> Pending Host Review
                                            </span>
                                          )}

                                          {isRejected && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-1 text-[11px] font-bold">
                                              <FaTimes size={10} /> Declined by Host
                                            </span>
                                          )}

                                          {isApproved && isAccepted && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-bold">
                                              <FaCheck size={10} /> Quote Accepted (+₹{cr.ownerQuotedPrice || 0})
                                            </span>
                                          )}

                                          {isApproved && !isAccepted && (
                                            <div className="flex items-center gap-2">
                                              <span className="font-extrabold text-purple-900 bg-purple-100 px-2.5 py-1 rounded-lg text-xs">
                                                Quote: ₹{cr.ownerQuotedPrice || 0}
                                              </span>
                                              <button
                                                type="button"
                                                disabled={isAccepting}
                                                onClick={() => handleAcceptCustomQuote(booking._id, idx)}
                                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 text-xs font-bold transition shadow-xs disabled:opacity-50"
                                              >
                                                {isAccepting ? (
                                                  <FaSpinner className="animate-spin" size={10} />
                                                ) : (
                                                  <FaCheck size={10} />
                                                )}
                                                {isAccepting
                                                  ? "Accepting..."
                                                  : `Accept Quote (+₹${cr.ownerQuotedPrice || 0})`}
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Pricing & Actions */}
                      <div className="md:col-span-3 flex flex-col justify-between items-start md:items-end border-t border-slate-100 pt-4 md:border-t-0 md:pt-0">
                        <div className="md:text-right">
                          <span className="text-xs uppercase tracking-wider text-slate-400 block font-semibold">
                            Total Charged
                          </span>
                          <span className="text-2xl font-extrabold text-emerald-600">
                            ₹{booking.totalPrice?.toLocaleString()}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 w-full md:w-auto">
                          {spot?._id && (
                            <Link
                              to={`/plot/${spot._id}`}
                              className="rounded-xl border border-slate-200 px-4 py-2 text-center text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                              View Spot Details
                            </Link>
                          )}

                          {/* Pay / Retry Button for Approved Reservations */}
                          {booking.status === "approved" && (
                            <button
                              disabled={payingBookingId === booking._id}
                              onClick={() => handlePayBooking(booking)}
                              className={`rounded-xl px-5 py-2.5 text-xs font-extrabold shadow-md flex items-center justify-center gap-2 transition hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 ${
                                booking.paymentStatus === "failed"
                                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 text-white"
                                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 text-white"
                              }`}
                            >
                              {payingBookingId === booking._id ? (
                                <FaSpinner className="animate-spin" size={12} />
                              ) : (
                                <FaCreditCard size={12} />
                              )}
                              <span>
                                {booking.paymentStatus === "failed" ? "Retry Payment" : "Pay & Confirm"} (₹{booking.totalPrice?.toLocaleString()})
                              </span>
                            </button>
                          )}

                          {(isPending || booking.status === "approved") && (
                            <button
                              disabled={cancellingId === booking._id}
                              onClick={() => handleCancelBooking(booking._id)}
                              className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {cancellingId === booking._id && (
                                <FaSpinner className="animate-spin" size={12} />
                              )}
                              Cancel Reservation
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MyBookings;
