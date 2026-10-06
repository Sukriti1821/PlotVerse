const crypto = require("crypto");
const Razorpay = require("razorpay");
const GiftVoucher = require("../models/GiftVoucher");
const Spot = require("../models/Spot");
const Experience = require("../models/Experience");
const Booking = require("../models/Booking");
const User = require("../models/User");
const availabilityService = require("./availabilityService");
const referralService = require("./referralService");

// Helper to convert "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const parts = timeStr.split(":");
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
};

// Helper to compute end time string
const computeEndTime = (startTime, durationHours) => {
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + durationHours * 60;
  const endH = Math.floor(endMins / 60) % 24;
  const endM = endMins % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
};

// Check if Razorpay keys are placeholder test keys
const isPlaceholderKey = (key) => {
  return !key || key.includes("placeholder") || key === "your_razorpay_key_id";
};

/**
 * 1. Generate unique, high-entropy Gift Voucher Code (e.g. GIFT-PLOT-7A9K-M2X8)
 */
const generateUniqueVoucherCode = async () => {
  let isUnique = false;
  let code = "";
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    code = `GIFT-PLOT-${part1}-${part2}`;

    const existing = await GiftVoucher.findOne({ voucherCode: code });
    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    code = `GIFT-PLOT-${Date.now().toString(36).toUpperCase()}`;
  }

  return code;
};

/**
 * 2. Create Gift Order
 */
const createGiftOrder = async ({
  buyerId,
  senderName,
  recipientName,
  recipientEmail,
  recipientPhone = "",
  personalMessage = "",
  spotId,
  experienceId = null,
  selectedAddOns = [],
  durationHours = null,
  giftType = "open_voucher",
  scheduledDate = null,
  scheduledStartTime = null,
  useWalletCredits = false,
}) => {
  if (!buyerId || !senderName || !recipientName || !recipientEmail) {
    throw new Error("Missing required gift sender or recipient details.");
  }

  const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
  if (!EMAIL_REGEX.test(recipientEmail.trim())) {
    throw new Error("Please provide a valid recipient email address.");
  }

  // Fetch target experience or spot
  let experienceDoc = null;
  if (experienceId) {
    experienceDoc = await Experience.findById(experienceId).populate("spot");
    if (!experienceDoc) {
      throw new Error("Experience package not found.");
    }
  }

  const targetSpotId = experienceDoc ? experienceDoc.spot._id : spotId;
  const spotObj = experienceDoc ? experienceDoc.spot : await Spot.findById(targetSpotId);

  if (!spotObj) {
    throw new Error("Selected spot listing not found.");
  }

  // Calculate gift pricing
  let calculatedAmount = 0;
  const validatedAddOns = [];
  const hours = experienceDoc ? experienceDoc.durationHours : Number(durationHours) || 2;

  if (experienceDoc) {
    calculatedAmount = experienceDoc.price;

    if (Array.isArray(selectedAddOns)) {
      selectedAddOns.forEach((addonReq) => {
        const addonName = typeof addonReq === "string" ? addonReq.trim() : (addonReq.name || "").trim();
        const matched = (experienceDoc.optionalAddOns || []).find(
          (opt) => opt.name.toLowerCase() === addonName.toLowerCase()
        );
        if (matched) {
          calculatedAmount += matched.price;
          validatedAddOns.push({ name: matched.name, price: matched.price });
        }
      });
    }
  } else {
    // Raw plot reservation gift
    const hourly = Number(spotObj.price) || 500;
    calculatedAmount = hourly * hours;

    if (Array.isArray(selectedAddOns)) {
      selectedAddOns.forEach((addonReq) => {
        const addonName = typeof addonReq === "string" ? addonReq.trim() : (addonReq.name || "").trim();
        const price = Number(addonReq.price || 0);
        if (addonName && price >= 0) {
          calculatedAmount += price;
          validatedAddOns.push({ name: addonName, price });
        }
      });
    }
  }

  // Evaluate optional wallet credits
  let appliedWalletCredits = 0;
  let payableTotal = calculatedAmount;

  if (useWalletCredits) {
    const buyerUser = await User.findById(buyerId);
    if (buyerUser && buyerUser.walletBalance > 0) {
      const walletCalc = referralService.calculateApplicableCredits({
        userWalletBalance: buyerUser.walletBalance,
        bookingTotal: calculatedAmount,
      });

      if (walletCalc.canApply && walletCalc.applicableCredits > 0) {
        appliedWalletCredits = walletCalc.applicableCredits;
        payableTotal = walletCalc.payableTotal;
      }
    }
  }

  const voucherCode = await generateUniqueVoucherCode();
  const securityPin = String(Math.floor(1000 + Math.random() * 9000));
  const isFullyPaidByCredits = payableTotal === 0 && appliedWalletCredits > 0;

  // Create GiftVoucher record
  const giftVoucher = await GiftVoucher.create({
    buyer: buyerId,
    senderName: senderName.trim(),
    recipientName: recipientName.trim(),
    recipientEmail: recipientEmail.trim().toLowerCase(),
    recipientPhone: recipientPhone.trim(),
    personalMessage: personalMessage.trim() || "Enjoy this special outdoor escape on Thikana!",
    spot: targetSpotId,
    experience: experienceDoc ? experienceDoc._id : null,
    experienceTitle: experienceDoc ? experienceDoc.title : spotObj.title,
    selectedAddOns: validatedAddOns,
    durationHours: hours,
    giftAmount: calculatedAmount,
    appliedWalletCredits,
    voucherCode,
    securityPin,
    giftType,
    scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
    scheduledStartTime,
    scheduledEndTime: scheduledStartTime ? computeEndTime(scheduledStartTime, hours) : null,
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
    status: isFullyPaidByCredits ? "active" : "pending_payment",
    paymentStatus: isFullyPaidByCredits ? "paid" : "unpaid",
  });

  // Deduct wallet credits if used
  if (appliedWalletCredits > 0) {
    await referralService.deductWalletCredits({
      userId: buyerId,
      amount: appliedWalletCredits,
      bookingId: giftVoucher._id,
      spotTitle: `Gift for ${recipientName} (${giftVoucher.experienceTitle})`,
    });
  }

  if (isFullyPaidByCredits) {
    return {
      voucher: giftVoucher,
      fullyPaid: true,
      amountInRupees: 0,
    };
  }

  // Create Razorpay Order
  const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder_key";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key_12345";
  const amountInPaise = Math.round(payableTotal * 100);
  let orderId = "";

  if (isPlaceholderKey(keyId) || isPlaceholderKey(keySecret)) {
    orderId = `order_gift_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  } else {
    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `gft_${giftVoucher._id.toString().slice(-8)}`,
        notes: {
          giftVoucherId: giftVoucher._id.toString(),
          recipientEmail: giftVoucher.recipientEmail,
          experienceTitle: giftVoucher.experienceTitle,
        },
      });
      orderId = order.id;
    } catch (rzpErr) {
      console.error("[Razorpay Gift Order Error]:", rzpErr);
      orderId = `order_gift_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
  }

  giftVoucher.razorpayOrderId = orderId;
  await giftVoucher.save();

  return {
    voucher: giftVoucher,
    fullyPaid: false,
    orderId,
    amountInPaise,
    amountInRupees: payableTotal,
    currency: "INR",
    keyId,
  };
};

/**
 * 3. Verify Gift Payment and Activate Voucher
 */
const verifyGiftPayment = async ({
  voucherId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  if (!voucherId) {
    throw new Error("Gift voucher ID is required.");
  }

  const voucher = await GiftVoucher.findById(voucherId).populate("spot").populate("experience");
  if (!voucher) {
    throw new Error("Gift voucher not found.");
  }

  if (voucher.status === "active" && voucher.paymentStatus === "paid") {
    return { success: true, voucher, message: "Gift voucher is already active." };
  }

  // Ensure incoming order ID matches the voucher's assigned order
  if (voucher.razorpayOrderId && voucher.razorpayOrderId !== razorpay_order_id) {
    throw new Error("Gift voucher payment verification failed: Order ID mismatch.");
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key_12345";
  const isProduction = process.env.NODE_ENV === "production";

  // Mock test bypass is strictly prohibited in production
  const isMockTest =
    !isProduction &&
    isPlaceholderKey(keySecret) &&
    typeof razorpay_order_id === "string" &&
    razorpay_order_id.startsWith("order_gift_");

  let isValid = false;
  if (isMockTest) {
    const expectedSig = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    isValid =
      razorpay_signature === expectedSig ||
      razorpay_signature === "mock_signature_test" ||
      razorpay_signature === `sig_${razorpay_payment_id}`;
  } else {
    const expectedSig = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    isValid = expectedSig === razorpay_signature;
  }

  if (!isValid) {
    voucher.paymentStatus = "failed";
    await voucher.save();
    throw new Error("Cryptographic payment verification failed.");
  }

  voucher.status = "active";
  voucher.paymentStatus = "paid";
  voucher.razorpayOrderId = razorpay_order_id;
  voucher.razorpayPaymentId = razorpay_payment_id;
  await voucher.save();

  return {
    success: true,
    voucher,
    message: "Payment verified successfully! Gift voucher is now active.",
  };
};

/**
 * 4. Public Safe Voucher Details Lookup
 */
const getVoucherPublicDetails = async (code) => {
  if (!code || typeof code !== "string") {
    throw new Error("Voucher code is required.");
  }

  const normalizedCode = code.trim().toUpperCase();
  const voucher = await GiftVoucher.findOne({ voucherCode: normalizedCode })
    .populate("spot", "title location images description price operatingHours")
    .populate("experience", "title description price durationHours includedAmenities optionalAddOns image");

  if (!voucher) {
    throw new Error(`Voucher "${normalizedCode}" was not found. Please verify the code.`);
  }

  const isExpired = voucher.validUntil < new Date();

  return {
    voucherCode: voucher.voucherCode,
    senderName: voucher.senderName,
    recipientName: voucher.recipientName,
    recipientEmailMasked: voucher.recipientEmail.replace(/^(.{2})(.*)(@.*)$/, "$1***$3"),
    personalMessage: voucher.personalMessage,
    experienceTitle: voucher.experienceTitle,
    spot: voucher.spot,
    experience: voucher.experience,
    durationHours: voucher.durationHours,
    selectedAddOns: voucher.selectedAddOns,
    giftType: voucher.giftType,
    scheduledDate: voucher.scheduledDate,
    scheduledStartTime: voucher.scheduledStartTime,
    scheduledEndTime: voucher.scheduledEndTime,
    validUntil: voucher.validUntil,
    status: voucher.status,
    isExpired,
    canRedeem: voucher.status === "active" && !isExpired,
  };
};

/**
 * 5. Redeem Gift Voucher
 * Authoritative recipient redemption and booking conversion
 */
const redeemGiftVoucher = async ({
  voucherCode,
  recipientUserId,
  recipientEmail,
  selectedDate,
  selectedStartTime = "10:00",
}) => {
  if (!voucherCode || !recipientUserId) {
    throw new Error("Voucher code and recipient user identity are required.");
  }

  const normalizedCode = voucherCode.trim().toUpperCase();
  const voucher = await GiftVoucher.findOne({ voucherCode: normalizedCode })
    .populate("spot")
    .populate("experience");

  if (!voucher) {
    throw new Error(`Voucher "${normalizedCode}" not found.`);
  }

  // 1. Check duplicate redemption
  if (voucher.status === "redeemed") {
    throw new Error("This gift voucher has already been redeemed.");
  }

  if (voucher.status !== "active") {
    throw new Error(`Cannot redeem voucher with status "${voucher.status}".`);
  }

  // 2. Check expiration
  if (voucher.validUntil < new Date()) {
    voucher.status = "expired";
    await voucher.save();
    throw new Error("This gift voucher has expired.");
  }

  // 3. Check recipient authorization (Email match)
  const user = await User.findById(recipientUserId);
  if (!user) {
    throw new Error("Recipient account not found.");
  }

  const userEmail = (recipientEmail || user.email || "").toLowerCase().trim();
  const targetEmail = voucher.recipientEmail.toLowerCase().trim();

  if (userEmail !== targetEmail) {
    throw new Error(
      `Unauthorized: This gift voucher was sent specifically to ${voucher.recipientEmail}. Please log in or verify with that email address to redeem.`
    );
  }

  // 4. Determine final reservation date & time
  let finalDate = voucher.giftType === "scheduled_date" && voucher.scheduledDate
    ? voucher.scheduledDate
    : new Date(selectedDate);

  let finalStartTime = voucher.giftType === "scheduled_date" && voucher.scheduledStartTime
    ? voucher.scheduledStartTime
    : selectedStartTime;

  if (!finalDate || isNaN(new Date(finalDate).getTime())) {
    throw new Error("Please choose a valid reservation date.");
  }

  const hours = voucher.durationHours || 2;
  const finalEndTime = computeEndTime(finalStartTime, hours);

  // 5. Check slot availability on the host spot
  const availResult = await availabilityService.checkSlotAvailability({
    spotId: voucher.spot._id,
    date: finalDate,
    startTime: finalStartTime,
    endTime: finalEndTime,
    durationHours: hours,
  });

  if (!availResult.available) {
    throw new Error(
      `Selected time slot is unavailable on the landowner schedule: ${availResult.message}`
    );
  }

  // 6. Create confirmed Booking (Prepaid by Gift Voucher)
  const booking = await Booking.create({
    user: user._id,
    spot: voucher.spot._id,
    experience: voucher.experience ? voucher.experience._id : null,
    experienceTitle: voucher.experienceTitle,
    date: finalDate,
    startTime: finalStartTime,
    endTime: finalEndTime,
    durationHours: hours,
    checkIn: finalDate,
    checkOut: finalDate,
    guests: voucher.experience?.maxGuests || 2,
    selectedAmenities: voucher.experience?.includedAmenities || [],
    selectedAddOns: voucher.selectedAddOns || [],
    totalPrice: 0, // Zero payable on redemption
    amountPaid: voucher.giftAmount,
    status: "confirmed",
    paymentStatus: "paid",
    paidAt: new Date(),
    isGiftBooking: true,
    giftVoucher: voucher._id,
    giftSenderName: voucher.senderName,
    giftMessage: voucher.personalMessage,
  });

  // 7. Acquire slot locks
  const dateStr = finalDate.toISOString().split("T")[0];
  const lockResult = await availabilityService.acquireSlotLocks({
    spotId: voucher.spot._id,
    bookingId: booking._id,
    dateStr,
    startTime: finalStartTime,
    endTime: finalEndTime,
    bufferMinutes: availResult.bufferMinutes || 0,
  });

  if (!lockResult.success) {
    await Booking.findByIdAndDelete(booking._id);
    throw new Error("Selected time slot just clashed with another guest reservation. Please choose another time.");
  }

  // 8. Atomic transition of GiftVoucher to "redeemed"
  const updatedVoucher = await GiftVoucher.findOneAndUpdate(
    { _id: voucher._id, status: "active" },
    {
      status: "redeemed",
      redeemedBy: user._id,
      redeemedBooking: booking._id,
      redeemedAt: new Date(),
    },
    { new: true }
  );

  if (!updatedVoucher) {
    // Race condition rollback
    await Booking.findByIdAndDelete(booking._id);
    await availabilityService.releaseSlotLocks(booking._id);
    throw new Error("Voucher redemption conflict: Voucher was already redeemed concurrently.");
  }

  return {
    success: true,
    booking,
    voucher: updatedVoucher,
    message: `Gift redeemed successfully! Your reservation for "${voucher.experienceTitle}" is confirmed.`,
  };
};

module.exports = {
  generateUniqueVoucherCode,
  createGiftOrder,
  verifyGiftPayment,
  getVoucherPublicDetails,
  redeemGiftVoucher,
};
