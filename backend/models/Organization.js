const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company / Organization name is required"],
      trim: true,
      index: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    industry: {
      type: String,
      trim: true,
      default: "Technology",
    },
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
      default: "11-50",
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    billingAddress: {
      type: String,
      trim: true,
      default: "",
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    contactPhone: {
      type: String,
      trim: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    logo: {
      type: String,
      default: "",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        designation: { type: String, trim: true, default: "Event Coordinator" },
        role: {
          type: String,
          enum: ["admin", "organizer", "member"],
          default: "organizer",
        },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Organization", organizationSchema);
