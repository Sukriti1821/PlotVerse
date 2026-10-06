const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Booking = require("../models/Booking");
const Spot = require("../models/Spot");
const User = require("../models/User");

const {
  createSpot,
  getAllSpots,
  getSpotById,
  getOwnerSpots,
  getAvailableAmenities,
  updateSpot,
  deleteSpot,
} = require("../controllers/spotController");

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const {
  createBooking,
  updateBookingStatus,
  getUserBookings,
  getOwnerBookings,
} = require("../controllers/bookingController");

// Helper to mock express req/res
const createMockReqRes = ({ query = {}, params = {}, body = {}, user = null, headers = {} } = {}) => {
  const req = {
    query,
    params,
    body,
    user,
    headers,
    files: [],
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

async function runFullVerification() {
  const results = {
    passed: [],
    failed: [],
  };

  const assert = (condition, testName, details = "") => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      results.passed.push(testName);
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      results.failed.push({ testName, details });
    }
  };

  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
    await mongoose.connect(mongoUri);
    console.log("================================================================");
    console.log("   Thikana Full End-to-End Verification Test Suite           ");
    console.log("================================================================\n");

    // Clean up any existing test records
    await User.deleteMany({ email: { $regex: /@e2everify\.com$/i } });
    await Spot.deleteMany({ title: { $regex: /^\[E2E\]/ } });

    // =========================================================================
    // SETUP: Users for test
    // =========================================================================
    console.log("--- SETUP: Creating Test Accounts ---");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("InitialPass123", salt);

    const ownerA = await User.create({
      name: "Alice Owner",
      email: "alice@e2everify.com",
      password: hashedPassword,
      role: "owner",
    });

    const ownerB = await User.create({
      name: "Bob OtherOwner",
      email: "bob@e2everify.com",
      password: hashedPassword,
      role: "owner",
    });

    const customerA = await User.create({
      name: "Charlie Customer",
      email: "charlie@e2everify.com",
      password: hashedPassword,
      role: "customer",
    });

    console.log(`Created Owner A: ${ownerA.email}`);
    console.log(`Created Owner B: ${ownerB.email}`);
    console.log(`Created Customer: ${customerA.email}\n`);

    // =========================================================================
    // PART A: OWNER SPOT EDIT / DELETE
    // =========================================================================
    console.log("================================================================");
    console.log("   PART A: OWNER SPOT EDIT & DELETE VERIFICATION                ");
    console.log("================================================================");

    // Create Spot 1 owned by Owner A
    const spotA = await Spot.create({
      title: "[E2E] Pinecone Grove Camping",
      description: "Picturesque pine grove with valley views.",
      location: "Kullu, Himachal Pradesh",
      price: 900,
      category: "Campfire Stays",
      amenities: [
        { name: "Bonfire Setup", hourlyPrice: 250, price: 250 },
        { name: "Alpine Tent", hourlyPrice: 350, price: 350 },
      ],
      isActive: true,
      owner: ownerA._id,
    });

    // 1.1: Edit spot title, price, amenities as Owner A
    {
      const { req, res } = createMockReqRes({
        params: { id: spotA._id.toString() },
        body: {
          title: "[E2E] Pinecone Grove Luxury Camp",
          price: 1350,
          amenities: [
            { name: "Bonfire Setup", hourlyPrice: 300 },
            { name: "Solar Lanterns", hourlyPrice: 150 },
          ],
        },
        user: ownerA,
      });

      await updateSpot(req, res);
      const updated = res.data?.data || res.data;

      assert(
        res.statusCode === 200 &&
          updated.title === "[E2E] Pinecone Grove Luxury Camp" &&
          updated.price === 1350 &&
          updated.amenities.length === 2 &&
          updated.amenities.some((a) => a.name === "Solar Lanterns"),
        "1.1 Owner can edit spot title, base rate, and amenities",
        `Got: status=${res.statusCode}, title=${updated?.title}`
      );

      // Confirm changes reflect on public getSpotById
      const { req: getReq, res: getRes } = createMockReqRes({
        params: { id: spotA._id.toString() },
      });
      await getSpotById(getReq, getRes);
      assert(
        getRes.statusCode === 200 && getRes.data?.title === "[E2E] Pinecone Grove Luxury Camp",
        "1.1b Changes reflect on GET /api/spots/:id",
        `Got: title=${getRes.data?.title}`
      );
    }

    // 1.2: Attempt to edit spot as DIFFERENT owner (Owner B) -> 403 Forbidden
    {
      const { req, res } = createMockReqRes({
        params: { id: spotA._id.toString() },
        body: { title: "[E2E] Hacked by Owner B" },
        user: ownerB,
      });

      await updateSpot(req, res);
      assert(
        res.statusCode === 403,
        "1.2 Non-owning owner gets 403 Forbidden attempting to edit another's spot",
        `Got status: ${res.statusCode}`
      );
    }

    // 1.2b: Attempt to delete spot as DIFFERENT owner (Owner B) -> 403 Forbidden
    {
      const { req, res } = createMockReqRes({
        params: { id: spotA._id.toString() },
        user: ownerB,
      });

      await deleteSpot(req, res);
      assert(
        res.statusCode === 403,
        "1.2b Non-owning owner gets 403 Forbidden attempting to delete another's spot",
        `Got status: ${res.statusCode}`
      );
    }

    // 1.3: Deactivate / soft-delete a spot with no bookings
    const spotNoBookings = await Spot.create({
      title: "[E2E] Temporary Meadow",
      description: "Open plot with no reservations.",
      location: "Solan, Himachal Pradesh",
      price: 600,
      category: "Grassland Plot",
      isActive: true,
      owner: ownerA._id,
    });

    {
      const { req, res } = createMockReqRes({
        params: { id: spotNoBookings._id.toString() },
        body: { isActive: false },
        user: ownerA,
      });

      await updateSpot(req, res);
      assert(
        res.statusCode === 200,
        "1.3 Owner can deactivate spot via PATCH /api/spots/:id",
        `Status: ${res.statusCode}`
      );

      // Verify it disappears from public listings
      const { req: publicReq, res: publicRes } = createMockReqRes({
        query: { location: "Temporary Meadow" },
      });
      await getAllSpots(publicReq, publicRes);
      const publicSpots = publicRes.data?.data || publicRes.data?.spots || [];
      const foundInPublic = publicSpots.some((s) => s._id.toString() === spotNoBookings._id.toString());
      assert(
        !foundInPublic,
        "1.3b Deactivated spot disappears from public GET /api/spots",
        `foundInPublic: ${foundInPublic}`
      );

      // Verify it still shows in owner's "My Listings"
      const { req: ownerMeReq, res: ownerMeRes } = createMockReqRes({
        user: ownerA,
      });
      await getOwnerSpots(ownerMeReq, ownerMeRes);
      const ownerSpots = Array.isArray(ownerMeRes.data) ? ownerMeRes.data : ownerMeRes.data?.data || [];
      const foundInOwnerMe = ownerSpots.some((s) => s._id.toString() === spotNoBookings._id.toString());
      assert(
        foundInOwnerMe,
        "1.3c Deactivated spot remains visible in owner's My Listings (/owner/me)",
        `foundInOwnerMe: ${foundInOwnerMe}`
      );
    }

    // 1.4: Attempt to delete spot with active/pending booking -> blocked with 400
    const activeBooking = await Booking.create({
      user: customerA._id,
      spot: spotA._id,
      date: new Date(Date.now() + 86400000 * 3),
      startTime: "10:00",
      endTime: "14:00",
      durationHours: 4,
      totalPrice: spotA.price * 4,
      status: "pending",
    });

    {
      const { req, res } = createMockReqRes({
        params: { id: spotA._id.toString() },
        user: ownerA,
      });

      await deleteSpot(req, res);
      assert(
        res.statusCode === 400 &&
          res.data?.message === "Cancel or resolve existing bookings before deleting this spot",
        "1.4 Deletion blocked when active/pending booking exists",
        `Got: status=${res.statusCode}, message="${res.data?.message}"`
      );
    }

    // Clean up booking
    await Booking.deleteOne({ _id: activeBooking._id });
    await Spot.deleteOne({ _id: spotNoBookings._id });

    // =========================================================================
    // PART B: SEARCH & FILTERS
    // =========================================================================
    console.log("\n================================================================");
    console.log("   PART B: SEARCH & FILTERS VERIFICATION                        ");
    console.log("================================================================");

    // Create 3 distinct spots for search tests
    const searchSpot1 = await Spot.create({
      title: "[E2E] Kasol Riverside Glamping",
      description: "Right by the river in Parvati Valley.",
      location: "Kasol, Himachal Pradesh",
      price: 750,
      category: "Riverside Meadow",
      amenities: [
        { name: "Bonfire Setup", hourlyPrice: 200 },
        { name: "Riverside Access", hourlyPrice: 100 },
      ],
      isActive: true,
      owner: ownerA._id,
    });

    const searchSpot2 = await Spot.create({
      title: "[E2E] Rishikesh Cliffside Glamp",
      description: "Clifftop views above the Ganges.",
      location: "Rishikesh, Uttarakhand",
      price: 1800,
      category: "Hillside Hut",
      amenities: [
        { name: "Bonfire Setup", hourlyPrice: 250 },
        { name: "High Speed WiFi", hourlyPrice: 150 },
      ],
      isActive: true,
      owner: ownerA._id,
    });

    const searchSpot3 = await Spot.create({
      title: "[E2E] Manali Orchard Retreat",
      description: "Apple orchards in Manali.",
      location: "Manali, Himachal Pradesh",
      price: 1200,
      category: "Grassland Plot",
      amenities: [
        { name: "Bonfire Setup", hourlyPrice: 200 },
        { name: "Riverside Access", hourlyPrice: 100 },
        { name: "High Speed WiFi", hourlyPrice: 150 },
      ],
      isActive: true,
      owner: ownerA._id,
    });

    // 2.1: Test individual filters
    // 2.1a: Location partial match
    {
      const { req, res } = createMockReqRes({
        query: { location: "Uttarakhand" },
      });
      await getAllSpots(req, res);
      const spots = res.data?.data || [];
      const hasRishikesh = spots.some((s) => s.title === "[E2E] Rishikesh Cliffside Glamp");
      const hasKasol = spots.some((s) => s.title === "[E2E] Kasol Riverside Glamping");
      assert(
        hasRishikesh && !hasKasol,
        "2.1a Location filter accurately matches region/state",
        `hasRishikesh: ${hasRishikesh}, hasKasol: ${hasKasol}`
      );
    }

    // 2.1b: Price range filter
    {
      const { req, res } = createMockReqRes({
        query: { minPrice: "700", maxPrice: "1000" },
      });
      await getAllSpots(req, res);
      const spots = res.data?.data || [];
      const hasKasol750 = spots.some((s) => s.title === "[E2E] Kasol Riverside Glamping");
      const hasManali1200 = spots.some((s) => s.title === "[E2E] Manali Orchard Retreat");
      assert(
        hasKasol750 && !hasManali1200,
        "2.1b Price range filter accurately filters by base hourly rate",
        `hasKasol(₹750): ${hasKasol750}, hasManali(₹1200): ${hasManali1200}`
      );
    }

    // 2.2: Multiple filters intersected (Location + Price + Amenity)
    {
      const { req, res } = createMockReqRes({
        query: {
          location: "Himachal",
          minPrice: "1000",
          amenities: "High Speed WiFi",
        },
      });
      await getAllSpots(req, res);
      const spots = res.data?.data || [];
      const hasManali = spots.some((s) => s.title === "[E2E] Manali Orchard Retreat");
      const hasKasol = spots.some((s) => s.title === "[E2E] Kasol Riverside Glamping"); // Price ₹750 (<1000)
      const hasRishikesh = spots.some((s) => s.title === "[E2E] Rishikesh Cliffside Glamp"); // Uttarakhand, not Himachal
      assert(
        hasManali && !hasKasol && !hasRishikesh,
        "2.2 Multiple filters correctly intersected (Location + Price + Amenity)",
        `hasManali: ${hasManali}, hasKasol: ${hasKasol}, hasRishikesh: ${hasRishikesh}`
      );
    }

    // 2.3: Date/Time availability conflict detection
    const conflictDate = "2026-12-15";
    const confirmedRes = await Booking.create({
      user: customerA._id,
      spot: searchSpot3._id,
      date: new Date(`${conflictDate}T00:00:00.000Z`),
      startTime: "11:00",
      endTime: "15:00",
      durationHours: 4,
      totalPrice: searchSpot3.price * 4,
      status: "confirmed",
    });

    // 2.3a: Conflicting search window [12:00-14:00] -> excluded
    {
      const { req, res } = createMockReqRes({
        query: {
          location: "Manali Orchard",
          date: conflictDate,
          startTime: "12:00",
          endTime: "14:00",
        },
      });
      await getAllSpots(req, res);
      const spots = res.data?.data || [];
      const found = spots.some((s) => s._id.toString() === searchSpot3._id.toString());
      assert(
        !found,
        "2.3a Conflicting time slot [12:00-14:00] correctly excludes spot",
        `Spot found: ${found}`
      );
    }

    // 2.3b: Non-conflicting search window on same date [16:00-19:00] -> included
    {
      const { req, res } = createMockReqRes({
        query: {
          location: "Manali Orchard",
          date: conflictDate,
          startTime: "16:00",
          endTime: "19:00",
        },
      });
      await getAllSpots(req, res);
      const spots = res.data?.data || [];
      const found = spots.some((s) => s._id.toString() === searchSpot3._id.toString());
      assert(
        found,
        "2.3b Non-conflicting time slot [16:00-19:00] on same date includes spot",
        `Spot found: ${found}`
      );
    }

    // 2.4: Pagination
    {
      const { req, res } = createMockReqRes({
        query: { page: "1", limit: "2" },
      });
      await getAllSpots(req, res);
      assert(
        res.data?.data?.length <= 2 &&
          res.data?.totalCount >= 3 &&
          res.data?.totalPages >= 2 &&
          res.data?.currentPage === 1,
        "2.4 Pagination returns accurate metadata (data, totalCount, totalPages, currentPage)",
        `Count: ${res.data?.data?.length}, TotalPages: ${res.data?.totalPages}`
      );
    }

    // 2.5: Empty state when filters match nothing
    {
      const { req, res } = createMockReqRes({
        query: { location: "NonExistentMoonCraterLocationXYZ" },
      });
      await getAllSpots(req, res);
      assert(
        res.data?.data?.length === 0 && res.data?.totalCount === 0,
        "2.5 Zero-match search returns empty array and totalCount: 0",
        `TotalCount: ${res.data?.totalCount}`
      );
    }

    await Booking.deleteOne({ _id: confirmedRes._id });

    // =========================================================================
    // PART C: PASSWORD RESET
    // =========================================================================
    console.log("\n================================================================");
    console.log("   PART C: PASSWORD RESET VERIFICATION                          ");
    console.log("================================================================");

    const resetTestUser = await User.create({
      name: "Daisy Reset",
      email: "daisy@e2everify.com",
      password: hashedPassword, // "InitialPass123"
      role: "customer",
    });

    // 3.1 & 3.5: Request reset for registered email & unregistered email
    let validForgotRes;
    {
      const { req, res } = createMockReqRes({
        body: { email: "daisy@e2everify.com" },
      });
      await forgotPassword(req, res);
      validForgotRes = res.data;
    }

    let unknownForgotRes;
    {
      const { req, res } = createMockReqRes({
        body: { email: "ghost_unregistered@e2everify.com" },
      });
      await forgotPassword(req, res);
      unknownForgotRes = res.data;
    }

    assert(
      validForgotRes.success === true &&
        unknownForgotRes.success === true &&
        validForgotRes.message === unknownForgotRes.message,
      "3.1 & 3.5 Forgot-password returns identical generic message (no email enumeration)",
      `Messages identical: ${validForgotRes.message === unknownForgotRes.message}`
    );

    // 3.2: Use token to set new password and verify login
    const updatedDaisy = await User.findById(resetTestUser._id);
    assert(
      Boolean(updatedDaisy.resetPasswordToken && updatedDaisy.resetPasswordExpires > Date.now()),
      "3.1b Token hash and expiry correctly populated in database",
      `Token exists: ${Boolean(updatedDaisy.resetPasswordToken)}`
    );

    // Simulate token reset
    const newRawToken = crypto.randomBytes(32).toString("hex");
    const newHashedToken = crypto.createHash("sha256").update(newRawToken).digest("hex");
    updatedDaisy.resetPasswordToken = newHashedToken;
    updatedDaisy.resetPasswordExpires = new Date(Date.now() + 3600000);
    await updatedDaisy.save();

    const brandNewPassword = "SuperSecureNewPassword999";
    {
      const { req, res } = createMockReqRes({
        params: { token: newRawToken },
        body: { password: brandNewPassword },
      });
      await resetPassword(req, res);
      assert(
        res.statusCode === 200 && res.data?.success === true,
        "3.2 Reset password endpoint succeeds with valid token",
        `Status: ${res.statusCode}`
      );
    }

    // Verify login with OLD password fails
    {
      const { req, res } = createMockReqRes({
        body: { email: "daisy@e2everify.com", password: "InitialPass123" },
      });
      await loginUser(req, res);
      assert(
        res.statusCode === 401,
        "3.2b Login with OLD password is now rejected (401)",
        `Status: ${res.statusCode}`
      );
    }

    // Verify login with NEW password succeeds
    {
      const { req, res } = createMockReqRes({
        body: { email: "daisy@e2everify.com", password: brandNewPassword },
      });
      await loginUser(req, res);
      assert(
        res.statusCode === 200 && Boolean(res.data?.token),
        "3.2c Login with NEW password succeeds and issues valid JWT",
        `Status: ${res.statusCode}`
      );
    }

    // 3.3: Attempt to reuse the same reset token a second time -> 400
    {
      const { req, res } = createMockReqRes({
        params: { token: newRawToken },
        body: { password: "AnotherAttemptPassword" },
      });
      await resetPassword(req, res);
      assert(
        res.statusCode === 400,
        "3.3 Reusing a cleared token is rejected (single-use enforced)",
        `Status: ${res.statusCode}`
      );
    }

    // 3.4: Expired token rejection
    const expiredRawToken = crypto.randomBytes(32).toString("hex");
    const expiredHashedToken = crypto.createHash("sha256").update(expiredRawToken).digest("hex");
    const userForExpired = await User.findById(resetTestUser._id);
    userForExpired.resetPasswordToken = expiredHashedToken;
    userForExpired.resetPasswordExpires = new Date(Date.now() - 1000 * 60); // 1 minute in the past
    await userForExpired.save();

    {
      const { req, res } = createMockReqRes({
        params: { token: expiredRawToken },
        body: { password: "PasswordAfterExpiry" },
      });
      await resetPassword(req, res);
      assert(
        res.statusCode === 400,
        "3.4 Expired token is rejected with 400 error",
        `Status: ${res.statusCode}`
      );
    }

    // =========================================================================
    // PART D: REGRESSION CHECK
    // =========================================================================
    console.log("\n================================================================");
    console.log("   PART D: REGRESSION CHECKS (BOOKING FLOW & AUTH)              ");
    console.log("================================================================");

    // 4.1: Customer books spot -> Owner approves/confirms -> Status updates on both sides
    let createdBookingId;
    {
      const { req, res } = createMockReqRes({
        body: {
          spotId: spotA._id.toString(),
          date: new Date(Date.now() + 86400000 * 10).toISOString(),
          startTime: "10:00",
          endTime: "13:00",
          durationHours: 3,
          selectedAmenities: ["Bonfire Setup"],
          guests: 2,
        },
        user: customerA,
      });

      await createBooking(req, res);
      const createdBooking = res.data?.data || res.data;
      createdBookingId = createdBooking?._id;

      assert(
        res.statusCode === 201 && createdBooking?.status === "pending",
        "4.1 Customer creates booking successfully with status 'pending'",
        `Status: ${res.statusCode}, BookingStatus: ${createdBooking?.status}`
      );
    }

    // Owner approves/confirms booking
    {
      const { req, res } = createMockReqRes({
        params: { id: createdBookingId.toString() },
        body: { status: "confirmed" },
        user: ownerA,
      });

      await updateBookingStatus(req, res);
      const updatedBooking = res.data?.data || res.data;

      assert(
        res.statusCode === 200 && updatedBooking?.status === "confirmed",
        "4.1b Owner approves booking -> status updates to 'confirmed'",
        `Status: ${res.statusCode}, BookingStatus: ${updatedBooking?.status}`
      );
    }

    // Customer views their bookings
    {
      const { req, res } = createMockReqRes({
        user: customerA,
      });
      await getUserBookings(req, res);
      const userBookings = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const foundInUser = userBookings.some((b) => b._id.toString() === createdBookingId.toString() && b.status === "confirmed");
      assert(
        foundInUser,
        "4.1c Confirmed reservation reflects in Customer's My Bookings",
        `found: ${foundInUser}`
      );
    }

    // Owner views their bookings
    {
      const { req, res } = createMockReqRes({
        user: ownerA,
      });
      await getOwnerBookings(req, res);
      const ownerBookings = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const foundInOwner = ownerBookings.some((b) => b._id.toString() === createdBookingId.toString() && b.status === "confirmed");
      assert(
        foundInOwner,
        "4.1d Confirmed reservation reflects in Owner's Host Bookings",
        `found: ${foundInOwner}`
      );
    }

    // Clean up created booking
    await Booking.deleteOne({ _id: createdBookingId });

    // 4.2: Auth flow: Register with invalid role is rejected; register with valid role succeeds
    {
      const { req, res } = createMockReqRes({
        body: {
          name: "Test Role Reject",
          email: "invalid_role@e2everify.com",
          password: "password123",
          role: "invalidRoleValue",
        },
      });
      await registerUser(req, res);
      assert(
        res.statusCode === 400,
        "4.2 Registration with invalid role is rejected (400)",
        `Status: ${res.statusCode}`
      );
    }

    // Clean up all test spots and users
    await Spot.deleteMany({ _id: { $in: [spotA._id, searchSpot1._id, searchSpot2._id, searchSpot3._id] } });
    await User.deleteMany({ email: { $regex: /@e2everify\.com$/i } });
    console.log("\nCleaned up all temporary E2E test data.");

    console.log("\n================================================================");
    console.log(`E2E TEST SUMMARY: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
    console.log("================================================================");

    await mongoose.connection.close();

    if (results.failed.length > 0) {
      console.error("\nFailed Tests:");
      results.failed.forEach((f) => console.error(`- ${f.testName}: ${f.details}`));
      process.exit(1);
    } else {
      console.log("🎉 ALL END-TO-END CHECKS PASSED WITH ZERO FAILURES!");
      process.exit(0);
    }
  } catch (err) {
    console.error("FATAL E2E ERROR:", err);
    process.exit(1);
  }
}

runFullVerification();
