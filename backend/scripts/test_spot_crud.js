const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Booking = require("../models/Booking");
const Spot = require("../models/Spot");
const User = require("../models/User");
const {
  updateSpot,
  deleteSpot,
  getAllSpots,
  getSpotById,
  getOwnerSpots,
} = require("../controllers/spotController");

// Helper to mock express req/res
const createMockReqRes = (reqData = {}) => {
  const req = {
    params: reqData.params || {},
    body: reqData.body || {},
    query: reqData.query || {},
    user: reqData.user || null,
    headers: reqData.headers || {},
    files: reqData.files || [],
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

async function runSanityCheck() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Spot Edit/Delete Sanity Check.\n");

    // 1. Setup or retrieve test users: Host A, Host B, Customer
    let hostA = await User.findOne({ email: "hostA_test@thikana.com" });
    if (!hostA) {
      hostA = await User.create({
        name: "Host Alice",
        email: "hostA_test@thikana.com",
        password: "password123",
        role: "owner",
      });
    }

    let hostB = await User.findOne({ email: "hostB_test@thikana.com" });
    if (!hostB) {
      hostB = await User.create({
        name: "Host Bob",
        email: "hostB_test@thikana.com",
        password: "password123",
        role: "owner",
      });
    }

    let customer = await User.findOne({ role: "customer" });
    if (!customer) {
      customer = await User.create({
        name: "Test Customer",
        email: "customer_test@thikana.com",
        password: "password123",
        role: "customer",
      });
    }

    console.log(`[Setup] Host A: ${hostA.email} (${hostA._id})`);
    console.log(`[Setup] Host B: ${hostB.email} (${hostB._id})\n`);

    // Create a test spot owned by Host A
    const testSpot = await Spot.create({
      title: "Alpine Ridge Camp",
      description: "A serene spot nestled in high pine hills.",
      location: "Shimla, HP",
      price: 850,
      category: "Campfire Stays",
      amenities: [
        { name: "Wood Bonfire", hourlyPrice: 300, price: 300 },
        { name: "Dome Tent", hourlyPrice: 400, price: 400 },
      ],
      isActive: true,
      owner: hostA._id,
    });

    console.log(`[Setup] Created Test Spot: "${testSpot.title}" (${testSpot._id})\n`);

    // ========================================================
    // SANITY CHECK 1: Non-owning host gets 403 on edit & delete
    // ========================================================
    console.log("--- TEST 1: Ownership Check (Host B tries to update Host A's spot) ---");
    {
      const { req, res } = createMockReqRes({
        params: { id: testSpot._id.toString() },
        body: { title: "Hacked by Host B" },
        user: hostB,
      });

      await updateSpot(req, res);
      console.log(`Update Response Status: ${res.statusCode}, Message: ${res.data?.message}`);
      if (res.statusCode === 403) {
        console.log("✅ PASSED: Non-owning host got 403 trying to update another host's spot.\n");
      } else {
        throw new Error(`Expected status 403, got ${res.statusCode}`);
      }
    }

    console.log("--- TEST 2: Ownership Check (Host B tries to delete Host A's spot) ---");
    {
      const { req, res } = createMockReqRes({
        params: { id: testSpot._id.toString() },
        user: hostB,
      });

      await deleteSpot(req, res);
      console.log(`Delete Response Status: ${res.statusCode}, Message: ${res.data?.message}`);
      if (res.statusCode === 403) {
        console.log("✅ PASSED: Non-owning host got 403 trying to delete another host's spot.\n");
      } else {
        throw new Error(`Expected status 403, got ${res.statusCode}`);
      }
    }

    // ========================================================
    // SANITY CHECK 2: Amenity price validation (> 0 required)
    // ========================================================
    console.log("--- TEST 3: Amenity price validation (<= 0 price rejected) ---");
    {
      const { req, res } = createMockReqRes({
        params: { id: testSpot._id.toString() },
        body: {
          amenities: [
            { name: "Invalid Free Bonfire", hourlyPrice: 0 },
          ],
        },
        user: hostA,
      });

      await updateSpot(req, res);
      console.log(`Update Response Status: ${res.statusCode}, Message: ${res.data?.message}`);
      if (res.statusCode === 400) {
        console.log("✅ PASSED: Amenity price of 0 was rejected with 400.\n");
      } else {
        throw new Error(`Expected status 400, got ${res.statusCode}`);
      }
    }

    // ========================================================
    // SANITY CHECK 3: Legitimate update by Owner (Host A)
    // ========================================================
    console.log("--- TEST 4: Legitimate update by Owner (title, price, amenities) ---");
    {
      const { req, res } = createMockReqRes({
        params: { id: testSpot._id.toString() },
        body: {
          title: "Alpine Ridge Eco Sanctuary",
          price: 1200,
          location: "Upper Shimla, HP",
          amenities: [
            { name: "Luxury Firepit", hourlyPrice: 500 },
            { name: "Star Gazing Telescope", hourlyPrice: 350 },
          ],
        },
        user: hostA,
      });

      await updateSpot(req, res);
      const updated = res.data?.data || res.data;
      console.log(`Updated Title: "${updated.title}", Price: ₹${updated.price}/hr, Amenities count: ${updated.amenities.length}`);
      if (res.statusCode === 200 && updated.title === "Alpine Ridge Eco Sanctuary" && updated.price === 1200) {
        console.log("✅ PASSED: Spot updated successfully by owner with new pricing and amenities.\n");
      } else {
        throw new Error(`Update failed: ${JSON.stringify(res.data)}`);
      }
    }

    // ========================================================
    // SANITY CHECK 4: Block deletion when active bookings exist
    // ========================================================
    console.log("--- TEST 5: Active bookings block deletion ---");
    const activeBooking = await Booking.create({
      user: customer._id,
      spot: testSpot._id,
      date: new Date(Date.now() + 86400000 * 5),
      totalPrice: 2400,
      status: "confirmed",
    });
    console.log(`Created Active Booking (${activeBooking._id}) with status "${activeBooking.status}"`);

    {
      const { req, res } = createMockReqRes({
        params: { id: testSpot._id.toString() },
        user: hostA,
      });

      await deleteSpot(req, res);
      console.log(`Delete Response Status: ${res.statusCode}, Message: "${res.data?.message}"`);
      if (
        res.statusCode === 400 &&
        res.data?.message === "Cancel or resolve existing bookings before deleting this spot"
      ) {
        console.log("✅ PASSED: Spot deletion blocked due to active bookings with exact expected message.\n");
      } else {
        throw new Error(`Expected status 400, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }
    }

    // ========================================================
    // SANITY CHECK 5: Soft-delete preserves historical bookings
    // ========================================================
    console.log("--- TEST 6: Soft-delete when bookings are resolved ---");
    // Change booking status to completed/cancelled
    activeBooking.status = "cancelled";
    await activeBooking.save();

    {
      const { req, res } = createMockReqRes({
        params: { id: testSpot._id.toString() },
        user: hostA,
      });

      await deleteSpot(req, res);
      console.log(`Delete Response Status: ${res.statusCode}, Message: "${res.data?.message}", softDeleted: ${res.data?.softDeleted}`);
      if (res.statusCode === 200 && res.data?.softDeleted === true) {
        console.log("✅ PASSED: Spot was soft-deleted to preserve historical booking data.\n");
      } else {
        throw new Error(`Expected soft-delete, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }
    }

    // ========================================================
    // SANITY CHECK 6: Visibility filtering (deactivated spots)
    // ========================================================
    console.log("--- TEST 7: Deactivated spot visibility check ---");
    // Public getAllSpots should NOT return deactivated spot
    {
      const { req, res } = createMockReqRes();
      await getAllSpots(req, res);
      const publicSpots = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.spots || []);
      const foundInPublic = publicSpots.some((s) => s._id.toString() === testSpot._id.toString());
      console.log(`Deactivated spot visible in public GET /api/spots: ${foundInPublic}`);
      if (!foundInPublic) {
        console.log("✅ PASSED: Deactivated spot is hidden from public getAllSpots.\n");
      } else {
        throw new Error("Deactivated spot should NOT appear in public getAllSpots");
      }
    }

    // Public getSpotById should return 404 for unauthenticated visitor
    {
      const { req, res } = createMockReqRes({
        params: { id: testSpot._id.toString() },
        user: null,
      });
      await getSpotById(req, res);
      console.log(`Public GET /api/spots/:id Status: ${res.statusCode}, Message: "${res.data?.message}"`);
      if (res.statusCode === 404) {
        console.log("✅ PASSED: Public visitor receives 404 for deactivated spot.\n");
      } else {
        throw new Error(`Expected 404 for public visitor, got ${res.statusCode}`);
      }
    }

    // Owner getSpotById should SUCCEED and return the spot
    {
      const { req, res } = createMockReqRes({
        params: { id: testSpot._id.toString() },
        user: hostA,
      });
      await getSpotById(req, res);
      console.log(`Owner GET /api/spots/:id Status: ${res.statusCode}, Title: "${res.data?.title}"`);
      if (res.statusCode === 200 && res.data?._id.toString() === testSpot._id.toString()) {
        console.log("✅ PASSED: Host A can view their own deactivated spot.\n");
      } else {
        throw new Error(`Expected owner to view spot, got ${res.statusCode}`);
      }
    }

    // Owner getOwnerSpots should return the deactivated spot in My Listings
    {
      const { req, res } = createMockReqRes({
        user: hostA,
      });
      await getOwnerSpots(req, res);
      const ownerSpots = res.data || [];
      const foundInMyListings = ownerSpots.some((s) => s._id.toString() === testSpot._id.toString());
      console.log(`Deactivated spot visible in owner GET /api/spots/owner/me: ${foundInMyListings}`);
      if (foundInMyListings) {
        console.log("✅ PASSED: Deactivated spot remains visible in Host A's My Listings dashboard.\n");
      } else {
        throw new Error("Deactivated spot should appear in owner's My Listings");
      }
    }

    // ========================================================
    // CLEANUP
    // ========================================================
    console.log("--- Cleanup Test Records ---");
    await Booking.deleteOne({ _id: activeBooking._id });
    await Spot.deleteOne({ _id: testSpot._id });
    await User.deleteMany({ _id: { $in: [hostA._id, hostB._id] } });
    console.log("✅ Cleaned up temporary test spot, bookings, and test users.\n");

    await mongoose.connection.close();
    console.log("🎉 ALL SPOT CRUD & PERMISSION SANITY CHECKS COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (error) {
    console.error("❌ SANITY CHECK ERROR:", error);
    process.exit(1);
  }
}

runSanityCheck();
