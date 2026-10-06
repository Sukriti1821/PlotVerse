const express = require("express");
const router = express.Router();

const {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
} = require("../controllers/paymentController");

const { protect } = require("../middleware/authMiddleware");

// 1. Create Razorpay Payment Order (Protected, Customer)
router.post("/create-order", protect, createPaymentOrder);

// 2. Cryptographically Verify Razorpay Payment (Protected, Customer)
router.post("/verify", protect, verifyPayment);

// 3. Razorpay Webhook Endpoint (Public, verified via X-Razorpay-Signature header)
router.post("/webhook", handleWebhook);

module.exports = router;
