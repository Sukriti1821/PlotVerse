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

async function runTests() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB for availability engine tests.");

  try {
    // 1. Find or create a test user
    let testUser = await User.findOne({ email: "availability_tester@thikana.com" });
    if (!testUser) {
      testUser = await User.create({
        name: "Availability Tester",
        email: "availability_tester@thikana.com",
        password: "Password123!",
        role: "customer",
      });
    }

    // 2. Create a dedicated test spot with explicit operating windows & buffer
    // Example from user prompt:
    // Plot available: 10 AM - 8 PM (10:00 - 20:00)
    // Buffer time: 30 minutes
    const testSpot = await Spot.create({
      title: "Engine Test Glade Plot",
      description: "Dedicated testing plot for intelligent availability engine",
      location: "Kullu Valley, Himachal Pradesh",
      price: 1000,
      category: "Campfire Stays",
      amenities: ["Bonfire", "Tent"],
      maxGuests: 6,
      availability: {
        openTime: "10:00",
        closeTime: "20:00",
        openDays: [0, 1, 2, 3, 4, 5, 6],
        bufferMinutes: 30,
        minDurationHours: 1,
        maxDurationHours: 10,
        leadTimeHours: 1,
        blockedDates: [
          {
            date: new Date("2026-12-25T00:00:00.000Z"),
            reason: "Christmas Private Host Gathering",
          },
        ],
      },
    });

    console.log(`Created test spot: ${testSpot._id} (Operating: 10:00 - 20:00, Buffer: 30m)`);

    const targetDate = "2026-10-20";

    // Clean up any stale test bookings / locks for this spot
    await Booking.deleteMany({ spot: testSpot._id });
    await SlotLock.deleteMany({ spot: testSpot._id });

    // Test Case 1: Initial Day Schedule
    console.log("\n--- TEST CASE 1: Initial Schedule Query ---");
    const initialSchedule = await availabilityService.getSpotDailySchedule({
      spotId: testSpot._id,
      dateStr: targetDate,
    });
    console.log("Operating window:", initialSchedule.operatingHours);
    console.log("Timeline blocks count:", initialSchedule.timeline.length);
    console.log("Initial available windows:", initialSchedule.availableWindows);
    console.assert(initialSchedule.availableWindows.length === 1, "Should have 1 continuous open window (10:00 - 20:00)");

    // Test Case 2: Create Booking 1 (2 PM - 5 PM: 14:00 - 17:00)
    console.log("\n--- TEST CASE 2: Create Booking 1 (14:00 - 17:00: 2 PM - 5 PM) ---");
    const check1 = await availabilityService.checkSlotAvailability({
      spotId: testSpot._id,
      date: targetDate,
      startTime: "14:00",
      endTime: "17:00",
      durationHours: 3,
    });
    console.assert(check1.available === true, "Booking 1 should be available");

    const booking1 = await Booking.create({
      user: testUser._id,
      spot: testSpot._id,
      date: new Date(`${targetDate}T00:00:00.000Z`),
      startTime: "14:00",
      endTime: "17:00",
      durationHours: 3,
      totalPrice: 3000,
      status: "confirmed",
    });

    const lockRes1 = await availabilityService.acquireSlotLocks({
      spotId: testSpot._id,
      bookingId: booking1._id,
      dateStr: targetDate,
      startTime: "14:00",
      endTime: "17:00",
      bufferMinutes: 30,
    });
    console.log("Booking 1 locks acquired:", lockRes1.success, `(${lockRes1.count} slot keys)`);
    console.assert(lockRes1.success === true, "Booking 1 locks should succeed");

    // Test Case 3: Overlapping booking (4 PM - 6 PM: 16:00 - 18:00) MUST BE PREVENTED
    console.log("\n--- TEST CASE 3: Overlap Attempt (16:00 - 18:00: 4 PM - 6 PM) MUST BE PREVENTED ---");
    const overlapCheck = await availabilityService.checkSlotAvailability({
      spotId: testSpot._id,
      date: targetDate,
      startTime: "16:00",
      endTime: "18:00",
      durationHours: 2,
    });
    console.log("Overlap check result:", {
      available: overlapCheck.available,
      code: overlapCheck.code,
      message: overlapCheck.message,
    });
    console.assert(overlapCheck.available === false, "Overlap must be rejected");
    console.assert(overlapCheck.code === "BOOKING_CONFLICT", "Code must be BOOKING_CONFLICT");

    // Test Case 4: Buffer Collision (17:00 - 18:00) MUST BE PREVENTED DUE TO 30m BUFFER
    console.log("\n--- TEST CASE 4: Buffer Collision (17:00 - 18:00: immediately following without buffer) ---");
    const bufferCheck = await availabilityService.checkSlotAvailability({
      spotId: testSpot._id,
      date: targetDate,
      startTime: "17:00",
      endTime: "18:00",
      durationHours: 1,
    });
    console.log("Buffer check result:", {
      available: bufferCheck.available,
      code: bufferCheck.code,
      message: bufferCheck.message,
    });
    console.assert(bufferCheck.available === false, "Slot in buffer period must be rejected");

    // Test Case 5: Morning Slot (10 AM - 2 PM: 10:00 - 14:00) MUST BE ALLOWED
    console.log("\n--- TEST CASE 5: Morning Booking (10:00 - 14:00: 10 AM - 2 PM) MUST BE ALLOWED ---");
    const morningCheck = await availabilityService.checkSlotAvailability({
      spotId: testSpot._id,
      date: targetDate,
      startTime: "10:00",
      endTime: "14:00",
      durationHours: 4,
    });
    console.log("Morning check result:", { available: morningCheck.available });
    console.assert(morningCheck.available === true, "Morning slot 10:00 - 14:00 should be allowed");

    const booking2 = await Booking.create({
      user: testUser._id,
      spot: testSpot._id,
      date: new Date(`${targetDate}T00:00:00.000Z`),
      startTime: "10:00",
      endTime: "14:00",
      durationHours: 4,
      totalPrice: 4000,
      status: "confirmed",
    });
    const lockRes2 = await availabilityService.acquireSlotLocks({
      spotId: testSpot._id,
      bookingId: booking2._id,
      dateStr: targetDate,
      startTime: "10:00",
      endTime: "14:00",
      bufferMinutes: 0, // tight fit directly preceding 14:00
    });
    console.log("Booking 2 locks acquired:", lockRes2.success);
    console.assert(lockRes2.success === true, "Booking 2 locks should succeed");

    // Test Case 6: Evening Slot (5:30 PM - 8 PM: 17:30 - 20:00) MUST BE ALLOWED
    console.log("\n--- TEST CASE 6: Evening Booking (17:30 - 20:00: 5:30 PM - 8 PM) MUST BE ALLOWED ---");
    const eveningCheck = await availabilityService.checkSlotAvailability({
      spotId: testSpot._id,
      date: targetDate,
      startTime: "17:30",
      endTime: "20:00",
      durationHours: 2.5,
    });
    console.log("Evening check result:", { available: eveningCheck.available });
    console.assert(eveningCheck.available === true, "Evening slot after buffer (17:30 - 20:00) should be allowed");

    const booking3 = await Booking.create({
      user: testUser._id,
      spot: testSpot._id,
      date: new Date(`${targetDate}T00:00:00.000Z`),
      startTime: "17:30",
      endTime: "20:00",
      durationHours: 2.5,
      totalPrice: 2500,
      status: "confirmed",
    });
    const lockRes3 = await availabilityService.acquireSlotLocks({
      spotId: testSpot._id,
      bookingId: booking3._id,
      dateStr: targetDate,
      startTime: "17:30",
      endTime: "20:00",
      bufferMinutes: 30,
    });
    console.log("Booking 3 locks acquired:", lockRes3.success);
    console.assert(lockRes3.success === true, "Booking 3 locks should succeed");

    // Test Case 7: Outside Operating Hours (08:00 - 10:00) MUST BE REJECTED
    console.log("\n--- TEST CASE 7: Outside Operating Hours (08:00 - 10:00, spot opens at 10:00) ---");
    const earlyCheck = await availabilityService.checkSlotAvailability({
      spotId: testSpot._id,
      date: targetDate,
      startTime: "08:00",
      endTime: "10:00",
      durationHours: 2,
    });
    console.log("Early check result:", {
      available: earlyCheck.available,
      code: earlyCheck.code,
      message: earlyCheck.message,
    });
    console.assert(earlyCheck.available === false, "Outside hours should be rejected");
    console.assert(earlyCheck.code === "OUTSIDE_OPERATING_HOURS", "Code must be OUTSIDE_OPERATING_HOURS");

    // Test Case 8: Blocked Date (2026-12-25) MUST BE REJECTED
    console.log("\n--- TEST CASE 8: Blocked Date Check (Christmas 2026-12-25) ---");
    const blockedCheck = await availabilityService.checkSlotAvailability({
      spotId: testSpot._id,
      date: "2026-12-25",
      startTime: "12:00",
      endTime: "15:00",
      durationHours: 3,
    });
    console.log("Blocked check result:", {
      available: blockedCheck.available,
      code: blockedCheck.code,
      message: blockedCheck.message,
    });
    console.assert(blockedCheck.available === false, "Blocked date must be rejected");
    console.assert(blockedCheck.code === "BLOCKED_DATE", "Code must be BLOCKED_DATE");

    // Test Case 9: Release Locks on Cancellation
    console.log("\n--- TEST CASE 9: Lock Release on Cancellation ---");
    booking1.status = "cancelled";
    await booking1.save();
    await availabilityService.releaseSlotLocks(booking1._id);

    const postReleaseLocks = await SlotLock.find({ booking: booking1._id });
    console.log("Locks remaining for booking 1 after cancellation:", postReleaseLocks.length);
    console.assert(postReleaseLocks.length === 0, "Locks must be deleted on cancellation");

    // With booking1 cancelled, the window between booking 2 (+ buffer to 14:30) and booking 3 (17:30) is open!
    const recheckSlot1 = await availabilityService.checkSlotAvailability({
      spotId: testSpot._id,
      date: targetDate,
      startTime: "14:30",
      endTime: "17:00",
      durationHours: 2.5,
    });
    console.log("Slot 14:30 - 17:00 after cancellation available:", recheckSlot1.available);
    console.assert(recheckSlot1.available === true, "Released slot must become available again");

    // Clean up test records
    await Booking.deleteMany({ spot: testSpot._id });
    await SlotLock.deleteMany({ spot: testSpot._id });
    await Spot.findByIdAndDelete(testSpot._id);
    await User.findByIdAndDelete(testUser._id);

    console.log("\n=======================================================");
    console.log("ALL INTELLIGENT AVAILABILITY ENGINE UNIT TESTS PASSED!");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
