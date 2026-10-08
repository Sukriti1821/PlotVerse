/**
 * Thikana — Database Seed Script for Local Testing
 *
 * Populates MongoDB with realistic sample data (Users, Spots, Bookings)
 * across Himachal Pradesh, Uttarakhand, and Jammu & Kashmir.
 *
 * ALL SEEDED USERS SHARE THE TEST PASSWORD:
 * Password: "Test@123"
 *
 * DO NOT RUN AGAINST A PRODUCTION DATABASE.
 * Usage:
 *   npm run seed --prefix backend
 *   (or `npm run seed` from project root)
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const Spot = require("./models/Spot");
const Experience = require("./models/Experience");
const Booking = require("./models/Booking");
const Restaurant = require("./models/Restaurant");
const Testimonial = require("./models/Testimonial");
const crypto = require("crypto");
const Settings = require("./models/Settings");

async function seedDatabase() {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";

  const isProduction = process.env.NODE_ENV === "production";
  const isRemoteDb =
    mongoUri.includes("mongodb+srv") ||
    mongoUri.includes(".mongodb.net") ||
    (!mongoUri.includes("127.0.0.1") && !mongoUri.includes("localhost"));

  // Safeguard: Require explicit confirmation flag when seeding against production or remote database
  const confirmed = process.env.SEED_CONFIRM === "true" || process.argv.includes("--confirm");

  if ((isProduction || isRemoteDb) && !confirmed) {
    console.error("\n🛑 DANGER: Attempted to run database seed on a remote or production database!");
    console.error(`   Target URI: ${mongoUri.replace(/:([^:@]+)@/, ":****@")}`);
    console.error("   To prevent accidental loss of live data, seeding requires SEED_CONFIRM=true.");
    console.error("   Command: SEED_CONFIRM=true node seed.js (or node seed.js --confirm)\n");
    process.exit(1);
  }

  // Read seeded user password from env vars (never hardcoded weak passwords for production)
  let testPassword = process.env.SEED_ADMIN_PASSWORD || process.env.SEED_TEST_PASSWORD;
  if (!testPassword) {
    if (isProduction || isRemoteDb) {
      console.error("\n🛑 Error: SEED_ADMIN_PASSWORD must be configured in environment variables for production seeding.");
      process.exit(1);
    }
    testPassword = "Password@123";
    console.warn(`\nℹ️ Notice: Using standard local development password: ${testPassword}`);
  }

  try {
    console.log("--------------------------------------------------");
    console.log("🌿 Thikana — Seeding Database for Testing");
    console.log("--------------------------------------------------");
    console.log(`Connecting to MongoDB: ${mongoUri.replace(/:([^:@]+)@/, ":****@")}`);

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected.");

    // 1. Clear existing development data
    console.log("\n🧹 Clearing existing collections...");
    await Booking.deleteMany({});
    await Experience.deleteMany({});
    await Spot.deleteMany({});
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Testimonial.deleteMany({});
    await Settings.deleteMany({});
    console.log("✅ Collections cleared (Users, Spots, Experiences, Bookings, Restaurants, Testimonials, Settings).");

    // 2. Hash test password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);

    // 3. Seed Users (Owners, Customers & Admin)
    console.log("\n👤 Creating sample users...");
    const usersData = [
      // Platform Administrator
      {
        name: "Thikana Admin",
        email: "admin@thikana.com",
        password: hashedPassword,
        role: "admin",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
      },
      // Owners / Hosts
      {
        name: "Aarav Sharma",
        email: "aarav.host@thikana.com",
        password: hashedPassword,
        role: "owner",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      },
      {
        name: "Meera Joshi",
        email: "meera.stays@thikana.com",
        password: hashedPassword,
        role: "owner",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      },
      {
        name: "Vikram Rawat",
        email: "vikram.plots@thikana.com",
        password: hashedPassword,
        role: "owner",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      },
      // Customers / Guests
      {
        name: "Rohan Kapoor",
        email: "rohan.travel@thikana.com",
        password: hashedPassword,
        role: "customer",
        avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80",
      },
      {
        name: "Ananya Iyer",
        email: "ananya.art@thikana.com",
        password: hashedPassword,
        role: "customer",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      },
      {
        name: "Siddharth Malhotra",
        email: "sid.wanderer@thikana.com",
        password: hashedPassword,
        role: "customer",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
      },
    ];

    const seededUsers = await User.insertMany(usersData);
    const [adminUser, owner1, owner2, owner3, customer1, customer2, customer3] = seededUsers;
    console.log(`✅ Created ${seededUsers.length} users (1 admin, 3 owners, 3 customers).`);

    // 3b. Seed Platform Settings
    console.log("\n⚙️ Initializing platform settings...");
    await Settings.create({
      defaultCommissionRate: 10,
      platformName: "Thikana",
      requireOwnerApproval: false,
      lastUpdatedBy: adminUser._id,
    });
    console.log("✅ Platform settings initialized with 10% default commission rate.");

    // 4. Seed Spots across Himachal Pradesh, Uttarakhand, and Jammu & Kashmir (6 per category)
    console.log("\n🏞️ Creating scenic spots & plots across all 8 categories (6 per category)...");
    const getAllCategorySpots = require("./seed/allCategorySpots");
    const spotsData = getAllCategorySpots(owner1, owner2, owner3);

    const seededSpots = await Spot.insertMany(spotsData);
    console.log(`✅ Created ${seededSpots.length} spots across 8 categories (6 per category).`);

    // 4b. Seed Curated Outdoor Experience Packages & Corporate Retreats
    console.log("\n✨ Creating curated outdoor experience packages & corporate retreats...");
    const solangPlot = seededSpots.find((s) => s.title.includes("Solang")) || seededSpots[0];
    const datePlot = seededSpots.find((s) => s.category === "Date Night Setup") || seededSpots[1];
    const choptaPlot = seededSpots.find((s) => s.title.includes("Chopta")) || seededSpots[2];
    const campfirePlot = seededSpots.find((s) => s.category === "Campfire Stays") || seededSpots[3];
    const dharamkotPlot = seededSpots.find((s) => s.title.includes("Dharamkot")) || seededSpots[4];
    const bhimtalPlot = seededSpots.find((s) => s.title.includes("Bhimtal")) || seededSpots[5];

    const experiencesData = [
      {
        title: "Candlelit Pine Sunset Dinner & Bonfire",
        description: "Private romantic date night setup on an exclusive forest ridge overlooking Old Manali valley. Includes candlelit table decor, hot tea/refreshments, crackling bonfire, and private ambient fairy lighting.",
        spot: datePlot._id,
        owner: datePlot.owner || owner1._id,
        category: "Romantic Date",
        durationHours: 3,
        price: 3200,
        rating: 4.9,
        reviewsCount: 18,
        image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
        includedAmenities: [
          { name: "Candlelit Table & Floor Rugs" },
          { name: "Crackling Bonfire & Firewood" },
          { name: "Hot Himalayan Herbal Tea" },
        ],
        optionalAddOns: [
          { name: "Fresh Flower Bouquet", price: 600, description: "Locally sourced wild roses & mountain carnations" },
        ],
        isActive: true,
      },
      {
        title: "Himalayan High-Altitude Stargazing Night",
        description: "Guided deep-space stargazing session with an optical telescope atop Chopta's unpolluted alpine meadows. Observe Saturn's rings, lunar craters, and the radiant Milky Way arc in crystal-clear night skies.",
        spot: choptaPlot._id,
        owner: choptaPlot.owner || owner3._id,
        category: "Stargazing Retreat",
        durationHours: 4,
        price: 4200,
        rating: 5.0,
        reviewsCount: 24,
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
        includedAmenities: [
          { name: "Reflector Telescope & Star Chart" },
          { name: "Heavy Down Windbreaker Blankets" },
          { name: "Thermos Flask Kahwa Tea" },
        ],
        isActive: true,
      },
      {
        title: "Deodar Forest Campfire & Trout BBQ Grill",
        description: "Rustic twilight campfire package in Jibhi with private charcoal barbecue grill setup, wooden picnic benches, and riverside pine fragrance.",
        spot: campfirePlot._id,
        owner: campfirePlot.owner || owner2._id,
        category: "Sunset Campfire",
        durationHours: 4,
        price: 3800,
        rating: 4.8,
        reviewsCount: 15,
        image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
        includedAmenities: [
          { name: "Campfire Setup & Dried Pine Cones" },
          { name: "BBQ Grill & Skewers Kit" },
          { name: "Rustic Pine Log Seating" },
        ],
        isActive: true,
      },
      {
        title: "Alpine Pine Meadow Group Retreat & Camp",
        description: "Expansive day retreat for friends and families on Solang Valley's grassy terrain. Complete with two alpine waterproof tents, lawn games, acoustic guitar, and group campfire circle.",
        spot: solangPlot._id,
        owner: solangPlot.owner || owner1._id,
        category: "Friends' Escape",
        durationHours: 5,
        price: 5200,
        rating: 4.9,
        reviewsCount: 31,
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
        includedAmenities: [
          { name: "2 Alpine Waterproof Tents" },
          { name: "Group Seating & Floor Mattresses" },
          { name: "Frisbee & Badminton Gear" },
          { name: "Solar Power Hub" },
        ],
        isActive: true,
      },
      {
        title: "High-Altitude Yoga & Sound Bath Glade",
        description: "Mindfulness and breathwork session in an untouched pine clearing with singing bowls, organic herbal tea, and meditation mats surrounded by gentle mountain breezes.",
        spot: dharamkotPlot._id,
        owner: dharamkotPlot.owner || owner2._id,
        category: "Mountain Wellness",
        durationHours: 3,
        price: 2800,
        rating: 4.9,
        reviewsCount: 12,
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
        includedAmenities: [
          { name: "Eco Cotton Yoga Mats" },
          { name: "Tibetan Singing Bowls" },
          { name: "Mountain Herb Detox Infusion" },
        ],
        isActive: true,
      },
      {
        title: "Executive Wilderness Strategy Offsite",
        description: "High-speed Starlink connected mountain estate package with projector screen, whiteboard easel, ergonomic outdoor seating, and full day coffee/snack bar for executive leadership summits.",
        spot: solangPlot._id,
        owner: solangPlot.owner || owner1._id,
        category: "Friends' Escape",
        isCorporate: true,
        corporateType: "team_outing",
        durationHours: 6,
        price: 18000,
        rating: 5.0,
        reviewsCount: 9,
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
        includedAmenities: [
          { name: "High-speed Starlink Wi-Fi" },
          { name: "Outdoor 100-inch AV Screen" },
          { name: "Power Generator Backup" },
          { name: "Artisan Tea & Coffee Urns" },
        ],
        isActive: true,
      },
      {
        title: "Highland Leadership Offsite & Bonfire Forum",
        description: "Dedicated full-day mountain retreat for teams of up to 40 people. Features breakout lawn areas, catered buffet lunch setup, team-building obstacle spaces, and an evening campfire debrief.",
        spot: bhimtalPlot._id,
        owner: bhimtalPlot.owner || owner1._id,
        category: "Friends' Escape",
        isCorporate: true,
        corporateType: "offsite",
        durationHours: 8,
        price: 26000,
        rating: 4.9,
        reviewsCount: 14,
        image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
        includedAmenities: [
          { name: "Private Estate Exclusivity" },
          { name: "PA Audio & Wireless Mic" },
          { name: "Buffet Catering Canopy" },
          { name: "Evening Bonfire Forum" },
        ],
        isActive: true,
      },
    ];

    const seededExperiences = await Experience.insertMany(experiencesData);
    console.log(`✅ Created ${seededExperiences.length} curated experiences & corporate packages.`);

    // 5. Seed Local Restaurants & Cafes across regions
    console.log("\n🍽️ Creating local mountain restaurants & cafes...");
    const restaurantsData = [
      {
        name: "Old Manali Woodfire & Trout Kitchen",
        location: "Old Manali, Manali, Himachal Pradesh",
        region: "Himachal Pradesh",
        cuisine: "Himachali, Woodfired Pizzas & Continental",
        contact: {
          phone: "+91 98160 12345",
          email: "manali.trout@thikana.com",
          address: "Club House Road, Old Manali",
        },
        image:
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80",
        rating: 4.8,
        deliveryAvailable: true,
        menu: [
          {
            name: "Himalayan Trout Tandoori (Whole)",
            price: 450,
            description: "Fresh river trout marinated with mountain herbs and char-grilled.",
            isVeg: false,
            category: "Chef Specials",
          },
          {
            name: "Traditional Himachali Siddu with Ghee",
            price: 180,
            description: "Steamed wheat bread stuffed with spiced walnuts and poppy seeds.",
            isVeg: true,
            category: "Traditional",
          },
          {
            name: "Woodfired Four-Cheese & Basil Pizza",
            price: 380,
            description: "Crispy thin crust topped with local mountain mozzarella and fresh basil.",
            isVeg: true,
            category: "Woodfired",
          },
          {
            name: "Thermos Flask of Mountain Masala Chai (4 Cups)",
            price: 140,
            description: "Freshly brewed with ginger, cardamom, and Himalayan herbs.",
            isVeg: true,
            category: "Beverages",
          },
        ],
      },
      {
        name: "Jibhi Banjar Pine Cafe & Grill",
        location: "Jibhi, Banjar Valley, Himachal Pradesh",
        region: "Himachal Pradesh",
        cuisine: "Himachali Dham, Charcoal Barbecue & Bakery",
        contact: {
          phone: "+91 98160 54321",
          email: "jibhi.pine@thikana.com",
          address: "Near Jibhi Waterfall Bridge, Banjar",
        },
        image:
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        rating: 4.7,
        deliveryAvailable: true,
        menu: [
          {
            name: "Kullu Dham Special Platter",
            price: 320,
            description: "Authentic celebratory spread with madra, kadi, meetha bhat & rajma.",
            isVeg: true,
            category: "Thali",
          },
          {
            name: "Charcoal Barbecue Paneer Tikka Skewers",
            price: 260,
            description: "Smoked cottage cheese cubes with mint dip and onion salad.",
            isVeg: true,
            category: "Grills",
          },
          {
            name: "Warm Apple Cinnamon Crumble with Honey",
            price: 180,
            description: "Baked with local organic orchard apples and wild blossom honey.",
            isVeg: true,
            category: "Desserts",
          },
          {
            name: "Iced Wild Mint Lemonade Jar",
            price: 120,
            description: "Freshly crushed mountain mint with sparkling soda.",
            isVeg: true,
            category: "Beverages",
          },
        ],
      },
      {
        name: "Ganga Kinare Organic Cafe & Bakery",
        location: "Shivpuri, Rishikesh, Uttarakhand",
        region: "Uttarakhand",
        cuisine: "Organic Himalayan, Sourdough & Sattvic",
        contact: {
          phone: "+91 98370 99887",
          email: "ganga.cafe@thikana.com",
          address: "Badrinath Highway, Shivpuri, Rishikesh",
        },
        image:
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        rating: 4.9,
        deliveryAvailable: true,
        menu: [
          {
            name: "Garhwali Jhangora Millet Bowl with Paneer",
            price: 240,
            description: "Nutritious roasted millet salad with roasted greens and herbs.",
            isVeg: true,
            category: "Organic Bowls",
          },
          {
            name: "Artisan Woodfired Sourdough Bread Basket & Dips",
            price: 220,
            description: "Fresh baked sourdough loaf with hummus and sundried tomato tapenade.",
            isVeg: true,
            category: "Bakery",
          },
          {
            name: "Kumaoni Lemongrass & Tulsi Herbal Infusion",
            price: 130,
            description: "Soothing hot brew sourced directly from mountain farms.",
            isVeg: true,
            category: "Beverages",
          },
        ],
      },
      {
        name: "Mukteshwar Kumaoni Rasoi",
        location: "Mukteshwar, Nainital, Uttarakhand",
        region: "Uttarakhand",
        cuisine: "Authentic Kumaoni & Campfire Meals",
        contact: {
          phone: "+91 94120 77665",
          email: "mukteshwar.rasoi@thikana.com",
          address: "Chauli Ki Jali Road, Mukteshwar",
        },
        image:
          "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        rating: 4.6,
        deliveryAvailable: true,
        menu: [
          {
            name: "Bhatt Ki Churkani with Mountain Red Rice",
            price: 260,
            description: "Nutrient-rich black soybean curry slow-cooked in iron vessels.",
            isVeg: true,
            category: "Traditional",
          },
          {
            name: "Mandua (Ragi) Rotis with Fresh White Butter (4 pcs)",
            price: 120,
            description: "Handcrafted finger-millet flatbreads served hot.",
            isVeg: true,
            category: "Breads",
          },
          {
            name: "Wild Rhododendron (Buransh) Chilled Drink",
            price: 110,
            description: "Refreshing sweet-tart flower nectar beverage.",
            isVeg: true,
            category: "Beverages",
          },
        ],
      },
      {
        name: "Pahalgam Aru Valley Wazwan & Tea Corner",
        location: "Aru Valley, Pahalgam, Jammu & Kashmir",
        region: "Jammu & Kashmir",
        cuisine: "Kashmiri Wazwan & Traditional Breads",
        contact: {
          phone: "+91 94190 33221",
          email: "pahalgam.wazwan@thikana.com",
          address: "Main Market, Aru Valley Road, Pahalgam",
        },
        image:
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
        rating: 4.8,
        deliveryAvailable: true,
        menu: [
          {
            name: "Authentic Kashmiri Rista with Steamed Rice",
            price: 420,
            description: "Tender pounded meatballs simmered in a vibrant saffron-red gravy.",
            isVeg: false,
            category: "Wazwan",
          },
          {
            name: "Saffron & Almond Kashmiri Kahwa Flask",
            price: 160,
            description: "Brewed in a copper samovar with whole green tea leaves, cinnamon, and slivered almonds.",
            isVeg: true,
            category: "Beverages",
          },
          {
            name: "Fresh Kashmiri Bakarkhani & Girda Breads",
            price: 130,
            description: "Flaky traditional tandoor-baked breads with walnut chutney.",
            isVeg: true,
            category: "Breads",
          },
        ],
      },
    ];

    const seededRestaurants = await Restaurant.insertMany(restaurantsData);
    console.log(`✅ Created ${seededRestaurants.length} local restaurants & cafes.`);

    // 6. Seed realistic Bookings with various statuses & optional food orders
    console.log("\n📅 Creating sample bookings (pending, confirmed, rejected, cancelled)...");
    
    // Helper to calculate total price
    const calcPrice = (baseHourly, selectedAmenitiesList = [], hours, foodSubtotal = 0) => {
      const amenitiesSum = (selectedAmenitiesList || []).reduce(
        (acc, item) => acc + (Number(item?.hourlyPrice || item?.price) || 0),
        0
      );
      return (baseHourly + amenitiesSum) * hours + foodSubtotal;
    };

    const solangSpot = seededSpots.find((s) => s.title.includes("Solang")) || seededSpots[0];
    const dateSpot = seededSpots.find((s) => s.category === "Date Night Setup") || seededSpots[1];
    const bbqSpot = seededSpots.find((s) => s.title.includes("Jibhi Deodar")) || seededSpots[2];
    const gangaSpot = seededSpots.find((s) => s.title.includes("Ganga Riverbank")) || seededSpots[3];
    const orchardSpot = seededSpots.find((s) => s.title.includes("Mukteshwar")) || seededSpots[4];

    const bookingsData = [
      // 1. Confirmed Booking with Attached Food Order: Rohan on Solang Valley Meadow (3 hours)
      {
        user: customer1._id,
        spot: solangSpot._id,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
        startTime: "10:00",
        endTime: "13:00",
        durationHours: 3,
        guests: 4,
        selectedAmenities: (solangSpot.amenities || []).slice(0, 2),
        foodOrder: {
          restaurant: seededRestaurants[0]._id,
          restaurantName: seededRestaurants[0].name,
          items: [
            { name: "Traditional Himachali Siddu with Ghee", price: 180, quantity: 2 },
            { name: "Thermos Flask of Mountain Masala Chai (4 Cups)", price: 140, quantity: 1 },
          ],
          subtotal: 500,
        },
        totalPrice: calcPrice(
          solangSpot.price,
          (solangSpot.amenities || []).slice(0, 2),
          3,
          500
        ),
        status: "confirmed",
        paymentStatus: "paid",
        amountPaid: calcPrice(solangSpot.price, (solangSpot.amenities || []).slice(0, 2), 3, 500),
        paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        commissionRate: 10,
        platformCommission: Math.round(calcPrice(solangSpot.price, (solangSpot.amenities || []).slice(0, 2), 3, 500) * 0.1),
        ownerPayoutAmount: calcPrice(solangSpot.price, (solangSpot.amenities || []).slice(0, 2), 3, 500) - Math.round(calcPrice(solangSpot.price, (solangSpot.amenities || []).slice(0, 2), 3, 500) * 0.1),
        payoutStatus: "pending",
      },
      // 2. Pending Booking: Ananya on Old Manali Date Night (4 hours) without food order
      {
        user: customer2._id,
        spot: dateSpot._id,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // in 3 days
        startTime: "17:00",
        endTime: "21:00",
        durationHours: 4,
        guests: 2,
        selectedAmenities: (dateSpot.amenities || []).slice(0, 2),
        totalPrice: calcPrice(
          dateSpot.price,
          (dateSpot.amenities || []).slice(0, 2),
          4
        ),
        status: "pending",
        paymentStatus: "unpaid",
      },
      // 3. Confirmed Booking: Siddharth on Jibhi BBQ Lawn (5 hours)
      {
        user: customer3._id,
        spot: bbqSpot._id,
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // in 4 days
        startTime: "14:00",
        endTime: "19:00",
        durationHours: 5,
        guests: 8,
        selectedAmenities: (bbqSpot.amenities || []).slice(0, 3),
        totalPrice: calcPrice(
          bbqSpot.price,
          (bbqSpot.amenities || []).slice(0, 3),
          5
        ),
        status: "confirmed",
        paymentStatus: "paid",
        amountPaid: calcPrice(bbqSpot.price, (bbqSpot.amenities || []).slice(0, 3), 5),
        paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        commissionRate: 10,
        platformCommission: Math.round(calcPrice(bbqSpot.price, (bbqSpot.amenities || []).slice(0, 3), 5) * 0.1),
        ownerPayoutAmount: calcPrice(bbqSpot.price, (bbqSpot.amenities || []).slice(0, 3), 5) - Math.round(calcPrice(bbqSpot.price, (bbqSpot.amenities || []).slice(0, 3), 5) * 0.1),
        payoutStatus: "pending",
      },
      // 4. Rejected Booking: Rohan on Rishikesh Ganga Meadow (2 hours)
      {
        user: customer1._id,
        spot: gangaSpot._id,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
        startTime: "16:00",
        endTime: "18:00",
        durationHours: 2,
        guests: 3,
        selectedAmenities: (gangaSpot.amenities || []).slice(0, 1),
        totalPrice: calcPrice(
          gangaSpot.price,
          (gangaSpot.amenities || []).slice(0, 1),
          2
        ),
        status: "rejected",
      },
      // 5. Cancelled Booking: Ananya on Mukteshwar Orchard (3 hours)
      {
        user: customer2._id,
        spot: orchardSpot._id,
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // in 6 days
        startTime: "11:00",
        endTime: "14:00",
        durationHours: 3,
        guests: 2,
        selectedAmenities: (orchardSpot.amenities || []).slice(0, 2),
        totalPrice: calcPrice(
          orchardSpot.price,
          (orchardSpot.amenities || []).slice(0, 2),
          3
        ),
        status: "cancelled",
      },
    ];

    const seededBookings = await Booking.insertMany(bookingsData);
    console.log(`✅ Created ${seededBookings.length} sample bookings.`);

    // 7. Seed Authentic Guest Testimonials
    console.log("\n💬 Creating authentic guest experience testimonials...");
    const testimonialsData = [
      {
        name: "Aarav Sharma",
        role: "Landscape Photographer",
        spotName: "Solang Alpine Meadow & Pine Camping Plot",
        location: "Solang Valley, Himachal Pradesh",
        review:
          "Thikana made finding an untouched mountain glade effortless. We captured the Milky Way over our tent with zero light pollution, and the bonfire setup with pine wood was ready upon our arrival.",
        rating: 5,
        tag: "Camping & Bonfire",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        stayDate: "October 2025",
        isVerifiedStay: true,
      },
      {
        name: "Meera & Tushar Joshi",
        role: "Anniversary Getaway",
        spotName: "Old Manali Romantic Bohemian Stargazing Ridge",
        location: "Old Manali, Himachal Pradesh",
        review:
          "The private candlelit date setup on the apple orchard ridge was magical. Watching the sunset over the valley with warm cider felt like a secluded dream. Host Vikram made our evening unforgettable.",
        rating: 5,
        tag: "Romantic Escapes",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        stayDate: "November 2025",
        isVerifiedStay: true,
      },
      {
        name: "Devika Sen",
        role: "Solo Writer & Backpacker",
        spotName: "Chopta High-Altitude Bugyal Meadow",
        location: "Chopta, Uttarakhand",
        review:
          "Finding a private high-altitude meadow where I could pitch my canvas tent in total silence gave me the mental clarity I needed. The telescope provided for night skies was exceptional.",
        rating: 5,
        tag: "Solo & Nature",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        stayDate: "December 2025",
        isVerifiedStay: true,
      },
      {
        name: "Karan Singhania",
        role: "Astro-Photography Enthusiast",
        spotName: "Spiti High-Desert Stargazing Plateau",
        location: "Kaza, Spiti Valley, Himachal Pradesh",
        review:
          "Hands down the cleanest night sky experience in India. The host had sub-zero sleeping bags and an Celestron telescope waiting. The booking and payment flow was smooth and reassuring.",
        rating: 5,
        tag: "Stargazing",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        stayDate: "September 2025",
        isVerifiedStay: true,
      },
      {
        name: "Pooja & Friends Group",
        role: "Weekend Trekking Crew",
        spotName: "Kasol Pine Forest Night Campfire Glade",
        location: "Kasol, Parvati Valley, Himachal Pradesh",
        review:
          "We booked the private clearing for a post-trek reunion. The barbecue grill station and woodfire kettle chai made the cold evening so cozy. Best platform for genuine nature plots!",
        rating: 5,
        tag: "Camping & Bonfire",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
        stayDate: "January 2026",
        isVerifiedStay: true,
      },
      {
        name: "Kabir Malhotra",
        role: "Mindfulness & Yoga Guide",
        spotName: "Pahalgam Pine Valley Terraced Glade",
        location: "Aru Valley, Jammu & Kashmir",
        review:
          "Pure mountain tranquility surrounded by deodars and glacier streams. Our morning meditation sessions on the open turf were blissful. The local kahwa service was a delightful touch.",
        rating: 4.9,
        tag: "Solo & Nature",
        avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80",
        stayDate: "February 2026",
        isVerifiedStay: true,
      },
      {
        name: "Sneha & Arjun Roy",
        role: "Honeymoon Travelers",
        spotName: "Naggar Castle Vista Panoramic Sunset Gazebo",
        location: "Naggar, Kullu Valley, Himachal Pradesh",
        review:
          "The private evening deck with panoramic snow peak vistas felt like Europe in the heart of Himachal. Transparent pricing and hassle-free instant reservation.",
        rating: 5,
        tag: "Romantic Escapes",
        avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
        stayDate: "January 2026",
        isVerifiedStay: true,
      },
      {
        name: "Rishabh Varma",
        role: "College Reunion Organizer",
        spotName: "Jibhi Banjar Valley Pine BBQ Lawn",
        location: "Jibhi, Banjar Valley, Himachal Pradesh",
        review:
          "Accommodated our group of 8 with plenty of space for lawn games and barbecue dinner. Clean restrooms nearby and very responsive host. 10/10 recommendation.",
        rating: 4.8,
        tag: "Group Getaways",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
        stayDate: "February 2026",
        isVerifiedStay: true,
      },
    ];

    const seededReviews = await Testimonial.insertMany(testimonialsData);
    console.log(`✅ Created ${seededReviews.length} authentic guest testimonials.`);

    // 8. Print Summary and Test Credentials
    console.log("\n==================================================");
    console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
    console.log(`📊 Total Users        : ${seededUsers.length}`);
    console.log(`📊 Total Spots        : ${seededSpots.length}`);
    console.log(`📊 Total Restaurants  : ${seededRestaurants.length}`);
    console.log(`📊 Total Bookings     : ${seededBookings.length}`);
    console.log(`📊 Total Testimonials : ${seededReviews.length}`);
    console.log("--------------------------------------------------");
    console.log(`🔑 READY-TO-USE TEST ACCOUNTS (Password: ${testPassword}):`);
    console.log("--------------------------------------------------");
    console.log("  🏢 Host / Owner Login:");
    console.log("     Email    : aarav.host@thikana.com");
    console.log(`     Password : ${testPassword}`);
    console.log("     (Also created: meera.stays@thikana.com, vikram.plots@thikana.com)");
    console.log("");
    console.log("  🎒 Customer / Guest Login:");
    console.log("     Email    : rohan.travel@thikana.com");
    console.log(`     Password : ${testPassword}`);
    console.log("     (Also created: ananya.art@thikana.com, sid.wanderer@thikana.com)");
    console.log("==================================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
}

seedDatabase();
