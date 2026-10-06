const mongoose = require("mongoose");
const User = require("../models/User");
const Spot = require("../models/Spot");
const Experience = require("../models/Experience");
const Booking = require("../models/Booking");
const Organization = require("../models/Organization");
const corporateService = require("../services/corporateService");
const availabilityService = require("../services/availabilityService");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";

async function runTests() {
  console.log("=================================================");
  console.log("🚀 Thikana — Feature 10: B2B Corporate Test Suite");
  console.log("=================================================");

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB:", MONGO_URI);

    // 1. Setup Test Users
    console.log("\n1️⃣ Creating Test Host Meera, Corporate Organizer Vikram, and Bad Actor...");
    await User.deleteMany({
      email: {
        $in: [
          "corp_host_meera@test.com",
          "corp_organizer_vikram@test.com",
          "corp_bad_actor@test.com",
        ],
      },
    });
    await Organization.deleteMany({ name: "TechCorp Global Innovations" });

    const host = await User.create({
      name: "Meera Nair",
      email: "corp_host_meera@test.com",
      password: "password123",
      role: "owner",
    });

    const organizer = await User.create({
      name: "Vikram Malhotra",
      email: "corp_organizer_vikram@test.com",
      password: "password123",
      role: "customer",
    });

    const badActor = await User.create({
      name: "Sneaky Hacker",
      email: "corp_bad_actor@test.com",
      password: "password123",
      role: "customer",
    });

    console.log("   ✅ Created users: Host, Organizer, Bad Actor");

    // 2. Setup Corporate-friendly Spot
    console.log("\n2️⃣ Creating Corporate-friendly Plot with Capacity 60 & Tech Amenities...");
    await Spot.deleteMany({ title: "Silicon Pines Corporate Retreat Estate" });

    const spot = await Spot.create({
      title: "Silicon Pines Corporate Retreat Estate",
      description: "Scenic 3-acre pine grove equipped for corporate offsites, hackathons, and retreats.",
      location: "Kasauli Hills, Himachal Pradesh",
      price: 1500, // base hourly
      category: "Estate",
      owner: host._id,
      maxGuests: 60,
      corporateFriendly: {
        isCorporateFriendly: true,
        maxCorporateCapacity: 60,
        corporateAmenities: [
          "High-Speed Wi-Fi (300 Mbps)",
          "Projector & 120-inch Screen",
          "Conference Seating Setup",
          "Whiteboards & Flipcharts",
          "PA & Wireless Mic System",
          "Catering & Dining Pavilion",
          "Power Backup Generator",
        ],
        corporateHourlyRate: 2000,
        corporateDayPackagePrice: 16000,
        allowInstantCorporateBooking: false, // requires quote
      },
    });
    console.log("   ✅ Spot created:", spot.title, "(Capacity:", spot.corporateFriendly.maxCorporateCapacity, ")");

    // 3. Setup Corporate Experience Package
    console.log("\n3️⃣ Creating Corporate Curated Experience Package...");
    await Experience.deleteMany({ title: "Executive Leadership & Strategy Retreat" });

    const experience = await Experience.create({
      title: "Executive Leadership & Strategy Retreat",
      description: "Full-day immersive leadership workshop with outdoor breakout zones, barbecue lunch, and bonfire wrap-up.",
      spot: spot._id,
      owner: host._id,
      category: "Corporate Retreat",
      durationHours: 6,
      price: 18000,
      isCorporate: true,
      corporateType: "small_retreat",
      maxAttendees: 40,
      requiresCustomQuote: true,
      includedAmenities: [
        { name: "Projector & Sound", description: "Audio-visual gear" },
        { name: "Gourmet Lunch Setup", description: "Buffet dining" },
        { name: "Evening Bonfire Session", description: "Team relaxation" },
      ],
    });
    console.log("   ✅ Experience created:", experience.title, "(₹" + experience.price + ", 6h)");

    // 4. Register Organization Profile
    console.log("\n4️⃣ Creating Organization Profile for Vikram...");
    const org = await corporateService.createOrUpdateOrganization({
      userId: organizer._id,
      orgData: {
        companyName: "TechCorp Global Innovations",
        industry: "Technology & Cloud Services",
        companySize: "51-200",
        gstin: "07AAAAA0000A1Z5",
        billingAddress: "Tech Park Block 4, Cyber City, Gurugram, India",
        contactEmail: "events@techcorp.io",
        contactPhone: "+91 98765 43210",
        website: "https://techcorp.io",
        designation: "VP People & Culture",
      },
    });

    console.log("   ✅ Organization profile registered:", org.name, "(GSTIN:", org.gstin, ")");

    const updatedOrganizer = await User.findById(organizer._id);
    console.log("   ✅ Organizer user role updated to:", updatedOrganizer.role, "(Expected: corporate)");

    // 5. Test Corporate Spaces Search API
    console.log("\n5️⃣ Testing Corporate Spaces Query (getCorporateSpaces)...");
    const spacesResult = await corporateService.getCorporateSpaces({
      minCapacity: 30,
      amenity: "Projector",
    });
    console.log("   ✅ Found corporate spaces:", spacesResult.spots.length, "spots,", spacesResult.experiences.length, "experiences");
    if (spacesResult.spots.length === 0) {
      throw new Error("Expected at least 1 corporate spot matching criteria");
    }

    // 6. Submit Corporate RFP Quote Request
    console.log("\n6️⃣ Organizer Submits Corporate RFP Quote Request (25 Attendees)...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 5);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const bookingResult = await corporateService.submitCorporateBookingRequest({
      userId: organizer._id,
      spotId: spot._id,
      experienceId: experience._id,
      date: dateStr,
      startTime: "10:00",
      durationHours: 6,
      corporateDetails: {
        companyName: "TechCorp Global Innovations",
        gstin: "07AAAAA0000A1Z5",
        contactPerson: "Vikram Malhotra",
        contactEmail: "vikram@techcorp.io",
        contactPhone: "+91 98765 43210",
        eventType: "small_retreat",
        attendeesCount: 25,
        eventObjectives: "Annual H2 strategic roadmap alignment and cross-functional team building.",
        requiredAmenities: ["High-Speed Wi-Fi", "Projector & Screen", "Catering & Dining"],
        cateringNeeded: true,
        cateringNotes: "Buffet lunch for 25 people with vegetarian and vegan options.",
        avTechNeeded: true,
        estimatedBudget: 35000,
        purchaseOrderNumber: "PO-2026-TECHCORP-089",
      },
      requiresCustomQuote: true,
    });

    const quoteReqBooking = bookingResult.booking;
    console.log("   ✅ Corporate Request Created!");
    console.log("   Booking ID:", quoteReqBooking._id);
    console.log("   Status:", quoteReqBooking.status, "(Expected: quote_requested)");
    console.log("   Attendees:", quoteReqBooking.corporateDetails.attendeesCount);
    console.log("   Workflow:", bookingResult.workflow, "(Expected: quote_requested)");

    if (quoteReqBooking.status !== "quote_requested") {
      throw new Error(`Expected status quote_requested, got ${quoteReqBooking.status}`);
    }

    // 7. Host Reviews and Provides Custom Quote
    console.log("\n7️⃣ Host Meera Reviews Request and Provides Custom Quote...");
    const quotedBooking = await corporateService.provideHostQuote({
      hostUserId: host._id,
      bookingId: quoteReqBooking._id,
      quotedAmount: 32000,
      quotedPerHeadPrice: 1280,
      quoteNotes: "Exclusive estate reservation with dedicated Wi-Fi network, 25-person buffet lunch, projector setup, and bonfire.",
      quoteExpiresInDays: 7,
      termsAndInclusions: [
        "Exclusive access to 3-acre private pine orchard",
        "High-Speed 300 Mbps dedicated Wi-Fi",
        "120-inch projector with audio technician on-site",
        "Three-course hot buffet lunch & high tea",
        "Evening 2-hour bonfire with seating",
      ],
    });

    console.log("   ✅ Host Quote Provided!");
    console.log("   Status:", quotedBooking.status, "(Expected: quote_provided)");
    console.log("   Quoted Amount: ₹" + quotedBooking.totalPrice, "(Expected: ₹32,000)");
    console.log("   Quoted Per Head: ₹" + quotedBooking.corporateDetails.quoteDetails.quotedPerHeadPrice);
    console.log("   Inclusions count:", quotedBooking.corporateDetails.quoteDetails.termsAndInclusions.length);

    if (quotedBooking.status !== "quote_provided" || quotedBooking.totalPrice !== 32000) {
      throw new Error("Quote update failed");
    }

    // 8. Fraud / Security Test: Unauthorized Bad Actor attempts to accept quote
    console.log("\n8️⃣ Testing Security: Unauthorized User Attempts to Accept Quote...");
    let badActorBlocked = false;
    try {
      await corporateService.acceptHostQuote({
        userId: badActor._id,
        bookingId: quoteReqBooking._id,
      });
    } catch (err) {
      badActorBlocked = true;
      console.log("   ✅ Unauthorized user correctly blocked:", err.message);
    }
    if (!badActorBlocked) {
      throw new Error("Security failure: unauthorized user was able to accept quote!");
    }

    // 9. Legitimate Corporate Organizer Accepts Quote
    console.log("\n9️⃣ Legitimate Organizer Vikram Accepts Quote & Confirms Reservation...");
    const confirmedBooking = await corporateService.acceptHostQuote({
      userId: organizer._id,
      bookingId: quoteReqBooking._id,
    });

    console.log("   ✅ Quote Accepted & Reservation Confirmed!");
    console.log("   Booking Status:", confirmedBooking.status, "(Expected: confirmed)");
    console.log("   Payment Status:", confirmedBooking.paymentStatus, "(Expected: paid)");
    console.log("   Total Billed: ₹" + confirmedBooking.amountPaid);

    if (confirmedBooking.status !== "confirmed" || confirmedBooking.paymentStatus !== "paid") {
      throw new Error("Quote acceptance failed to confirm booking");
    }

    // Verify slot lock was acquired
    const locks = await availabilityService.checkSlotAvailability({
      spotId: spot._id,
      date: dateStr,
      startTime: "10:00",
      endTime: "16:00",
      durationHours: 6,
    });
    console.log("   ✅ Overlapping slot now correctly unavailable:", !locks.available, "(Expected: true)");
    if (locks.available) {
      throw new Error("Slot lock was not properly acquired on quote acceptance");
    }

    // 10. Test Get Landowner Corporate Requests & Organizer Bookings
    console.log("\n🔟 Testing Host and Organizer Listing Endpoints...");
    const hostRequests = await corporateService.getHostCorporateRequests(host._id);
    console.log("   ✅ Host corporate requests count:", hostRequests.length, "(Expected: >= 1)");

    const organizerBookings = await corporateService.getMyCorporateBookings(organizer._id);
    console.log("   ✅ Organizer corporate bookings count:", organizerBookings.length, "(Expected: >= 1)");

    console.log("\n=================================================");
    console.log("🎉 ALL FEATURE 10 B2B CORPORATE TESTS PASSED!");
    console.log("=================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
