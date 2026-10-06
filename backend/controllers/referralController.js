const Referral = require("../models/Referral");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const asyncHandler = require("../utils/asyncHandler");
const referralService = require("../services/referralService");

// Helper to mask email for privacy (e.g. rohan.travel@thikana.com -> r****l@thikana.com)
const maskEmail = (email) => {
  if (!email || !email.includes("@")) return "Customer";
  const [user, domain] = email.split("@");
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${"*".repeat(Math.min(user.length - 2, 4))}${user[user.length - 1]}@${domain}`;
};

// 1. GET USER REFERRAL DASHBOARD INFO (GET /api/referrals/my-referral-info)
const getMyReferralInfo = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Ensure user has a unique referral code
  const referralCode = await referralService.ensureUserReferralCode(user);

  // Derive client base URL
  const rawClientUrls = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((u) => u.trim().replace(/\/$/, ""))
    : [];
  const clientBaseUrl = rawClientUrls[0] || "http://localhost:5173";
  const referralLink = `${clientBaseUrl}/?ref=${referralCode}`;

  // Fetch all referrals made by this user
  const referrals = await Referral.find({ referrer: user._id })
    .populate("referredUser", "name email createdAt")
    .sort({ createdAt: -1 });

  // Calculate metrics
  let totalInvites = referrals.length;
  let successfulReferrals = 0;
  let pendingReferrals = 0;
  let disqualifiedReferrals = 0;

  const referralHistory = referrals.map((ref) => {
    if (ref.status === "rewarded" || ref.status === "qualified") {
      successfulReferrals++;
    } else if (ref.status === "pending") {
      pendingReferrals++;
    } else if (ref.status === "disqualified") {
      disqualifiedReferrals++;
    }

    const friendName = ref.referredUser?.name || "Plot Explorer";
    const friendEmailMasked = maskEmail(ref.referredUser?.email);

    return {
      _id: ref._id,
      friendName,
      friendEmailMasked,
      status: ref.status,
      rewardAmount: ref.referrerReward || referralService.DEFAULT_REWARD_AMOUNT,
      rewardedAt: ref.rewardedAt,
      createdAt: ref.createdAt,
      disqualificationReason: ref.disqualificationReason,
    };
  });

  // Calculate total referral rewards earned from ledger
  const rewardTransactions = await WalletTransaction.find({
    user: user._id,
    type: "referral_reward",
  });
  const totalCreditsEarned = rewardTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  res.json({
    success: true,
    data: {
      referralCode,
      referralLink,
      walletBalance: user.walletBalance || 0,
      totalCreditsEarned,
      rewardPerReferral: referralService.DEFAULT_REWARD_AMOUNT,
      minQualifyingAmount: referralService.MIN_QUALIFYING_AMOUNT,
      stats: {
        totalInvites,
        successfulReferrals,
        pendingReferrals,
        disqualifiedReferrals,
      },
      referralHistory,
    },
  });
});

// 2. GET USER WALLET CREDIT HISTORY (GET /api/referrals/wallet-history)
const getWalletHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("walletBalance");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const transactions = await WalletTransaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    data: {
      walletBalance: user.walletBalance || 0,
      transactions,
    },
  });
});

// 3. VALIDATE REFERRAL CODE (POST /api/referrals/validate-code)
const validateReferralCode = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Referral code is required.",
    });
  }

  const result = await referralService.validateReferralCode({
    code,
    currentUserId: req.user?._id || null,
  });

  if (!result.valid) {
    return res.status(400).json({
      success: false,
      message: result.message,
    });
  }

  res.json({
    success: true,
    code: result.code,
    referrerName: result.referrer.name,
    rewardAmount: result.rewardAmount,
    message: result.message,
  });
});

module.exports = {
  getMyReferralInfo,
  getWalletHistory,
  validateReferralCode,
};
