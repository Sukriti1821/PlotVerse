const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    promoType: {
      type: String,
      enum: [
        "coupon_code",        // Standard promo code entered at checkout
        "early_bird",         // Automatic discount for booking X days in advance
        "repeat_customer",    // Automatic loyalty discount for returning guests
        "limited_time_deal",  // Flash sale / limited-time promotional rate
        "banner_announcement" // Announcement / marketing banner on listing
      ],
      default: "coupon_code",
      required: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    // Applicable targets
    applicableType: {
      type: String,
      enum: ["all", "spot", "experience"],
      default: "all",
    },
    applicableSpot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Spot",
      default: null,
    },
    applicableExperience: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experience",
      default: null,
    },
    // Timing
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    // Restrictions
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    timesUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    minBookingValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Early-bird specific config
    advanceNoticeDays: {
      type: Number,
      default: 7, // days in advance required to qualify
    },
    // Promotional banner text
    bannerText: {
      type: String,
      trim: true,
      default: "",
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    allowStacking: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Promotion", promotionSchema);
