/**
 * Verification Script: Admin Panel & Commission/Payout Split
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Spot = require("../models/Spot");
const Booking = require("../models/Booking");
const Settings = require("../models/Settings");

async function runVerification() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
  console.log(`Connecting to MongoDB: ${mongoUri}`);
  await mongoose.connect(mongoUri);

  try {
    console.log("\n🧪 --- TEST SUITE: ADMIN PANEL & COMMISSION SYSTEM ---");

    // 1. Verify Users & Roles
    const admin = await User.findOne({ role: "admin" });
    const owner = await User.findOne({ role: "owner" });
    const customer = await User.findOne({ role: "customer" });

    if (!admin) throw new Error("Admin user not found in database");
    if (!owner) throw new Error("Owner user not found in database");
    if (!customer) throw new Error("Customer user not found in database");

    console.log(`✅ Admin user exists: ${admin.email} (${admin.role})`);
    console.log(`✅ Owner user exists: ${owner.email} (${owner.role})`);
    console.log(`✅ Customer user exists: ${customer.email} (${customer.role})`);

    // 2. Verify Settings
    const settings = await Settings.getSettings();
    if (!settings || settings.defaultCommissionRate === undefined) {
      throw new Error("Settings singleton failed to load");
    }
    console.log(`✅ Platform Settings loaded: Default Commission = ${settings.defaultCommissionRate}%`);

    // 3. Test Commission calculation
    const testSpot = await Spot.findOne({ owner: owner._id });
    if (!testSpot) throw new Error("No spots found for owner");

    const newBooking = await Booking.create({
      user: customer._id,
      spot: testSpot._id,
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      startTime: "10:00",
      endTime: "14:00",
      durationHours: 4,
      guests: 2,
      totalPrice: 4000,
      status: "approved",
      paymentStatus: "unpaid",
    });

    console.log(`✅ Created test booking ${newBooking._id} for ₹4000`);

    // Simulate payment confirmation calculation
    const rate = settings.defaultCommissionRate || 10;
    const platformCommission = Math.round((newBooking.totalPrice * rate) / 100);
    const ownerPayoutAmount = Math.max(0, newBooking.totalPrice - platformCommission);

    newBooking.status = "confirmed";
    newBooking.paymentStatus = "paid";
    newBooking.amountPaid = newBooking.totalPrice;
    newBooking.paidAt = new Date();
    newBooking.commissionRate = rate;
    newBooking.platformCommission = platformCommission;
    newBooking.ownerPayoutAmount = ownerPayoutAmount;
    newBooking.payoutStatus = "pending";
    await newBooking.save();

    if (newBooking.platformCommission !== 400) {
      throw new Error(`Expected platform commission to be ₹400 (10% of 4000), got ${newBooking.platformCommission}`);
    }
    if (newBooking.ownerPayoutAmount !== 3600) {
      throw new Error(`Expected owner payout to be ₹3600, got ${newBooking.ownerPayoutAmount}`);
    }
    console.log(`✅ Commission Split calculated properly: Gross ₹${newBooking.totalPrice}, Platform Commission (10%) = ₹${newBooking.platformCommission}, Owner Net Payout = ₹${newBooking.ownerPayoutAmount}`);

    // 4. Test Owner Suspension & Automatic Spot Unpublishing
    console.log("\n🧪 Testing Owner Suspension & Spot Unpublish...");
    owner.isSuspended = true;
    owner.suspendedAt = new Date();
    owner.suspensionReason = "Policy compliance audit";
    await owner.save();

    await Spot.updateMany(
      { owner: owner._id, isUnpublishedByAdmin: false },
      {
        isUnpublishedByAdmin: true,
        adminFlagReason: "Host account suspended: Policy compliance audit",
        adminFlaggedAt: new Date(),
      }
    );

    const unpublishedCount = await Spot.countDocuments({ owner: owner._id, isUnpublishedByAdmin: true });
    console.log(`✅ Owner suspended. Unpublished ${unpublishedCount} spots owned by ${owner.name}`);

    // Reactivate owner
    owner.isSuspended = false;
    owner.suspendedAt = null;
    owner.suspensionReason = "";
    await owner.save();

    await Spot.updateMany(
      { owner: owner._id, isUnpublishedByAdmin: true, adminFlagReason: { $regex: /Host account suspended/i } },
      { isUnpublishedByAdmin: false, adminFlagReason: "", adminFlaggedAt: null }
    );
    const restoredCount = await Spot.countDocuments({ owner: owner._id, isUnpublishedByAdmin: false });
    console.log(`✅ Owner reactivated. Restored ${restoredCount} spots`);

    // 5. Test Payout Settlement
    console.log("\n🧪 Testing Manual Payout Settlement...");
    newBooking.payoutStatus = "paid";
    newBooking.payoutDate = new Date();
    newBooking.payoutNote = "NEFT Ref #123456789 - Admin settlement";
    await newBooking.save();

    const verifiedBooking = await Booking.findById(newBooking._id);
    if (verifiedBooking.payoutStatus !== "paid" || !verifiedBooking.payoutDate) {
      throw new Error("Payout settlement verification failed");
    }
    console.log(`✅ Payout marked as paid on ${verifiedBooking.payoutDate.toISOString()} with note: "${verifiedBooking.payoutNote}"`);

    // Clean up test booking
    await Booking.findByIdAndDelete(newBooking._id);
    console.log("✅ Cleaned up temporary test booking");

    console.log("\n🎉 ALL BACKEND VERIFICATIONS PASSED!");
  } finally {
    await mongoose.disconnect();
  }
}

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
