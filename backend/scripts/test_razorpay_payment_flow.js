/**
 * Thikana — Razorpay Pay-After-Approval Sanity Check & Verification Script
 *
 * Verifies:
 * 1. Bookings cannot be directly marked 'confirmed' via /api/bookings/:id/status
 * 2. Owner approval transitions booking to 'approved' (awaiting payment)
 * 3. Payment order creation recomputes amount strictly server-side from booking
 * 4. Invalid payment signature is rejected and booking remains in 'approved' status
 * 5. Valid HMAC SHA256 signature confirms the booking and marks payment as 'paid'
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const crypto = require("crypto");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Booking = require("../models/Booking");
const Spot = require("../models/Spot");
const User = require("../models/User");
const { updateBookingStatus } = require("../controllers/bookingController");
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

async function runSanityCheck() {
  console.log("==================================================");
  console.log("💳 Thikana — Razorpay Pay-After-Approval Sanity Check");
  console.log("==================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB Connected.\n");

  let testOwner, testCustomer, testSpot, testBooking;

  try {
    // 1. Setup Test Users
    testOwner = await User.findOne({ email: "aarav.host@thikana.com" });
    if (!testOwner) {
      testOwner = await User.create({
        name: "Test Host",
        email: "aarav.host@thikana.com",
        password: "password123",
        role: "owner",
      });
    }

    testCustomer = await User.findOne({ email: "rohan.travel@thikana.com" });
    if (!testCustomer) {
      testCustomer = await User.create({
        name: "Test Guest",
        email: "rohan.travel@thikana.com",
        password: "password123",
        role: "customer",
      });
    }

    // 2. Setup Test Spot
    testSpot = await Spot.findOne({ owner: testOwner._id });
    if (!testSpot) {
      testSpot = await Spot.create({
        title: "Test Alpine Meadow Retreat",
        description: "Scenic test plot for verification",
        location: "Solang Valley, Manali",
        price: 1500,
        category: "Grassland Plot",
        owner: testOwner._id,
      });
    }

    // 3. Create Test Booking (Status: pending)
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 5);

    testBooking = await Booking.create({
      user: testCustomer._id,
      spot: testSpot._id,
      date: bookingDate,
      startTime: "10:00",
      endTime: "14:00",
      durationHours: 4,
      totalPrice: 6000, // 4 hrs * 1500
      status: "pending",
      paymentStatus: "unpaid",
    });
    console.log(`[Step 1] Created test booking ${testBooking._id} with status: '${testBooking.status}', totalPrice: ₹${testBooking.totalPrice}`);

    // ==========================================
    // SANITY CHECK 1: Prevent Direct Confirmation
    // ==========================================
    console.log("\n--- TEST 1: Prevent Direct Confirmation via /api/bookings/:id/status ---");
    {
      const { req, res } = createMockReqRes({
        params: { id: testBooking._id.toString() },
        body: { status: "confirmed" },
        user: testCustomer,
      });

      await updateBookingStatus(req, res);

      if (res.statusCode === 400 && res.data?.message?.includes("Direct confirmation is not permitted")) {
        console.log("✅ PASSED: Direct confirmation attempt was REJECTED (status code 400).");
        console.log(`   Rejection Message: "${res.data.message}"`);
      } else {
        throw new Error(`Direct confirmation was NOT rejected as expected! Status: ${res.statusCode}, Body: ${JSON.stringify(res.data)}`);
      }
    }

    // ==========================================
    // SANITY CHECK 2: Owner Approves Booking
    // ==========================================
    console.log("\n--- TEST 2: Host Approves Reservation (Status becomes 'approved') ---");
    {
      const { req, res } = createMockReqRes({
        params: { id: testBooking._id.toString() },
        body: { status: "approved" },
        user: testOwner,
      });

      await updateBookingStatus(req, res);

      const refreshed = await Booking.findById(testBooking._id);
      if (res.statusCode === 200 && refreshed.status === "approved") {
        console.log(`✅ PASSED: Host successfully approved booking. Current status: '${refreshed.status}' (Awaiting payment).`);
      } else {
        throw new Error(`Host approval failed! Status code: ${res.statusCode}, Booking status: ${refreshed.status}`);
      }
    }

    // ==========================================
    // SANITY CHECK 3: Server-side Amount Calculation in Order Creation
    // ==========================================
    console.log("\n--- TEST 3: Create Payment Order with Server-Side Recomputed Amount ---");
    let generatedOrderId = "";
    {
      // Attempt to pass manipulated amount in body (e.g. ₹100 instead of ₹6000)
      const { req, res } = createMockReqRes({
        body: {
          bookingId: testBooking._id.toString(),
          amount: 100, // Attacker tries to send smaller client-side amount
        },
        user: testCustomer,
      });

      await createPaymentOrder(req, res);

      if (res.statusCode === 200 && res.data?.orderId) {
        generatedOrderId = res.data.orderId;
        const expectedPaise = 6000 * 100; // 600000 paise

        if (res.data.amount === expectedPaise) {
          console.log(`✅ PASSED: Server ignored client-sent amount and correctly recomputed ₹${res.data.amountInRupees} (${res.data.amount} paise).`);
          console.log(`   Generated Razorpay Order ID: ${generatedOrderId}`);
        } else {
          throw new Error(`Amount calculation mismatch! Expected ${expectedPaise} paise, got ${res.data.amount}`);
        }

        const refreshed = await Booking.findById(testBooking._id);
        if (refreshed.razorpayOrderId === generatedOrderId) {
          console.log(`✅ PASSED: Booking record saved razorpayOrderId: '${refreshed.razorpayOrderId}'.`);
        } else {
          throw new Error("Booking record failed to store razorpayOrderId.");
        }
      } else {
        throw new Error(`Order creation failed! Status: ${res.statusCode}, Body: ${JSON.stringify(res.data)}`);
      }
    }

    // ==========================================
    // SANITY CHECK 4: Invalid Signature Rejection
    // ==========================================
    console.log("\n--- TEST 4: Invalid Signature Rejection ---");
    {
      const { req, res } = createMockReqRes({
        body: {
          bookingId: testBooking._id.toString(),
          razorpay_order_id: generatedOrderId,
          razorpay_payment_id: "pay_tampered_fake_999",
          razorpay_signature: "forged_malicious_signature_hash_000",
        },
        user: testCustomer,
      });

      await verifyPayment(req, res);

      const refreshed = await Booking.findById(testBooking._id);
      if (res.statusCode === 400 && refreshed.status === "approved" && refreshed.paymentStatus === "failed") {
        console.log("✅ PASSED: Invalid signature was REJECTED (400 Bad Request).");
        console.log(`   Booking correctly preserved status '${refreshed.status}' with paymentStatus '${refreshed.paymentStatus}' (allows guest to retry).`);
      } else {
        throw new Error(`Invalid signature was not rejected properly! Booking status: ${refreshed.status}`);
      }
    }

    // ==========================================
    // SANITY CHECK 5: Valid Cryptographic Signature Verification
    // ==========================================
    console.log("\n--- TEST 5: Cryptographic HMAC SHA256 Signature Verification ---");
    {
      const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key_12345";
      const paymentId = `pay_valid_test_${Date.now()}`;

      // Compute authentic HMAC SHA256 signature
      const validSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${generatedOrderId}|${paymentId}`)
        .digest("hex");

      const { req, res } = createMockReqRes({
        body: {
          bookingId: testBooking._id.toString(),
          razorpay_order_id: generatedOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSignature,
        },
        user: testCustomer,
      });

      await verifyPayment(req, res);

      const confirmedBooking = await Booking.findById(testBooking._id);
      if (
        res.statusCode === 200 &&
        confirmedBooking.status === "confirmed" &&
        confirmedBooking.paymentStatus === "paid" &&
        confirmedBooking.amountPaid === 6000 &&
        confirmedBooking.razorpayPaymentId === paymentId
      ) {
        console.log("✅ PASSED: Cryptographic signature verified successfully!");
        console.log(`   Booking Status: '${confirmedBooking.status}'`);
        console.log(`   Payment Status: '${confirmedBooking.paymentStatus}'`);
        console.log(`   Amount Paid   : ₹${confirmedBooking.amountPaid}`);
        console.log(`   Payment ID    : ${confirmedBooking.razorpayPaymentId}`);
        console.log(`   Paid At       : ${confirmedBooking.paidAt}`);
      } else {
        throw new Error(`Valid payment verification failed! Status: ${res.statusCode}, Booking: ${JSON.stringify(confirmedBooking)}`);
      }
    }

    console.log("\n==================================================");
    console.log("🎉 ALL 5 RAZORPAY PAYMENT FLOW SANITY CHECKS PASSED!");
    console.log("==================================================");

    // Clean up test booking
    await Booking.deleteOne({ _id: testBooking._id });
    console.log("🧹 Cleaned up temporary test booking record.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ SANITY CHECK ERROR:", err);
    if (testBooking && testBooking._id) {
      await Booking.deleteOne({ _id: testBooking._id });
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

runSanityCheck();
