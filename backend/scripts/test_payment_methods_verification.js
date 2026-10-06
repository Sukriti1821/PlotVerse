/**
 * Thikana — Razorpay Payment Methods Configuration & Method Verification Test
 *
 * Verifies:
 * 1. Razorpay Checkout Config Schema:
 *    - UPI configured as primary/top priority block (GPay, PhonePe, Paytm, etc.)
 *    - Cards configured as second block
 *    - Netbanking configured as third block
 *    - Wallets configured as fourth block
 *    - Sequence enforces [block.upi, block.cards, block.netbanking, block.wallets]
 *    - EMI and Pay Later options are explicitly excluded
 * 2. Method Execution Verification:
 *    - Successful verification through UPI test flow -> status 'confirmed', paymentStatus 'paid'
 *    - Successful verification through Card test flow -> status 'confirmed', paymentStatus 'paid'
 *    - Successful verification through Netbanking test flow -> status 'confirmed', paymentStatus 'paid'
 *    - Successful verification through Wallet test flow -> status 'confirmed', paymentStatus 'paid'
 * 3. Tamper Prevention:
 *    - Bad/forged signature attempts on any method are rejected and preserve 'approved' status
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Booking = require("../models/Booking");
const Spot = require("../models/Spot");
const User = require("../models/User");
const { createPaymentOrder, verifyPayment } = require("../controllers/paymentController");

const createMockReqRes = ({ body = {}, params = {}, query = {}, user = {} } = {}) => {
  const req = { body, params, query, user, headers: {} };
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return { req, res };
};

async function runPaymentMethodsSanityCheck() {
  console.log("===============================================================");
  console.log("💳 Thikana — Razorpay Payment Methods Configuration Verification");
  console.log("===============================================================\n");

  // --- PART 1: Validate Frontend Razorpay Checkout Configuration File ---
  console.log("--- PART 1: Validating Razorpay Checkout Configuration Schema ---");
  const razorpayJsPath = path.join(__dirname, "../../frontend/src/utils/razorpay.js");
  const razorpayJsContent = fs.readFileSync(razorpayJsPath, "utf-8");

  // Verify Blocks definition
  if (!razorpayJsContent.includes("RAZORPAY_CHECKOUT_CONFIG")) {
    throw new Error("❌ FAILED: RAZORPAY_CHECKOUT_CONFIG export missing in razorpay.js");
  }
  console.log("✅ Verified RAZORPAY_CHECKOUT_CONFIG defined.");

  // Check UPI block & priority
  const hasUPI = razorpayJsContent.includes('method: "upi"');
  const hasCards = razorpayJsContent.includes('method: "card"');
  const hasNetbanking = razorpayJsContent.includes('method: "netbanking"');
  const hasWallets = razorpayJsContent.includes('method: "wallet"');

  if (!hasUPI || !hasCards || !hasNetbanking || !hasWallets) {
    throw new Error(`❌ FAILED: One or more payment methods missing in blocks config. (UPI: ${hasUPI}, Cards: ${hasCards}, Netbanking: ${hasNetbanking}, Wallets: ${hasWallets})`);
  }
  console.log("✅ Verified all 4 core payment methods present in instruments (UPI, Cards, Netbanking, Wallets).");

  // Verify Sequence
  const sequenceMatches = razorpayJsContent.includes('"block.upi"') &&
    razorpayJsContent.includes('"block.cards"') &&
    razorpayJsContent.includes('"block.netbanking"') &&
    razorpayJsContent.includes('"block.wallets"');

  if (!sequenceMatches) {
    throw new Error("❌ FAILED: sequence does not contain all four prioritized blocks.");
  }

  // Ensure sequence ordering: UPI first, then cards, netbanking, wallets
  const upiIndex = razorpayJsContent.indexOf('"block.upi"');
  const cardIndex = razorpayJsContent.indexOf('"block.cards"');
  const netbankingIndex = razorpayJsContent.indexOf('"block.netbanking"');
  const walletIndex = razorpayJsContent.indexOf('"block.wallets"');

  if (upiIndex < cardIndex && cardIndex < netbankingIndex && netbankingIndex < walletIndex) {
    console.log("✅ Verified Sequence Priority Order: 1. UPI -> 2. Cards -> 3. Netbanking -> 4. Wallets.");
  } else {
    throw new Error("❌ FAILED: Sequence order is incorrect!");
  }

  // Verify EMI and PayLater are explicitly excluded/hidden
  const excludesEMI = razorpayJsContent.includes('{ method: "emi" }');
  const excludesPayLater = razorpayJsContent.includes('{ method: "paylater" }');
  if (excludesEMI && excludesPayLater) {
    console.log("✅ Verified EMI and Pay Later are explicitly excluded from checkout.");
  } else {
    throw new Error("❌ FAILED: EMI or Pay Later exclusion missing.");
  }

  // --- PART 2: Database & Backend Verification for Each Method Type ---
  console.log("\n--- PART 2: Verifying Payments Across Each Method Type ---");
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB Connected.");

  const secret = process.env.RAZORPAY_KEY_SECRET || "mock_razorpay_secret_for_tests";
  let testOwner, testCustomer, testSpot;

  try {
    testOwner = await User.findOne({ email: "aarav.host@thikana.com" }) ||
      await User.create({ name: "Host", email: "aarav.host@thikana.com", password: "password123", role: "host" });

    testCustomer = await User.findOne({ email: "rohan.travel@thikana.com" }) ||
      await User.create({ name: "Customer", email: "rohan.travel@thikana.com", password: "password123", role: "user" });

    testSpot = await Spot.findOne({ owner: testOwner._id }) ||
      await Spot.create({
        title: "Pahalgam Pine Valley Glade",
        description: "Serene terrace in Kashmir",
        location: "Pahalgam, Jammu and Kashmir",
        category: "mountain",
        pricePerDay: 2500,
        owner: testOwner._id,
        images: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb"],
      });

    const paymentMethodsToTest = [
      { name: "UPI", prefix: "pay_upi_test_" },
      { name: "Credit/Debit Card", prefix: "pay_card_test_" },
      { name: "Netbanking", prefix: "pay_netbanking_test_" },
      { name: "Wallet", prefix: "pay_wallet_test_" },
    ];

    for (const method of paymentMethodsToTest) {
      console.log(`\nTesting Method: [${method.name}]`);

      // 1. Create a booking in 'approved' status
      const booking = await Booking.create({
        spot: testSpot._id,
        user: testCustomer._id,
        owner: testOwner._id,
        date: new Date("2026-11-20"),
        totalPrice: 2500,
        status: "approved", // Host approved, awaiting payment
        paymentStatus: "unpaid",
      });

      // 2. Generate Razorpay order
      const { req: orderReq, res: orderRes } = createMockReqRes({
        body: { bookingId: booking._id.toString() },
        user: testCustomer,
      });
      await createPaymentOrder(orderReq, orderRes);

      if (orderRes.statusCode !== 200 || !orderRes.data.orderId) {
        throw new Error(`Failed to create payment order for ${method.name}: ${JSON.stringify(orderRes.data)}`);
      }
      const orderId = orderRes.data.orderId;

      // 3. Test Invalid Signature Rejection first
      const fakePaymentId = `${method.prefix}tamper_${Date.now()}`;
      const { req: badVerifyReq, res: badVerifyRes } = createMockReqRes({
        body: {
          bookingId: booking._id.toString(),
          razorpay_order_id: orderId,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: "forged_signature_xyz_123",
        },
        user: testCustomer,
      });
      await verifyPayment(badVerifyReq, badVerifyRes);
      if (badVerifyRes.statusCode !== 400) {
        throw new Error(`Security Failure: Forged signature on ${method.name} was not rejected!`);
      }
      const unchangedBooking = await Booking.findById(booking._id);
      if (unchangedBooking.status === "confirmed") {
        throw new Error(`Security Failure: Booking got confirmed with forged signature on ${method.name}!`);
      }
      console.log(`  ✅ ${method.name}: Forged signature safely rejected.`);

      // 4. Test Authentic Signature Verification
      const legitimatePaymentId = `${method.prefix}${Date.now()}`;
      const validSignature = crypto
        .createHmac("sha256", secret)
        .update(`${orderId}|${legitimatePaymentId}`)
        .digest("hex");

      const { req: validVerifyReq, res: validVerifyRes } = createMockReqRes({
        body: {
          bookingId: booking._id.toString(),
          razorpay_order_id: orderId,
          razorpay_payment_id: legitimatePaymentId,
          razorpay_signature: validSignature,
        },
        user: testCustomer,
      });
      await verifyPayment(validVerifyReq, validVerifyRes);

      if (validVerifyRes.statusCode !== 200) {
        throw new Error(`Failed to verify authentic ${method.name} payment: ${JSON.stringify(validVerifyRes.data)}`);
      }

      // 5. Verify database state
      const confirmedBooking = await Booking.findById(booking._id);
      if (confirmedBooking.status !== "confirmed" || confirmedBooking.paymentStatus !== "paid") {
        throw new Error(`Booking status mismatch for ${method.name}: ${confirmedBooking.status} / ${confirmedBooking.paymentStatus}`);
      }
      if (confirmedBooking.razorpayPaymentId !== legitimatePaymentId) {
        throw new Error(`Payment ID mismatch for ${method.name}`);
      }
      console.log(`  ✅ ${method.name}: Payment verified -> status: '${confirmedBooking.status}', paymentStatus: '${confirmedBooking.paymentStatus}', amountPaid: ₹${confirmedBooking.amountPaid}.`);

      // Clean up test booking
      await Booking.findByIdAndDelete(booking._id);
    }

    console.log("\n===============================================================");
    console.log("🎉 ALL PAYMENT METHOD CONFIGURATION & VERIFICATION TESTS PASSED!");
    console.log("===============================================================");
  } finally {
    await mongoose.disconnect();
    console.log("\nMongoDB Disconnected.");
  }
}

runPaymentMethodsSanityCheck().catch((err) => {
  console.error("\n❌ SANITY CHECK ERROR:", err);
  process.exit(1);
});
