/**
 * Thikana — Historical Analytics Seed Script
 * 
 * Populates host Aarav Sharma (aarav.host@thikana.com) with 28 realistic bookings
 * spanning the last 90 days, varied hours, amenities (with Bonfire at ~72%),
 * experiences ("Mountain Date", "Friends' Escape"), and baseline views/clicks.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Spot = require("../models/Spot");
const Booking = require("../models/Booking");
const Experience = require("../models/Experience");

async function seedAnalyticsData() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
  console.log(`Connecting to MongoDB: ${mongoUri}...`);
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  // 1. Find Aarav Sharma
  const host = await User.findOne({ email: "aarav.host@thikana.com" });
  if (!host) {
    console.error("❌ Host aarav.host@thikana.com not found. Please run main seed first.");
    process.exit(1);
  }

  // 2. Find Aarav's spots
  const hostSpots = await Spot.find({ owner: host._id });
  if (hostSpots.length === 0) {
    console.error("❌ No spots found for host Aarav. Please run main seed first.");
    process.exit(1);
  }
  console.log(`Found ${hostSpots.length} spots for host ${host.name}`);

  // Update spots with realistic views and clicks
  const viewCounts = [340, 265, 190, 145, 95];
  for (let i = 0; i < hostSpots.length; i++) {
    const s = hostSpots[i];
    s.views = viewCounts[i] || 150;
    s.clicks = Math.round(s.views * 0.28);
    await s.save();
  }
  console.log("✅ Updated spots with baseline views and clicks.");

  // 3. Find customers
  const customers = await User.find({ role: "customer" });
  if (customers.length === 0) {
    console.error("❌ No customers found.");
    process.exit(1);
  }

  // 4. Find experiences hosted on Aarav's spots
  const experiences = await Experience.find({ spot: { $in: hostSpots.map((s) => s._id) } });
  console.log(`Found ${experiences.length} experiences for Aarav's spots.`);

  // 5. Clear prior seed bookings for Aarav's spots to prevent duplication
  await Booking.deleteMany({ spot: { $in: hostSpots.map((s) => s._id) } });
  console.log("🧹 Cleared old bookings for Aarav's spots.");

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Curated amenity items
  const bonfireAmenity = { name: "Bonfire & Firewood", price: 400 };
  const bbqAmenity = { name: "BBQ Grill Station", price: 600 };
  const telescopeAmenity = { name: "Stargazing Telescope", price: 500 };
  const seatingAmenity = { name: "Luxury Ground Seating", price: 300 };
  const musicAmenity = { name: "Acoustic Speaker Setup", price: 250 };

  const sampleBookings = [];

  // Define 28 distinct bookings over the past 90 days + 3 upcoming
  const bookingConfigs = [
    // --- LAST 7 DAYS (6 bookings) ---
    {
      daysAgo: 1,
      startTime: "16:00",
      duration: 4,
      amenities: [bonfireAmenity, bbqAmenity],
      status: "confirmed",
      expIdx: 0,
    },
    {
      daysAgo: 2,
      startTime: "17:00",
      duration: 3,
      amenities: [bonfireAmenity, seatingAmenity],
      status: "confirmed",
      expIdx: null,
    },
    {
      daysAgo: 3,
      startTime: "14:00",
      duration: 4,
      amenities: [bonfireAmenity, telescopeAmenity],
      status: "confirmed",
      expIdx: 1,
    },
    {
      daysAgo: 4,
      startTime: "16:00",
      duration: 4,
      amenities: [bonfireAmenity, musicAmenity],
      status: "confirmed",
      expIdx: 0,
    },
    {
      daysAgo: 5,
      startTime: "11:00",
      duration: 3,
      amenities: [seatingAmenity],
      status: "confirmed",
      expIdx: null,
    },
    {
      daysAgo: 6,
      startTime: "18:00",
      duration: 4,
      amenities: [bonfireAmenity, telescopeAmenity, bbqAmenity],
      status: "confirmed",
      expIdx: 2,
    },

    // --- 8 TO 30 DAYS AGO (14 bookings) ---
    {
      daysAgo: 8,
      startTime: "16:00",
      duration: 4,
      amenities: [bonfireAmenity, seatingAmenity],
      status: "confirmed",
      expIdx: 0,
    },
    {
      daysAgo: 10,
      startTime: "15:00",
      duration: 5,
      amenities: [bonfireAmenity, bbqAmenity],
      status: "confirmed",
      expIdx: 1,
    },
    {
      daysAgo: 11,
      startTime: "17:00",
      duration: 4,
      amenities: [bonfireAmenity],
      status: "confirmed",
      expIdx: null,
    },
    {
      daysAgo: 13,
      startTime: "12:00",
      duration: 3,
      amenities: [seatingAmenity],
      status: "cancelled", // 1 cancellation
      expIdx: null,
    },
    {
      daysAgo: 14,
      startTime: "16:00",
      duration: 4,
      amenities: [bonfireAmenity, bbqAmenity, musicAmenity],
      status: "confirmed",
      expIdx: 0,
    },
    {
      daysAgo: 16,
      startTime: "18:00",
      duration: 4,
      amenities: [bonfireAmenity, telescopeAmenity],
      status: "confirmed",
      expIdx: 2,
    },
    {
      daysAgo: 18,
      startTime: "14:00",
      duration: 4,
      amenities: [bonfireAmenity, seatingAmenity],
      status: "confirmed",
      expIdx: null,
    },
    {
      daysAgo: 20,
      startTime: "16:00",
      duration: 5,
      amenities: [bonfireAmenity, bbqAmenity],
      status: "confirmed",
      expIdx: 1,
    },
    {
      daysAgo: 21,
      startTime: "17:00",
      duration: 3,
      amenities: [bonfireAmenity],
      status: "confirmed",
      expIdx: 0,
    },
    {
      daysAgo: 23,
      startTime: "10:00",
      duration: 4,
      amenities: [seatingAmenity, musicAmenity],
      status: "confirmed",
      expIdx: null,
    },
    {
      daysAgo: 25,
      startTime: "16:00",
      duration: 4,
      amenities: [bonfireAmenity, bbqAmenity],
      status: "confirmed",
      expIdx: 0,
    },
    {
      daysAgo: 27,
      startTime: "15:00",
      duration: 4,
      amenities: [bonfireAmenity, telescopeAmenity],
      status: "confirmed",
      expIdx: 2,
    },
    {
      daysAgo: 28,
      startTime: "17:00",
      duration: 4,
      amenities: [bonfireAmenity],
      status: "confirmed",
      expIdx: null,
    },
    {
      daysAgo: 29,
      startTime: "16:00",
      duration: 4,
      amenities: [bonfireAmenity, seatingAmenity],
      status: "confirmed",
      expIdx: 1,
    },

    // --- 31 TO 90 DAYS AGO (8 bookings) ---
    {
      daysAgo: 35,
      startTime: "16:00",
      duration: 4,
      amenities: [bonfireAmenity, bbqAmenity],
      status: "confirmed",
      expIdx: 0,
    },
    {
      daysAgo: 42,
      startTime: "17:00",
      duration: 4,
      amenities: [bonfireAmenity],
      status: "confirmed",
      expIdx: null,
    },
    {
      daysAgo: 48,
      startTime: "15:00",
      duration: 5,
      amenities: [bonfireAmenity, bbqAmenity, musicAmenity],
      status: "confirmed",
      expIdx: 1,
    },
    {
      daysAgo: 55,
      startTime: "18:00",
      duration: 4,
      amenities: [bonfireAmenity, telescopeAmenity],
      status: "confirmed",
      expIdx: 2,
    },
    {
      daysAgo: 63,
      startTime: "14:00",
      duration: 4,
      amenities: [seatingAmenity],
      status: "confirmed",
      expIdx: null,
    },
    {
      daysAgo: 70,
      startTime: "16:00",
      duration: 4,
      amenities: [bonfireAmenity, seatingAmenity],
      status: "confirmed",
      expIdx: 0,
    },
    {
      daysAgo: 77,
      startTime: "16:00",
      duration: 4,
      amenities: [bonfireAmenity, bbqAmenity],
      status: "confirmed",
      expIdx: 1,
    },
    {
      daysAgo: 85,
      startTime: "17:00",
      duration: 3,
      amenities: [bonfireAmenity],
      status: "confirmed",
      expIdx: null,
    },

    // --- UPCOMING (3 bookings) ---
    {
      daysAgo: -2, // 2 days in future
      startTime: "16:00",
      duration: 4,
      amenities: [bonfireAmenity, bbqAmenity],
      status: "confirmed",
      expIdx: 0,
    },
    {
      daysAgo: -4, // 4 days in future
      startTime: "17:00",
      duration: 4,
      amenities: [bonfireAmenity, telescopeAmenity],
      status: "confirmed",
      expIdx: 2,
    },
    {
      daysAgo: -6, // 6 days in future
      startTime: "14:00",
      duration: 3,
      amenities: [seatingAmenity],
      status: "approved", // approved awaiting payment
      expIdx: null,
    },
  ];

  for (let i = 0; i < bookingConfigs.length; i++) {
    const cfg = bookingConfigs[i];
    const spot = hostSpots[i % hostSpots.length];
    const cust = customers[i % customers.length];
    const bookingDate = new Date(now - cfg.daysAgo * dayMs);

    const startH = parseInt(cfg.startTime.split(":")[0], 10);
    const endH = startH + cfg.duration;
    const endTime = `${String(endH).padStart(2, "0")}:00`;

    let exp = null;
    let expTitle = "";
    let basePrice = (spot.price || 500) * cfg.duration;

    if (cfg.expIdx !== null && experiences[cfg.expIdx]) {
      exp = experiences[cfg.expIdx];
      expTitle = exp.title;
      basePrice = exp.price || 2999;
    }

    const amenityTotal = cfg.amenities.reduce((sum, a) => sum + (a.price || 0), 0);
    const totalPrice = basePrice + amenityTotal;

    sampleBookings.push({
      user: cust._id,
      spot: spot._id,
      date: bookingDate,
      startTime: cfg.startTime,
      endTime,
      durationHours: cfg.duration,
      guests: 2 + (i % 5),
      selectedAmenities: cfg.amenities,
      experience: exp ? exp._id : null,
      experienceTitle: expTitle,
      totalPrice,
      status: cfg.status,
      paymentStatus: cfg.status === "confirmed" ? "paid" : "unpaid",
      amountPaid: cfg.status === "confirmed" ? totalPrice : 0,
    });
  }

  const inserted = await Booking.insertMany(sampleBookings);
  console.log(`✅ Seeded ${inserted.length} realistic historical bookings for host ${host.name}!`);

  const bonfireCount = sampleBookings.filter((b) =>
    b.selectedAmenities.some((a) => a.name.includes("Bonfire"))
  ).length;
  console.log(
    `🔥 Bonfire was selected in ${bonfireCount} of ${sampleBookings.length} bookings (${Math.round(
      (bonfireCount / sampleBookings.length) * 100
    )}%).`
  );

  await mongoose.disconnect();
  console.log("Done.");
}

seedAnalyticsData().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
