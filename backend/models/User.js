const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your full name"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Please provide your email address"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters long"],
    },

    role: {
      type: String,
      enum: {
        values: ["customer", "owner", "tourist", "admin", "corporate"],
        message: "{VALUE} is not a valid role.",
      },
      required: [true, "Please specify a role"],
    },

    avatar: {
      type: String,
      default: "",
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Spot",
      },
    ],

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    // Feature 8: Referral System & Customer Wallet
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    hasCompletedFirstBooking: {
      type: Boolean,
      default: false,
    },

    // Feature 10: B2B Corporate Linkage
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    organizationRole: {
      type: String,
      enum: ["admin", "organizer", "member", "none"],
      default: "none",
    },

    // Admin & Account Management fields
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspensionReason: {
      type: String,
      default: "",
    },
    isOwnerApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);