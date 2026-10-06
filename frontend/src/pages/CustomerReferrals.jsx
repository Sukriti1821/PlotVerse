import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaGift,
  FaShareAlt,
  FaCopy,
  FaCheck,
  FaWhatsapp,
  FaTwitter,
  FaEnvelope,
  FaWallet,
  FaUsers,
  FaCheckCircle,
  FaHourglassHalf,
  FaHistory,
  FaQuestionCircle,
  FaArrowRight,
  FaShieldAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const CustomerReferrals = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [walletHistory, setWalletHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState("referrals"); // 'referrals' | 'wallet'
  const [openFaq, setOpenFaq] = useState(null);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const [refRes, walletRes] = await Promise.all([
        API.get("/referrals/my-referral-info"),
        API.get("/referrals/wallet-history"),
      ]);

      if (refRes.data?.data) {
        setData(refRes.data.data);
      }
      if (walletRes.data?.data?.transactions) {
        setWalletHistory(walletRes.data.data.transactions);
      }
    } catch (err) {
      console.error("Failed to load referral data:", err);
      toast.error(err.response?.data?.message || "Failed to load referral details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const referralCode = data?.referralCode || "THIKANA";
  const referralLink = data?.referralLink || `${window.location.origin}/?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success(`Referral code "${referralCode}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Referral invitation link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareText = `Join me on Thikana — book private outdoor spaces, campfires, and nature getaways! Use my referral code ${referralCode} to get ₹200 credit on your first booking:`;

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent("Invite: Get ₹200 credit on Thikana outdoor spaces!");
    const body = encodeURIComponent(`Hey!\n\nI've been booking scenic private outdoor spaces on Thikana for camping, dates, and group gatherings.\n\nSign up using my link or code "${referralCode}", and both of us will receive ₹200 Thikana credit when you complete your first reservation:\n\n${referralLink}\n\nEnjoy the outdoors!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Thikana & Get ₹200 Credit",
          text: shareText,
          url: referralLink,
        });
      } catch (e) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const faqs = [
    {
      q: "How do my friend and I receive the ₹200 credit?",
      a: "When your friend signs up with your unique referral code or link and completes their first eligible outdoor booking (minimum ₹300 subtotal), ₹200 is automatically credited to both of your Thikana wallets.",
    },
    {
      q: "Where can I spend my Thikana wallet credits?",
      a: "Your credits can be applied instantly during checkout on any plot reservation or curated experience package. Simply check 'Use Thikana Wallet Credit' before confirming.",
    },
    {
      q: "Do my wallet credits expire?",
      a: "No! Thikana referral credits never expire. You can accumulate them from multiple friends and save them for future weekend getaways.",
    },
    {
      q: "Can I refer as many friends as I want?",
      a: "Yes! There is no cap on the number of friends you can invite. The more friends who book their first outdoor escape, the more credits you earn.",
    },
    {
      q: "What prevents referral fraud?",
      a: "To keep the platform fair, rewards require a verified first completed booking with payment confirmation. Self-referrals, duplicate accounts, and circular referral loops are automatically blocked by our fraud engine.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 pb-20 pt-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          
          {/* Top Breadcrumb & Title */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                <FaGift /> Referral Program & Wallet
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Invite Friends, Earn ₹200 Together
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Share the joy of private outdoor escapes and earn Thikana wallet credits for every friend who books.
              </p>
            </div>

            <Link
              to="/my-bookings"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600"
            >
              ← Back to Reservations
            </Link>
          </div>

          {/* Hero Invitation Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-8 sm:p-10 text-white shadow-2xl mb-8">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30 mb-4">
                  <FaGift className="text-emerald-400" /> Double-Sided Reward Program
                </div>
                <h2 className="text-2xl sm:text-3xl font-black leading-tight text-white">
                  Give ₹200. Get ₹200. <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                    Endless outdoor memories.
                  </span>
                </h2>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-xl">
                  Invite your friends to discover private outdoor spaces, campfires, starlit dining, and scenic plots. When they complete their first eligible booking, you both receive ₹200 directly into your Thikana wallet.
                </p>

                {/* 3 Step Micro Roadmap */}
                <div className="mt-6 grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/80">
                  <div>
                    <div className="text-emerald-400 font-extrabold text-sm">1. Share</div>
                    <div className="text-xs text-slate-400 mt-0.5">Send your code or link</div>
                  </div>
                  <div>
                    <div className="text-emerald-400 font-extrabold text-sm">2. Friend Books</div>
                    <div className="text-xs text-slate-400 mt-0.5">First trip confirmed</div>
                  </div>
                  <div>
                    <div className="text-emerald-400 font-extrabold text-sm">3. ₹200 Credited</div>
                    <div className="text-xs text-slate-400 mt-0.5">Both wallets rewarded</div>
                  </div>
                </div>
              </div>

              {/* Referral Code & Share Card */}
              <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 shadow-xl">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1.5">
                  Your Personal Referral Code
                </div>

                {/* Big Code Pill with Copy */}
                <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-900/80 border border-emerald-500/30 p-3 mb-4">
                  <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-emerald-400 pl-2">
                    {referralCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 active:scale-95 shadow-md shadow-emerald-900/40"
                  >
                    {copiedCode ? <FaCheck /> : <FaCopy />}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                {/* Share Link Input */}
                <div className="mb-4">
                  <div className="text-xs font-medium text-slate-300 mb-1">Invitation Link</div>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-700/60 p-2 text-xs text-slate-300">
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      className="w-full bg-transparent outline-none truncate font-mono text-slate-400 text-xs"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 shrink-0"
                    >
                      {copiedLink ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={handleWhatsAppShare}
                    title="Share via WhatsApp"
                    className="flex flex-col items-center justify-center gap-1 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 p-2.5 text-[#25D366] hover:bg-[#25D366]/30 transition"
                  >
                    <FaWhatsapp size={18} />
                    <span className="text-[10px] font-bold">WhatsApp</span>
                  </button>
                  <button
                    onClick={handleTwitterShare}
                    title="Share on X / Twitter"
                    className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/10 border border-white/20 p-2.5 text-white hover:bg-white/20 transition"
                  >
                    <FaTwitter size={18} />
                    <span className="text-[10px] font-bold">Post on X</span>
                  </button>
                  <button
                    onClick={handleEmailShare}
                    title="Send via Email"
                    className="flex flex-col items-center justify-center gap-1 rounded-xl bg-blue-500/20 border border-blue-500/30 p-2.5 text-blue-300 hover:bg-blue-500/30 transition"
                  >
                    <FaEnvelope size={18} />
                    <span className="text-[10px] font-bold">Email</span>
                  </button>
                  <button
                    onClick={handleNativeShare}
                    title="More Share Options"
                    className="flex flex-col items-center justify-center gap-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 p-2.5 text-emerald-300 hover:bg-emerald-500/30 transition"
                  >
                    <FaShareAlt size={18} />
                    <span className="text-[10px] font-bold">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Metrics Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Wallet Balance
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                  <FaWallet size={16} />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black text-slate-900">
                ₹{data?.walletBalance ?? 0}
              </div>
              <p className="mt-1 text-xs text-emerald-700 font-medium">
                Available to use at checkout
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Earned
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
                  <FaGift size={16} />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black text-slate-900">
                ₹{data?.totalCreditsEarned ?? 0}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Lifetime referral credits
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Friends Invited
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-700">
                  <FaUsers size={16} />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black text-slate-900">
                {data?.stats?.totalInvites ?? 0}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Signed up with your code
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Successful Bookings
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700">
                  <FaCheckCircle size={16} />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black text-slate-900">
                {data?.stats?.successfulReferrals ?? 0}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Qualified & rewarded bookings
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("referrals")}
              className={`pb-3.5 px-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
                activeTab === "referrals"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FaUsers /> Referral History ({data?.referralHistory?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`pb-3.5 px-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
                activeTab === "wallet"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FaHistory /> Wallet Activity Log ({walletHistory.length})
            </button>
          </div>

          {/* Tab Content: Referrals History */}
          {activeTab === "referrals" && (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-12">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Invited Friends</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track the status of friends you&apos;ve invited to Thikana.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-slate-400">
                  Loading referral records...
                </div>
              ) : !data?.referralHistory || data.referralHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4 text-2xl">
                    🌲
                  </div>
                  <h4 className="text-base font-bold text-slate-900">No referrals yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Share your code <span className="font-mono font-bold text-emerald-700">{referralCode}</span> with friends who love the outdoors to start earning ₹200 credits!
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
                  >
                    <FaCopy /> Copy Invitation Link
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.referralHistory.map((item) => (
                    <div
                      key={item._id}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 font-extrabold text-sm border border-emerald-100">
                          {item.friendName ? item.friendName.charAt(0).toUpperCase() : "P"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {item.friendName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.friendEmailMasked} • Joined {new Date(item.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        {item.status === "rewarded" || item.status === "qualified" ? (
                          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                            <FaCheckCircle className="text-emerald-500" />
                            <span>Rewarded (+₹{item.rewardAmount})</span>
                          </div>
                        ) : item.status === "pending" ? (
                          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
                            <FaHourglassHalf className="text-amber-500" />
                            <span>Awaiting 1st Booking (₹{item.rewardAmount})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
                            <span>Disqualified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Wallet Activity Log */}
          {activeTab === "wallet" && (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-12">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Wallet Credit Ledger</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Immutable history of earned, redeemed, and refunded credits.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Current Balance</div>
                  <div className="text-lg font-black text-emerald-700">₹{data?.walletBalance ?? 0}</div>
                </div>
              </div>

              {walletHistory.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No wallet transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {walletHistory.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <div
                        key={tx._id}
                        className="p-4 sm:p-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-black ${
                              isPositive
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {isPositive ? "+₹" : "-₹"}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {tx.description}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`text-sm font-extrabold ${
                              isPositive ? "text-emerald-600" : "text-slate-800"
                            }`}
                          >
                            {isPositive ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Bal: ₹{tx.balanceAfter}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Program Rules & FAQ Accordion */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
              <FaQuestionCircle /> Referral Guidelines & FAQ
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-6">
              Frequently Asked Questions
            </h3>

            <div className="divide-y divide-slate-100">
              {faqs.map((faq, idx) => (
                <div key={idx} className="py-4">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="flex w-full items-center justify-between text-left font-bold text-slate-800 hover:text-emerald-600 transition text-sm"
                  >
                    <span>{faq.q}</span>
                    <span className="text-slate-400">
                      {openFaq === idx ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </span>
                  </button>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <FaShieldAlt className="text-emerald-600" />
                <span>Protected by Thikana Anti-Fraud Referral Engine.</span>
              </div>
              <Link to="/contact" className="text-emerald-600 hover:underline font-semibold">
                Have questions? Contact Support →
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CustomerReferrals;
