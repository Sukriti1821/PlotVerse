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
import { FiMessageSquare, FiShield } from "react-icons/fi";
import BookingChatModal from "../components/chat/BookingChatModal";
import OfflineBookingPassModal from "../components/booking/OfflineBookingPassModal";

const MyBookings = () => {
  const { user, openAuthModal } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [acceptingQuoteKey, setAcceptingQuoteKey] = useState(null);
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);
  const [passBooking, setPassBooking] = useState(null);

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
          <span className="flex items-center gap-1.5 rounded-full bg-pine-mist border border-pine/20 px-3 py-1 text-xs font-bold text-pine">
            <FaCheckCircle /> Confirmed & Paid
          </span>
        );
      case "approved":
        if (paymentStatus === "failed") {
          return (
            <span className="flex items-center gap-1.5 rounded-full bg-danger-mist px-3 py-1 text-xs font-bold text-danger border border-danger/20">
              <FaExclamationTriangle className="text-danger" /> Payment Failed — Retry Available
            </span>
          );
        }
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-pine-mist px-3 py-1 text-xs font-bold text-pine border border-pine/20">
            <FaCreditCard className="text-pine animate-pulse" /> Approved — Awaiting Payment
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-danger-mist px-3 py-1 text-xs font-bold text-danger border border-danger/20">
            <FaBan /> Cancelled
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-danger-mist px-3 py-1 text-xs font-bold text-danger border border-danger/20">
            <FaTimesCircle /> Declined by Host
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 text-xs font-bold text-slate-brand border border-mist">
            <FaCheckCircle /> Completed
          </span>
        );
      case "expired":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 text-xs font-bold text-slate-brand border border-mist">
            <FaHourglassHalf /> Expired
          </span>
        );
      case "pending":
      default:
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-saffron/15 border border-saffron/30 px-3 py-1 text-xs font-bold text-saffron-text">
            <FaHourglassHalf /> Pending Host Review
          </span>
        );
    }
  };

  const placeholderImage =
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop";

  return (
    <div className="min-h-screen bg-snow text-navy flex flex-col justify-between">
      <div>
        <Navbar />

        <div className="max-w-6xl mx-auto px-6 py-12 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-navy">
              My Reservations
            </h1>
            <p className="mt-2 text-sm text-slate-brand">
              Track, review, and manage your booked plots and scenic outdoor stays.
            </p>
          </div>

          {/* Referral & Wallet Banner Card */}
          {user && (
            <div className="mb-8 overflow-hidden rounded-3xl bg-navy p-6 sm:p-7 text-snow shadow-xl border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-saffron text-xl">
                    <FaGift />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-snow text-base sm:text-lg">
                        Invite Friends & Earn ₹200 Each
                      </span>
                      <span className="rounded-full bg-saffron/20 px-2 py-0.5 text-[10px] font-bold text-saffron border border-saffron/30">
                        Wallet: ₹{user.walletBalance ?? 0}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-light-slate max-w-xl leading-relaxed">
                      Share your unique referral link with friends. When they complete their first outdoor reservation, you both receive ₹200 in Thikana credits!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <Link
                    to="/referrals"
                    className="flex items-center gap-2 rounded-full bg-saffron px-5 py-2.5 text-xs font-bold text-navy transition hover:bg-saffron-hover shadow-md active:scale-95"
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
            <div className="rounded-3xl border border-mist bg-white p-12 text-center shadow-sm">
              <FaCompass className="mx-auto text-4xl text-saffron mb-4" />
              <h2 className="text-2xl font-bold text-navy">
                Sign in to view your bookings
              </h2>
              <p className="mt-2 text-sm text-slate-brand max-w-md mx-auto">
                Log into your Thikana account to view your upcoming itineraries, custom amenity add-ons, and payment receipts.
              </p>
              <button
                onClick={() => openAuthModal("login")}
                className="mt-6 rounded-full bg-saffron px-8 py-3 text-sm font-bold text-navy shadow-md hover:bg-saffron-hover transition active:scale-95 cursor-pointer"
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
            <div className="rounded-2xl border border-danger/20 bg-danger-mist p-8 text-center my-6">
              <FaExclamationTriangle className="mx-auto text-3xl text-danger" />
              <h3 className="mt-3 text-lg font-semibold text-danger">
                Unable to load reservations
              </h3>
              <p className="mt-1 text-sm text-slate-brand">{error}</p>
              <button
                onClick={fetchBookings}
                className="mt-4 rounded-full border-2 border-navy text-navy px-5 py-2 text-sm font-semibold hover:bg-navy hover:text-snow cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty Bookings State */}
          {user && !loading && !error && bookings.length === 0 && (
            <div className="rounded-3xl border border-mist bg-white p-16 text-center shadow-sm">
              <FaCalendarAlt className="mx-auto text-5xl text-light-slate mb-4" />
              <h3 className="text-2xl font-bold text-navy">
                No Bookings Yet
              </h3>
              <p className="mt-2 text-sm text-slate-brand max-w-sm mx-auto">
                You haven&apos;t reserved any scenic spots yet. Discover curated nature retreats and book your first stay!
              </p>
              <Link
                to="/listings"
                className="mt-6 inline-block rounded-full border-2 border-navy px-8 py-3 text-sm font-bold text-navy shadow-sm transition hover:bg-navy hover:text-snow"
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
                    className="overflow-hidden rounded-3xl border border-mist bg-white p-6 shadow-sm transition hover:shadow-md lg:p-8"
                  >
                    <div className="grid gap-6 md:grid-cols-12 items-center">
                      {/* Thumbnail Image */}
                      <div className="md:col-span-3">
                        <div className="h-44 w-full overflow-hidden rounded-2xl bg-snow border border-mist">
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
                          {getStatusBadge(booking.status, booking.paymentStatus)}
                          <span className="text-xs text-slate-brand">
                            Booked on {new Date(booking.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-navy">
                          {spotTitle}
                        </h3>

                        <p className="flex items-center gap-1.5 text-xs text-slate-brand">
                          <FaMapMarkerAlt className="text-saffron-text" />
                          {spotLocation}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-navy pt-1">
                          <span className="flex items-center gap-1.5 rounded-xl bg-snow border border-mist px-3 py-1.5">
                            <FaCalendarAlt className="text-navy" />
                            {bookingDateStr}
                          </span>

                          <span className="flex items-center gap-1.5 rounded-xl bg-snow border border-mist px-3 py-1.5">
                            <FaClock className="text-navy" />
                            {booking.startTime} - {booking.endTime} ({booking.durationHours || 1}h)
                          </span>
                        </div>

                        {/* Selected Amenities Pills */}
                        {booking.selectedAmenities &&
                          booking.selectedAmenities.length > 0 && (
                            <div className="pt-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-brand block mb-1">
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
                                      className="inline-flex items-center gap-1 rounded-lg bg-snow px-2.5 py-1 text-[11px] font-semibold text-navy border border-mist"
                                    >
                                      <FaCheckCircle size={10} className="text-pine" />
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
                              <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-text block mb-1">
                                🍽️ Food Order ({booking.foodOrder.restaurantName || "Local Cafe"} • ₹{booking.foodOrder.subtotal}):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {booking.foodOrder.items.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 rounded-lg bg-snow px-2.5 py-1 text-[11px] font-semibold text-navy border border-mist"
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
                            <div className="pt-3 border-t border-mist mt-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-navy flex items-center gap-1.5 mb-2">
                                <FaMagic size={11} className="text-saffron-text" /> Special Requests ({booking.customRequests.length}):
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
                                      className="rounded-xl border border-mist bg-snow p-3 text-xs"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div>
                                          <p className="font-bold text-navy">
                                            “{cr.description}”
                                          </p>
                                          {isPending && (
                                            <p className="text-[11px] text-slate-brand mt-0.5">
                                              Host is reviewing your request. Price will be quoted shortly.
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                          {isPending && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-saffron/15 border border-saffron/30 text-saffron-text px-2.5 py-1 text-[11px] font-bold">
                                              <FaHourglassHalf size={10} /> Pending Host Review
                                            </span>
                                          )}

                                          {isRejected && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-danger-mist border border-danger/20 text-danger px-2.5 py-1 text-[11px] font-bold">
                                              <FaTimes size={10} /> Declined by Host
                                            </span>
                                          )}

                                          {isApproved && isAccepted && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-pine-mist border border-pine/20 text-pine px-2.5 py-1 text-[11px] font-bold">
                                              <FaCheck size={10} /> Quote Accepted (+₹{cr.ownerQuotedPrice || 0})
                                            </span>
                                          )}

                                          {isApproved && !isAccepted && (
                                            <div className="flex items-center gap-2">
                                              <span className="font-extrabold text-navy bg-white border border-mist px-2.5 py-1 rounded-lg text-xs">
                                                Quote: ₹{cr.ownerQuotedPrice || 0}
                                              </span>
                                              <button
                                                type="button"
                                                disabled={isAccepting}
                                                onClick={() => handleAcceptCustomQuote(booking._id, idx)}
                                                className="inline-flex items-center gap-1 rounded-lg bg-saffron hover:bg-saffron-hover text-navy px-3 py-1 text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
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
                      <div className="md:col-span-3 flex flex-col justify-between items-start md:items-end border-t border-mist pt-4 md:border-t-0 md:pt-0">
                        <div className="md:text-right">
                          <span className="text-xs uppercase tracking-wider text-slate-brand block font-semibold">
                            Total Charged
                          </span>
                          <span className="text-2xl font-extrabold text-navy">
                            ₹{booking.totalPrice?.toLocaleString()}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 w-full md:w-auto">
                          {spot?._id && (
                            <Link
                              to={`/plot/${spot._id}`}
                              className="rounded-xl border border-mist px-4 py-2 text-center text-xs font-bold text-navy transition hover:border-navy"
                            >
                              View Spot Details
                            </Link>
                          )}

                          {/* Pay / Retry Button for Approved Reservations */}
                          {booking.status === "approved" && (
                            <button
                              disabled={payingBookingId === booking._id}
                              onClick={() => handlePayBooking(booking)}
                              className="rounded-xl px-5 py-2.5 text-xs font-extrabold shadow-md flex items-center justify-center gap-2 transition hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 bg-saffron hover:bg-saffron-hover text-navy cursor-pointer"
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

                          {/* In-App Direct Message Host Button */}
                          <button
                            type="button"
                            onClick={() => setChatBooking(booking)}
                            className="rounded-xl border border-mist bg-white hover:border-navy px-4 py-2 text-center text-xs font-bold text-navy transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <FiMessageSquare className="text-saffron-text" /> Message Host
                          </button>

                          {/* Offline Mountain Check-in Pass Button */}
                          <button
                            type="button"
                            onClick={() => setPassBooking(booking)}
                            className="rounded-xl bg-navy hover:bg-navy-deep text-white px-4 py-2 text-center text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <FiShield className="text-saffron" /> Offline Mountain Pass
                          </button>

                          {(isPending || booking.status === "approved") && (
                            <button
                              disabled={cancellingId === booking._id}
                              onClick={() => handleCancelBooking(booking._id)}
                              className="rounded-xl bg-danger-mist border border-danger/20 px-4 py-2 text-xs font-bold text-danger transition hover:bg-danger/10 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
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

      {/* In-App Host Message Drawer */}
      <BookingChatModal
        isOpen={!!chatBooking}
        onClose={() => setChatBooking(null)}
        booking={chatBooking}
        recipientName={chatBooking?.spot?.owner?.name || "Himalayan Host"}
        recipientRole="host"
      />

      {/* Offline Mountain Check-in Pass Modal */}
      <OfflineBookingPassModal
        isOpen={!!passBooking}
        onClose={() => setPassBooking(null)}
        booking={passBooking}
      />

      <Footer />
    </div>
  );
};

export default MyBookings;
