const crypto = require("crypto");
const User = require("../models/User");
const Referral = require("../models/Referral");
const WalletTransaction = require("../models/WalletTransaction");

const MIN_QUALIFYING_AMOUNT = 300; // Minimum booking total to trigger referral rewards
const DEFAULT_REWARD_AMOUNT = 200; // ₹200 for referrer and ₹200 for referred user

/**
 * 1. Generate a unique, clean uppercase referral code
 * Format: 4-5 chars of user's name + 3-4 random alphanumeric chars (e.g. ROHAN84X)
 */
const generateUniqueReferralCode = async (name = "PLOT") => {
  const cleanName = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 5) || "PLOT";

  let code = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 3);
    code = `${cleanName}${randomSuffix}`;

    const existing = await User.findOne({ referralCode: code });
    if (!existing) {
      isUnique = true;
    }
  }

  // Fallback with timestamp if many collisions
  if (!isUnique) {
    code = `PLOT${Date.now().toString(36).toUpperCase().slice(-4)}`;
  }

  return code;
};

/**
 * 2. Ensure user has a referral code (lazy initialization for existing users)
 */
const ensureUserReferralCode = async (user) => {
  if (user.referralCode) {
    return user.referralCode;
  }

  const newCode = await generateUniqueReferralCode(user.name);
  user.referralCode = newCode;
  await user.save();
  return newCode;
};

/**
 * 3. Validate a referral code with strict fraud checks
 */
const validateReferralCode = async ({ code, currentUserId = null, userEmail = null }) => {
  if (!code || typeof code !== "string" || !code.trim()) {
    return { valid: false, message: "Please provide a valid referral code." };
  }

  const normalizedCode = code.trim().toUpperCase();
  const referrer = await User.findOne({ referralCode: normalizedCode });

  if (!referrer) {
    return {
      valid: false,
      message: `Referral code "${normalizedCode}" is invalid. Please check the code and try again.`,
    };
  }

  // Self-referral prevention: ID check
  if (currentUserId && referrer._id.toString() === currentUserId.toString()) {
    return {
      valid: false,
      message: "Self-referral is not allowed. You cannot use your own referral code.",
    };
  }

  // Self-referral prevention: Email check
  if (userEmail && referrer.email.toLowerCase() === userEmail.toLowerCase().trim()) {
    return {
      valid: false,
      message: "Self-referral is not allowed. You cannot refer an account with the same email.",
    };
  }

  // Circular loop prevention: Referrer cannot be referred by current user
  if (currentUserId && referrer.referredBy && referrer.referredBy.toString() === currentUserId.toString()) {
    return {
      valid: false,
      message: "Circular referrals are not permitted.",
    };
  }

  return {
    valid: true,
    referrer: {
      _id: referrer._id,
      name: referrer.name,
      email: referrer.email,
      referralCode: referrer.referralCode,
    },
    code: normalizedCode,
    rewardAmount: DEFAULT_REWARD_AMOUNT,
    message: `Valid referral code! Both you and ${referrer.name} will receive ₹${DEFAULT_REWARD_AMOUNT} Thikana credit on your first completed booking.`,
  };
};

/**
 * 4. Register a new referral linkage upon customer signup
 */
const registerReferral = async ({ referrerCode, newUserId, newUserEmail }) => {
  if (!referrerCode || !newUserId) {
    return { success: false, message: "Missing required referral parameters" };
  }

  const validation = await validateReferralCode({
    code: referrerCode,
    currentUserId: newUserId,
    userEmail: newUserEmail,
  });

  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  // Check if this new user has already been referred
  const existingReferral = await Referral.findOne({ referredUser: newUserId });
  if (existingReferral) {
    return {
      success: false,
      message: "This account has already been registered with a referral.",
    };
  }

  // Link referredBy on the new user
  await User.findByIdAndUpdate(newUserId, { referredBy: validation.referrer._id });

  // Create pending Referral document
  const referral = await Referral.create({
    referrer: validation.referrer._id,
    referredUser: newUserId,
    referralCode: validation.code,
    status: "pending",
    referrerReward: DEFAULT_REWARD_AMOUNT,
    referredReward: DEFAULT_REWARD_AMOUNT,
    campaignName: "standard_200_launch",
  });

  return {
    success: true,
    referral,
    referrer: validation.referrer,
  };
};

/**
 * 5. Process Qualifying Booking Event
 * Triggered authoritatively when a booking is confirmed & paid
 */
const processQualifyingBooking = async (booking) => {
  if (!booking || !booking.user) {
    return { qualified: false, reason: "Invalid booking" };
  }

  const customerId = booking.user._id ? booking.user._id : booking.user;
  const customer = await User.findById(customerId);

  if (!customer) {
    return { qualified: false, reason: "Customer not found" };
  }

  // Fraud check: has customer already completed their first booking?
  if (customer.hasCompletedFirstBooking) {
    return {
      qualified: false,
      reason: "Customer has already completed a previous qualifying booking.",
    };
  }

  // Fraud check: Minimum qualifying booking value
  const bookingTotal = Number(booking.totalPrice) || 0;
  const creditsUsed = Number(booking.appliedWalletCredits) || 0;
  const effectiveTotal = bookingTotal + creditsUsed;

  if (effectiveTotal < MIN_QUALIFYING_AMOUNT) {
    return {
      qualified: false,
      reason: `Booking total (₹${effectiveTotal}) is below minimum qualifying threshold of ₹${MIN_QUALIFYING_AMOUNT}.`,
    };
  }

  // Check if there is an active pending referral for this customer
  const referral = await Referral.findOne({
    referredUser: customer._id,
    status: "pending",
  }).populate("referrer");

  if (!referral) {
    // Mark first booking completed so future referrals cannot be claimed retroactively
    customer.hasCompletedFirstBooking = true;
    await customer.save();
    return {
      qualified: false,
      reason: "No pending referral found for this customer.",
    };
  }

  // Loop & self-referral double-check
  if (referral.referrer._id.toString() === customer._id.toString()) {
    referral.status = "disqualified";
    referral.disqualificationReason = "Self-referral violation detected.";
    await referral.save();
    customer.hasCompletedFirstBooking = true;
    await customer.save();
    return { qualified: false, reason: "Disqualified: Self-referral violation." };
  }

  // Atomic state transition to 'rewarded' to prevent concurrent double-crediting
  const updatedReferral = await Referral.findOneAndUpdate(
    { _id: referral._id, status: "pending" },
    {
      status: "rewarded",
      qualifyingBooking: booking._id,
      qualifiedAt: new Date(),
      rewardedAt: new Date(),
    },
    { new: true }
  );

  if (!updatedReferral) {
    return { qualified: false, reason: "Referral was already processed or no longer pending." };
  }

  const referrerRewardAmount = updatedReferral.referrerReward || DEFAULT_REWARD_AMOUNT;
  const referredRewardAmount = updatedReferral.referredReward || DEFAULT_REWARD_AMOUNT;

  // 1. Credit Referrer Wallet
  const updatedReferrer = await User.findByIdAndUpdate(
    referral.referrer._id,
    { $inc: { walletBalance: referrerRewardAmount } },
    { new: true }
  );

  await WalletTransaction.create({
    user: referral.referrer._id,
    amount: referrerRewardAmount,
    balanceAfter: updatedReferrer.walletBalance,
    type: "referral_reward",
    referenceId: updatedReferral._id.toString(),
    description: `Referral reward: ${customer.name || "A friend"} completed their first outdoor booking!`,
  });

  // 2. Credit Referred Customer Wallet
  const updatedCustomer = await User.findByIdAndUpdate(
    customer._id,
    {
      $inc: { walletBalance: referredRewardAmount },
      $set: { hasCompletedFirstBooking: true },
    },
    { new: true }
  );

  await WalletTransaction.create({
    user: customer._id,
    amount: referredRewardAmount,
    balanceAfter: updatedCustomer.walletBalance,
    type: "referral_reward",
    referenceId: updatedReferral._id.toString(),
    description: `Referral welcome bonus for completing your first Thikana booking! (Invited by ${
      referral.referrer.name || "friend"
    })`,
  });

  return {
    qualified: true,
    referrerReward: referrerRewardAmount,
    referredReward: referredRewardAmount,
    referral: updatedReferral,
  };
};

/**
 * 6. Calculate applicable wallet credits for booking checkout
 */
const calculateApplicableCredits = ({ userWalletBalance = 0, bookingTotal = 0, requestedCredits = null }) => {
  const balance = Math.max(0, Number(userWalletBalance) || 0);
  const total = Math.max(0, Number(bookingTotal) || 0);

  if (balance <= 0 || total <= 0) {
    return {
      canApply: false,
      applicableCredits: 0,
      payableTotal: total,
      balanceRemaining: balance,
    };
  }

  let creditToUse = Math.min(balance, total);
  if (requestedCredits !== null && !isNaN(requestedCredits)) {
    creditToUse = Math.min(creditToUse, Math.max(0, Number(requestedCredits)));
  }

  return {
    canApply: creditToUse > 0,
    applicableCredits: creditToUse,
    payableTotal: Math.max(0, total - creditToUse),
    balanceRemaining: Math.max(0, balance - creditToUse),
  };
};

/**
 * 7. Deduct wallet credits on successful booking creation
 */
const deductWalletCredits = async ({ userId, amount, bookingId, spotTitle = "Outdoor Space" }) => {
  if (!userId || !amount || amount <= 0) return null;

  const user = await User.findById(userId);
  if (!user || user.walletBalance < amount) {
    throw new Error("Insufficient wallet balance to apply credits.");
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalance: -amount } },
    { new: true }
  );

  const transaction = await WalletTransaction.create({
    user: userId,
    amount: -amount,
    balanceAfter: updatedUser.walletBalance,
    type: "booking_discount",
    referenceId: bookingId.toString(),
    description: `Applied ₹${amount} Thikana credits to reservation for "${spotTitle}"`,
  });

  return {
    deducted: amount,
    balanceAfter: updatedUser.walletBalance,
    transaction,
  };
};

/**
 * 8. Refund wallet credits on booking cancellation
 */
const refundWalletCredits = async ({ userId, amount, bookingId }) => {
  if (!userId || !amount || amount <= 0) return null;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalance: amount } },
    { new: true }
  );

  const transaction = await WalletTransaction.create({
    user: userId,
    amount: amount,
    balanceAfter: updatedUser.walletBalance,
    type: "booking_refund",
    referenceId: bookingId ? bookingId.toString() : null,
    description: `Refund of ₹${amount} wallet credits from cancelled booking #${
      bookingId ? bookingId.toString().slice(-6) : ""
    }`,
  });

  return {
    refunded: amount,
    balanceAfter: updatedUser.walletBalance,
    transaction,
  };
};

/**
 * 9. Handle Booking Cancellation for Referrals
 * If a qualifying booking is cancelled before check-in, disqualify referral and adjust
 */
const handleBookingCancellation = async (booking) => {
  if (!booking) return;

  // A. Refund any credits used by customer
  if (booking.appliedWalletCredits && booking.appliedWalletCredits > 0) {
    await refundWalletCredits({
      userId: booking.user._id ? booking.user._id : booking.user,
      amount: booking.appliedWalletCredits,
      bookingId: booking._id,
    });
  }

  // B. Check if this booking was the qualifying booking for a referral
  const referral = await Referral.findOne({ qualifyingBooking: booking._id });
  if (referral && referral.status === "rewarded") {
    // If the booking was cancelled, update referral record status
    referral.status = "disqualified";
    referral.disqualificationReason = `Qualifying booking #${booking._id.toString().slice(-6)} was cancelled.`;
    await referral.save();
  }
};

module.exports = {
  MIN_QUALIFYING_AMOUNT,
  DEFAULT_REWARD_AMOUNT,
  generateUniqueReferralCode,
  ensureUserReferralCode,
  validateReferralCode,
  registerReferral,
  processQualifyingBooking,
  calculateApplicableCredits,
  deductWalletCredits,
  refundWalletCredits,
  handleBookingCancellation,
};
