const mongoose = require("mongoose");

const giftVoucherSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    senderName: {
      type: String,
      required: [true, "Sender name is required"],
      trim: true,
    },

    recipientName: {
      type: String,
      required: [true, "Recipient name is required"],
      trim: true,
    },

    recipientEmail: {
      type: String,
      required: [true, "Recipient email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },

    recipientPhone: {
      type: String,
      default: "",
      trim: true,
    },

    personalMessage: {
      type: String,
      default: "Enjoy this special outdoor escape on Thikana — Mera Thikana!",
      trim: true,
      maxlength: 1000,
    },

    spot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Spot",
      required: true,
      index: true,
    },

    experience: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experience",
      default: null,
      index: true,
    },

    experienceTitle: {
      type: String,
      default: "",
      trim: true,
    },

    selectedAddOns: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],

    durationHours: {
      type: Number,
      required: true,
      default: 2,
    },

    giftAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    appliedWalletCredits: {
      type: Number,
      default: 0,
      min: 0,
    },

    voucherCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    securityPin: {
      type: String,
      default: "",
    },

    giftType: {
      type: String,
      enum: ["open_voucher", "scheduled_date"],
      default: "open_voucher",
    },

    scheduledDate: {
      type: Date,
      default: null,
    },

    scheduledStartTime: {
      type: String,
      default: null,
    },

    scheduledEndTime: {
      type: String,
      default: null,
    },

    validFrom: {
      type: Date,
      default: Date.now,
    },

    validUntil: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days (6 months)
      index: true,
    },

    deliveryDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["pending_payment", "active", "redeemed", "cancelled", "expired"],
      default: "pending_payment",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    redeemedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    redeemedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

giftVoucherSchema.index({ buyer: 1, createdAt: -1 });
giftVoucherSchema.index({ recipientEmail: 1, status: 1 });

module.exports = mongoose.model("GiftVoucher", giftVoucherSchema);
