/**
 * Comprehensive fallback dataset for Thikana.
 * Ensures the marketplace never displays broken states, 0-result blanks,
 * or connection alerts when the backend is cold-starting on free-tier hosting (Render).
 */

export const FALLBACK_SPOTS = [
  // 1. GRASSLAND PLOT
  {
    _id: "6aa122beec5cfe830180d6e1",
    id: "6aa122beec5cfe830180d6e1",
    title: "Solang Alpine Meadow & Pine Camping Plot",
    description: "Untouched open grassland plot surrounded by tall deodar pines and towering snow-capped peaks in Solang Valley. Completely free of commercial concrete, perfect for daytime picnics, yoga retreats, and panoramic Himalayan photography.",
    location: "Solang Valley, Manali, Himachal Pradesh",
    price: 1200,
    category: "Grassland Plot",
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 38,
    maxGuests: 15,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Bonfire Setup & Firewood", hourlyPrice: 350, price: 350 },
      { name: "Alpine Waterproof Tent", hourlyPrice: 500, price: 500 },
      { name: "Solar Lanterns & Power", hourlyPrice: 150, price: 150 },
      { name: "WiFi Access", hourlyPrice: 200, price: 200 },
    ],
    corporateFriendly: {
      isCorporateFriendly: true,
      maxCorporateCapacity: 60,
      corporateAmenities: ["High-speed Wi-Fi", "AV Projector Setup", "Buffet Dining Area", "Power Generator Backup"],
      corporateHourlyRate: 2500,
      corporateDayPackagePrice: 15000,
    },
  },
  {
    _id: "6aa122beec5cfe830180d6e2",
    id: "6aa122beec5cfe830180d6e2",
    title: "Chopta High-Altitude Bugyal Meadow",
    description: "Pristine alpine meadow overlooking the Chandrashila peak. Soft velvet grass surrounded by rhododendron bushes and unobstructed vistas of the Garhwal Himalayas.",
    location: "Chopta, Rudraprayag, Uttarakhand",
    price: 1400,
    category: "Grassland Plot",
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 26,
    maxGuests: 12,
    image: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Stargazing Telescope", hourlyPrice: 250, price: 250 },
      { name: "Bonfire Setup & Firewood", hourlyPrice: 350, price: 350 },
      { name: "Guided Nature Trail", hourlyPrice: 300, price: 300 },
    ],
    corporateFriendly: {
      isCorporateFriendly: true,
      maxCorporateCapacity: 45,
      corporateAmenities: ["Starlink Satellite Wi-Fi", "Outdoor Seating Setup", "Bonfire Evening Deck", "Catering Service"],
      corporateHourlyRate: 2800,
      corporateDayPackagePrice: 18000,
    },
  },

  // 2. DATE NIGHT SETUP
  {
    _id: "6aa122beec5cfe830180d6e0",
    id: "6aa122beec5cfe830180d6e0",
    title: "Old Manali Ridge Sunset Date Night Setup",
    description: "Exclusive cliffside perch above Old Manali with fairy-lit gazebo, low Bohemian tables, warm plush sheepskin throws, and a clear valley vista of distant snow ranges.",
    location: "Old Manali, Himachal Pradesh",
    price: 1500,
    category: "Date Night Setup",
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 42,
    maxGuests: 4,
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Candlelight Dinner Setup", hourlyPrice: 600, price: 600 },
      { name: "Bonfire Setup & Firewood", hourlyPrice: 350, price: 350 },
      { name: "Acoustic Bluetooth Speaker", hourlyPrice: 150, price: 150 },
    ],
  },
  {
    _id: "6aa122beec5cfe830180d6df",
    id: "6aa122beec5cfe830180d6df",
    title: "Pahalgam Pine Valley Terraced Glade",
    description: "Terraced grassy alcove nestled inside ancient Kashmiri pine forests. Gentle murmurs of glacial streams below and secluded tranquility ideal for romantic dates.",
    location: "Aru Valley, Pahalgam, Jammu & Kashmir",
    price: 1800,
    category: "Date Night Setup",
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 29,
    maxGuests: 4,
    image: "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Candlelight Dinner Setup", hourlyPrice: 600, price: 600 },
      { name: "Bonfire Setup & Firewood", hourlyPrice: 350, price: 350 },
      { name: "WiFi Access", hourlyPrice: 200, price: 200 },
    ],
  },

  // 3. HILLSIDE HUT
  {
    _id: "6aa122beec5cfe830180d6e3",
    id: "6aa122beec5cfe830180d6e3",
    title: "Dharamkot High Pine Lookout Plot",
    description: "Elevated hillside terrace with a rustic cedar shepherd's hut. Direct panoramic views over the Kangra Valley and Triund ridgeline with cedar wood deck.",
    location: "Dharamkot, McLeodganj, Himachal Pradesh",
    price: 1350,
    category: "Hillside Hut",
    rating: 4.8,
    reviewsCount: 31,
    maxGuests: 8,
    image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "WiFi Access", hourlyPrice: 200, price: 200 },
      { name: "Bonfire Setup & Firewood", hourlyPrice: 350, price: 350 },
      { name: "Solar Lanterns & Power", hourlyPrice: 150, price: 150 },
    ],
    corporateFriendly: {
      isCorporateFriendly: true,
      maxCorporateCapacity: 40,
      corporateAmenities: ["High-speed Wi-Fi", "Whiteboard & AV Setup", "Organic Tea Station", "Generator Backup"],
      corporateHourlyRate: 2400,
      corporateDayPackagePrice: 14000,
    },
  },
  {
    _id: "6aa122beec5cfe830180d6e4",
    id: "6aa122beec5cfe830180d6e4",
    title: "Jibhi Cedar Glade Cabin Plot",
    description: "Quiet forest glade in the heart of Tirthan Valley featuring an authentic traditional kathkuni wooden stone cabin. Shaded by centuries-old towering deodars.",
    location: "Jibhi, Tirthan Valley, Himachal Pradesh",
    price: 1450,
    category: "Hillside Hut",
    rating: 4.9,
    reviewsCount: 22,
    maxGuests: 8,
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Bonfire Setup & Firewood", hourlyPrice: 350, price: 350 },
      { name: "Barbecue Grill & Coal", hourlyPrice: 400, price: 400 },
      { name: "Riverside Access", hourlyPrice: 150, price: 150 },
    ],
  },

  // 4. GET TOGETHER SETUP
  {
    _id: "6aa122beec5cfe830180d6e5",
    id: "6aa122beec5cfe830180d6e5",
    title: "Bhimtal Mountain Panorama Camp",
    description: "Expansive terraced property overlooking the emerald waters of Bhimtal Lake. Multi-level stone patios, outdoor dining tables, and expansive lawns for celebrations.",
    location: "Bhimtal, Nainital, Uttarakhand",
    price: 1750,
    category: "Get Together Setup",
    rating: 4.9,
    reviewsCount: 35,
    maxGuests: 30,
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "WiFi Access", hourlyPrice: 200, price: 200 },
      { name: "Barbecue Grill & Coal", hourlyPrice: 400, price: 400 },
      { name: "Bonfire Setup & Firewood", hourlyPrice: 350, price: 350 },
      { name: "Alpine Waterproof Tent", hourlyPrice: 500, price: 500 },
    ],
    corporateFriendly: {
      isCorporateFriendly: true,
      maxCorporateCapacity: 80,
      corporateAmenities: ["High-speed Wi-Fi", "Audio/Mic System", "Buffet Dining Area", "Dedicated Event Host"],
      corporateHourlyRate: 2200,
      corporateDayPackagePrice: 16000,
    },
  },
  {
    _id: "6aa122beec5cfe830180d6e6",
    id: "6aa122beec5cfe830180d6e6",
    title: "Kullu Riverside Apple Orchard Plot",
    description: "Spacious private plot bounded by fruiting apple orchards and the gushing Beas River. Fitted with group picnic benches, hammock grove, and barbecue clearing.",
    location: "Raison, Kullu Valley, Himachal Pradesh",
    price: 1600,
    category: "Get Together Setup",
    rating: 4.8,
    reviewsCount: 19,
    maxGuests: 25,
    image: "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Barbecue Grill & Coal", hourlyPrice: 400, price: 400 },
      { name: "Bonfire Setup & Firewood", hourlyPrice: 350, price: 350 },
      { name: "Riverside Access", hourlyPrice: 150, price: 150 },
    ],
  },

  // 5. MOUNTAIN CAFE
  {
    _id: "6aa122beec5cfe830180d6e7",
    id: "6aa122beec5cfe830180d6e7",
    title: "Mussoorie Cloud End Ridge Plot",
    description: "Scenic cliffside clearing offering warm mountain brews, fresh bakery snacks, and front-row seats to the famous Mussoorie Winterline sunset phenomenon.",
    location: "Cloud End, Mussoorie, Uttarakhand",
    price: 1550,
    category: "Mountain Cafe",
    rating: 4.8,
    reviewsCount: 28,
    maxGuests: 20,
    image: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "WiFi Access", hourlyPrice: 200, price: 200 },
      { name: "Solar Lanterns & Power", hourlyPrice: 150, price: 150 },
      { name: "Guided Nature Trail", hourlyPrice: 300, price: 300 },
    ],
  },
  {
    _id: "6aa122beec5cfe830180d6e8",
    id: "6aa122beec5cfe830180d6e8",
    title: "Kasol Parvati Riverfront Terrace",
    description: "Artistic riverside cafe grounds along the pristine Parvati River in Kasol. Bohemian floor seating, ambient music setup, and mountain herbal beverages.",
    location: "Kasol, Parvati Valley, Himachal Pradesh",
    price: 1400,
    category: "Mountain Cafe",
    rating: 4.7,
    reviewsCount: 33,
    maxGuests: 20,
    image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Riverside Access", hourlyPrice: 150, price: 150 },
      { name: "WiFi Access", hourlyPrice: 200, price: 200 },
      { name: "Bonfire Setup & Firewood", hourlyPrice: 350, price: 350 },
    ],
  },

  // 6. RIVERSIDE MEADOW
  {
    _id: "6aa122beec5cfe830180d6e9",
    id: "6aa122beec5cfe830180d6e9",
    title: "Tirthan Crystal River Pebble Glade",
    description: "Natural grassy bank right beside the crystal clear waters of the Tirthan River. Ideal for day-long angling, cold dip dips, and peaceful meditation.",
    location: "Gushaini, Tirthan Valley, Himachal Pradesh",
    price: 1650,
    category: "Riverside Meadow",
    rating: 4.9,
    reviewsCount: 27,
    maxGuests: 15,
    image: "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Riverside Access", hourlyPrice: 150, price: 150 },
      { name: "Alpine Waterproof Tent", hourlyPrice: 500, price: 500 },
      { name: "Barbecue Grill & Coal", hourlyPrice: 400, price: 400 },
    ],
  },
  {
    _id: "6aa122beec5cfe830180d6ea",
    id: "6aa122beec5cfe830180d6ea",
    title: "Barot Valley Uhl Riverside Meadow",
    description: "Quiet green patch hugging the banks of the Uhl River in Barot Valley. Fresh deodar breeze, pebble banks, and scenic views of the hydroelectric dam reservoir.",
    location: "Barot Valley, Mandi, Himachal Pradesh",
    price: 1300,
    category: "Riverside Meadow",
    rating: 4.8,
    reviewsCount: 16,
    maxGuests: 12,
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Riverside Access", hourlyPrice: 150, price: 150 },
      { name: "Bonfire Setup & Firewood", hourlyPrice: 350, price: 350 },
    ],
  },

  // 7. EMPTY PLOT
  {
    _id: "6aa122beec5cfe830180d6eb",
    id: "6aa122beec5cfe830180d6eb",
    title: "Kinnaur Apple Blossom Terraced Plot",
    description: "Raw, undeveloped mountain terrace plot in high Kalpa overlooking the sacred Kinner Kailash peak. Completely virgin land with crisp dry mountain winds.",
    location: "Kalpa, Kinnaur, Himachal Pradesh",
    price: 1100,
    category: "Empty Plot",
    rating: 4.9,
    reviewsCount: 20,
    maxGuests: 10,
    image: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Solar Lanterns & Power", hourlyPrice: 150, price: 150 },
      { name: "Guided Nature Trail", hourlyPrice: 300, price: 300 },
    ],
  },
  {
    _id: "6aa122beec5cfe830180d6ec",
    id: "6aa122beec5cfe830180d6ec",
    title: "Spiti High Altitude Valley Basin",
    description: "Pure barren high-altitude open terrain on the banks of the Spiti River near Kaza. Zero light pollution, sheer silence, and stark trans-Himalayan geological beauty.",
    location: "Kaza, Spiti Valley, Himachal Pradesh",
    price: 1500,
    category: "Empty Plot",
    rating: 4.8,
    reviewsCount: 14,
    maxGuests: 10,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Stargazing Telescope", hourlyPrice: 250, price: 250 },
      { name: "Solar Lanterns & Power", hourlyPrice: 150, price: 150 },
    ],
  },

  // 8. CAMPFIRE STAYS
  {
    _id: "6aa122beec5cfe830180d6ed",
    id: "6aa122beec5cfe830180d6ed",
    title: "Deodar Forest Starlit Campfire Glade",
    description: "Dedicated bonfire sanctuary deep within the Jibhi deodar woods. Features sunken stone fire pit, dry aromatic pine firewood, log benches, and twinkling fairy canopy.",
    location: "Jibhi, Kullu, Himachal Pradesh",
    price: 1600,
    category: "Campfire Stays",
    rating: 4.9,
    reviewsCount: 36,
    maxGuests: 15,
    image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Bonfire Setup & Firewood", hourlyPrice: 350, price: 350 },
      { name: "Barbecue Grill & Coal", hourlyPrice: 400, price: 400 },
      { name: "Stargazing Telescope", hourlyPrice: 250, price: 250 },
    ],
  },
  {
    _id: "6aa122beec5cfe830180d6ee",
    id: "6aa122beec5cfe830180d6ee",
    title: "Patnitop Pine Woods Campfire Retreat",
    description: "Protected meadow bordered by thick pine trees with campfire facilities, barbecue grills, and starry vistas over the Chenab gorge in Jammu.",
    location: "Patnitop, Udhampur, Jammu & Kashmir",
    price: 1350,
    category: "Campfire Stays",
    rating: 4.8,
    reviewsCount: 23,
    maxGuests: 15,
    image: "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Bonfire Setup & Firewood", hourlyPrice: 350, price: 350 },
      { name: "Barbecue Grill & Coal", hourlyPrice: 400, price: 400 },
    ],
    corporateFriendly: {
      isCorporateFriendly: true,
      maxCorporateCapacity: 50,
      corporateAmenities: ["Wi-Fi Connectivity", "Bonfire Evening Setup", "Barbecue Lunch Station", "Breakout Circles"],
      corporateHourlyRate: 2000,
      corporateDayPackagePrice: 12000,
    },
  },
];

export const FALLBACK_CORPORATE_SPACES = FALLBACK_SPOTS.filter(
  (s) => s.corporateFriendly?.isCorporateFriendly
);

export const FALLBACK_CORPORATE_EXPERIENCES = [
  {
    _id: "corp_exp_solang_01",
    id: "corp_exp_solang_01",
    title: "Executive Alpine Summit & Strategic Offsite",
    description: "Private mountain clearing equipped with high-speed Wi-Fi, audio/mic setup, flip-charts, and gourmet Himalayan catering for executive off-sites and quarterly planning.",
    spot: {
      _id: "6aa122beec5cfe830180d6e1",
      title: "Solang Alpine Meadow & Pine Camping Plot",
      location: "Solang Valley, Manali, Himachal Pradesh",
      images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"],
    },
    durationHours: 6,
    price: 35000,
    maxAttendees: 40,
    isCorporate: true,
    corporateType: "corporate_meeting",
    rating: 4.9,
    reviewsCount: 14,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
  },
  {
    _id: "corp_exp_chopta_02",
    id: "corp_exp_chopta_02",
    title: "High-Altitude Leadership Unplugged & Stargazing",
    description: "All-day strategy session in an unpolluted alpine meadow with telescope observation, hot herbal tea breaks, and evening fireside reflection for founder teams.",
    spot: {
      _id: "6aa122beec5cfe830180d6e2",
      title: "Chopta High-Altitude Bugyal Meadow",
      location: "Chopta, Rudraprayag, Uttarakhand",
      images: ["https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80"],
    },
    durationHours: 8,
    price: 42000,
    maxAttendees: 35,
    isCorporate: true,
    corporateType: "small_retreat",
    rating: 5.0,
    reviewsCount: 9,
    image: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
  },
  {
    _id: "corp_exp_bhimtal_03",
    id: "corp_exp_bhimtal_03",
    title: "Lakeside Team Resilience & Outdoor Adventure Challenge",
    description: "Custom team-building games, obstacle navigation, and open-air pavilion lunch for expanding company camaraderie overlooking Bhimtal Lake.",
    spot: {
      _id: "6aa122beec5cfe830180d6e5",
      title: "Bhimtal Mountain Panorama Camp",
      location: "Bhimtal, Nainital, Uttarakhand",
      images: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"],
    },
    durationHours: 6,
    price: 38000,
    maxAttendees: 60,
    isCorporate: true,
    corporateType: "team_outing",
    rating: 4.8,
    reviewsCount: 16,
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  },
];

export const FALLBACK_EXPERIENCES = [
  {
    _id: "exp_manali_date_01",
    id: "exp_manali_date_01",
    title: "Candlelight Date Night & Twilight Bonfire",
    description: "Curated romantic evening package overlooking snow peaks with ambient candlelight, cozy sheepskin floor seating, crackling private bonfire, and warm herbal tea.",
    spot: {
      _id: "6aa122beec5cfe830180d6e0",
      title: "Old Manali Ridge Sunset Date Night Setup",
      location: "Old Manali, Himachal Pradesh",
      images: ["https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80"],
    },
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
      { name: "Fresh Flower Bouquet", price: 600, description: "Wild roses & mountain carnations" },
      { name: "Acoustic Guitar Serenader", price: 1200, description: "Live unplugged music for 45 mins" },
    ],
    maxGuests: 4,
  },
  {
    _id: "exp_chopta_stargaze_02",
    id: "exp_chopta_stargaze_02",
    title: "Himalayan High-Altitude Stargazing Night",
    description: "Guided deep-space stargazing session with an optical telescope atop Chopta's unpolluted alpine meadows. Observe Saturn's rings, lunar craters, and the radiant Milky Way arc in crystal-clear night skies.",
    spot: {
      _id: "6aa122beec5cfe830180d6e2",
      title: "Chopta High-Altitude Bugyal Meadow",
      location: "Chopta, Rudraprayag, Uttarakhand",
      images: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"],
    },
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
    optionalAddOns: [
      { name: "Astrophotography RAW Capture Session", price: 1500, description: "3 high-res long-exposure photos" },
    ],
    maxGuests: 6,
  },
  {
    _id: "exp_jibhi_campfire_03",
    id: "exp_jibhi_campfire_03",
    title: "Deodar Forest Campfire & Trout BBQ Grill",
    description: "Rustic twilight campfire package in Jibhi with private charcoal barbecue grill setup, wooden picnic benches, and riverside pine fragrance.",
    spot: {
      _id: "6aa122beec5cfe830180d6ed",
      title: "Deodar Forest Starlit Campfire Glade",
      location: "Jibhi, Tirthan Valley, Himachal Pradesh",
      images: ["https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80"],
    },
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
    optionalAddOns: [
      { name: "Fresh Marinated River Trout", price: 800, description: "2 pieces seasoned with mountain herbs" },
    ],
    maxGuests: 10,
  },
  {
    _id: "exp_solang_group_04",
    id: "exp_solang_group_04",
    title: "Alpine Pine Meadow Group Retreat & Camp",
    description: "Expansive day retreat for friends and families on Solang Valley's grassy terrain. Complete with two alpine waterproof tents, lawn games, acoustic guitar, and group campfire circle.",
    spot: {
      _id: "6aa122beec5cfe830180d6e1",
      title: "Solang Alpine Meadow & Pine Camping Plot",
      location: "Solang Valley, Manali, Himachal Pradesh",
      images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"],
    },
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
    optionalAddOns: [
      { name: "Live Acoustic Singer & Guitarist", price: 1800, description: "2 hours mountain folk & retro jams" },
    ],
    maxGuests: 12,
  },
  {
    _id: "exp_dharamkot_yoga_05",
    id: "exp_dharamkot_yoga_05",
    title: "High-Altitude Yoga & Sound Bath Glade",
    description: "Mindfulness and breathwork session in an untouched pine clearing with singing bowls, organic herbal tea, and meditation mats surrounded by gentle mountain breezes.",
    spot: {
      _id: "6aa122beec5cfe830180d6e3",
      title: "Dharamkot High Pine Lookout Plot",
      location: "Dharamkot, McLeodganj, Himachal Pradesh",
      images: ["https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80"],
    },
    category: "Romantic Date",
    durationHours: 3,
    price: 2800,
    rating: 4.9,
    reviewsCount: 12,
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    includedAmenities: [
      { name: "Tibetan Singing Bowls Set" },
      { name: "Organic Herbal Tea Station" },
      { name: "Meditation Cushions & Mats" },
    ],
    optionalAddOns: [
      { name: "Guided Breathwork Instructor", price: 1200, description: "60-minute certified yoga master" },
    ],
    maxGuests: 8,
  },
  {
    _id: "exp_patnitop_sunset_06",
    id: "exp_patnitop_sunset_06",
    title: "Sunset Valley Acoustic Music & Wine Evening",
    description: "Scenic evening package on the wooden terrace deck of Patnitop with acoustic melodies, fairy lanterns, and private barbecue dinner under the crimson twilight skies.",
    spot: {
      _id: "6aa122beec5cfe830180d6ee",
      title: "Patnitop Pine Woods Campfire Retreat",
      location: "Patnitop, Udhampur, Jammu & Kashmir",
      images: ["https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80"],
    },
    category: "Sunset Campfire",
    durationHours: 4,
    price: 4500,
    rating: 4.9,
    reviewsCount: 19,
    image: "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    includedAmenities: [
      { name: "Sunset Wooden Deck Setup" },
      { name: "Twilight Fairy Lights & Lanterns" },
      { name: "Charcoal Barbecue Grill" },
    ],
    optionalAddOns: [
      { name: "Fresh Apple Cider Jug", price: 500, description: "Locally pressed Kashmiri apple cider" },
    ],
    maxGuests: 8,
  },
];

// Helper to filter fallback listings
export const filterFallbackSpots = (spotsList, filters = {}) => {
  const { category, location, minPrice, maxPrice, amenities, guests, sort } = filters;
  let list = [...(spotsList || FALLBACK_SPOTS)];

  if (category && category !== "all") {
    list = list.filter((s) => s.category?.toLowerCase() === category.toLowerCase());
  }

  if (location && location.trim()) {
    const locLower = location.trim().toLowerCase();
    list = list.filter(
      (s) =>
        s.location?.toLowerCase().includes(locLower) ||
        s.title?.toLowerCase().includes(locLower)
    );
  }

  if (minPrice) {
    const min = Number(minPrice);
    if (!isNaN(min)) list = list.filter((s) => (s.price || 0) >= min);
  }

  if (maxPrice) {
    const max = Number(maxPrice);
    if (!isNaN(max)) list = list.filter((s) => (s.price || 0) <= max);
  }

  if (guests) {
    const g = Number(guests);
    if (!isNaN(g)) list = list.filter((s) => (s.maxGuests || 6) >= g);
  }

  if (amenities && amenities.length > 0) {
    list = list.filter((s) => {
      const spotAmenities = Array.isArray(s.amenities)
        ? s.amenities.map((a) => (typeof a === "string" ? a : a.name).toLowerCase())
        : [];
      return amenities.some((req) =>
        spotAmenities.some((sa) => sa.includes(req.toLowerCase()))
      );
    });
  }

  if (sort === "price-asc") {
    list.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sort === "price-desc") {
    list.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (sort === "rating") {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return list;
};

// Helper to filter fallback corporate spaces
export const filterFallbackCorporateSpaces = (spacesList, filters = {}) => {
  const { minCapacity, location, amenity } = filters;
  let list = [...(spacesList || FALLBACK_CORPORATE_SPACES)];

  if (minCapacity) {
    const cap = Number(minCapacity);
    if (!isNaN(cap)) {
      list = list.filter((s) => (s.corporateFriendly?.maxCorporateCapacity || s.maxGuests || 50) >= cap);
    }
  }

  if (location && location.trim()) {
    const locLower = location.trim().toLowerCase();
    list = list.filter(
      (s) =>
        s.location?.toLowerCase().includes(locLower) ||
        s.title?.toLowerCase().includes(locLower)
    );
  }

  if (amenity && amenity.trim()) {
    const aLower = amenity.trim().toLowerCase();
    list = list.filter((s) =>
      s.corporateFriendly?.corporateAmenities?.some((item) =>
        item.toLowerCase().includes(aLower)
      )
    );
  }

  return list;
};

// Helper to filter fallback corporate experiences
export const filterFallbackCorporateExperiences = (expsList, filters = {}) => {
  const { eventType, location } = filters;
  let list = [...(expsList || FALLBACK_CORPORATE_EXPERIENCES)];

  if (eventType && eventType !== "all") {
    list = list.filter((e) => e.corporateType === eventType);
  }

  if (location && location.trim()) {
    const locLower = location.trim().toLowerCase();
    list = list.filter(
      (e) =>
        e.spot?.location?.toLowerCase().includes(locLower) ||
        e.title?.toLowerCase().includes(locLower)
    );
  }

  return list;
};

// Helper to filter fallback experiences
export const filterFallbackExperiences = (expsList, filters = {}) => {
  const { category, search, duration, sort } = filters;
  let list = [...(expsList || FALLBACK_EXPERIENCES)];

  if (category && category !== "all") {
    const catLower = category.toLowerCase();
    list = list.filter((e) => {
      const eCat = (e.category || "").toLowerCase();
      if (catLower === "friends' escape" || catLower === "group gathering") {
        return eCat === "friends' escape" || eCat === "group gathering";
      }
      return eCat === catLower;
    });
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (e) =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.spot?.location?.toLowerCase().includes(q)
    );
  }

  if (duration) {
    const durNum = Number(duration);
    if (!isNaN(durNum) && durNum > 0) {
      list = list.filter((e) => (e.durationHours || 4) <= durNum);
    }
  }

  if (sort === "priceAsc") {
    list.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sort === "priceDesc") {
    list.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (sort === "durationAsc") {
    list.sort((a, b) => (a.durationHours || 0) - (b.durationHours || 0));
  } else if (sort === "rating") {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return list;
};
