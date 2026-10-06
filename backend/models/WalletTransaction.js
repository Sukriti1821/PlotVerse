const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true, // +200 or -200
    },

    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    type: {
      type: String,
      enum: [
        "referral_reward",
        "booking_discount",
        "booking_refund",
        "admin_adjustment",
        "welcome_credit",
      ],
      required: true,
    },

    referenceId: {
      type: String,
      default: null,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
