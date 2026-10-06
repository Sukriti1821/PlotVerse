const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Booking = require("../models/Booking");
const Spot = require("../models/Spot");
const User = require("../models/User");
const { getAllSpots, getAvailableAmenities } = require("../controllers/spotController");

// Helper to mock express req/res
const createMockReqRes = (query = {}) => {
  const req = {
    query,
    params: {},
    body: {},
    headers: {},
  };

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

async function runSearchFiltersSanityCheck() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Search & Filter Sanity Check.\n");

    // 1. Setup Test Host and Customer
    let host = await User.findOne({ email: "filter_host@thikana.com" });
    if (!host) {
      host = await User.create({
        name: "Filter Test Host",
        email: "filter_host@thikana.com",
        password: "password123",
        role: "owner",
      });
    }

    let customer = await User.findOne({ email: "filter_guest@thikana.com" });
    if (!customer) {
      customer = await User.create({
        name: "Filter Test Guest",
        email: "filter_guest@thikana.com",
        password: "password123",
        role: "customer",
      });
    }

    // 2. Create distinct test spots
    // Spot 1: Himachal Pradesh, ₹800/hr, Amenities: Bonfire, Tent
    const spot1 = await Spot.create({
      title: "Solang Valley Meadows",
      description: "Lush meadows in Manali.",
      location: "Manali, Himachal Pradesh",
      price: 800,
      category: "Grassland Plot",
      amenities: [
        { name: "Bonfire Setup", hourlyPrice: 300 },
        { name: "Alpine Tent", hourlyPrice: 400 },
      ],
      isActive: true,
      owner: host._id,
    });

    // Spot 2: Himachal Pradesh, ₹1500/hr, Amenities: Bonfire, WiFi, Stargazing
    const spot2 = await Spot.create({
      title: "Kasol Riverside Haven",
      description: "Tranquil retreat by Parvati river.",
      location: "Kasol, Himachal Pradesh",
      price: 1500,
      category: "Riverside Meadow",
      amenities: [
        { name: "Bonfire Setup", hourlyPrice: 350 },
        { name: "High Speed WiFi", hourlyPrice: 150 },
        { name: "Stargazing Telescope", hourlyPrice: 250 },
      ],
      isActive: true,
      owner: host._id,
    });

    // Spot 3: Uttarakhand, ₹1200/hr, Amenities: Alpine Tent, Bonfire
    const spot3 = await Spot.create({
      title: "Rishikesh Cliff Camp",
      description: "Overlooking Ganga rapids.",
      location: "Rishikesh, Uttarakhand",
      price: 1200,
      category: "Campfire Stays",
      amenities: [
        { name: "Alpine Tent", hourlyPrice: 450 },
        { name: "Bonfire Setup", hourlyPrice: 300 },
      ],
      isActive: true,
      owner: host._id,
    });

    // Spot 4: Uttarakhand, ₹500/hr, Amenities: WiFi only
    const spot4 = await Spot.create({
      title: "Dehradun Orchard Plot",
      description: "Quiet mango orchard.",
      location: "Dehradun, Uttarakhand",
      price: 500,
      category: "Empty Plot",
      amenities: [
        { name: "High Speed WiFi", hourlyPrice: 100 },
      ],
      isActive: true,
      owner: host._id,
    });

    const testSpotIds = [spot1._id.toString(), spot2._id.toString(), spot3._id.toString(), spot4._id.toString()];
    console.log(`Created 4 test spots:
  - Spot 1: ${spot1.title} (${spot1.location}, ₹${spot1.price})
  - Spot 2: ${spot2.title} (${spot2.location}, ₹${spot2.price})
  - Spot 3: ${spot3.title} (${spot3.location}, ₹${spot3.price})
  - Spot 4: ${spot4.title} (${spot4.location}, ₹${spot4.price})\n`);

    // ========================================================
    // SANITY CHECK 1: Combining Multiple Filters (Intersection)
    // ========================================================
    console.log("--- TEST 1: Combining Location + Price Range + Amenity ---");
    // Filter: location="Himachal", minPrice=700, maxPrice=1000, amenities="Bonfire Setup"
    // Expected: ONLY Spot 1 (Solang Valley, ₹800) matches all 3 criteria.
    // Spot 2 is in Himachal with Bonfire, but price is ₹1500 (>1000).
    // Spot 3 and 4 are in Uttarakhand.
    {
      const { req, res } = createMockReqRes({
        location: "Himachal",
        minPrice: "700",
        maxPrice: "1000",
        amenities: "Bonfire Setup",
      });

      await getAllSpots(req, res);
      const spots = res.data?.data || [];
      console.log(`Matching spots count: ${spots.length}`);
      spots.forEach((s) => console.log(`  -> Matched: "${s.title}" (${s.location}, ₹${s.price})`));

      const matchedTestSpots = spots.filter((s) => testSpotIds.includes(s._id.toString()));
      if (
        matchedTestSpots.length === 1 &&
        matchedTestSpots[0]._id.toString() === spot1._id.toString()
      ) {
        console.log("✅ PASSED: Multiple filters correctly intersected. Spot 1 returned exclusively.\n");
      } else {
        throw new Error(`Expected only Spot 1, but got ${JSON.stringify(matchedTestSpots.map((s) => s.title))}`);
      }
    }

    // ========================================================
    // SANITY CHECK 2: Amenity Requirement (Must have ALL selected)
    // ========================================================
    console.log("--- TEST 2: Multi-Amenity Match (Requires ALL selected amenities) ---");
    // Filter: amenities="Bonfire Setup,High Speed WiFi"
    // Spot 2 has BOTH Bonfire Setup and High Speed WiFi.
    // Spot 1 and Spot 3 only have Bonfire Setup (missing WiFi).
    // Spot 4 only has WiFi (missing Bonfire).
    // Expected: Spot 2 is returned, Spot 1, 3, 4 are excluded.
    {
      const { req, res } = createMockReqRes({
        amenities: "Bonfire Setup,High Speed WiFi",
      });

      await getAllSpots(req, res);
      const spots = res.data?.data || [];
      const matchedTestSpots = spots.filter((s) => testSpotIds.includes(s._id.toString()));
      console.log(`Matched spots with both Bonfire & WiFi: ${matchedTestSpots.map((s) => s.title).join(", ")}`);

      if (
        matchedTestSpots.length === 1 &&
        matchedTestSpots[0]._id.toString() === spot2._id.toString()
      ) {
        console.log("✅ PASSED: ALL amenity intersection confirmed. Only spots possessing all selected amenities returned.\n");
      } else {
        throw new Error(`Expected only Spot 2, got: ${JSON.stringify(matchedTestSpots.map((s) => s.title))}`);
      }
    }

    // ========================================================
    // SANITY CHECK 3: Date & Time Confirmed Booking Conflict Check
    // ========================================================
    console.log("--- TEST 3: Date & Time Availability Conflict Detection ---");
    const testDate = new Date("2026-11-20T00:00:00.000Z");

    // Create a CONFIRMED booking on Spot 1 from 10:00 to 14:00 on testDate
    const confirmedBooking = await Booking.create({
      user: customer._id,
      spot: spot1._id,
      date: testDate,
      startTime: "10:00",
      endTime: "14:00",
      durationHours: 4,
      totalPrice: 3200,
      status: "confirmed",
    });
    console.log(`Created Confirmed Booking on "${spot1.title}" for 2026-11-20 from 10:00 to 14:00.`);

    // 3a. Search with genuine conflict: 2026-11-20, 11:00 to 13:00
    // Overlaps [10:00, 14:00] -> Spot 1 MUST be excluded!
    {
      const { req, res } = createMockReqRes({
        location: "Solang",
        date: "2026-11-20",
        startTime: "11:00",
        endTime: "13:00",
      });

      await getAllSpots(req, res);
      const spots = res.data?.data || [];
      const spot1Found = spots.some((s) => s._id.toString() === spot1._id.toString());
      console.log(`Conflict check [11:00 - 13:00] -> Spot 1 present: ${spot1Found}`);
      if (!spot1Found) {
        console.log("✅ PASSED: Spot 1 properly excluded during conflicting booked time window.");
      } else {
        throw new Error("Spot 1 should be EXCLUDED due to conflicting confirmed booking!");
      }
    }

    // 3b. Search on same date but NON-CONFLICTING window: 2026-11-20, 15:00 to 18:00
    // Does NOT overlap [10:00, 14:00] -> Spot 1 MUST be available and included!
    {
      const { req, res } = createMockReqRes({
        location: "Solang",
        date: "2026-11-20",
        startTime: "15:00",
        endTime: "18:00",
      });

      await getAllSpots(req, res);
      const spots = res.data?.data || [];
      const spot1Found = spots.some((s) => s._id.toString() === spot1._id.toString());
      console.log(`Non-conflict check [15:00 - 18:00] -> Spot 1 present: ${spot1Found}`);
      if (spot1Found) {
        console.log("✅ PASSED: Spot 1 is correctly available on the same day for a non-overlapping slot.\n");
      } else {
        throw new Error("Spot 1 should BE INCLUDED for a non-overlapping time slot on the same day!");
      }
    }

    // ========================================================
    // SANITY CHECK 4: Sorting (Price Ascending and Descending)
    // ========================================================
    console.log("--- TEST 4: Sorting by Price ---");
    // Sort: priceAsc
    {
      const { req, res } = createMockReqRes({ sort: "priceAsc", limit: "10" });
      await getAllSpots(req, res);
      const spots = res.data?.data || [];
      const prices = spots.map((s) => s.price);
      console.log(`priceAsc prices: ${prices.slice(0, 5).join(", ")}`);
      for (let i = 1; i < prices.length; i++) {
        if (prices[i] < prices[i - 1]) {
          throw new Error(`priceAsc order violated: ${prices[i - 1]} > ${prices[i]}`);
        }
      }
      console.log("✅ PASSED: priceAsc returned spots in ascending price order.");
    }

    // Sort: priceDesc
    {
      const { req, res } = createMockReqRes({ sort: "priceDesc", limit: "10" });
      await getAllSpots(req, res);
      const spots = res.data?.data || [];
      const prices = spots.map((s) => s.price);
      console.log(`priceDesc prices: ${prices.slice(0, 5).join(", ")}`);
      for (let i = 1; i < prices.length; i++) {
        if (prices[i] > prices[i - 1]) {
          throw new Error(`priceDesc order violated: ${prices[i - 1]} < ${prices[i]}`);
        }
      }
      console.log("✅ PASSED: priceDesc returned spots in descending price order.\n");
    }

    // ========================================================
    // SANITY CHECK 5: Pagination
    // ========================================================
    console.log("--- TEST 5: Pagination (page & limit) ---");
    {
      const { req, res } = createMockReqRes({ page: "1", limit: "2" });
      await getAllSpots(req, res);
      console.log(`Page 1 results: count=${res.data?.data?.length}, totalCount=${res.data?.totalCount}, totalPages=${res.data?.totalPages}, currentPage=${res.data?.currentPage}`);

      if (
        res.data?.data?.length === 2 &&
        res.data?.totalCount >= 4 &&
        res.data?.totalPages >= 2 &&
        res.data?.currentPage === 1
      ) {
        console.log("✅ PASSED: Pagination metadata and slicing verified.\n");
      } else {
        throw new Error(`Pagination metadata incorrect: ${JSON.stringify(res.data)}`);
      }
    }

    // ========================================================
    // SANITY CHECK 6: Clearing all filters returns full list
    // ========================================================
    console.log("--- TEST 6: Clearing Filters (Full unfiltered catalog) ---");
    {
      const { req, res } = createMockReqRes({});
      await getAllSpots(req, res);
      const spots = res.data?.data || [];
      const returnedTestSpotIds = spots.map((s) => s._id.toString());
      const allFound = testSpotIds.every((id) => returnedTestSpotIds.includes(id));

      console.log(`Unfiltered query returned ${res.data?.totalCount} spots total.`);
      if (allFound) {
        console.log("✅ PASSED: Resetting/clearing filters returns full unfiltered spots list.\n");
      } else {
        throw new Error("Clearing filters did not return all test spots!");
      }
    }

    // ========================================================
    // SANITY CHECK 7: Dynamic Amenities Endpoint
    // ========================================================
    console.log("--- TEST 7: Dynamic Amenities Endpoint GET /api/spots/amenities ---");
    {
      const { req, res } = createMockReqRes();
      await getAvailableAmenities(req, res);
      const amenityList = res.data?.data || [];
      console.log(`Discovered available amenities: ${amenityList.slice(0, 5).join(", ")} (+${amenityList.length - 5} more)`);

      if (amenityList.includes("Bonfire Setup") && amenityList.includes("High Speed WiFi")) {
        console.log("✅ PASSED: Dynamic amenities list returned all active amenities.\n");
      } else {
        throw new Error("Missing expected amenities from catalog");
      }
    }

    // Cleanup
    console.log("--- Cleanup Test Records ---");
    await Booking.deleteOne({ _id: confirmedBooking._id });
    await Spot.deleteMany({ _id: { $in: testSpotIds } });
    await User.deleteMany({ _id: { $in: [host._id, customer._id] } });
    console.log("✅ Cleaned up temporary test records.\n");

    await mongoose.connection.close();
    console.log("🎉 ALL SEARCH, FILTER, AVAILABILITY, & PAGINATION TESTS PASSED!");
    process.exit(0);
  } catch (err) {
    console.error("❌ SEARCH & FILTER TEST ERROR:", err);
    process.exit(1);
  }
}

runSearchFiltersSanityCheck();
