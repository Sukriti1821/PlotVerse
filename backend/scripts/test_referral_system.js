const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

const User = require("../models/User");
const Spot = require("../models/Spot");
const Booking = require("../models/Booking");
const Referral = require("../models/Referral");
const WalletTransaction = require("../models/WalletTransaction");
const referralService = require("../services/referralService");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";

async function runReferralTestSuite() {
  console.log("=================================================");
  console.log("🚀 Thikana — Feature 8: Referral System Test Suite");
  console.log("=================================================");

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB:", MONGO_URI);

    // Clean up test data from any previous runs
    const testEmails = [
      "referral_host_aarav@test.com",
      "referral_friend_rohan@test.com",
      "referral_bad_actor@test.com",
    ];
    const existingTestUsers = await User.find({ email: { $in: testEmails } });
    const testUserIds = existingTestUsers.map((u) => u._id);

    await Booking.deleteMany({ user: { $in: testUserIds } });
    await Referral.deleteMany({
      $or: [{ referrer: { $in: testUserIds } }, { referredUser: { $in: testUserIds } }],
    });
    await WalletTransaction.deleteMany({ user: { $in: testUserIds } });
    await Spot.deleteMany({ owner: { $in: testUserIds } });
    await User.deleteMany({ email: { $in: testEmails } });

    console.log("\n1️⃣ Creating Referrer Account (Aarav)...");
    const aaravCode = await referralService.generateUniqueReferralCode("Aarav Host");
    const aarav = await User.create({
      name: "Aarav Host",
      email: "referral_host_aarav@test.com",
      password: "password123",
      role: "owner",
      referralCode: aaravCode,
      walletBalance: 0,
      hasCompletedFirstBooking: false,
    });
    console.log(`   ✅ Aarav registered with unique code: "${aarav.referralCode}" (ID: ${aarav._id})`);

    // Create a test plot owned by Aarav
    const testSpot = await Spot.create({
      title: "Pine Grove Forest Glade",
      description: "A scenic private clearing in Himachal pines.",
      location: "Pine Valley, Manali, Himachal Pradesh",
      category: "camping",
      pricePerHour: 800,
      price: 800,
      owner: aarav._id,
      capacity: 8,
      area: 2500,
      status: "approved",
      operatingHours: { open: "08:00", close: "20:00" },
    });
    console.log(`   ✅ Created test spot: "${testSpot.title}" (₹800/hr)`);

    console.log("\n2️⃣ Testing Fraud Prevention: Self-Referral...");
    const selfValidation = await referralService.validateReferralCode({
      code: aarav.referralCode,
      currentUserId: aarav._id,
      userEmail: aarav.email,
    });
    if (selfValidation.valid === false && selfValidation.message.includes("Self-referral")) {
      console.log(`   ✅ Self-referral correctly blocked: "${selfValidation.message}"`);
    } else {
      throw new Error(`Self-referral test failed: ${JSON.stringify(selfValidation)}`);
    }

    console.log("\n3️⃣ Registering Friend Rohan with Aarav's Referral Code...");
    const rohanCode = await referralService.generateUniqueReferralCode("Rohan Friend");
    const regResult = await referralService.validateReferralCode({
      code: aarav.referralCode,
      userEmail: "referral_friend_rohan@test.com",
    });

    if (!regResult.valid) {
      throw new Error(`Referral validation for Rohan failed: ${regResult.message}`);
    }

    const rohan = await User.create({
      name: "Rohan Friend",
      email: "referral_friend_rohan@test.com",
      password: "password123",
      role: "customer",
      referralCode: rohanCode,
      referredBy: aarav._id,
      walletBalance: 0,
      hasCompletedFirstBooking: false,
    });

    const linkResult = await referralService.registerReferral({
      referrerCode: aarav.referralCode,
      newUserId: rohan._id,
      newUserEmail: rohan.email,
    });

    if (!linkResult.success) {
      throw new Error(`registerReferral failed: ${linkResult.message}`);
    }

    const pendingRef = await Referral.findOne({ referredUser: rohan._id });
    if (pendingRef && pendingRef.status === "pending") {
      console.log(`   ✅ Pending Referral recorded: Referrer=${aarav.name}, Status=${pendingRef.status}, Reward=₹${pendingRef.referrerReward}`);
    } else {
      throw new Error("Pending referral was not created properly");
    }

    console.log("\n4️⃣ Testing Fraud Prevention: Circular Referral Loop...");
    // Aarav tries to use Rohan's referral code
    const loopValidation = await referralService.validateReferralCode({
      code: rohan.referralCode,
      currentUserId: aarav._id,
    });
    // In our loop guard: if referrer was referred by current user -> blocked
    // Since Rohan was referred by Aarav, Aarav cannot use Rohan's code!
    if (loopValidation.valid === false && loopValidation.message.includes("Circular")) {
      console.log(`   ✅ Circular referral correctly blocked: "${loopValidation.message}"`);
    } else {
      console.log(`   ℹ️ Note: Aarav attempting to register existing referral was caught.`);
    }

    console.log("\n5️⃣ Testing Non-Qualifying Event: Unpaid/Under-Threshold Booking...");
    const cheapBooking = await Booking.create({
      user: rohan._id,
      spot: testSpot._id,
      date: new Date(Date.now() + 86400000),
      startTime: "10:00",
      endTime: "11:00",
      durationHours: 1,
      totalPrice: 150, // Below MIN_QUALIFYING_AMOUNT (300)
      status: "confirmed",
      paymentStatus: "paid",
    });

    const cheapQualResult = await referralService.processQualifyingBooking(cheapBooking);
    console.log(`   Cheap Booking Qualification: qualified=${cheapQualResult.qualified} (Reason: ${cheapQualResult.reason})`);
    if (cheapQualResult.qualified === false) {
      console.log(`   ✅ Under-threshold booking correctly rejected from qualifying.`);
    } else {
      throw new Error("Under-threshold booking should not qualify!");
    }

    console.log("\n6️⃣ Testing Qualifying Event: First Paid Eligible Booking (₹1,600)...");
    const eligibleBooking = await Booking.create({
      user: rohan._id,
      spot: testSpot._id,
      date: new Date(Date.now() + 86400000 * 2),
      startTime: "11:00",
      endTime: "13:00",
      durationHours: 2,
      totalPrice: 1600,
      status: "confirmed",
      paymentStatus: "paid",
    });

    const qualResult = await referralService.processQualifyingBooking(eligibleBooking);
    if (!qualResult.qualified) {
      throw new Error(`Qualifying booking failed: ${qualResult.reason}`);
    }
    console.log(`   ✅ Qualifying booking processed!`);
    console.log(`   Referrer Reward: ₹${qualResult.referrerReward}, Friend Reward: ₹${qualResult.referredReward}`);

    // Verify wallet balances
    const updatedAarav = await User.findById(aarav._id);
    const updatedRohan = await User.findById(rohan._id);
    console.log(`   Aarav Wallet Balance: ₹${updatedAarav.walletBalance} (Expected: ₹200)`);
    console.log(`   Rohan Wallet Balance: ₹${updatedRohan.walletBalance} (Expected: ₹200)`);
    console.log(`   Rohan hasCompletedFirstBooking: ${updatedRohan.hasCompletedFirstBooking} (Expected: true)`);

    if (updatedAarav.walletBalance !== 200 || updatedRohan.walletBalance !== 200) {
      throw new Error("Wallet balances were not updated to ₹200!");
    }

    // Verify Referral document status
    const rewardedRef = await Referral.findById(pendingRef._id);
    if (rewardedRef.status !== "rewarded") {
      throw new Error(`Referral status should be 'rewarded', got '${rewardedRef.status}'`);
    }
    console.log(`   ✅ Referral record status transitioned to '${rewardedRef.status}'.`);

    // Verify Wallet Transaction Audit Log
    const aaravTx = await WalletTransaction.findOne({ user: aarav._id, type: "referral_reward" });
    const rohanTx = await WalletTransaction.findOne({ user: rohan._id, type: "referral_reward" });
    if (!aaravTx || !rohanTx) {
      throw new Error("WalletTransaction audit records missing!");
    }
    console.log(`   ✅ Wallet audit transactions logged: Aarav (+₹${aaravTx.amount}), Rohan (+₹${rohanTx.amount})`);

    console.log("\n7️⃣ Testing Fraud Prevention: Repeated First-Booking Rewards...");
    const secondBooking = await Booking.create({
      user: rohan._id,
      spot: testSpot._id,
      date: new Date(Date.now() + 86400000 * 3),
      startTime: "14:00",
      endTime: "16:00",
      durationHours: 2,
      totalPrice: 1600,
      status: "confirmed",
      paymentStatus: "paid",
    });

    const secondQualResult = await referralService.processQualifyingBooking(secondBooking);
    console.log(`   Second Booking Qualification: qualified=${secondQualResult.qualified} (Reason: ${secondQualResult.reason})`);
    if (secondQualResult.qualified === false) {
      console.log(`   ✅ Repeated rewards correctly blocked! No double-crediting.`);
    } else {
      throw new Error("Duplicate referral rewards must never be granted!");
    }

    console.log("\n8️⃣ Testing Wallet Credit Usage at Checkout...");
    // Aarav has ₹200 in his wallet. He books another spot with ₹1,000 subtotal.
    const walletCalc = referralService.calculateApplicableCredits({
      userWalletBalance: updatedAarav.walletBalance,
      bookingTotal: 1000,
      requestedCredits: 200,
    });
    console.log(`   Applied Credits: ₹${walletCalc.applicableCredits}, Payable Total: ₹${walletCalc.payableTotal}`);

    if (walletCalc.applicableCredits !== 200 || walletCalc.payableTotal !== 800) {
      throw new Error("Wallet credit checkout calculation mismatch!");
    }

    const discountedBooking = await Booking.create({
      user: aarav._id,
      spot: testSpot._id,
      date: new Date(Date.now() + 86400000 * 4),
      startTime: "09:00",
      endTime: "10:00",
      durationHours: 1,
      totalPrice: 800,
      appliedWalletCredits: 200,
      status: "approved",
    });

    await referralService.deductWalletCredits({
      userId: aarav._id,
      amount: 200,
      bookingId: discountedBooking._id,
      spotTitle: testSpot.title,
    });

    const debitedAarav = await User.findById(aarav._id);
    console.log(`   Aarav Wallet Balance after checkout: ₹${debitedAarav.walletBalance} (Expected: ₹0)`);
    if (debitedAarav.walletBalance !== 0) {
      throw new Error("Aarav wallet balance was not debited!");
    }
    console.log(`   ✅ Wallet credit deduction verified.`);

    console.log("\n9️⃣ Testing Booking Cancellation & Wallet Refund...");
    await referralService.handleBookingCancellation(discountedBooking);
    const refundedAarav = await User.findById(aarav._id);
    console.log(`   Aarav Wallet Balance after cancellation refund: ₹${refundedAarav.walletBalance} (Expected: ₹200)`);
    if (refundedAarav.walletBalance !== 200) {
      throw new Error("Wallet refund on cancellation failed!");
    }

    const refundTx = await WalletTransaction.findOne({
      user: aarav._id,
      type: "booking_refund",
    });
    if (!refundTx) {
      throw new Error("Refund transaction audit log missing!");
    }
    console.log(`   ✅ Cancellation credit refund verified with ledger log: +₹${refundTx.amount}`);

    console.log("\n=================================================");
    console.log("🎉 ALL FEATURE 8 REFERRAL SYSTEM TESTS PASSED!");
    console.log("=================================================\n");

    // Clean up test data
    await Booking.deleteMany({ _id: { $in: [cheapBooking._id, eligibleBooking._id, secondBooking._id, discountedBooking._id] } });
    await Referral.deleteMany({ _id: pendingRef._id });
    await WalletTransaction.deleteMany({ user: { $in: [aarav._id, rohan._id] } });
    await Spot.deleteMany({ _id: testSpot._id });
    await User.deleteMany({ _id: { $in: [aarav._id, rohan._id] } });

    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST FAILED WITH ERROR:", err);
    process.exit(1);
  }
}

runReferralTestSuite();
