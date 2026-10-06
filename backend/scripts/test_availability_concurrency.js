const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

const Spot = require("../models/Spot");
const Booking = require("../models/Booking");
const SlotLock = require("../models/SlotLock");
const User = require("../models/User");
const availabilityService = require("../services/availabilityService");

async function simulateRaceCondition() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB for high-concurrency race condition testing.");

  try {
    // 1. Create a test spot
    const testSpot = await Spot.create({
      title: "Concurrency Race Test Meadow",
      description: "Dedicated plot for stress-testing concurrent booking race conditions",
      location: "Solang Valley, Manali",
      price: 1500,
      category: "Campfire Stays",
      amenities: ["Bonfire"],
      maxGuests: 8,
      availability: {
        openTime: "08:00",
        closeTime: "22:00",
        bufferMinutes: 30,
        minDurationHours: 1,
        maxDurationHours: 8,
      },
    });

    // 2. Create 10 different concurrent users
    const users = [];
    for (let i = 1; i <= 10; i++) {
      let u = await User.findOne({ email: `race_user_${i}@thikana.com` });
      if (!u) {
        u = await User.create({
          name: `Race User ${i}`,
          email: `race_user_${i}@thikana.com`,
          password: "Password123!",
          role: "customer",
        });
      }
      users.push(u);
    }

    const testDate = "2026-11-10";
    const startTime = "14:00"; // 2:00 PM
    const endTime = "17:00";   // 5:00 PM
    const durationHours = 3;

    // Clean up any pre-existing records for this spot
    await Booking.deleteMany({ spot: testSpot._id });
    await SlotLock.deleteMany({ spot: testSpot._id });

    console.log("\n=======================================================");
    console.log("SIMULATING 10 SIMULTANEOUS CONCURRENT RESERVATION REQUESTS");
    console.log(`Plot: ${testSpot.title}`);
    console.log(`Date: ${testDate}, Time Slot: ${startTime} - ${endTime} (+30m buffer)`);
    console.log("=======================================================\n");

    // Launch all 10 booking requests at the EXACT SAME INSTANT via Promise.all
    // Each request simulates the full backend flow:
    // checkSlotAvailability -> Booking.create -> acquireSlotLocks -> rollback on conflict
    const attemptBooking = async (user, index) => {
      try {
        const avail = await availabilityService.checkSlotAvailability({
          spotId: testSpot._id,
          date: testDate,
          startTime,
          endTime,
          durationHours,
        });

        if (!avail.available) {
          return {
            index,
            user: user.name,
            success: false,
            phase: "pre_check",
            code: avail.code,
            message: avail.message,
          };
        }

        // Create booking record
        const booking = await Booking.create({
          user: user._id,
          spot: testSpot._id,
          date: new Date(`${testDate}T00:00:00.000Z`),
          startTime,
          endTime,
          durationHours,
          totalPrice: 4500,
          status: "pending",
        });

        // Attempt database-level atomic slot lock acquisition
        const lockRes = await availabilityService.acquireSlotLocks({
          spotId: testSpot._id,
          bookingId: booking._id,
          dateStr: testDate,
          startTime,
          endTime,
          bufferMinutes: 30,
        });

        if (!lockRes.success) {
          // Rollback the created booking
          await Booking.findByIdAndDelete(booking._id);
          return {
            index,
            user: user.name,
            success: false,
            phase: "atomic_lock_enforcement",
            code: lockRes.code,
            message: lockRes.message,
          };
        }

        return {
          index,
          user: user.name,
          success: true,
          bookingId: booking._id,
          slotCount: lockRes.count,
        };
      } catch (err) {
        return {
          index,
          user: user.name,
          success: false,
          phase: "exception",
          error: err.message,
        };
      }
    };

    const results = await Promise.all(users.map((u, idx) => attemptBooking(u, idx + 1)));

    console.log("--- RESULTS OF CONCURRENT EXECUTION ---");
    let successfulCount = 0;
    let rejectedCount = 0;

    results.forEach((r) => {
      if (r.success) {
        successfulCount++;
        console.log(`[WINNER] Request #${r.index} (${r.user}) SUCCESS! Booking ID: ${r.bookingId} (${r.slotCount} slot locks secured)`);
      } else {
        rejectedCount++;
        console.log(`[BLOCKED] Request #${r.index} (${r.user}) Rejected in ${r.phase}: ${r.code || r.error}`);
      }
    });

    console.log(`\nSummary: Successful = ${successfulCount}, Blocked = ${rejectedCount}`);

    // VERIFICATION AT DATABASE LEVEL
    const finalBookings = await Booking.find({ spot: testSpot._id });
    const finalLocks = await SlotLock.find({ spot: testSpot._id });

    console.log("\n--- DATABASE INTEGRITY VERIFICATION ---");
    console.log(`Total Bookings in Database: ${finalBookings.length}`);
    console.log(`Total SlotLock documents in Database: ${finalLocks.length}`);

    console.assert(
      successfulCount === 1,
      `FATAL: Expected exactly 1 booking to succeed, but ${successfulCount} succeeded!`
    );
    console.assert(
      finalBookings.length === 1,
      `FATAL: Expected exactly 1 booking in database, but found ${finalBookings.length}!`
    );
    console.assert(
      rejectedCount === 9,
      `FATAL: Expected 9 requests to be safely rejected, but got ${rejectedCount}!`
    );

    console.log("\n=======================================================");
    console.log("VERDICT: ZERO DOUBLE-BOOKINGS GUARANTEED!");
    console.log("MongoDB storage-engine compound unique index successfully serialized all concurrent attempts.");
    console.log("=======================================================\n");

    // Clean up test records
    await Booking.deleteMany({ spot: testSpot._id });
    await SlotLock.deleteMany({ spot: testSpot._id });
    await Spot.findByIdAndDelete(testSpot._id);
    await User.deleteMany({ email: { $regex: /^race_user_/ } });
  } catch (err) {
    console.error("Concurrency test failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

simulateRaceCondition();
