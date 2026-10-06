require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Spot = require("../models/Spot");
const User = require("../models/User");
const Experience = require("../models/Experience");
const Booking = require("../models/Booking");
const SlotLock = require("../models/SlotLock");
const availabilityService = require("../services/availabilityService");

async function runExperienceEngineTests() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Experience Engine tests.\n");

    // Clean up any old test bookings/locks for this test
    const testDate = new Date("2026-11-20");
    const testDateStr = "2026-11-20";

    // 1. Verify Seeded Experiences exist
    const experiences = await Experience.find().populate("spot");
    console.log(`--- TEST 1: Query Seeded Experiences ---`);
    console.log(`Total experiences found: ${experiences.length}`);
    if (experiences.length === 0) {
      throw new Error("Expected seeded experiences, found 0.");
    }
    const mountainDate = experiences.find((e) => e.title === "Mountain Date");
    if (!mountainDate) {
      throw new Error("Expected 'Mountain Date' experience.");
    }
    console.log(`✓ 'Mountain Date' verified: ₹${mountainDate.price}, ${mountainDate.durationHours} hours.`);
    console.log(`✓ Included amenities count: ${mountainDate.includedAmenities.length}`);
    console.log(`✓ Optional add-ons count: ${mountainDate.optionalAddOns.length}`);

    // Clean up test date locks
    await SlotLock.deleteMany({ spot: mountainDate.spot._id, slotKey: { $regex: `^${testDateStr}` } });
    await Booking.deleteMany({ spot: mountainDate.spot._id, date: testDate });

    // 2. Test Booking Creation with Experience Package
    console.log(`\n--- TEST 2: Book 'Mountain Date' Package ---`);
    const testUser = await User.findOne({ role: "customer" }) || (await User.findOne());
    if (!testUser) throw new Error("No user found for booking test");

    // We book Mountain Date from 14:00 (4 hours -> ends at 18:00) with optional add-on "Gourmet Fondue & Strawberries" (+₹650)
    const selectedAddOn = mountainDate.optionalAddOns[0]; // Fondue (+₹650)
    const expectedBase = mountainDate.price; // 2999
    const expectedTotal = expectedBase + selectedAddOn.price; // 2999 + 650 = 3649

    const startTime = "14:00";
    const endTime = "18:00";
    const hours = mountainDate.durationHours; // 4

    // Availability check on underlying plot
    const availCheck = await availabilityService.checkSlotAvailability({
      spotId: mountainDate.spot._id,
      date: testDate,
      startTime,
      endTime,
      durationHours: hours,
    });
    console.log("Availability check for experience slot (14:00 - 18:00):", availCheck.available);
    if (!availCheck.available) {
      throw new Error(`Expected slot to be available: ${availCheck.message}`);
    }

    // Build verified pricing breakdown
    const pricingBreakdown = {
      isExperience: true,
      experienceId: mountainDate._id,
      experienceTitle: mountainDate.title,
      durationHours: mountainDate.durationHours,
      basePackagePrice: expectedBase,
      includedAmenities: mountainDate.includedAmenities,
      selectedAddOns: [{ name: selectedAddOn.name, price: selectedAddOn.price }],
      grandTotal: expectedTotal,
      itemizedLines: [
        { label: `${mountainDate.title} (${mountainDate.durationHours}h Package)`, amount: expectedBase, type: "experience_base" },
        ...mountainDate.includedAmenities.map(i => ({ label: `${i.name} (Included)`, amount: 0, type: "included_amenity" })),
        { label: `${selectedAddOn.name} (Add-On Upgrade)`, amount: selectedAddOn.price, type: "optional_addon" },
      ],
    };

    const booking = await Booking.create({
      user: testUser._id,
      spot: mountainDate.spot._id,
      experience: mountainDate._id,
      experienceTitle: mountainDate.title,
      selectedAddOns: [{ name: selectedAddOn.name, price: selectedAddOn.price }],
      date: testDate,
      startTime,
      endTime,
      durationHours: hours,
      checkIn: testDate,
      checkOut: testDate,
      guests: 2,
      totalPrice: expectedTotal,
      pricingBreakdown,
      status: "pending",
    });

    // Acquire slot locks on underlying plot
    const lockResult = await availabilityService.acquireSlotLocks({
      spotId: mountainDate.spot._id,
      bookingId: booking._id,
      dateStr: testDateStr,
      startTime,
      endTime,
      bufferMinutes: 30,
    });

    console.log(`✓ Booking created: ${booking._id}`);
    console.log(`✓ Grand Total: ₹${booking.totalPrice} (Base: ₹${expectedBase} + Add-on: ₹${selectedAddOn.price})`);
    console.log(`✓ Slot locks secured on underlying plot: ${lockResult.acquiredCount} locks`);

    // 3. Test Conflict Prevention on the underlying plot
    console.log(`\n--- TEST 3: Conflict Prevention on Underlying Plot ---`);
    // Attempt to book the underlying plot directly during 16:00 - 19:00 (overlaps with 14:00 - 18:00 + 30m buffer)
    const conflictCheck = await availabilityService.checkSlotAvailability({
      spotId: mountainDate.spot._id,
      date: testDate,
      startTime: "16:00",
      endTime: "19:00",
      durationHours: 3,
    });

    console.log("Overlap booking attempt result (16:00 - 19:00):", conflictCheck.available ? "ALLOWED" : "REJECTED");
    if (conflictCheck.available) {
      throw new Error("Double-booking bug! Experience slot did not block overlapping plot booking.");
    }
    console.log(`✓ Overlapping attempt successfully blocked with code: ${conflictCheck.code}`);

    // Clean up test booking
    await SlotLock.deleteMany({ bookingId: booking._id });
    await Booking.findByIdAndDelete(booking._id);
    console.log("✓ Test booking and locks cleaned up.");

    console.log("\n=======================================================");
    console.log("ALL EXPERIENCE ENGINE TESTS PASSED!");
    console.log("=======================================================");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

runExperienceEngineTests();
