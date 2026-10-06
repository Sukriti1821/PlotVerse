const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    defaultCommissionRate: {
      type: Number,
      required: true,
      default: 10,
      min: [0, "Commission percentage cannot be negative"],
      max: [100, "Commission percentage cannot exceed 100%"],
    },
    platformName: {
      type: String,
      default: "Thikana",
      trim: true,
    },
    requireOwnerApproval: {
      type: Boolean,
      default: false,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helper static method to get singleton settings document
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      defaultCommissionRate: 10,
      platformName: "Thikana",
      requireOwnerApproval: false,
    });
  }
  return settings;
};

module.exports = mongoose.model("Settings", settingsSchema);
