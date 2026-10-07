const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Spot = require("../models/Spot");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const realHimachalSpots = [
  {
    title: "Solang Alpine Meadow & Pine Camping Plot",
    description:
      "A pristine open grassland plot surrounded by tall deodar pines and towering snow-capped peaks in Solang Valley. Completely untouched by commercial concrete, this natural meadow is perfect for daytime picnics, yoga retreats, pitch-your-own-tent camping, and panoramic Himalayan photography.",
    location: "Solang Valley, Manali, Himachal Pradesh",
    price: 1200,
    category: "Grassland Plot",
    amenities: [
      { name: "Bonfire & Dry Pine Wood", price: 350 },
      { name: "4-Person Waterproof Alpine Tent", price: 500 },
      { name: "Solar Power Station for Charging", price: 150 },
      { name: "Fresh Mountain Spring Water", price: 0 },
      { name: "On-Site Caretaker Assistance", price: 0 },
    ],
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Old Manali Ridge Sunset Date Night Setup",
    description:
      "A secluded hilltop open plot specially curated with fairy lights, bohemian woven rugs, low wooden tables, floor cushions, and an unobstructed 360-degree sunset view of the Manali valley. Ideal for romantic candlelit evenings, anniversaries, and stargazing under the clear Himalayan night sky.",
    location: "Old Manali Hilltop, Manali, Himachal Pradesh",
    price: 1500,
    category: "Date Night Setup",
    amenities: [
      { name: "Fairy Lights & Bohemian Decor Kit", price: 400 },
      { name: "Private Candlelit Bonfire Setup", price: 300 },
      { name: "Portable Bluetooth Acoustic Speaker", price: 100 },
      { name: "Stargazing Astronomy Telescope", price: 250 },
      { name: "Warm Yak-Wool Blankets & Throws", price: 0 },
    ],
    image:
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Naggar Cedar Wood Hillside Hut & Orchard Plot",
    description:
      "A charming, rustic Himachali timber and stone wooden cabin situated inside an organic apple orchard overlooking the Beas river basin. Features a vintage wood stove, wide verandah, and total immersion in the peaceful sounds of pine breezes and mountain birds.",
    location: "Naggar, Kullu Valley, Himachal Pradesh",
    price: 1800,
    category: "Hillside Hut",
    amenities: [
      { name: "Cast Iron Fireplace & Firewood", price: 300 },
      { name: "High-Speed Starlink Satellite WiFi", price: 150 },
      { name: "Fresh Organic Apple Basket", price: 200 },
      { name: "Orchard Hammock & Tea Kettle", price: 0 },
      { name: "Dedicated Kitchenette Access", price: 0 },
    ],
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Jibhi Deodar Forest Gathering Lawn & BBQ",
    description:
      "Sprawling private open field adjacent to a gentle mountain stream in Jibhi. Designed for friends and family get-togethers, acoustic jamming, outdoor barbecue parties, and intimate open-air gatherings surrounded by deep cedar woods.",
    location: "Jibhi, Banjar Valley, Himachal Pradesh",
    price: 2200,
    category: "Get Together Setup",
    amenities: [
      { name: "Charcoal Barbecue Grill Station", price: 600 },
      { name: "Campfire Circle with Wooden Log Benches", price: 400 },
      { name: "Outdoor Movie Projector & Screen", price: 500 },
      { name: "Badminton & Lawn Games Set", price: 0 },
      { name: "Dedicated Barbecue Assistant", price: 300 },
    ],
    image:
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Dharamkot Rustic Mountain Cafe Courtyard & Lawn",
    description:
      "An open-air mountain cafe terrace and grassy clearing nestled on the Dharamkot ridge above McLeodganj. Handcrafted wooden benches, prayer flags, views of the Kangra Valley, and a peaceful ambiance perfect for creator meetups, acoustic sessions, and sunset chai.",
    location: "Dharamkot, McLeodganj, Himachal Pradesh",
    price: 1400,
    category: "Mountain Cafe",
    amenities: [
      { name: "Artisan Pour-Over Coffee Station", price: 300 },
      { name: "High-Speed Fiber WiFi", price: 100 },
      { name: "Himalayan Herbal Chai & Snack Platter", price: 250 },
      { name: "Acoustic Guitar & Djembe Drum", price: 0 },
      { name: "Low Seating Tibetan Floor Mats", price: 0 },
    ],
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Parvati Riverside Wild Grassland Meadow",
    description:
      "A raw, wide-open grassy riverbank plot directly bordering the turquoise rushing waters of the Parvati River in Kasol. No concrete or buildings — just natural mountain stones, lush green grass, and towering Himalayan pine trees.",
    location: "Kasol, Parvati Valley, Himachal Pradesh",
    price: 1600,
    category: "Riverside Meadow",
    amenities: [
      { name: "Riverside Stone Firepit", price: 350 },
      { name: "Trout Fishing Rod & Tackle Set", price: 200 },
      { name: "Waterproof Ground Camping Tarps", price: 100 },
      { name: "Foldable Camping Chairs & Table", price: 150 },
      { name: "Direct River Access & Clean Spring", price: 0 },
    ],
    image:
      "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Vashisht Waterfall-View Agricultural Terraced Plot",
    description:
      "Authentic multi-level green mountain terrace plot facing the majestic Jogini waterfalls across the valley. Abundant wild mountain flowers, cool mountain breezes, and completely open space for meditation, small acoustic gatherings, and day picnics.",
    location: "Vashisht, Upper Manali, Himachal Pradesh",
    price: 1100,
    category: "Empty Plot",
    amenities: [
      { name: "Canvas Sun Canopy & Mattresses", price: 250 },
      { name: "Terrace Bonfire Pit with Kindling", price: 200 },
      { name: "Local Village Cultural Guide", price: 400 },
      { name: "Fresh Natural Well Water", price: 0 },
    ],
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Tirthan River Handcrafted Wooden Cabin & Orchard Lawn",
    description:
      "Hand-hewn cedar wood hut nestled at the edge of Great Himalayan National Park buffer zone. Comes with an open grassy apple lawn, stone barbecue pit, and soothing sounds of the Tirthan River flowing nearby.",
    location: "Gushaini, Tirthan Valley, Himachal Pradesh",
    price: 1950,
    category: "Hillside Hut",
    amenities: [
      { name: "Cedar Firepit & Firewood Log Bundle", price: 300 },
      { name: "Fresh Trout Barbecue Marinade & Grill", price: 700 },
      { name: "Birdwatching Binoculars & Field Guide", price: 150 },
      { name: "Solar Lanterns & Fairy Light Ambience", price: 100 },
      { name: "Riverside Hammock Stand", price: 0 },
    ],
    image:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
  },
];

async function seedDatabase() {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";

    const isProduction = process.env.NODE_ENV === "production";
    const isRemoteDb =
      mongoUri.includes("mongodb+srv://") ||
      mongoUri.includes(".mongodb.net");
    const confirmFlag =
      process.env.SEED_CONFIRM === "true" ||
      process.argv.includes("--confirm");

    if ((isProduction || isRemoteDb) && !confirmFlag) {
      console.error(
        "\n🛑 SAFETY BLOCKED: Refusing to seed spots into a remote or production database!"
      );
      console.error("To proceed, set SEED_CONFIRM=true or pass --confirm.\n");
      process.exit(1);
    }

    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);

    console.log("Connected to database. Setting up demo host user...");

    // Find or create a verified demo host
    let host = await User.findOne({ email: "host@thikana.com" });
    if (!host) {
      const salt = await bcrypt.genSalt(10);
      const hostPassword = process.env.SEED_HOST_PASSWORD || process.env.SEED_ADMIN_PASSWORD || "Host@Thikana123!";
      const hashedPassword = await bcrypt.hash(hostPassword, salt);
      host = await User.create({
        name: "Himachal Stays Co.",
        email: "host@thikana.com",
        password: hashedPassword,
        role: "owner",
      });
      console.log("Created verified demo host:", host.email);
    }

    // Clear old spots and seed real authentic Himachal plots
    await Spot.deleteMany({});
    console.log("Cleared existing spots.");

    const spotsToInsert = realHimachalSpots.map((spot) => ({
      ...spot,
      owner: host._id,
    }));

    const inserted = await Spot.insertMany(spotsToInsert);
    console.log(`✅ Successfully seeded ${inserted.length} real Himachal plots & setups!`);

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seedDatabase();
