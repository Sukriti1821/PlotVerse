import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaEnvelope,
  FaCheck,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaBan,
  FaSpinner,
  FaExclamationTriangle,
  FaShieldAlt,
  FaUsers,
  FaFilter,
  FaMagic,
  FaImages,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import HostNavHeader from "../components/owner/HostNavHeader";
import SpotManageModal from "../components/owner/SpotManageModal";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { getImageUrl } from "../utils/imageHelper";
import { BookingListSkeleton } from "../components/common/SkeletonLoader";
import { FiMessageSquare } from "react-icons/fi";
import BookingChatModal from "../components/chat/BookingChatModal";

const OwnerBookings = () => {
  const { user, openAuthModal } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSpotId, setSelectedSpotId] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);
  
  // State for Spot Manage Modal
  const [isSpotModalOpen, setIsSpotModalOpen] = useState(false);
  const [spotToEdit, setSpotToEdit] = useState(null);

  // State for Custom Request quotes input: { [`${bookingId}-${idx}`]: price }
  const [customQuotes, setCustomQuotes] = useState({});
  const [respondingReqKey, setRespondingReqKey] = useState(null);

  // Feature 10: Corporate RFP Quoting Modal State
  const [isCorpQuoteModalOpen, setIsCorpQuoteModalOpen] = useState(false);
  const [quotingCorpBooking, setQuotingCorpBooking] = useState(null);
  const [corpQuoteAmount, setCorpQuoteAmount] = useState("");
  const [corpQuotePerHead, setCorpQuotePerHead] = useState("");
  const [corpQuoteNotes, setCorpQuoteNotes] = useState("");
  const [corpQuoteTerms, setCorpQuoteTerms] = useState("");
  const [submittingCorpQuote, setSubmittingCorpQuote] = useState(false);

  const isOwner = user && (user.role === "owner" || user.role === "admin");

  const fetchOwnerBookings = useCallback(async () => {
    if (!isOwner) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await API.get("/bookings/owner");
      const data = Array.isArray(response.data) ? response.data : [];
      setBookings(data);
    } catch (err) {
      console.error("Error fetching owner bookings:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load host reservations. Please verify your host account."
      );
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    fetchOwnerBookings();
  }, [fetchOwnerBookings]);

  // Handle Accept (Confirm) or Reject
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      setActionLoadingId(bookingId);
      await API.patch(`/bookings/${bookingId}/status`, {
        status: newStatus,
      });

      toast.success(
        newStatus === "approved"
          ? "Reservation approved! Awaiting guest payment."
          : newStatus === "confirmed"
          ? "Reservation confirmed and locked in!"
          : "Reservation rejected.",
        { autoClose: 3500 }
      );

      // Optimistically update local state
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: newStatus } : b
        )
      );
    } catch (err) {
      console.error(`Status update error (${newStatus}):`, err);
      toast.error(
        err.response?.data?.message ||
          `Failed to update booking to ${newStatus}.`
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Owner Response to Custom Request (Approve with Price / Reject)
  const handleRespondCustomRequest = async (bookingId, index, ownerResponse) => {
    const reqKey = `${bookingId}-${index}`;
    try {
      setRespondingReqKey(reqKey);
      const quotedPrice = Number(customQuotes[reqKey]) || 0;

      await API.patch(
        `/bookings/${bookingId}/custom-request/${index}`,
        {
          ownerResponse,
          ownerQuotedPrice: quotedPrice,
        }
      );

      toast.success(
        ownerResponse === "approved"
          ? `Custom request approved with quote ₹${quotedPrice}!`
          : "Custom request declined.",
        { autoClose: 3500 }
      );

      // Optimistically update
      setBookings((prev) =>
        prev.map((b) => {
          if (b._id !== bookingId) return b;
          const updatedCustom = [...(b.customRequests || [])];
          if (updatedCustom[index]) {
            updatedCustom[index] = {
              ...updatedCustom[index],
              ownerResponse,
              ownerQuotedPrice: quotedPrice,
            };
          }
          return { ...b, customRequests: updatedCustom };
        })
      );
    } catch (err) {
      console.error("Custom request quote error:", err);
      toast.error("Failed to update custom request.");
    } finally {
      setRespondingReqKey(null);
    }
  };

  // Feature 10: Open Corporate Quoting Modal
  const openCorporateQuoteModal = (b) => {
    setQuotingCorpBooking(b);
    const existingQuote = b.corporateDetails?.quoteDetails;
    setCorpQuoteAmount(existingQuote?.quotedAmount || b.totalPrice || "");
    setCorpQuotePerHead(
      existingQuote?.quotedPerHeadPrice ||
        Math.round((b.totalPrice || 0) / (b.corporateDetails?.attendeesCount || b.guests || 1)) ||
        ""
    );
    setCorpQuoteNotes(
      existingQuote?.quoteNotes ||
        "Tailored corporate package including venue setup, Wi-Fi, and team facilities."
    );
    setCorpQuoteTerms(
      existingQuote?.termsAndInclusions?.join(", ") ||
        "Exclusive Plot Access, Dedicated High-Speed Wi-Fi, Projector Setup, Refreshments"
    );
    setIsCorpQuoteModalOpen(true);
  };

  // Feature 10: Submit Landowner Quote
  const handleSendCorporateQuote = async (e) => {
    e.preventDefault();
    if (!quotingCorpBooking) return;
    try {
      setSubmittingCorpQuote(true);
      const termsArray = corpQuoteTerms
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await API.post(`/corporate/quote/${quotingCorpBooking._id}`, {
        quotedAmount: Number(corpQuoteAmount),
        quotedPerHeadPrice: Number(corpQuotePerHead),
        quoteNotes: corpQuoteNotes,
        termsAndInclusions: termsArray,
      });

      if (res.data?.success) {
        toast.success("Corporate quote delivered to client!");
        setIsCorpQuoteModalOpen(false);
        fetchOwnerBookings();
      }
    } catch (err) {
      console.error("Failed to send quote:", err);
      toast.error(err.response?.data?.message || "Failed to submit quote.");
    } finally {
      setSubmittingCorpQuote(false);
    }
  };

  // Distinct spots for dropdown filtering
  const distinctSpots = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => {
      if (b.spot?._id) {
        map.set(b.spot._id, b.spot.title || "Unnamed Spot");
      }
    });
    return Array.from(map.entries());
  }, [bookings]);

  // Status counts for tab badges
  const counts = useMemo(() => {
    const map = {
      all: bookings.length,
      pending: 0,
      approved: 0,
      confirmed: 0,
      rejected: 0,
      cancelled: 0,
      corporate: 0,
    };
    bookings.forEach((b) => {
      if (map[b.status] !== undefined) {
        map[b.status]++;
      }
      if (b.isCorporate) {
        map.corporate++;
      }
    });
    return map;
  }, [bookings]);

  // Filter bookings by status and spot
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchStatus =
        activeTab === "all"
          ? true
          : activeTab === "corporate"
          ? b.isCorporate
          : b.status === activeTab;
      const matchSpot =
        selectedSpotId === "all" || b.spot?._id === selectedSpotId;
      return matchStatus && matchSpot;
    });
  }, [bookings, activeTab, selectedSpotId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            <FaCheckCircle /> Confirmed & Paid
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800 border border-indigo-200">
            <FaClock className="text-indigo-600 animate-pulse" /> Approved — Awaiting Payment
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
            <FaBan /> Cancelled by Customer
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
            <FaTimesCircle /> Declined
          </span>
        );
      case "quote_requested":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 animate-pulse border border-amber-300">
            <FaHourglassHalf /> Corporate Quote Requested
          </span>
        );
      case "quote_provided":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-300">
            <FaFileInvoiceDollar /> Quote Sent to Company
          </span>
        );
      case "pending":
      default:
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 animate-pulse">
            <FaHourglassHalf /> Pending Decision
          </span>
        );
    }
  };

  const tabs = [
    { id: "all", label: "All Requests", count: counts.all },
    { id: "corporate", label: "🏢 Corporate RFPs", count: counts.corporate, highlight: counts.corporate > 0 },
    { id: "pending", label: "Pending", count: counts.pending, highlight: true },
    { id: "approved", label: "Approved (Awaiting Payment)", count: counts.approved },
    { id: "confirmed", label: "Confirmed & Paid", count: counts.confirmed },
    { id: "rejected", label: "Declined", count: counts.rejected },
    { id: "cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <Navbar />

        <HostNavHeader
          title="Booking Management"
          subtitle="Review and approve incoming reservation requests for your listed properties."
          badge="Host Reservations"
          actions={
            <div className="flex items-center flex-wrap gap-3">
              <button
                onClick={() => {
                  setSpotToEdit(null);
                  setIsSpotModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 text-xs font-bold shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 cursor-pointer"
              >
                <FaImages /> + List a New Spot
              </button>

              {distinctSpots.length > 1 && (
                <div className="flex items-center gap-2 bg-white rounded-2xl p-2 border border-slate-200 shadow-sm">
                  <FaFilter className="text-slate-400 text-xs ml-2" />
                  <select
                    value={selectedSpotId}
                    onChange={(e) => setSelectedSpotId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 outline-none pr-3 py-1 cursor-pointer"
                  >
                    <option value="all">All Properties ({distinctSpots.length})</option>
                    {distinctSpots.map(([id, title]) => (
                      <option key={id} value={id}>
                        {title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          }
        />

        <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">

          {/* Access Control Guard */}
          {!user ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <FaShieldAlt className="mx-auto text-4xl text-emerald-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900">
                Host Authentication Required
              </h2>
              <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                Please log in with your plot owner/host account to manage guest reservations.
              </p>
              <button
                onClick={() => openAuthModal("login")}
                className="mt-6 rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition"
              >
                Sign In as Host
              </button>
            </div>
          ) : !isOwner ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-12 text-center shadow-sm">
              <FaShieldAlt className="mx-auto text-4xl text-amber-600 mb-4" />
              <h2 className="text-2xl font-bold text-amber-900">
                Host Privileges Required
              </h2>
              <p className="mt-2 text-sm text-amber-700 max-w-md mx-auto">
                Your current account is registered as a tourist/guest. Only plot hosts and owners can access this booking approval console.
              </p>
              <Link
                to="/listings"
                className="mt-6 inline-block rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition"
              >
                Explore Destinations
              </Link>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin scrollbar-thumb-slate-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 min-h-[44px] items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        activeTab === tab.id
                          ? "bg-white/20 text-white"
                          : tab.highlight && tab.count > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Loading Skeleton */}
              {loading && (
                <div className="py-4">
                  <BookingListSkeleton count={3} />
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center my-6">
                  <FaExclamationTriangle className="mx-auto text-3xl text-rose-500" />
                  <h3 className="mt-3 text-lg font-semibold text-rose-800">
                    Unable to load reservations
                  </h3>
                  <p className="mt-1 text-sm text-rose-600">{error}</p>
                  <button
                    onClick={fetchOwnerBookings}
                    className="mt-4 rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-rose-500"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && filteredBookings.length === 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
                  <FaCalendarAlt className="mx-auto text-5xl text-slate-300 mb-4" />
                  <h3 className="text-2xl font-bold text-slate-800">
                    No {activeTab === "all" ? "" : activeTab} bookings found
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                    {activeTab === "pending"
                      ? "All pending booking requests have been reviewed!"
                      : "When travelers book your spots, their requests will appear here for your review."}
                  </p>
                  {activeTab !== "all" && (
                    <button
                      onClick={() => setActiveTab("all")}
                      className="mt-6 rounded-full bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 transition"
                    >
                      Show All Bookings
                    </button>
                  )}
                </div>
              )}

              {/* Bookings List */}
              {!loading && !error && filteredBookings.length > 0 && (
                <div className="space-y-6">
                  <AnimatePresence>
                    {filteredBookings.map((booking) => {
                      const spot = booking.spot;
                      const customer = booking.user;
                      const isPending = booking.status === "pending";
                      const isLoadingAction = actionLoadingId === booking._id;

                      const bookingDateStr = booking.date
                        ? new Date(booking.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Date not specified";

                      return (
                        <motion.div
                          key={booking._id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition lg:p-8 ${
                            isPending
                              ? "border-emerald-200 ring-2 ring-emerald-500/10"
                              : "border-slate-200"
                          }`}
                        >
                          <div className="grid gap-6 lg:grid-cols-12 items-start">
                            {/* Spot Image */}
                            <div className="lg:col-span-3">
                              <div className="h-44 w-full overflow-hidden rounded-2xl bg-slate-100">
                                <img
                                  src={getImageUrl(spot?.image)}
                                  alt={spot?.title || "Property"}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </div>

                            {/* Booking Information */}
                            <div className="lg:col-span-6 space-y-3">
                              <div className="flex flex-wrap items-center gap-3">
                                {getStatusBadge(booking.status)}
                                <span className="text-xs text-slate-400">
                                  Received on {new Date(booking.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                  {spot?.title || "Scenic Spot"}
                                </h3>
                                <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                  <FaMapMarkerAlt className="text-emerald-500" />
                                  {spot?.location || "Location not specified"}
                                </p>
                              </div>

                              {/* Customer Details Box */}
                              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                    <FaUser size={12} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800">
                                      {customer?.name || "Customer"}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      {customer?.email || "No email provided"}
                                    </p>
                                  </div>
                                </div>

                                {customer?.email && (
                                  <a
                                    href={`mailto:${customer.email}?subject=Regarding your booking for ${spot?.title}`}
                                    className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-bold text-slate-700 border border-slate-200 hover:bg-slate-100 transition text-[11px]"
                                  >
                                    <FaEnvelope size={11} className="text-emerald-600" /> Message
                                  </a>
                                )}
                              </div>

                              {/* Timing Pills */}
                              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700 pt-1">
                                <span className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5">
                                  <FaCalendarAlt className="text-emerald-600" />
                                  {bookingDateStr}
                                </span>

                                <span className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5">
                                  <FaClock className="text-emerald-600" />
                                  {booking.startTime} - {booking.endTime} ({booking.durationHours || 1}h)
                                </span>

                                <span className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5">
                                  <FaUsers className="text-emerald-600" />
                                  {booking.guests || 1} {booking.guests === 1 ? "Guest" : "Guests"}
                                </span>
                              </div>

                              {/* Selected Amenities List */}
                              {booking.selectedAmenities &&
                                booking.selectedAmenities.length > 0 && (
                                  <div className="pt-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                      Requested Add-ons:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {booking.selectedAmenities.map((amenity, idx) => {
                                        const name =
                                          typeof amenity === "string"
                                            ? amenity
                                            : amenity.name || `Amenity #${idx + 1}`;
                                        const price =
                                          typeof amenity === "object" && amenity.hourlyPrice > 0
                                            ? ` (+₹${amenity.hourlyPrice}/hr)`
                                            : "";

                                        return (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-100"
                                          >
                                            <FaCheckCircle size={10} className="text-emerald-500" />
                                            {name}
                                            {price}
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
                                      🍽️ Guest Food Order ({booking.foodOrder.restaurantName || "Partner Cafe"} • ₹{booking.foodOrder.subtotal}):
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

                              {/* Custom Requests (Outside Catalog) Reviewer */}
                              {booking.customRequests &&
                                booking.customRequests.length > 0 && (
                                  <div className="pt-3 border-t border-slate-100 mt-3">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5 mb-2">
                                      <FaMagic size={11} /> Special Guest Requests ({booking.customRequests.length}):
                                    </span>
                                    <div className="space-y-2">
                                      {booking.customRequests.map((cr, idx) => {
                                        const reqKey = `${booking._id}-${idx}`;
                                        const isPendingReq = cr.ownerResponse === "pending";
                                        const isApproved = cr.ownerResponse === "approved";
                                        const isRejected = cr.ownerResponse === "rejected";
                                        const isRespondingThis = respondingReqKey === reqKey;

                                        return (
                                          <div
                                            key={idx}
                                            className="rounded-xl border border-purple-200/80 bg-purple-50/50 p-3 text-xs"
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <p className="font-bold text-slate-800">
                                                “{cr.description}”
                                              </p>

                                              {/* Status Tag */}
                                              {isApproved && (
                                                <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                                                  <FaCheck size={9} /> Quoted: ₹{cr.ownerQuotedPrice || 0}
                                                  {cr.customerAccepted ? " (Accepted)" : " (Pending Guest)"}
                                                </span>
                                              )}
                                              {isRejected && (
                                                <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-[10px] font-bold">
                                                  <FaTimes size={9} /> Declined
                                                </span>
                                              )}
                                              {isPendingReq && (
                                                <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-bold animate-pulse">
                                                  <FaHourglassHalf size={9} /> Needs Quote
                                                </span>
                                              )}
                                            </div>

                                            {/* Action / Quote form if pending or host wants to re-quote */}
                                            {isPendingReq && (
                                              <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2 border-t border-purple-100">
                                                <div className="relative w-28">
                                                  <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs font-bold">₹</span>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Quote price"
                                                    value={customQuotes[reqKey] !== undefined ? customQuotes[reqKey] : ""}
                                                    onChange={(e) =>
                                                      setCustomQuotes((prev) => ({
                                                        ...prev,
                                                        [reqKey]: e.target.value,
                                                      }))
                                                    }
                                                    className="w-full rounded-lg border border-purple-200 bg-white pl-6 pr-2 py-1 text-xs outline-none focus:border-purple-500 font-bold"
                                                  />
                                                </div>

                                                <button
                                                  disabled={isRespondingThis}
                                                  onClick={() => handleRespondCustomRequest(booking._id, idx, "approved")}
                                                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 text-[11px] font-bold transition shadow-xs disabled:opacity-50"
                                                >
                                                  {isRespondingThis ? "Saving..." : "Approve & Quote"}
                                                </button>

                                                <button
                                                  disabled={isRespondingThis}
                                                  onClick={() => handleRespondCustomRequest(booking._id, idx, "rejected")}
                                                  className="rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50"
                                                >
                                                  Decline
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                            </div>

                              {/* Actions, Revenue & Payout Split */}
                              <div className="lg:col-span-3 flex flex-col justify-between items-start lg:items-end border-t border-slate-100 pt-4 lg:border-t-0 lg:pt-0 w-full">
                                <div className="w-full lg:text-right space-y-2">
                                  {/* Financial Commission & Payout Breakdown */}
                                  <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-3.5 space-y-1.5 text-xs text-slate-600 w-full">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-slate-400 font-semibold">Gross Total:</span>
                                      <span className="font-bold text-slate-800">₹{booking.totalPrice?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 text-emerald-700">
                                      <span className="font-semibold">Platform Fee ({booking.commissionRate || 10}%):</span>
                                      <span className="font-bold">
                                        -₹{(booking.platformCommission || Math.round((booking.totalPrice || 0) * 0.1)).toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between gap-4">
                                      <span className="font-extrabold text-slate-900">Net Host Payout:</span>
                                      <span className="text-base font-black text-emerald-600">
                                        ₹{(booking.ownerPayoutAmount || (booking.totalPrice - (booking.platformCommission || Math.round((booking.totalPrice || 0) * 0.1)))).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Payout Status Badge (for confirmed/paid bookings) */}
                                  {(booking.paymentStatus === "paid" || booking.status === "confirmed") && (
                                    <div className="pt-1">
                                      {booking.payoutStatus === "paid" ? (
                                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-left lg:text-right text-[11px]">
                                          <span className="font-bold text-emerald-800 flex items-center lg:justify-end gap-1">
                                            <FaCheckCircle className="text-emerald-600" /> Payout Settled
                                          </span>
                                          {booking.payoutDate && (
                                            <span className="text-[10px] text-slate-500 block mt-0.5">
                                              Disbursed on {new Date(booking.payoutDate).toLocaleDateString()}
                                            </span>
                                          )}
                                        </div>
                                      ) : booking.payoutStatus === "processing" ? (
                                        <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-left lg:text-right text-[11px]">
                                          <span className="font-bold text-blue-800 flex items-center lg:justify-end gap-1">
                                            <FaClock className="text-blue-600" /> Processing Payout
                                          </span>
                                          <span className="text-[10px] text-slate-500 block mt-0.5">
                                            Bank transfer initiated by platform
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-left lg:text-right text-[11px]">
                                          <span className="font-bold text-amber-800 flex items-center lg:justify-end gap-1">
                                            <FaClock className="text-amber-600" /> Payout Pending
                                          </span>
                                          <span className="text-[10px] text-slate-500 block mt-0.5">
                                            Scheduled for manual admin settlement
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-5 flex flex-col gap-2 w-full">
                                  {isPending ? (
                                    <div className="flex flex-col gap-2">
                                      {booking.isCorporate && (
                                        <button
                                          onClick={() => openCorporateQuoteModal(booking)}
                                          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition cursor-pointer"
                                        >
                                          <FaFileInvoiceDollar size={12} />
                                          {booking.status === "quote_provided" ? "Update Quote" : "Send Custom Quote"}
                                        </button>
                                      )}

                                      <button
                                        disabled={isLoadingAction}
                                        onClick={() => handleUpdateStatus(booking._id, "approved")}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer"
                                      >
                                        {isLoadingAction ? (
                                          <FaSpinner className="animate-spin" />
                                        ) : (
                                          <FaCheck size={12} />
                                        )}
                                        Approve Reservation
                                      </button>

                                      <button
                                        disabled={isLoadingAction}
                                        onClick={() => handleUpdateStatus(booking._id, "rejected")}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50 cursor-pointer"
                                      >
                                        <FaTimes size={12} />
                                        Reject Request
                                      </button>
                                    </div>
                                  ) : booking.status === "approved" ? (
                                    <div className="rounded-xl bg-indigo-50 p-3 text-center border border-indigo-200">
                                      <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center justify-center gap-1">
                                        <FaClock size={11} className="animate-pulse text-indigo-600" /> Awaiting Payment
                                      </p>
                                      <p className="text-xs font-medium text-indigo-600 mt-0.5">
                                        Approved! Waiting for guest payment.
                                      </p>
                                    </div>
                                  ) : booking.status === "confirmed" ? (
                                    <div className="rounded-xl bg-emerald-50 p-3 text-center border border-emerald-200">
                                      <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1">
                                        <FaCheckCircle size={11} className="text-emerald-600" /> Confirmed & Paid
                                      </p>
                                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                                        Guest payment received
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        Status Settled
                                      </p>
                                      <p className="text-xs font-semibold text-slate-700 capitalize mt-0.5">
                                        {booking.status}
                                      </p>
                                    </div>
                                  )}

                                  {/* In-App Direct Message Guest Button */}
                                  <button
                                    type="button"
                                    onClick={() => setChatBooking(booking)}
                                    className="w-full mt-2.5 rounded-xl border border-mist bg-white hover:border-navy px-3 py-2 text-center text-xs font-bold text-navy transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <FiMessageSquare className="text-saffron-text" /> Message Guest
                                  </button>
                                </div>
                              </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Direct In-App Guest Messaging Drawer */}
      <BookingChatModal
        isOpen={!!chatBooking}
        onClose={() => setChatBooking(null)}
        booking={chatBooking}
        recipientName={chatBooking?.user?.name || "Guest"}
        recipientRole="traveler"
      />

      {/* Spot Create / Edit Modal */}
      <SpotManageModal
        isOpen={isSpotModalOpen}
        onClose={() => setIsSpotModalOpen(false)}
        spotToEdit={spotToEdit}
        onSpotSaved={() => {
          fetchOwnerBookings();
        }}
      />

      {/* Feature 10: Landowner Corporate Quoting Modal */}
      <AnimatePresence>
        {isCorpQuoteModalOpen && quotingCorpBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-900"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-100 text-blue-700 text-base">
                    <FaFileInvoiceDollar />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base">
                      Send Quote: {quotingCorpBooking.corporateDetails?.companyName || "Corporate Client"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Attendees: {quotingCorpBooking.corporateDetails?.attendeesCount || quotingCorpBooking.guests} Guests • {quotingCorpBooking.durationHours} Hours
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCorpQuoteModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              <form onSubmit={handleSendCorporateQuote} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Total Quoted Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={corpQuoteAmount}
                      onChange={(e) => {
                        setCorpQuoteAmount(e.target.value);
                        const guests = quotingCorpBooking.corporateDetails?.attendeesCount || quotingCorpBooking.guests || 1;
                        setCorpQuotePerHead(Math.round(Number(e.target.value) / guests));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Per Head Rate (₹)
                    </label>
                    <input
                      type="number"
                      value={corpQuotePerHead}
                      onChange={(e) => setCorpQuotePerHead(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Host Notes / Special Offer Description
                  </label>
                  <textarea
                    rows={2}
                    value={corpQuoteNotes}
                    onChange={(e) => setCorpQuoteNotes(e.target.value)}
                    placeholder="Details about setup, timing, and accommodations"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Terms & Inclusions (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={corpQuoteTerms}
                    onChange={(e) => setCorpQuoteTerms(e.target.value)}
                    placeholder="e.g. Wi-Fi, Projector, Lawn access, Hot lunch"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCorpQuoteModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCorpQuote}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingCorpQuote ? <FaSpinner className="animate-spin" /> : <FaFileInvoiceDollar />}
                    Deliver Quote
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default OwnerBookings;
