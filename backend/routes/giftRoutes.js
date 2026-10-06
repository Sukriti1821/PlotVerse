const express = require("express");
const router = express.Router();
const {
  createGift,
  verifyPayment,
  getVoucher,
  redeemVoucher,
  getMySentGifts,
  getMyReceivedGifts,
} = require("../controllers/giftController");
const { protect } = require("../middleware/authMiddleware");

// Public route for voucher details preview
router.get("/voucher/:code", getVoucher);

// Protected routes (Customer & Owner)
router.post("/order", protect, createGift);
router.post("/verify-payment", protect, verifyPayment);
router.post("/redeem", protect, redeemVoucher);
router.get("/my-sent-gifts", protect, getMySentGifts);
router.get("/my-received-gifts", protect, getMyReceivedGifts);

module.exports = router;
