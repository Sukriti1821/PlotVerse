const mongoose = require("mongoose");

/**
 * SlotLock Schema
 * Provides database-level serialization and race-condition prevention.
 * Each document represents a discrete time bucket (e.g. 30-minute interval)
 * occupied by an active booking or its host-turnaround buffer period.
 */
const slotLockSchema = new mongoose.Schema(
  {
    spot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Spot",
      required: true,
      index: true,
    },
    dateStr: {
      type: String, // "YYYY-MM-DD"
      required: true,
      index: true,
    },
    slotKey: {
      type: String, // "YYYY-MM-DD_HH:MM"
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    isBuffer: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// CRITICAL: Compound Unique Index enforced by MongoDB WiredTiger B-tree engine
// Guarantees at the storage engine level that overlapping time slots cannot be booked simultaneously.
slotLockSchema.index({ spot: 1, slotKey: 1 }, { unique: true });

module.exports = mongoose.model("SlotLock", slotLockSchema);
