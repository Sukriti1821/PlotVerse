import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaGift,
  FaShareAlt,
  FaCopy,
  FaCheck,
  FaWhatsapp,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTicketAlt,
  FaHeart,
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaSearch,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { getImageUrl } from "../utils/imageHelper";

const MyGifts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("sent"); // 'sent' | 'received'
  const [sentGifts, setSentGifts] = useState([]);
  const [receivedGifts, setReceivedGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedCode, setCopiedCode] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const [sentRes, receivedRes] = await Promise.all([
        API.get("/gifts/my-sent-gifts"),
        API.get("/gifts/my-received-gifts"),
      ]);

      if (sentRes.data?.data) {
        setSentGifts(sentRes.data.data);
      }
      if (receivedRes.data?.data) {
        setReceivedGifts(receivedRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch gifts:", err);
      toast.error(err.response?.data?.message || "Failed to load your gifts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGifts();
    }
  }, [user]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Voucher code "${code}" copied!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCopyLink = (code) => {
    const link = `${window.location.origin}/redeem?code=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(code);
    toast.success("Redemption link copied to clipboard!");
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleWhatsAppShare = (gift) => {
    const redeemUrl = `${window.location.origin}/redeem?code=${gift.voucherCode}`;
    const itemTitle = gift.experience?.title || gift.spot?.title || "Outdoor Escape";
    const text = `🎁 *Hey ${gift.recipientName}!* \n\nI bought you a private Thikana experience voucher: *${itemTitle}*!\n\n"${gift.personalMessage || "Enjoy your outdoor escape!"}"\n\n🎟️ Voucher Code: *${gift.voucherCode}*\n🔗 Redeem & choose your time slot here: ${redeemUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Filter list
  const currentList = activeTab === "sent" ? sentGifts : receivedGifts;
  const filteredGifts = currentList.filter((g) => {
    // Status filter
    if (statusFilter !== "all" && g.status !== statusFilter) return false;

    // Search filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const title = (g.experience?.title || g.spot?.title || "").toLowerCase();
    const code = (g.voucherCode || "").toLowerCase();
    const name = (activeTab === "sent" ? g.recipientName : g.senderName || "").toLowerCase();
    return title.includes(term) || code.includes(term) || name.includes(term);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active (Ready to Redeem)
          </span>
        );
      case "redeemed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300/40">
            <FaCheckCircle className="text-blue-500 text-[10px]" />
            Redeemed
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300/40">
            <FaTimesCircle className="text-rose-500 text-[10px]" />
            Expired
          </span>
        );
      case "pending_payment":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/40">
            <FaHourglassHalf className="text-amber-500 text-[10px]" />
            Pending Payment
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Hero Header */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-8 sm:p-12 mb-8 shadow-2xl border border-emerald-500/20">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium backdrop-blur-md mb-3 border border-emerald-500/30">
                <FaGift className="text-emerald-400" />
                Thikana Gift Vouchers
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Gift Experiences & Vouchers
              </h1>
              <p className="mt-2 text-slate-300 max-w-xl text-sm sm:text-base leading-relaxed">
                Surprise friends, family, and loved ones with unforgettable outdoor escapes, bonfires, private stargazing dates, and retreats.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/redeem"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <FaTicketAlt />
                Redeem a Voucher
              </Link>
              <Link
                to="/experiences"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md border border-white/15 transition-all"
              >
                <FaGift />
                Send a Gift
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 p-1 bg-slate-200/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl w-fit border border-slate-300/60 dark:border-slate-800">
            <button
              onClick={() => {
                setActiveTab("sent");
                setStatusFilter("all");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "sent"
                  ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FaGift />
              Gifts Sent ({sentGifts.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("received");
                setStatusFilter("all");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "received"
                  ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FaHeart className="text-rose-500" />
              Gifts Received ({receivedGifts.length})
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Search by title, name, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white w-56 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Content Listing */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Loading your gift vouchers...
            </p>
          </div>
        ) : filteredGifts.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm max-w-xl mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl">
              <FaGift />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {activeTab === "sent"
                ? "No gift vouchers found"
                : "No gifts received yet"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-6">
              {activeTab === "sent"
                ? "You haven't gifted any Thikana experiences or vouchers matching this filter yet."
                : "When someone buys an experience gift using your email address, it will automatically show up here."}
            </p>
            {activeTab === "sent" ? (
              <Link
                to="/experiences"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20"
              >
                <FaGift />
                Browse Experiences to Gift
              </Link>
            ) : (
              <Link
                to="/redeem"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20"
              >
                <FaTicketAlt />
                Have a Code? Redeem Here
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredGifts.map((gift) => {
                const itemTitle =
                  gift.experience?.title ||
                  gift.spot?.title ||
                  "Thikana Outdoor Escape";
                const itemImg =
                  gift.experience?.image ||
                  gift.spot?.images?.[0] ||
                  "/placeholder.jpg";
                const locationStr =
                  typeof gift.spot?.location === "object"
                    ? `${gift.spot.location.city || ""}, ${gift.spot.location.state || ""}`.replace(/^, |, $/g, "")
                    : gift.spot?.location || "Private Plot Location";

                return (
                  <motion.div
                    key={gift._id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    {/* Top Image & Ribbon */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                      <img
                        src={getImageUrl(itemImg)}
                        alt={itemTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=60";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                      {/* Status Tag */}
                      <div className="absolute top-3 left-3">
                        {getStatusBadge(gift.status)}
                      </div>

                      {/* Gift Value Badge */}
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white font-bold text-xs border border-white/20">
                        ₹{(gift.giftAmount || 0).toLocaleString("en-IN")}
                      </div>

                      {/* Title & Location over image */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-0.5">
                          {gift.experience ? "Curated Experience" : "Private Plot"}
                        </p>
                        <h3 className="font-bold text-base line-clamp-1">
                          {itemTitle}
                        </h3>
                        {locationStr && (
                          <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5 line-clamp-1">
                            <FaMapMarkerAlt className="text-emerald-400 text-[10px] shrink-0" />
                            {locationStr}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Body Info */}
                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div>
                        {/* Recipient / Sender Metadata */}
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                          {activeTab === "sent" ? (
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">
                                Recipient
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {gift.recipientName}
                              </span>
                              <span className="text-slate-400 block text-[11px]">
                                {gift.recipientEmail}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">
                                Gifted By
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {gift.senderName || "A Friend"}
                              </span>
                            </div>
                          )}

                          <div className="text-right">
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">
                              Valid Until
                            </span>
                            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 justify-end">
                              <FaCalendarAlt className="text-[10px] text-emerald-500" />
                              {new Date(gift.validUntil).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric", year: "numeric" }
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Personal Message Preview */}
                        {gift.personalMessage && (
                          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 text-amber-900 dark:text-amber-200/90 text-xs italic mb-4 leading-relaxed relative">
                            <span className="text-amber-500 font-serif text-sm mr-1">“</span>
                            {gift.personalMessage}
                            <span className="text-amber-500 font-serif text-sm ml-1">”</span>
                          </div>
                        )}

                        {/* Voucher Code Box */}
                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                              <FaTicketAlt className="text-emerald-500 text-[10px]" />
                              Voucher Code
                            </span>
                            <button
                              onClick={() => handleCopyCode(gift.voucherCode)}
                              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              {copiedCode === gift.voucherCode ? (
                                <>
                                  <FaCheck className="text-emerald-500" /> Copied
                                </>
                              ) : (
                                <>
                                  <FaCopy /> Copy
                                </>
                              )}
                            </button>
                          </div>
                          <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wider">
                            {gift.voucherCode}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                        {activeTab === "sent" ? (
                          <>
                            <button
                              onClick={() => handleCopyLink(gift.voucherCode)}
                              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                              title="Copy direct redemption link"
                            >
                              {copiedLink === gift.voucherCode ? (
                                <FaCheck className="text-emerald-500" />
                              ) : (
                                <FaShareAlt />
                              )}
                              Share Link
                            </button>
                            <button
                              onClick={() => handleWhatsAppShare(gift)}
                              className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-emerald-300/30"
                              title="Share on WhatsApp"
                            >
                              <FaWhatsapp className="text-emerald-500 text-sm" />
                              WhatsApp
                            </button>
                          </>
                        ) : (
                          <>
                            {gift.status === "active" ? (
                              <button
                                onClick={() =>
                                  navigate(`/redeem?code=${gift.voucherCode}`)
                                }
                                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                              >
                                <FaCalendarAlt />
                                Redeem & Schedule Slot
                                <FaArrowRight className="text-[10px]" />
                              </button>
                            ) : gift.status === "redeemed" ? (
                              <div className="w-full py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-900/50">
                                <FaCheckCircle />
                                Redeemed ({new Date(gift.redeemedAt).toLocaleDateString()})
                              </div>
                            ) : (
                              <div className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium text-center">
                                Voucher Expired
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyGifts;
