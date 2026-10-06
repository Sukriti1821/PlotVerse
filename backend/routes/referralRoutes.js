const express = require("express");
const router = express.Router();
const {
  getMyReferralInfo,
  getWalletHistory,
  validateReferralCode,
} = require("../controllers/referralController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/validate-code", validateReferralCode);

// Protected routes (Customer & Owner)
router.get("/my-referral-info", protect, getMyReferralInfo);
router.get("/wallet-history", protect, getWalletHistory);

module.exports = router;
