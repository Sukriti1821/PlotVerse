const GiftVoucher = require("../models/GiftVoucher");
const asyncHandler = require("../utils/asyncHandler");
const giftService = require("../services/giftService");

// 1. CREATE GIFT ORDER (POST /api/gifts/order)
const createGift = asyncHandler(async (req, res) => {
  const result = await giftService.createGiftOrder({
    buyerId: req.user._id,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    data: result,
    message: result.fullyPaid
      ? "Gift voucher activated with wallet credits!"
      : "Gift order initiated. Please complete payment.",
  });
});

// 2. VERIFY GIFT PAYMENT (POST /api/gifts/verify-payment)
const verifyPayment = asyncHandler(async (req, res) => {
  const { voucherId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const result = await giftService.verifyGiftPayment({
    voucherId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  res.json({
    success: true,
    data: result.voucher,
    message: result.message,
  });
});

// 3. GET VOUCHER PUBLIC DETAILS (GET /api/gifts/voucher/:code)
const getVoucher = asyncHandler(async (req, res) => {
  const { code } = req.params;

  const result = await giftService.getVoucherPublicDetails(code);

  res.json({
    success: true,
    data: result,
  });
});

// 4. REDEEM GIFT VOUCHER (POST /api/gifts/redeem)
const redeemVoucher = asyncHandler(async (req, res) => {
  const { voucherCode, selectedDate, selectedStartTime } = req.body;

  const result = await giftService.redeemGiftVoucher({
    voucherCode,
    recipientUserId: req.user._id,
    recipientEmail: req.user.email,
    selectedDate,
    selectedStartTime,
  });

  res.json({
    success: true,
    data: result,
    message: result.message,
  });
});

// 5. GET MY SENT GIFTS (GET /api/gifts/my-sent-gifts)
const getMySentGifts = asyncHandler(async (req, res) => {
  const gifts = await GiftVoucher.find({ buyer: req.user._id })
    .populate("spot", "title location images")
    .populate("experience", "title image durationHours")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: gifts,
  });
});

// 6. GET MY RECEIVED GIFTS (GET /api/gifts/my-received-gifts)
const getMyReceivedGifts = asyncHandler(async (req, res) => {
  const gifts = await GiftVoucher.find({
    recipientEmail: req.user.email.toLowerCase().trim(),
    status: { $in: ["active", "redeemed"] },
  })
    .populate("spot", "title location images")
    .populate("experience", "title image durationHours")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: gifts,
  });
});

module.exports = {
  createGift,
  verifyPayment,
  getVoucher,
  redeemVoucher,
  getMySentGifts,
  getMyReceivedGifts,
};
