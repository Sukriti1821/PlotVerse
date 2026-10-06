const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

const User = require("../models/User");
const Spot = require("../models/Spot");
const Experience = require("../models/Experience");
const Booking = require("../models/Booking");
const GiftVoucher = require("../models/GiftVoucher");
const giftService = require("../services/giftService");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";

async function runGiftTestSuite() {
  console.log("=================================================");
  console.log("🚀 Thikana — Feature 9: Gift Bookings Test Suite");
  console.log("=================================================");

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB:", MONGO_URI);

    // Clean up test data
    const testEmails = [
      "gift_buyer_rohan@test.com",
      "gift_recipient_priya@test.com",
      "gift_bad_actor@test.com",
      "gift_host_meera@test.com",
    ];

    const testUsers = await User.find({ email: { $in: testEmails } });
    const userIds = testUsers.map((u) => u._id);

    await Booking.deleteMany({ user: { $in: userIds } });
    await GiftVoucher.deleteMany({ buyer: { $in: userIds } });
    await Experience.deleteMany({ owner: { $in: userIds } });
    await Spot.deleteMany({ owner: { $in: userIds } });
    await User.deleteMany({ email: { $in: testEmails } });

    console.log("\n1️⃣ Creating Test Host Meera, Buyer Rohan, Recipient Priya, and Bad Actor...");
    const host = await User.create({
      name: "Meera Host",
      email: "gift_host_meera@test.com",
      password: "password123",
      role: "owner",
    });

    const buyer = await User.create({
      name: "Rohan Sharma",
      email: "gift_buyer_rohan@test.com",
      password: "password123",
      role: "customer",
    });

    const recipient = await User.create({
      name: "Priya Kapoor",
      email: "gift_recipient_priya@test.com",
      password: "password123",
      role: "customer",
    });

    const badActor = await User.create({
      name: "Bad Actor",
      email: "gift_bad_actor@test.com",
      password: "password123",
      role: "customer",
    });

    console.log("   ✅ Users created: Buyer, Recipient, Host, Bad Actor");

    // Create Spot and Experience Package
    const spot = await Spot.create({
      title: "Manali Alpine Orchard Clearing",
      description: "Private secluded apple orchard meadow with mountain views.",
      location: "Old Manali, Himachal Pradesh",
      category: "orchard",
      price: 1000,
      pricePerHour: 1000,
      owner: host._id,
      capacity: 6,
      area: 3000,
      status: "approved",
      operatingHours: { open: "08:00", close: "22:00" },
    });

    const experience = await Experience.create({
      title: "Mountain Sunset Date & Stargazing",
      description: "A magical twilight setup with fairy lights and warm blankets.",
      spot: spot._id,
      owner: host._id,
      category: "Romantic Date",
      durationHours: 4,
      price: 2999,
      includedAmenities: [
        { name: "Fairy Lights & Candle Setup" },
        { name: "Cozy Recliner Seating" },
        { name: "Hot Herbal Tea" },
      ],
      optionalAddOns: [
        { name: "Bonfire & Wood Logs", price: 500 },
        { name: "Artisanal Cheese Platter", price: 750 },
      ],
      maxGuests: 2,
      isActive: true,
    });
    console.log(`   ✅ Created Experience: "${experience.title}" (₹2,999, 4h) at spot "${spot.title}"`);

    console.log("\n2️⃣ Buyer Rohan Purchases Experience as Gift for Priya...");
    const giftOrderResult = await giftService.createGiftOrder({
      buyerId: buyer._id,
      senderName: "Rohan Sharma",
      recipientName: "Priya Kapoor",
      recipientEmail: "gift_recipient_priya@test.com",
      recipientPhone: "+91 9876543210",
      personalMessage: "Happy Birthday Priya! Enjoy this mountain date under the stars ❤️",
      spotId: spot._id,
      experienceId: experience._id,
      selectedAddOns: [{ name: "Bonfire & Wood Logs", price: 500 }],
      durationHours: 4,
      giftType: "open_voucher",
    });

    const voucher = giftOrderResult.voucher;
    console.log(`   ✅ Gift Order Created!`);
    console.log(`   Voucher Code: "${voucher.voucherCode}"`);
    console.log(`   Total Prepaid Amount: ₹${voucher.giftAmount} (Expected: ₹3,499)`);
    console.log(`   Status: "${voucher.status}" (Expected: pending_payment)`);

    if (voucher.giftAmount !== 3499) {
      throw new Error(`Expected gift amount 3499, got ${voucher.giftAmount}`);
    }

    console.log("\n3️⃣ Simulating Payment Verification for Gift Voucher...");
    const verifyResult = await giftService.verifyGiftPayment({
      voucherId: voucher._id,
      razorpay_order_id: voucher.razorpayOrderId || "order_gift_mock_123",
      razorpay_payment_id: "pay_mock_gift_456",
      razorpay_signature: "mock_signature",
    });

    const activeVoucher = verifyResult.voucher;
    console.log(`   ✅ Payment verified! Voucher Status: "${activeVoucher.status}" (Expected: active)`);
    console.log(`   Payment Status: "${activeVoucher.paymentStatus}" (Expected: paid)`);

    if (activeVoucher.status !== "active" || activeVoucher.paymentStatus !== "paid") {
      throw new Error("Voucher activation failed!");
    }

    console.log("\n4️⃣ Testing Public Voucher Lookup (GET /api/gifts/voucher/:code)...");
    const publicDetails = await giftService.getVoucherPublicDetails(voucher.voucherCode);
    console.log(`   Public Preview for Code: ${publicDetails.voucherCode}`);
    console.log(`   Sender: ${publicDetails.senderName}`);
    console.log(`   Recipient: ${publicDetails.recipientName} (${publicDetails.recipientEmailMasked})`);
    console.log(`   Personal Message: "${publicDetails.personalMessage}"`);
    console.log(`   Can Redeem: ${publicDetails.canRedeem}`);

    if (publicDetails.senderName !== "Rohan Sharma" || !publicDetails.canRedeem) {
      throw new Error("Public voucher lookup returned unexpected data");
    }

    console.log("\n5️⃣ Testing Fraud Prevention: Unauthorized Recipient Account...");
    try {
      await giftService.redeemGiftVoucher({
        voucherCode: voucher.voucherCode,
        recipientUserId: badActor._id,
        recipientEmail: badActor.email,
        selectedDate: new Date(Date.now() + 86400000),
        selectedStartTime: "14:00",
      });
      throw new Error("Unauthorized recipient should have been blocked!");
    } catch (authErr) {
      if (authErr.message.includes("Unauthorized") || authErr.message.includes("specifically to")) {
        console.log(`   ✅ Unauthorized redemption correctly blocked: "${authErr.message}"`);
      } else {
        throw authErr;
      }
    }

    console.log("\n6️⃣ Testing Fraud Prevention: Expired Voucher Check...");
    // Temporarily set validUntil in past
    const expiredVoucher = await GiftVoucher.create({
      buyer: buyer._id,
      senderName: "Rohan",
      recipientName: "Priya",
      recipientEmail: "gift_recipient_priya@test.com",
      spot: spot._id,
      experience: experience._id,
      experienceTitle: experience.title,
      giftAmount: 2999,
      voucherCode: "GIFT-PLOT-EXPIRED-TEST",
      validUntil: new Date(Date.now() - 86400000), // Expired yesterday
      status: "active",
      paymentStatus: "paid",
    });

    try {
      await giftService.redeemGiftVoucher({
        voucherCode: expiredVoucher.voucherCode,
        recipientUserId: recipient._id,
        recipientEmail: recipient.email,
        selectedDate: new Date(Date.now() + 86400000),
        selectedStartTime: "14:00",
      });
      throw new Error("Expired voucher should have been rejected!");
    } catch (expErr) {
      if (expErr.message.includes("expired")) {
        console.log(`   ✅ Expired voucher correctly rejected: "${expErr.message}"`);
      } else {
        throw expErr;
      }
    }

    console.log("\n7️⃣ Testing Legitimate Recipient Redemption (Priya schedules for tomorrow)...");
    const targetDate = new Date(Date.now() + 86400000 * 2); // 2 days ahead
    const redeemResult = await giftService.redeemGiftVoucher({
      voucherCode: voucher.voucherCode,
      recipientUserId: recipient._id,
      recipientEmail: recipient.email,
      selectedDate: targetDate,
      selectedStartTime: "15:00",
    });

    const booking = redeemResult.booking;
    console.log(`   ✅ Gift Redeemed Successfully!`);
    console.log(`   Created Booking ID: ${booking._id}`);
    console.log(`   Booking Status: ${booking.status} (Expected: confirmed)`);
    console.log(`   Total Payable by Recipient: ₹${booking.totalPrice} (Expected: 0)`);
    console.log(`   Is Gift Booking: ${booking.isGiftBooking}`);
    console.log(`   Gift Sender: "${booking.giftSenderName}"`);
    console.log(`   Gift Message: "${booking.giftMessage}"`);

    if (booking.totalPrice !== 0 || !booking.isGiftBooking || booking.status !== "confirmed") {
      throw new Error("Redeemed booking does not match expected state!");
    }

    // Verify voucher record status in DB
    const redeemedVoucherDoc = await GiftVoucher.findById(voucher._id);
    console.log(`   Voucher Document Status in DB: "${redeemedVoucherDoc.status}" (Expected: redeemed)`);
    console.log(`   Redeemed By: ${redeemedVoucherDoc.redeemedBy}`);
    console.log(`   Redeemed Booking: ${redeemedVoucherDoc.redeemedBooking}`);

    if (redeemedVoucherDoc.status !== "redeemed") {
      throw new Error("Voucher document was not updated to 'redeemed'!");
    }

    console.log("\n8️⃣ Testing Fraud Prevention: Duplicate Redemption Attempt...");
    try {
      await giftService.redeemGiftVoucher({
        voucherCode: voucher.voucherCode,
        recipientUserId: recipient._id,
        recipientEmail: recipient.email,
        selectedDate: new Date(Date.now() + 86400000 * 3),
        selectedStartTime: "15:00",
      });
      throw new Error("Duplicate voucher redemption should have been blocked!");
    } catch (dupErr) {
      if (dupErr.message.includes("already been redeemed")) {
        console.log(`   ✅ Duplicate redemption correctly blocked: "${dupErr.message}"`);
      } else {
        throw dupErr;
      }
    }

    console.log("\n=================================================");
    console.log("🎉 ALL FEATURE 9 GIFT BOOKINGS TESTS PASSED!");
    console.log("=================================================\n");

    // Clean up test data
    await Booking.deleteMany({ _id: booking._id });
    await GiftVoucher.deleteMany({ _id: { $in: [voucher._id, expiredVoucher._id] } });
    await Experience.deleteMany({ _id: experience._id });
    await Spot.deleteMany({ _id: spot._id });
    await User.deleteMany({ _id: { $in: [buyer._id, recipient._id, host._id, badActor._id] } });

    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST FAILED WITH ERROR:", err);
    process.exit(1);
  }
}

runGiftTestSuite();
