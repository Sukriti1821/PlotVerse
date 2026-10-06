import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaBuilding,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaUtensils,
  FaTv,
  FaTag,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaSave,
  FaArrowRight,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { getImageUrl } from "../utils/imageHelper";

const CorporateBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("bookings"); // 'bookings' | 'profile'
  const [corporateBookings, setCorporateBookings] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Profile Edit State
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [companySize, setCompanySize] = useState("11-50");
  const [billingAddress, setBillingAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, orgRes] = await Promise.all([
        API.get("/corporate/my-bookings"),
        API.get("/corporate/organization"),
      ]);

      if (bookingsRes.data?.data) {
        setCorporateBookings(bookingsRes.data.data);
      }
      if (orgRes.data?.data) {
        const o = orgRes.data.data;
        setOrganization(o);
        setCompanyName(o.name || "");
        setGstin(o.gstin || "");
        setIndustry(o.industry || "Technology");
        setCompanySize(o.companySize || "11-50");
        setBillingAddress(o.billingAddress || "");
        setContactEmail(o.contactEmail || "");
        setContactPhone(o.contactPhone || "");
        setWebsite(o.website || "");
      }
    } catch (err) {
      console.error("Failed to load corporate bookings:", err);
      toast.error("Could not load corporate dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle Accept Host Quote
  const handleAcceptQuote = async (bookingId) => {
    try {
      setActionLoadingId(bookingId);
      const res = await API.post(`/corporate/accept-quote/${bookingId}`);
      if (res.data?.success) {
        toast.success("Quote accepted! Your corporate event is officially confirmed.");
        fetchData();
      }
    } catch (err) {
      console.error("Accept quote error:", err);
      toast.error(err.response?.data?.message || "Failed to accept quote.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Decline Host Quote
  const handleDeclineQuote = async (bookingId) => {
    const reason = window.prompt("Reason for declining quote (optional):");
    try {
      setActionLoadingId(bookingId);
      const res = await API.post(`/corporate/decline-quote/${bookingId}`, { reason });
      if (res.data?.success) {
        toast.info("Quote declined and booking request closed.");
        fetchData();
      }
    } catch (err) {
      console.error("Decline quote error:", err);
      toast.error(err.response?.data?.message || "Failed to decline quote.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Save Organization Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await API.post("/corporate/organization", {
        companyName,
        gstin,
        industry,
        companySize,
        billingAddress,
        contactEmail,
        contactPhone,
        website,
      });

      if (res.data?.success) {
        setOrganization(res.data.data);
        toast.success("Organization profile saved successfully!");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      toast.error(err.response?.data?.message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "quote_requested":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/50">
            <FaHourglassHalf className="animate-spin text-[10px]" />
            Awaiting Landowner Quote
          </span>
        );
      case "quote_provided":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300/50 animate-pulse">
            <FaFileInvoiceDollar />
            Quote Received (Action Needed)
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/50">
            <FaCheckCircle />
            Confirmed & Schedule Locked
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/50">
            <FaTimesCircle />
            Cancelled / Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-8 mb-8 border border-emerald-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2 border border-emerald-500/30">
              <FaBuilding />
              Corporate Events Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {organization?.name || "Corporate Outings & RFPs"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {organization?.gstin ? `GSTIN: ${organization.gstin} • ` : ""}
              Manage team off-sites, custom quotes, and billing details.
            </p>
          </div>

          <Link
            to="/corporate"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
          >
            <FaBuilding /> Browse Corporate Spaces
          </Link>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition ${
              activeTab === "bookings"
                ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Events & Quotes ({corporateBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition ${
              activeTab === "profile"
                ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Company Profile & Invoicing
          </button>
        </div>

        {/* Tab 1: Bookings & Quotes Listing */}
        {activeTab === "bookings" ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FaSpinner className="animate-spin text-3xl text-emerald-500 mb-3" />
              <p className="text-xs text-slate-500">Loading corporate events...</p>
            </div>
          ) : corporateBookings.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl mx-auto">
              <FaFileInvoiceDollar className="text-4xl text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="font-bold text-lg">No corporate requests found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
                You haven't requested any corporate off-sites or quotes yet. Discover private outdoor estates equipped for teams.
              </p>
              <Link
                to="/corporate"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
              >
                Plan a Corporate Event
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {corporateBookings.map((b) => {
                const itemTitle = b.experience?.title || b.spot?.title || "Corporate Event";
                const itemImg = b.experience?.image || b.spot?.images?.[0];
                const quote = b.corporateDetails?.quoteDetails;
                const isQuoteProvided = b.status === "quote_provided" && quote?.quotedAmount;

                return (
                  <div
                    key={b._id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden ${
                      isQuoteProvided
                        ? "border-blue-400 dark:border-blue-500/60 shadow-lg shadow-blue-500/10"
                        : "border-slate-200 dark:border-slate-800 shadow-sm"
                    }`}
                  >
                    <div className="p-6">
                      {/* Top Row: Title, Status, and Date */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-start gap-4">
                          <img
                            src={getImageUrl(itemImg)}
                            alt={itemTitle}
                            className="w-16 h-16 rounded-xl object-cover bg-slate-800 shrink-0"
                            onError={(e) => {
                              e.target.src =
                                "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=60";
                            }}
                          />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                              {b.corporateDetails?.eventType?.replace("_", " ") || "Corporate Event"}
                            </span>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                              {itemTitle}
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <FaMapMarkerAlt className="text-emerald-500" />
                              {b.spot?.location || "Private Retreat Location"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-1">
                          {getStatusBadge(b.status)}
                          <span className="text-[11px] text-slate-400 font-mono">
                            Ref: {b._id}
                          </span>
                        </div>
                      </div>

                      {/* Event Details Grid */}
                      <div className="py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Event Date</span>
                          <span className="font-bold flex items-center gap-1 text-slate-800 dark:text-slate-200 mt-0.5">
                            <FaCalendarAlt className="text-emerald-500" />
                            {new Date(b.date).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Schedule & Time</span>
                          <span className="font-bold flex items-center gap-1 text-slate-800 dark:text-slate-200 mt-0.5">
                            <FaClock className="text-emerald-500" />
                            {b.startTime} ({b.durationHours} Hours)
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Attendees</span>
                          <span className="font-bold flex items-center gap-1 text-slate-800 dark:text-slate-200 mt-0.5">
                            <FaUsers className="text-emerald-500" />
                            {b.corporateDetails?.attendeesCount || b.guests} Guests
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">
                            {isQuoteProvided ? "Quoted Total" : "Estimated Budget"}
                          </span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                            ₹{(b.totalPrice || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Special Notes & Requirements */}
                      {(b.corporateDetails?.cateringNeeded || b.corporateDetails?.avTechNeeded || b.corporateDetails?.eventObjectives) && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs mb-4 space-y-1">
                          {b.corporateDetails?.eventObjectives && (
                            <p className="text-slate-600 dark:text-slate-300">
                              <strong>Objective:</strong> {b.corporateDetails.eventObjectives}
                            </p>
                          )}
                          {b.corporateDetails?.cateringNeeded && (
                            <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                              <FaUtensils className="text-amber-500 text-[10px]" />
                              <strong>Catering:</strong> {b.corporateDetails.cateringNotes || "Required"}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Quote Review Box (When Quote Provided) */}
                      {isQuoteProvided && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 my-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 dark:border-blue-900/40 pb-3">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 tracking-wider">
                                Official Landowner Quote
                              </span>
                              <h4 className="text-base font-black text-slate-900 dark:text-white">
                                ₹{quote.quotedAmount.toLocaleString("en-IN")}{" "}
                                <span className="text-xs font-normal text-slate-500">
                                  (₹{quote.quotedPerHeadPrice || Math.round(quote.quotedAmount / (b.guests || 1))} / head)
                                </span>
                              </h4>
                            </div>

                            {quote.quoteExpiresAt && (
                              <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                                Valid until: {new Date(quote.quoteExpiresAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          {quote.quoteNotes && (
                            <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                              “{quote.quoteNotes}”
                            </p>
                          )}

                          {quote.termsAndInclusions && quote.termsAndInclusions.length > 0 && (
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                                Inclusions & Setup:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {quote.termsAndInclusions.map((term, i) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 font-medium border border-blue-200 dark:border-blue-900"
                                  >
                                    ✓ {term}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-2 flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => handleAcceptQuote(b._id)}
                              disabled={actionLoadingId === b._id}
                              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                            >
                              {actionLoadingId === b._id ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <FaCheck />
                              )}
                              Accept & Confirm Reservation
                            </button>

                            <button
                              onClick={() => handleDeclineQuote(b._id)}
                              disabled={actionLoadingId === b._id}
                              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 font-semibold text-xs border border-rose-200 dark:border-rose-900 transition flex items-center gap-1.5"
                            >
                              <FaTimes />
                              Decline
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Tab 2: Organization Profile Settings */
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 max-w-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-1">Company Invoicing & Profile</h2>
            <p className="text-xs text-slate-500 mb-6">
              Official company billing details for GST invoices, receipts, and event agreements.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Company Size
                  </label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="1-10">1-10 Employees</option>
                    <option value="11-50">11-50 Employees</option>
                    <option value="51-200">51-200 Employees</option>
                    <option value="201-500">201-500 Employees</option>
                    <option value="500+">500+ Employees</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Official Work Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                {savingProfile ? <FaSpinner className="animate-spin" /> : <FaSave />}
                Save Company Profile
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CorporateBookings;
