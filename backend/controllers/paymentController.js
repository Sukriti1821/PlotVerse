const crypto = require("crypto");
const Razorpay = require("razorpay");
const Booking = require("../models/Booking");
const Spot = require("../models/Spot");
const Settings = require("../models/Settings");
const asyncHandler = require("../utils/asyncHandler");
const referralService = require("../services/referralService");
const { sendBookingConfirmedEmail } = require("../services/emailService");

// Helper to initialize Razorpay client
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn("[Razorpay] Warning: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing.");
  }

  return new Razorpay({
    key_id: keyId || "rzp_test_placeholder_key",
    key_secret: keySecret || "placeholder_secret_key_12345",
  });
};

// Check if keys are placeholder test keys
const isPlaceholderKey = (key) => {
  return !key || key.includes("placeholder") || key === "your_razorpay_key_id";
};

// Explicit separation: Razorpay Test vs Live Keys
const isLiveKey = (key) => typeof key === "string" && key.startsWith("rzp_live_");
const isTestKey = (key) => typeof key === "string" && key.startsWith("rzp_test_");

// ==========================================
// 1. CREATE PAYMENT ORDER (POST /api/payments/create-order)
// ==========================================
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: "Booking ID is required to create a payment order",
    });
  }

  const booking = await Booking.findById(bookingId).populate("spot");
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found",
    });
  }

  // Verify booking belongs to authenticated customer
  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to pay for this booking",
    });
  }

  // Pay-after-approval rule: Host must have approved before customer can pay
  if (booking.status === "pending") {
    return res.status(400).json({
      success: false,
      message: "This booking is still pending host approval. You can only pay once the host approves your reservation.",
    });
  }

  if (booking.status === "confirmed" && booking.paymentStatus === "paid") {
    return res.status(400).json({
      success: false,
      message: "This booking has already been paid for and confirmed.",
    });
  }

  if (booking.status === "rejected") {
    return res.status(400).json({
      success: false,
      message: "This booking was declined by the host. Payment cannot be initiated.",
    });
  }

  if (booking.status === "cancelled") {
    return res.status(400).json({
      success: false,
      message: "This booking was cancelled. Payment cannot be initiated.",
    });
  }

  if (booking.status !== "approved") {
    return res.status(400).json({
      success: false,
      message: `Cannot process payment for booking with status '${booking.status}'.`,
    });
  }

  // CRITICAL: Recompute amount strictly server-side from booking record (paise: 1 INR = 100 paise)
  const amountInRupees = Number(booking.totalPrice) || 0;
  if (amountInRupees <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking total price. Amount must be greater than zero.",
    });
  }

  const amountInPaise = Math.round(amountInRupees * 100);
  const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder_key";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key_12345";

  if (isLiveKey(keyId) && process.env.NODE_ENV !== "production" && process.env.ALLOW_RAZORPAY_LIVE !== "true") {
    console.warn("⚠️ [Razorpay] WARNING: Using LIVE Razorpay Key in non-production environment! Real funds will be charged unless test keys (rzp_test_*) are used.");
  }

  let orderId = "";

  // If using placeholder keys (no active Razorpay live/test account credentials yet),
  // simulate an order to allow seamless local testing
  if (isPlaceholderKey(keyId) || isPlaceholderKey(keySecret)) {
    orderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  } else {
    try {
      const razorpay = getRazorpayInstance();
      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `bkg_${booking._id.toString().slice(-8)}_${Date.now().toString().slice(-4)}`,
        notes: {
          bookingId: booking._id.toString(),
          customerEmail: req.user.email,
          spotTitle: booking.spot?.title || "Plot Booking",
        },
      };

      const razorpayOrder = await razorpay.orders.create(options);
      orderId = razorpayOrder.id;
    } catch (razorpayErr) {
      console.error("[Razorpay] Order creation API error:", razorpayErr);
      // Fallback for offline/test environments
      orderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
  }

  // Save orderId to booking record
  booking.razorpayOrderId = orderId;
  booking.paymentStatus = "unpaid";
  await booking.save();

  res.json({
    success: true,
    orderId,
    amount: amountInPaise,
    amountInRupees,
    currency: "INR",
    keyId,
    isLive: isLiveKey(keyId),
    bookingId: booking._id,
    spotTitle: booking.spot?.title || "Plot Reservation",
    customer: {
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || "",
    },
  });
});

// ==========================================
// 2. VERIFY PAYMENT (POST /api/payments/verify)
// ==========================================
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!bookingId || !razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({
      success: false,
      message: "Missing required payment verification details",
    });
  }

  const booking = await Booking.findById(bookingId).populate("spot");
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found",
    });
  }

  // Verify ownership
  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to verify payment for this booking",
    });
  }

  // Idempotency: If already confirmed with this payment ID, return current confirmed state
  if (booking.status === "confirmed" && booking.paymentStatus === "paid") {
    return res.json({
      success: true,
      message: "Booking is already confirmed and paid.",
      data: booking,
    });
  }

  // Ensure incoming order ID strictly matches the order created for this booking
  if (booking.razorpayOrderId && booking.razorpayOrderId !== razorpay_order_id) {
    return res.status(400).json({
      success: false,
      message: "Payment verification failed: Razorpay order ID mismatch.",
    });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key_12345";
  const isProduction = process.env.NODE_ENV === "production";

  // Mock test bypass is STRICTLY prohibited in production
  const isMockTest =
    !isProduction &&
    isPlaceholderKey(keySecret) &&
    typeof razorpay_order_id === "string" &&
    razorpay_order_id.startsWith("order_test_");

  let isValidSignature = false;

  if (isMockTest) {
    // In local development / test mode with placeholder keys, allow verified test signatures
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    isValidSignature =
      razorpay_signature === expectedSignature ||
      razorpay_signature === "mock_signature_test" ||
      razorpay_signature === `sig_${razorpay_payment_id}`;
  } else {
    // Cryptographic HMAC SHA256 signature verification with Razorpay Secret
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    isValidSignature = generatedSignature === razorpay_signature;
  }

  if (!isValidSignature) {
    booking.paymentStatus = "failed";
    await booking.save();

    return res.status(400).json({
      success: false,
      message: "Payment verification failed: Invalid cryptographic signature. Booking has NOT been confirmed.",
    });
  }

  // Signature is valid — transition booking to confirmed
  booking.status = "confirmed";
  booking.paymentStatus = "paid";
  booking.razorpayOrderId = razorpay_order_id;
  booking.razorpayPaymentId = razorpay_payment_id;
  booking.razorpaySignature = razorpay_signature;
  booking.amountPaid = booking.totalPrice;
  booking.paidAt = new Date();

  // Calculate platform commission and owner net payout from Settings
  try {
    const settings = await Settings.getSettings();
    const rate = Number(settings?.defaultCommissionRate) || 10;
    const commission = Math.round(((Number(booking.totalPrice) || 0) * rate) / 100);
    const ownerPayout = Math.max(0, (Number(booking.totalPrice) || 0) - commission);

    booking.commissionRate = rate;
    booking.platformCommission = commission;
    booking.ownerPayoutAmount = ownerPayout;
    booking.payoutStatus = "pending";
  } catch (settErr) {
    console.error("[Payment] Error calculating commission split:", settErr.message);
    // Fallback default 10%
    const rate = 10;
    const commission = Math.round(((Number(booking.totalPrice) || 0) * rate) / 100);
    booking.commissionRate = rate;
    booking.platformCommission = commission;
    booking.ownerPayoutAmount = Math.max(0, (Number(booking.totalPrice) || 0) - commission);
    booking.payoutStatus = "pending";
  }

  await booking.save();

  // Feature 8: Trigger referral qualification check on customer's first completed booking
  try {
    await referralService.processQualifyingBooking(booking);
  } catch (refErr) {
    console.error("[Referral] Error processing qualifying booking:", refErr.message);
  }

  const populated = await Booking.findById(booking._id)
    .populate("spot")
    .populate("user", "name email")
    .populate("foodOrder.restaurant");

  // Send Booking Confirmed notification email
  try {
    const userEmail = populated.user?.email || req.user?.email;
    const userName = populated.user?.name || req.user?.name;
    if (userEmail) {
      sendBookingConfirmedEmail({
        to: userEmail,
        name: userName,
        spotTitle: populated.spot?.title || "Scenic Plot",
        bookingDate: populated.date ? new Date(populated.date).toLocaleDateString("en-IN") : "Upcoming",
        startTime: populated.startTime || "09:00",
        endTime: populated.endTime || "17:00",
        amountPaid: populated.totalPrice,
        paymentId: razorpay_payment_id,
      }).catch((e) => console.error("[Payment] Async email send error:", e.message));
    }
  } catch (mailErr) {
    console.error("[Payment] Error dispatching confirmation email:", mailErr.message);
  }

  res.json({
    success: true,
    message: "Payment verified successfully! Your booking is now locked in and confirmed.",
    data: populated,
    ...populated.toObject(),
  });
});

// ==========================================
// 3. RAZORPAY WEBHOOK (POST /api/payments/webhook)
// ==========================================
const handleWebhook = asyncHandler(async (req, res) => {
  const webhookSignature = req.headers["x-razorpay-signature"];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (!webhookSignature || !webhookSecret) {
    return res.status(400).json({ status: "ignored", message: "Missing signature or webhook secret" });
  }

  try {
    const rawBody = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== webhookSignature) {
      console.warn("[Razorpay Webhook] Signature verification failed.");
      return res.status(400).json({ status: "invalid_signature" });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;

    if (event === "payment.captured" && paymentEntity) {
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      if (orderId) {
        const booking = await Booking.findOne({ razorpayOrderId: orderId });
        if (booking && booking.status !== "confirmed") {
          booking.status = "confirmed";
          booking.paymentStatus = "paid";
          booking.razorpayPaymentId = paymentId;
          booking.amountPaid = booking.totalPrice;
          booking.paidAt = new Date();

          // Calculate platform commission and owner net payout from Settings
          try {
            const settings = await Settings.getSettings();
            const rate = Number(settings?.defaultCommissionRate) || 10;
            const commission = Math.round(((Number(booking.totalPrice) || 0) * rate) / 100);
            const ownerPayout = Math.max(0, (Number(booking.totalPrice) || 0) - commission);

            booking.commissionRate = rate;
            booking.platformCommission = commission;
            booking.ownerPayoutAmount = ownerPayout;
            booking.payoutStatus = "pending";
          } catch (settErr) {
            console.error("[Payment Webhook] Error calculating commission split:", settErr.message);
            const rate = 10;
            const commission = Math.round(((Number(booking.totalPrice) || 0) * rate) / 100);
            booking.commissionRate = rate;
            booking.platformCommission = commission;
            booking.ownerPayoutAmount = Math.max(0, (Number(booking.totalPrice) || 0) - commission);
            booking.payoutStatus = "pending";
          }

          await booking.save();
          console.log(`[Razorpay Webhook] Booking ${booking._id} confirmed via payment.captured webhook.`);

          try {
            await referralService.processQualifyingBooking(booking);
          } catch (refErr) {
            console.error("[Referral Webhook] Error processing qualifying booking:", refErr.message);
          }

          // Send confirmation email
          try {
            const populated = await Booking.findById(booking._id).populate("user").populate("spot");
            if (populated?.user?.email) {
              sendBookingConfirmedEmail({
                to: populated.user.email,
                name: populated.user.name,
                spotTitle: populated.spot?.title || "Scenic Plot",
                bookingDate: populated.date ? new Date(populated.date).toLocaleDateString("en-IN") : "Upcoming",
                startTime: populated.startTime || "09:00",
                endTime: populated.endTime || "17:00",
                amountPaid: populated.totalPrice,
                paymentId,
              }).catch(() => {});
            }
          } catch (mErr) {
            console.error("[Razorpay Webhook] Email send error:", mErr.message);
          }
        }
      }
    } else if (event === "payment.failed" && paymentEntity) {
      const orderId = paymentEntity.order_id;
      if (orderId) {
        const booking = await Booking.findOne({ razorpayOrderId: orderId });
        if (booking && booking.status !== "confirmed") {
          booking.paymentStatus = "failed";
          await booking.save();
        }
      }
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("[Razorpay Webhook] Processing error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
};
