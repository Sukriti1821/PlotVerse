require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Spot = require("../models/Spot");
const User = require("../models/User");
const Experience = require("../models/Experience");

async function seedExperiences() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding experiences...");

    // Find any existing spots
    const spots = await Spot.find().populate("owner");
    if (spots.length === 0) {
      console.log("No spots found in database. Run spot seeder first.");
      process.exit(1);
    }

    const hostUser = spots[0].owner || (await User.findOne({ role: "owner" })) || (await User.findOne());
    if (!hostUser) {
      console.log("No host user found.");
      process.exit(1);
    }

    // Pick spots for experiences
    const spot1 = spots[0]; // mountain / valley
    const spot2 = spots[1] || spots[0];
    const spot3 = spots[2] || spots[0];
    const spot4 = spots[3] || spots[0];

    // Clear old experiences
    await Experience.deleteMany({});
    console.log("Cleared existing experiences.");

    const experiencesToCreate = [
      {
        title: "Mountain Date",
        category: "Romantic Date",
        description:
          "An intimate, candlelit mountain retreat designed for couples. Enjoy panoramic pine valley vistas, private seating surrounded by fairy lights, cozy campfire warmth, and a curated outdoor dinner setup with soft background acoustic music.",
        spot: spot1._id,
        owner: spot1.owner?._id || hostUser._id,
        durationHours: 4,
        price: 2999,
        maxGuests: 2,
        includedAmenities: [
          { name: "Bonfire Setup & Firewood", description: "Crackling firewood logs with fire tender" },
          { name: "Romantic Ambient Decoration", description: "Fairy lights, tea candles & rustic table setting" },
          { name: "Outdoor Dinner Setup", description: "Curated dinner table with tableware & glassware" },
          { name: "Acoustic Bluetooth Music", description: "Portable Marshall speaker with curated chill playlists" },
        ],
        optionalAddOns: [
          { name: "Gourmet Fondue & Strawberries", price: 650, description: "Warm chocolate fondue with seasonal fruit skewers" },
          { name: "Fresh Rose Bouquet", price: 450, description: "Hand-picked red & blush alpine roses" },
          { name: "Private Photographer (30 mins)", price: 1500, description: "High-resolution candid photoshoot" },
        ],
        image:
          "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
        images: [
          "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        ],
        isFeatured: true,
        rating: 4.95,
        reviewsCount: 28,
        isActive: true,
      },
      {
        title: "Friends' Escape",
        category: "Group Gathering",
        description:
          "The ultimate half-day private escape for your squad! Gather around a roaring bonfire with full BBQ grill equipment, spacious lawn lounge seating, ambient music, and outdoor yard games overlooking scenic mountain ridges.",
        spot: spot2._id,
        owner: spot2.owner?._id || hostUser._id,
        durationHours: 6,
        price: 3999,
        maxGuests: 10,
        includedAmenities: [
          { name: "Bonfire Pit & Firewood", description: "All-evening bonfire with unlimited wood supplies" },
          { name: "Charcoal BBQ Grill Setup", description: "Heavy duty grill rack, skewers, charcoal & tongs" },
          { name: "Spacious Group Seating", description: "Rustic log benches, picnic tables and bean bags" },
          { name: "Music Sound System", description: "High-power outdoor waterproof party speaker" },
        ],
        optionalAddOns: [
          { name: "Marinated BBQ Skewer Platter", price: 1200, description: "Paneer, bell peppers, corn & herb skewers ready to grill" },
          { name: "Campfire Guitarist (1 Hour)", price: 1800, description: "Live unplugged indie folk & rock session" },
          { name: "Cornhole & Outdoor Yard Games", price: 400, description: "Cornhole boards, frisbees, and badmintons" },
        ],
        image:
          "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=1200&q=80",
        images: [
          "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
        ],
        isFeatured: true,
        rating: 4.91,
        reviewsCount: 42,
        isActive: true,
      },
      {
        title: "Alpine Stargazing Night",
        category: "Stargazing Retreat",
        description:
          "Escape light pollution under crystal-clear high-altitude skies. Equipped with an astronomical reflector telescope, insulated waterproof dome tent, reclining stargazing deck loungers, and warm herbal tea.",
        spot: spot3._id,
        owner: spot3.owner?._id || hostUser._id,
        durationHours: 5,
        price: 3499,
        maxGuests: 4,
        includedAmenities: [
          { name: "Celestron Astronomical Telescope", description: "Deep sky reflector telescope with laser finder" },
          { name: "Insulated Dome Tent", description: "Weatherproof 4-person tent with memory foam mattresses" },
          { name: "Campfire & Marshmallows", description: "Toasting sticks and marshmallow supplies" },
          { name: "Hot Cocoa & Tea Thermos", description: "Warm spiced drinks and cookies" },
        ],
        optionalAddOns: [
          { name: "Sub-Zero Sleeping Bags (Set of 2)", price: 500, description: "Extreme cold rated sleeping bags" },
          { name: "Astrophotography Phone Mount", price: 300, description: "Capture lunar craters & nebulae directly on phone" },
        ],
        image:
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
        images: [
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
        ],
        isFeatured: true,
        rating: 4.98,
        reviewsCount: 35,
        isActive: true,
      },
      {
        title: "Riverside Sunset Campfire",
        category: "Sunset Campfire",
        description:
          "Unwind by the soothing rush of mountain waters as the sun dips behind the pine ridge. Features private riverside deck access, stone firepit, solar lanterns, and hammock loungers.",
        spot: spot4._id,
        owner: spot4.owner?._id || hostUser._id,
        durationHours: 4,
        price: 2499,
        maxGuests: 6,
        includedAmenities: [
          { name: "Riverside Firepit Setup", description: "Stone firepit with pine firewood and firestarter" },
          { name: "Hammock & Deck Loungers", description: "Canvas hammocks suspended between pine trees" },
          { name: "Warm Solar Lanterns", description: "Gentle ambient pathway lighting" },
        ],
        optionalAddOns: [
          { name: "Riverside Maggi & Tea Kit", price: 350, description: "Stove, kettle, mountain tea leaves & noodle cups" },
          { name: "Kayaking Gear (2 Pax)", price: 900, description: "Tandem kayak with life jackets and paddles" },
        ],
        image:
          "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
        images: [
          "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
        ],
        isFeatured: false,
        rating: 4.88,
        reviewsCount: 19,
        isActive: true,
      },
    ];

    const created = await Experience.insertMany(experiencesToCreate);
    console.log(`Successfully seeded ${created.length} curated experiences!`);
    created.forEach((e) => console.log(`- ${e.title} (${e.durationHours}h) -> ₹${e.price}`));

    process.exit(0);
  } catch (err) {
    console.error("Error seeding experiences:", err);
    process.exit(1);
  }
}

seedExperiences();
