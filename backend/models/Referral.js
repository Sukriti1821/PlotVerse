const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // A user can only be referred once in their lifetime
      index: true,
    },

    referralCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "qualified", "rewarded", "disqualified"],
      default: "pending",
      index: true,
    },

    qualifyingBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    referrerReward: {
      type: Number,
      default: 200,
      min: 0,
    },

    referredReward: {
      type: Number,
      default: 200,
      min: 0,
    },

    campaignName: {
      type: String,
      default: "standard_200_launch",
      trim: true,
    },

    qualifiedAt: {
      type: Date,
      default: null,
    },

    rewardedAt: {
      type: Date,
      default: null,
    },

    disqualificationReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly look up all referrals by referrer sorted by date
referralSchema.index({ referrer: 1, createdAt: -1 });

module.exports = mongoose.model("Referral", referralSchema);
