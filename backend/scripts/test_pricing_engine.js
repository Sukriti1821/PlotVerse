const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

const Spot = require("../models/Spot");
const Booking = require("../models/Booking");
const User = require("../models/User");
const pricingService = require("../services/pricingService");

async function runPricingTests() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB for dynamic pricing tests.");

  try {
    // 1. Create test user
    let testUser = await User.findOne({ email: "pricing_tester@thikana.com" });
    if (!testUser) {
      testUser = await User.create({
        name: "Pricing Tester",
        email: "pricing_tester@thikana.com",
        password: "Password123!",
        role: "customer",
      });
    }

    // 2. Create test spot with comprehensive pricing rules matching user's prompt
    // Weekday: ₹500/hr, Weekend: ₹700/hr, Peak Season (Dec): ₹1,000/hr
    const testSpot = await Spot.create({
      title: "Dynamic Pricing Alpine Meadow",
      description: "Spot for testing dynamic pricing rules and transparent breakdowns",
      location: "Old Manali, Himachal Pradesh",
      price: 500, // Base rate
      category: "Campfire Stays",
      amenities: [
        { name: "Bonfire Setup", price: 75 },
        { name: "Luxury Decoration", price: 125 },
      ],
      maxGuests: 6,
      pricingRules: {
        weekdayPrice: 500,
        weekendPrice: 700,
        peakSeasonPrice: 1000,
        peakSeasonMonths: [12], // December
        holidayPrice: 1200,
        holidays: [
          {
            date: new Date("2026-11-01T00:00:00.000Z"),
            name: "Diwali Festival",
            hourlyPrice: 1200,
          },
        ],
        specialDates: [
          {
            date: new Date("2026-12-31T00:00:00.000Z"),
            hourlyPrice: 1800,
            reason: "New Year's Eve Special",
          },
        ],
        durationDiscounts: [
          {
            minHours: 4,
            discountPercentage: 10,
            label: "Extended Stay (4+ Hours - 10% Off)",
          },
          {
            minHours: 8,
            discountPercentage: 20,
            label: "Full Day Stay (8+ Hours - 20% Off)",
          },
        ],
      },
    });

    console.log(`Created test spot: ${testSpot._id}`);

    // TEST 1: Weekday Pricing (Wednesday, Oct 14, 2026)
    console.log("\n--- TEST 1: Weekday Pricing (Wednesday) ---");
    const weekdayRes = await pricingService.calculatePrice({
      spot: testSpot,
      date: "2026-10-14",
      durationHours: 3,
      selectedAmenities: [],
    });
    console.log("Weekday Rule Applied:", weekdayRes.appliedRule.ruleLabel);
    console.log("Effective Hourly Rate:", weekdayRes.effectiveHourlyRate);
    console.log("Grand Total (3h @ ₹500/hr):", weekdayRes.grandTotal);
    console.assert(weekdayRes.effectiveHourlyRate === 500, "Weekday rate should be ₹500/hr");
    console.assert(weekdayRes.grandTotal === 1500, "Grand total should be ₹1,500");

    // TEST 2: Weekend Pricing + Amenities (Saturday, Oct 17, 2026)
    console.log("\n--- TEST 2: Weekend Pricing + Amenities ---");
    const weekendRes = await pricingService.calculatePrice({
      spot: testSpot,
      date: "2026-10-17", // Saturday
      durationHours: 4,
      selectedAmenities: ["Bonfire Setup", "Luxury Decoration"],
    });
    console.log("Rule Applied:", weekendRes.appliedRule.ruleLabel);
    console.log("Base Plot Total:", weekendRes.basePlotTotal);
    console.log("Weekend Adjustment (+₹200/hr × 4h):", weekendRes.appliedRule.totalAdjustment);
    console.log("Duration Discount (10% off on 4h):", weekendRes.durationDiscount);
    console.log("Amenities Total (₹75 + ₹125 = ₹200/hr × 4h):", weekendRes.amenitiesTotal);
    console.log("Itemized Lines:", weekendRes.itemizedLines);
    console.log("Grand Total:", weekendRes.grandTotal);
    console.assert(weekendRes.appliedRule.ruleType === "weekend", "Rule should be weekend");
    console.assert(weekendRes.appliedRule.effectiveHourlyRate === 700, "Weekend rate should be ₹700/hr");
    console.assert(weekendRes.appliedRule.totalAdjustment === 800, "Weekend adjustment should be +₹800");
    console.assert(weekendRes.amenitiesTotal === 800, "Amenities total should be ₹800");

    // TEST 3: Peak Season Pricing (Wednesday, Dec 16, 2026)
    console.log("\n--- TEST 3: Peak Season Pricing (Dec) ---");
    const peakRes = await pricingService.calculatePrice({
      spot: testSpot,
      date: "2026-12-16",
      durationHours: 3,
      selectedAmenities: [],
    });
    console.log("Rule Applied:", peakRes.appliedRule.ruleLabel);
    console.log("Effective Rate:", peakRes.effectiveHourlyRate);
    console.log("Grand Total (3h @ ₹1,000/hr):", peakRes.grandTotal);
    console.assert(peakRes.appliedRule.ruleType === "peak_season", "Rule should be peak_season");
    console.assert(peakRes.effectiveHourlyRate === 1000, "Peak season rate should be ₹1,000/hr");
    console.assert(peakRes.grandTotal === 3000, "Grand total should be ₹3,000");

    // TEST 4: Special Date Priority Over Peak Season (Dec 31, 2026)
    console.log("\n--- TEST 4: Priority 1 Special Date Override ---");
    const specialDateRes = await pricingService.calculatePrice({
      spot: testSpot,
      date: "2026-12-31", // In peak month Dec, but special date NYE
      durationHours: 2,
      selectedAmenities: [],
    });
    console.log("Rule Applied:", specialDateRes.appliedRule.ruleLabel);
    console.log("Effective Rate (Special Date override):", specialDateRes.effectiveHourlyRate);
    console.log("Grand Total (2h @ ₹1,800/hr):", specialDateRes.grandTotal);
    console.assert(specialDateRes.appliedRule.ruleType === "special_date", "Priority 1 Special Date must take precedence");
    console.assert(specialDateRes.effectiveHourlyRate === 1800, "Rate should be ₹1,800/hr");
    console.assert(specialDateRes.grandTotal === 3600, "Grand total should be ₹3,600");

    // TEST 5: Holiday Pricing (Diwali, Nov 01, 2026)
    console.log("\n--- TEST 5: Holiday Pricing ---");
    const holidayRes = await pricingService.calculatePrice({
      spot: testSpot,
      date: "2026-11-01",
      durationHours: 3,
      selectedAmenities: [],
    });
    console.log("Rule Applied:", holidayRes.appliedRule.ruleLabel);
    console.log("Effective Rate (Holiday):", holidayRes.effectiveHourlyRate);
    console.assert(holidayRes.appliedRule.ruleType === "holiday", "Rule should be holiday");
    console.assert(holidayRes.effectiveHourlyRate === 1200, "Holiday rate should be ₹1,200/hr");

    // Clean up
    await Spot.findByIdAndDelete(testSpot._id);
    await User.findByIdAndDelete(testUser._id);

    console.log("\n=======================================================");
    console.log("ALL DYNAMIC PRICING ENGINE TESTS PASSED!");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("Pricing test failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runPricingTests();
