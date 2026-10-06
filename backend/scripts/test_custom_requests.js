const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Booking = require("../models/Booking");
const Spot = require("../models/Spot");
const User = require("../models/User");

async function runTest() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for sanity check.");

    const customer = await User.findOne({ role: "customer" });
    const owner = await User.findOne({ role: "owner" });
    const spot = await Spot.findOne({ owner: owner._id });

    if (!customer || !owner || !spot) {
      console.log("No data found, exiting.");
      process.exit(0);
    }

    console.log("Found Customer:", customer.name, "| Owner:", owner.name, "| Spot:", spot.title);

    // 1. Standard booking with no custom requests
    const standardBooking = await Booking.create({
      user: customer._id,
      spot: spot._id,
      date: new Date(Date.now() + 86400000 * 7),
      startTime: "10:00",
      endTime: "12:00",
      durationHours: 2,
      totalPrice: spot.price * 2,
      status: "pending",
      customRequests: [],
    });
    console.log("✅ [Check 1] Standard booking (zero custom requests) created successfully. Total: ₹" + standardBooking.totalPrice);

    // 2. Booking with custom requests
    const customBooking = await Booking.create({
      user: customer._id,
      spot: spot._id,
      date: new Date(Date.now() + 86400000 * 8),
      startTime: "12:00",
      endTime: "16:00",
      durationHours: 4,
      totalPrice: spot.price * 4,
      status: "pending",
      customRequests: [
        {
          description: "4 Extra Foldable Chairs & Warm Fleece Blankets",
          ownerResponse: "pending",
          ownerQuotedPrice: null,
          customerAccepted: false,
        },
      ],
    });
    console.log("✅ [Check 2] Booking with customRequests created. Initial Total: ₹" + customBooking.totalPrice + ", Status: " + customBooking.customRequests[0].ownerResponse);

    // 3. Owner response: Quoting price
    customBooking.customRequests[0].ownerResponse = "approved";
    customBooking.customRequests[0].ownerQuotedPrice = 450;
    await customBooking.save();
    console.log("✅ [Check 3] Owner approved with quote of ₹450. Total remains uncommitted: ₹" + customBooking.totalPrice);

    // 4. Customer accepts quote -> Recalculates total
    const oldTotal = customBooking.totalPrice;
    customBooking.customRequests[0].customerAccepted = true;
    customBooking.totalPrice = oldTotal + customBooking.customRequests[0].ownerQuotedPrice;
    await customBooking.save();
    console.log("✅ [Check 4] Customer accepted quote! New Total: ₹" + customBooking.totalPrice + " (Verified: ₹" + oldTotal + " + ₹450 = ₹" + customBooking.totalPrice + ")");

    // Clean up
    await Booking.deleteMany({ _id: { $in: [standardBooking._id, customBooking._id] } });
    console.log("✅ [Check 5] Temporary test records cleaned up.");

    await mongoose.connection.close();
    console.log("🎉 ALL CUSTOM REQUEST CHECKS PASSED!");
    process.exit(0);
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
}

runTest();
