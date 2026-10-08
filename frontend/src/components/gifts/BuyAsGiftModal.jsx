import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaTimes,
  FaGift,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaHeart,
  FaCopy,
  FaCheck,
  FaWhatsapp,
  FaSpinner,
  FaWallet,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import { openRazorpayModal } from "../../utils/razorpay";

const BuyAsGiftModal = ({
  isOpen,
  onClose,
  spot,
  experience,
  selectedAddOns = [],
  durationHours,
}) => {
  const { user, openAuthModal, refreshUser } = useAuth();

  const [senderName, setSenderName] = useState(user?.name || "");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [personalMessage, setPersonalMessage] = useState(
    "For you & someone special ❤️ Enjoy this private outdoor escape on Thikana!"
  );
  const [useWalletCredits, setUseWalletCredits] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Success modal state after purchase
  const [purchasedVoucher, setPurchasedVoucher] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // Calculate pricing
  const basePrice = experience ? experience.price : (Number(spot?.price) || 500) * (durationHours || 2);
  const addOnsTotal = (selectedAddOns || []).reduce(
    (sum, a) => sum + (Number(a.price) || 0),
    0
  );
  const giftSubtotal = basePrice + addOnsTotal;

  const availableWallet = user?.walletBalance || 0;
  const appliedCredits = useWalletCredits && availableWallet > 0
    ? Math.min(availableWallet, giftSubtotal)
    : 0;
  const finalPayable = Math.max(0, giftSubtotal - appliedCredits);

  const presetMessages = [
    "For you & someone special ❤️",
    "Happy Birthday! 🎂 Enjoy the outdoors!",
    "Congratulations! Here's a private getaway 🌲",
    "A well-deserved sunset retreat ✨",
  ];

  const handlePurchaseGift = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.info("Please sign in to purchase a gift.");
      openAuthModal("login");
      return;
    }

    if (!recipientName.trim() || !recipientEmail.trim()) {
      toast.error("Please provide recipient's name and email.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        senderName: senderName.trim() || user.name || "A Friend",
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim().toLowerCase(),
        recipientPhone: recipientPhone.trim(),
        personalMessage: personalMessage.trim(),
        spotId: spot?._id || spot?.id || experience?.spot?._id,
        experienceId: experience?._id || null,
        selectedAddOns: (selectedAddOns || []).map((a) => ({
          name: a.name,
          price: Number(a.price || 0),
        })),
        durationHours: experience?.durationHours || durationHours || 2,
        giftType: "open_voucher",
        useWalletCredits,
      };

      const res = await API.post("/gifts/order", payload);
      const orderData = res.data?.data;

      if (orderData.fullyPaid) {
        // 100% paid by credits
        setPurchasedVoucher(orderData.voucher);
        if (refreshUser) refreshUser();
        toast.success("🎁 Gift Voucher purchased and activated successfully!");
        return;
      }

      // Razorpay Payment Flow
      await openRazorpayModal({
        orderData: {
          orderId: orderData.orderId,
          amount: orderData.amountInPaise,
          currency: "INR",
          keyId: orderData.keyId,
          spotTitle: `Gift Voucher: ${experience?.title || spot?.title || "Outdoor Stay"}`,
          customer: {
            name: user.name,
            email: user.email,
          },
        },
        onSuccess: async (paymentDetails) => {
          try {
            const verifyRes = await API.post("/gifts/verify-payment", {
              voucherId: orderData.voucher._id,
              ...paymentDetails,
            });

            const activatedVoucher = verifyRes.data?.data || orderData.voucher;
            setPurchasedVoucher(activatedVoucher);
            if (refreshUser) refreshUser();
            toast.success("🎁 Gift payment verified! Voucher is ready to share.");
          } catch (verifyErr) {
            console.error("Gift payment verification failed:", verifyErr);
            toast.error(
              verifyErr.response?.data?.message || "Payment verification failed. Please contact support."
            );
          }
        },
        onDismiss: () => {
          toast.info("Gift purchase window closed. You can complete your purchase anytime!");
        },
        onError: (err) => {
          console.error("Payment error:", err);
          toast.error(err?.description || "Payment cancelled or failed.");
        },
      });
    } catch (err) {
      console.error("Gift creation failed:", err);
      toast.error(err.response?.data?.message || "Failed to initiate gift purchase.");
    } finally {
      setSubmitting(false);
    }
  };

  const giftShareUrl = purchasedVoucher
    ? `${window.location.origin}/redeem?code=${purchasedVoucher.voucherCode}`
    : "";

  const handleCopyLink = () => {
    if (!giftShareUrl) return;
    navigator.clipboard.writeText(giftShareUrl);
    setCopiedLink(true);
    toast.success("Gift redemption link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = `Hey ${recipientName}! I got you a special outdoor experience gift on Thikana: "${experience?.title || spot?.title}". Redeem your gift voucher here: ${giftShareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl my-8 border border-slate-100"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-20 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <FaTimes size={16} />
          </button>

          {!purchasedVoucher ? (
            /* Step 1: Compose Gift */
            <div>
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 p-6 text-white relative">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30 mb-2">
                  <FaGift className="text-emerald-400" /> Give an Experience
                </div>
                <h3 className="text-2xl font-black">
                  Gift {experience ? experience.title : spot?.title || "an Outdoor Space"}
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  Recipient receives a personalized voucher valid for 6 months to schedule whenever they wish.
                </p>
              </div>

              {/* Form Body */}
              <form onSubmit={handlePurchaseGift} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Recipient Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Recipient Full Name *
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                      <FaUser className="text-slate-400 text-xs" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Priya Kapoor"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Recipient Email *
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                      <FaEnvelope className="text-slate-400 text-xs" />
                      <input
                        type="email"
                        required
                        placeholder="priya@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Sender Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Your Name (Sender) *
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                      <FaHeart className="text-rose-400 text-xs" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rohan Sharma"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Recipient Phone (Optional)
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 focus-within:border-emerald-500">
                      <FaPhone className="text-slate-400 text-xs" />
                      <input
                        type="tel"
                        placeholder="+91 9876543210"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Message */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Personal Message
                    </label>
                    <span className="text-[10px] text-slate-400">Printed on digital voucher</span>
                  </div>
                  <textarea
                    rows={3}
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder="Write something warm and memorable..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                  {/* Preset quick chips */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {presetMessages.map((msg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPersonalMessage(msg)}
                        className="rounded-full bg-slate-100 hover:bg-emerald-50 text-[10px] font-medium text-slate-600 hover:text-emerald-700 px-2.5 py-1 border border-slate-200 transition"
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Digital Card Preview */}
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 border border-emerald-200/80">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        🎁 Digital Gift Voucher Preview
                      </span>
                      <div className="text-sm font-black text-slate-900 mt-1">
                        {experience ? experience.title : spot?.title}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 italic line-clamp-2">
                        &ldquo;{personalMessage}&rdquo;
                      </p>
                      <div className="text-[11px] text-slate-500 mt-2">
                        For: <strong className="text-slate-800">{recipientName || "Recipient"}</strong> • From: <strong className="text-slate-800">{senderName || "You"}</strong>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs font-bold text-emerald-700 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                        Valid 6 Months
                      </div>
                      <div className="text-xs font-extrabold text-slate-800 mt-2">
                        ₹{giftSubtotal.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet Credit Checkbox */}
                {user && availableWallet > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                    <label className="flex items-center justify-between gap-2 cursor-pointer select-none">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={useWalletCredits}
                          onChange={(e) => setUseWalletCredits(e.target.checked)}
                          className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <FaWallet className="text-emerald-600" size={11} /> Use Thikana Wallet Balance
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Available: ₹{availableWallet.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                      {useWalletCredits && appliedCredits > 0 && (
                        <span className="text-xs font-black text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-md">
                          -₹{appliedCredits.toLocaleString("en-IN")}
                        </span>
                      )}
                    </label>
                  </div>
                )}

                {/* Total & Submit Button */}
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Payable
                    </span>
                    <div className="text-2xl font-black text-emerald-700">
                      ₹{finalPayable.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3.5 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin" /> Processing Gift...
                      </>
                    ) : (
                      <>
                        <FaGift /> Purchase Gift Voucher (₹{finalPayable.toLocaleString("en-IN")})
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Step 2: Confirmation & Shareable Voucher Card */
            <div className="p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl mb-4 shadow-inner">
                🎁
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Gift Voucher Purchased!
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Your gift for <strong className="text-slate-800">{purchasedVoucher.recipientName}</strong> is active and ready to be redeemed.
              </p>

              {/* Code Box */}
              <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white shadow-xl border border-emerald-500/30">
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1">
                  Unique Voucher Code
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black text-emerald-400 tracking-widest">
                  {purchasedVoucher.voucherCode}
                </div>
                <p className="text-[11px] text-slate-300 mt-2">
                  Valid until {new Date(purchasedVoucher.validUntil).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>

              {/* Share & Copy Actions */}
              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 text-xs transition shadow-md"
                >
                  {copiedLink ? <FaCheck /> : <FaCopy />}
                  <span>{copiedLink ? "Redemption Link Copied!" : "Copy Gift Redemption Link"}</span>
                </button>

                <button
                  onClick={handleWhatsAppShare}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 text-xs transition shadow-md"
                >
                  <FaWhatsapp size={16} />
                  <span>Send via WhatsApp to {purchasedVoucher.recipientName}</span>
                </button>

                <button
                  onClick={onClose}
                  className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BuyAsGiftModal;
