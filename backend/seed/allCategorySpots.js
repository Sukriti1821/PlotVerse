/**
 * 48 Curated Spots — 6 spots per category for all 8 categories
 *
 * AUDIT GUIDELINE:
 * - Empty Plot: Must depict pure undeveloped land, natural meadows, and open fields (no houses/buildings).
 * - Grassland Plot: Must depict verdant, rolling grass/pastures (no rocky snow peaks or barren crags).
 */
module.exports = (owner1, owner2, owner3) => {
  const rawSpots = [
  // ==========================================
  // 1. GRASSLAND PLOTS (6 spots)
  // ==========================================
  {
    title: "Solang Alpine Meadow & Pine Camping Plot",
    description: "Untouched open grassland plot surrounded by tall deodar pines and towering snow-capped peaks in Solang Valley. Completely free of commercial concrete, perfect for daytime picnics, yoga retreats, and panoramic Himalayan photography.",
    location: "Solang Valley, Manali, Himachal Pradesh",
    price: 1200,
    category: "Grassland Plot",
    isFeatured: true,
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Bonfire Setup & Firewood", hourlyPrice: 350, price: 350 },
      { name: "Alpine Waterproof Tent", hourlyPrice: 500, price: 500 },
      { name: "Solar Lanterns & Power", hourlyPrice: 150, price: 150 },
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
    title: "Khajjiar Cedar Meadow Glade",
    description: "Expansive green grassland clearing enveloped by dense cedar groves in Khajjiar. Gently undulating turf, crisp fresh air, and wide open skies ideal for leisurely picnics and outdoor games.",
    location: "Khajjiar, Chamba, Himachal Pradesh",
    price: 1300,
    category: "Grassland Plot",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Picnic Blanket & Floor Rugs", hourlyPrice: 200, price: 200 },
      { name: "Campfire Setup", hourlyPrice: 350, price: 350 },
      { name: "Thermos Flask Chai", hourlyPrice: 120, price: 120 },
    ],
  },
  {
    title: "Chopta High-Altitude Bugyal Meadow",
    description: "Pristine alpine meadow overlooking the Chandrashila peak. Soft velvet grass surrounded by rhododendron bushes and unobstructed vistas of the Garhwal Himalayas.",
    location: "Chopta, Rudraprayag, Uttarakhand",
    price: 1400,
    category: "Grassland Plot",
    isFeatured: true,
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Stargazing Telescope", hourlyPrice: 250, price: 250 },
      { name: "Thermal Windbreaker Blankets", hourlyPrice: 150, price: 150 },
    ],
    corporateFriendly: {
      isCorporateFriendly: true,
      maxCorporateCapacity: 45,
      corporateAmenities: ["Starlink Satellite Wi-Fi", "Outdoor Seating Setup", "Bonfire Evening Deck", "Catering Service"],
      corporateHourlyRate: 2800,
      corporateDayPackagePrice: 18000,
    },
  },
  {
    title: "Gulmarg Alpine Plateau Grassland",
    description: "Wide emerald terrace overlooking the Pir Panjal ranges in Gulmarg. Clean mountain breezes, colorful wild buttercups in bloom, and majestic pine silhouettes.",
    location: "Gulmarg Valley, Baramulla, Jammu & Kashmir",
    price: 1600,
    category: "Grassland Plot",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Kashmiri Kahwa & Samovar", hourlyPrice: 250, price: 250 },
      { name: "Log Seating Circle", hourlyPrice: 200, price: 200 },
    ],
  },
  {
    title: "Dayara Bugyal Panoramic Grassland",
    description: "One of the most spectacular highland meadows in Asia. Sweeping undulating turf ideal for mindfulness, yoga sessions, acoustic music, and serene mountain stays.",
    location: "Barsu, Uttarkashi, Uttarakhand",
    price: 1350,
    category: "Grassland Plot",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Weatherproof Tent", hourlyPrice: 400, price: 400 },
      { name: "Guided Nature Walk", hourlyPrice: 300, price: 300 },
    ],
  },
  {
    title: "Triund Hilltop Ridge Camping Lawn",
    description: "Iconic ridge top lawn with the mighty Dhauladhar peaks towering directly behind and the illuminated Kangra valley stretching below at night.",
    location: "Triund Ridge, Dharamshala, Himachal Pradesh",
    price: 1500,
    category: "Grassland Plot",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Bonfire Setup", hourlyPrice: 350, price: 350 },
      { name: "High-Altitude Sleeping Bags", hourlyPrice: 250, price: 250 },
    ],
  },

  // ==========================================
  // 2. DATE NIGHT SETUPS (6 spots)
  // ==========================================
  {
    title: "Old Manali Ridge Sunset Date Night Setup",
    description: "A secluded hilltop open plot specially curated with fairy lights, bohemian woven rugs, low wooden tables, floor cushions, and an unobstructed sunset view of the Manali valley.",
    location: "Old manali sunset date setup",
    price: 1500,
    category: "Date Night Setup",
    isFeatured: true,
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Fairy Lights & Bohemian Decor Kit", hourlyPrice: 400, price: 400 },
      { name: "Candlelit Bonfire Setup", hourlyPrice: 300, price: 300 },
      { name: "Acoustic Bluetooth Soundbox", hourlyPrice: 150, price: 150 },
      { name: "Stargazing Astronomy Telescope", hourlyPrice: 250, price: 250 },
    ],
  },
  {
    title: "Naggar Twilight Gazebo & Candlelit Hearth",
    description: "Private romantic gazebo tucked beside ancient deodars in Naggar. Soft amber lanterns, comfortable lounge seating, and an expansive mountain valley sunset panorama.",
    location: "Naggar, Kullu Valley, Himachal Pradesh",
    price: 1700,
    category: "Date Night Setup",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Candlelight Dinner Setup", hourlyPrice: 450, price: 450 },
      { name: "Gourmet Dessert Platter", hourlyPrice: 350, price: 350 },
      { name: "Warm Wool Blankets", hourlyPrice: 100, price: 100 },
    ],
  },
  {
    title: "Landour Starlit Terrace Date Setup",
    description: "Intimate cliffside stone terrace perched in the pine ridges of Landour. Overlooks the glittering lights of the Doon valley under a canopy of mountain stars.",
    location: "Landour Cantt, Mussoorie, Uttarakhand",
    price: 1850,
    category: "Date Night Setup",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Artisanal Hot Chocolate Kit", hourlyPrice: 200, price: 200 },
      { name: "Telescope for Stargazing", hourlyPrice: 250, price: 250 },
      { name: "Romantic String Lights", hourlyPrice: 250, price: 250 },
    ],
  },
  {
    title: "Kasol Parvati Waterside Date Deck",
    description: "Private wooden river-deck lined with Moroccan lanterns, plush floor cushions, and gentle mountain river sounds in Old Kasol.",
    location: "Old Kasol, Parvati Valley, Himachal Pradesh",
    price: 1600,
    category: "Date Night Setup",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Private Riverbank Firepit", hourlyPrice: 350, price: 350 },
      { name: "Herbal Tea & Cookie Basket", hourlyPrice: 200, price: 200 },
    ],
  },
  {
    title: "Pangot Hill Romantic Sunset Deck",
    description: "Quiet hillside wooden lookout in Pangot facing the Trishul peaks. Cozy fleece throws, candle centerpieces, and sunset wine & cheese dining.",
    location: "Pangot, Nainital, Uttarakhand",
    price: 1550,
    category: "Date Night Setup",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Sunset Photo Session", hourlyPrice: 500, price: 500 },
      { name: "Candle & Lantern Decor", hourlyPrice: 250, price: 250 },
    ],
  },
  {
    title: "Nigeen Shore Floating Candlelit Terrace",
    description: "Magical open-air wooden deck at the edge of Nigeen Lake in Srinagar. Lined with oil lamps, Persian rugs, and reflection of mountain stars.",
    location: "Nigeen Lake Shore, Srinagar, Jammu & Kashmir",
    price: 1900,
    category: "Date Night Setup",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Kashmiri Wazwan Date Menu", hourlyPrice: 600, price: 600 },
      { name: "Traditional Kahwa Kettle", hourlyPrice: 200, price: 200 },
    ],
  },

  // ==========================================
  // 3. HILLSIDE HUTS (6 spots)
  // ==========================================
  {
    title: "Mukteshwar Kumaon Apple Orchard & Hillside Hut",
    description: "Traditional rustic Kumaoni stone and timber wooden chalet inside a terraced apple orchard facing the Trishul and Nanda Devi snow peaks.",
    location: "Mukteshwar, Nainital, Uttarakhand",
    price: 1800,
    category: "Hillside Hut",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Cast Iron Fireplace & Wood", hourlyPrice: 300, price: 300 },
      { name: "Starlink WiFi Access", hourlyPrice: 150, price: 150 },
      { name: "Fresh Organic Apple Basket", hourlyPrice: 200, price: 200 },
    ],
  },
  {
    title: "Jibhi Timber Treehouse Chalet",
    description: "Two-story handcrafted timber hut built around towering pine trunks in Jibhi. Features a cedarwood balcony directly over a whispering mountain brook.",
    location: "Jibhi, Tirthan Valley, Himachal Pradesh",
    price: 2100,
    category: "Hillside Hut",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Firewood & Hearth Kit", hourlyPrice: 300, price: 300 },
      { name: "Hammock Balcony Setup", hourlyPrice: 150, price: 150 },
    ],
  },
  {
    title: "Kanatal Cedar Stone Alpine Cottage",
    description: "Secluded rustic stone cabin nestled in the mist-shrouded cedar ridge of Kanatal. Wood burning stove, glass windows, and quiet forest vistas.",
    location: "Kanatal, Dhanaulti, Uttarakhand",
    price: 1750,
    category: "Hillside Hut",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Heated Radiators & Stove", hourlyPrice: 300, price: 300 },
      { name: "Board Games & Books Library", hourlyPrice: 100, price: 100 },
    ],
  },
  {
    title: "Kalpa Kinner Kailash Alpine Log Cabin",
    description: "Authentic pine log cabin situated high above Kalpa facing the sacred Kinner Kailash peak. Traditional wood carvings and solar heated comforts.",
    location: "Kalpa, Kinnaur, Himachal Pradesh",
    price: 2200,
    category: "Hillside Hut",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Kinnauri Apple Juice", hourlyPrice: 150, price: 150 },
      { name: "Wood Stove & Dry Pine Cones", hourlyPrice: 250, price: 250 },
    ],
  },
  {
    title: "Dhanaulti Eco-Pine Hut & Ridge",
    description: "Eco-friendly wooden cabin perched on a hillside ridge in Dhanaulti. Surrounded by deep deodars and crisp mountain winds.",
    location: "Dhanaulti, Mussoorie Hills, Uttarakhand",
    price: 1650,
    category: "Hillside Hut",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Organic Herb Tea Station", hourlyPrice: 120, price: 120 },
      { name: "Campfire Log Bench", hourlyPrice: 250, price: 250 },
    ],
  },
  {
    title: "Sonamarg Glacier-View Wood Haven",
    description: "Charming wooden outpost cabin facing the Thajiwas glacier in Sonamarg. Perfect for hikers, writers, and alpine retreat seekers.",
    location: "Sonamarg, Ganderbal, Jammu & Kashmir",
    price: 1950,
    category: "Hillside Hut",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Glacier Trekking Kit", hourlyPrice: 350, price: 350 },
      { name: "Samovar Tea Setup", hourlyPrice: 200, price: 200 },
    ],
  },

  // ==========================================
  // 4. GET TOGETHER SETUPS (6 spots)
  // ==========================================
  {
    title: "Jibhi Deodar Forest Gathering Lawn & BBQ",
    description: "Sprawling private open field adjacent to a gentle mountain stream in Jibhi. Designed for friends and family gatherings, acoustic jams, and barbecue parties.",
    location: "Jibhi, Banjar Valley, Himachal Pradesh",
    price: 2200,
    category: "Get Together Setup",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Charcoal BBQ Grill Station", hourlyPrice: 600, price: 600 },
      { name: "Campfire Circle with Benches", hourlyPrice: 400, price: 400 },
      { name: "Outdoor Movie Projector", hourlyPrice: 500, price: 500 },
    ],
  },
  {
    title: "Dehradun Sal Forest Party Clearing & Hearth",
    description: "Sunny forest glade surrounded by tall Sal trees in Maldevta. Ideal for birthday celebrations, team outings, outdoor barbecues, and acoustic jamming.",
    location: "Maldevta, Dehradun, Uttarakhand",
    price: 2000,
    category: "Get Together Setup",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Barbecue Master Assistant", hourlyPrice: 400, price: 400 },
      { name: "Booming Bluetooth PA Speaker", hourlyPrice: 250, price: 250 },
    ],
  },
  {
    title: "Mashobra Pines Group Gathering Plot",
    description: "Exclusive terraced lawn among cedar canopies in Mashobra. Includes open firepit, banquet buffet tables, and fairy-lit gazebos for evening parties.",
    location: "Mashobra, Shimla, Himachal Pradesh",
    price: 2400,
    category: "Get Together Setup",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Catering Buffet Station", hourlyPrice: 600, price: 600 },
      { name: "Fairy Light String Canopy", hourlyPrice: 350, price: 350 },
    ],
  },
  {
    title: "Bhimtal Lakeside Open Courtyard",
    description: "Lakeside lawn and cobblestone courtyard in Bhimtal. Features panoramic water views, a clay tandoor oven, and casual outdoor lounge seating.",
    location: "Bhimtal, Nainital District, Uttarakhand",
    price: 2100,
    category: "Get Together Setup",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Clay Tandoor & Charcoal Kit", hourlyPrice: 450, price: 450 },
      { name: "Lawn Badminton Kit", hourlyPrice: 150, price: 150 },
    ],
    corporateFriendly: {
      isCorporateFriendly: true,
      maxCorporateCapacity: 75,
      corporateAmenities: ["High-speed Wi-Fi", "Lakeside Deck AV Setup", "Buffet Dining Area", "Private Valet Parking"],
      corporateHourlyRate: 3500,
      corporateDayPackagePrice: 22000,
    },
  },
  {
    title: "Dharamkot Oak Canopy Circle & Jammery",
    description: "Bohemian forest amphitheater in Upper Dharamkot. Soft floor rugs, cushions, and wooden log seats perfect for community circles and group retreat sessions.",
    location: "Upper Dharamkot, Kangra, Himachal Pradesh",
    price: 1800,
    category: "Get Together Setup",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Acoustic Guitars & Djembe Kit", hourlyPrice: 300, price: 300 },
      { name: "Chai & Snack Urn", hourlyPrice: 250, price: 250 },
    ],
    corporateFriendly: {
      isCorporateFriendly: true,
      maxCorporateCapacity: 40,
      corporateAmenities: ["Fiber Wi-Fi", "Amphitheater Acoustics", "Catering & Tea Station", "Generator Backup"],
      corporateHourlyRate: 2600,
      corporateDayPackagePrice: 16000,
    },
  },
  {
    title: "Patnitop Pine Grove Gathering Meadow",
    description: "High mountain forest meadow in Patnitop with custom barbecue facilities, wooden picnic tables, and ample space for group games and retreats.",
    location: "Patnitop, Udhampur, Jammu & Kashmir",
    price: 1950,
    category: "Get Together Setup",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Barbecue Grill Station", hourlyPrice: 450, price: 450 },
      { name: "Pine Log Seating Circle", hourlyPrice: 200, price: 200 },
    ],
    corporateFriendly: {
      isCorporateFriendly: true,
      maxCorporateCapacity: 50,
      corporateAmenities: ["High-speed Wi-Fi", "Outdoor Projection Screen", "Bonfire Forum", "Catering & Barbecue"],
      corporateHourlyRate: 2900,
      corporateDayPackagePrice: 19000,
    },
  },

  // ==========================================
  // 5. MOUNTAIN CAFES (6 spots)
  // ==========================================
  {
    title: "Old Manali Rooftop Cedar Coffee Deck",
    description: "Cozy open-air mountain cafe terrace looking over Old Manali's apple orchards and snowy Rohtang peaks. Fresh artisanal espresso and organic baked goods.",
    location: "Old Manali Village, Himachal Pradesh",
    price: 1100,
    category: "Mountain Cafe",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Unlimited Espresso & Pour-Over", hourlyPrice: 250, price: 250 },
      { name: "High-Speed WiFi & Charging", hourlyPrice: 100, price: 100 },
      { name: "Heated Terrace Seat", hourlyPrice: 150, price: 150 },
    ],
  },
  {
    title: "Kasol Evergreen Herbal Brew Yard",
    description: "Bohemian courtyard garden cafe along the Chalal trail. Herbal infusions, acoustic background music, low seating, and panoramic pine tree shade.",
    location: "Chalal Trail, Kasol, Himachal Pradesh",
    price: 1050,
    category: "Mountain Cafe",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Organic Herbal Tea Pot", hourlyPrice: 150, price: 150 },
      { name: "Fresh Bakery Sampler", hourlyPrice: 200, price: 200 },
    ],
  },
  {
    title: "Landour Pine Courtyard Cafe & Bakery",
    description: "Classic colonial mountain cafe patio nestled among Landour's deodars. Fresh apple pies, cinnamon crepes, and crisp mountain morning views.",
    location: "Landour Cantt, Mussoorie, Uttarakhand",
    price: 1300,
    category: "Mountain Cafe",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Landour Bakery Pastry Set", hourlyPrice: 250, price: 250 },
      { name: "French Press Coffee", hourlyPrice: 180, price: 180 },
    ],
  },
  {
    title: "Tapovan Cliffside Ganga Cafe Terrace",
    description: "Sunlit open terrace cafe overlooking the turquoise Ganges in Tapovan. Vegan smoothie bowls, specialty roasts, and soothing temple chimes.",
    location: "Tapovan, Rishikesh, Uttarakhand",
    price: 1200,
    category: "Mountain Cafe",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Ayurvedic Herbal Brews", hourlyPrice: 150, price: 150 },
      { name: "Yoga Mat & Sunset Deck Access", hourlyPrice: 120, price: 120 },
    ],
  },
  {
    title: "Bhagsunag Waterfall Terrace Cafe",
    description: "Perched high on the rocks directly facing the Bhagsunag waterfall. Mountain breezes, steaming ginger-lemon-honey tea, and Tibetan momos.",
    location: "Bhagsunag, McLeod Ganj, Himachal Pradesh",
    price: 950,
    category: "Mountain Cafe",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Ginger Lemon Honey Tea", hourlyPrice: 100, price: 100 },
      { name: "Waterfall View Front Table", hourlyPrice: 150, price: 150 },
    ],
  },
  {
    title: "Leh Changspa Organic Orchard Cafe",
    description: "Sun-drenched apricot orchard garden cafe in Changspa. Tibetan butter tea, Ladakhi sourdough bread, and snow-capped Stok Kangri views.",
    location: "Changspa Lane, Leh, Ladakh",
    price: 1350,
    category: "Mountain Cafe",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Traditional Butter Tea & Khambir", hourlyPrice: 200, price: 200 },
      { name: "Warm Woolen Poncho", hourlyPrice: 100, price: 100 },
    ],
  },

  // ==========================================
  // 6. RIVERSIDE MEADOWS (6 spots)
  // ==========================================
  {
    title: "Rishikesh Ganga Riverbank Grassy Clearing",
    description: "A peaceful, natural grassy meadow right on the banks of the sacred Ganges in Shivpuri. Far away from city traffic, ideal for meditation and river sound immersion.",
    location: "Shivpuri, Rishikesh, Uttarakhand",
    price: 1600,
    category: "Riverside Meadow",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Riverside Bonfire & Seating", hourlyPrice: 450, price: 450 },
      { name: "Outdoor Yoga Mats", hourlyPrice: 250, price: 250 },
    ],
  },
  {
    title: "Tirthan River Pebble Glade & Angling Shore",
    description: "Private crystal-clear trout stream riverbank clearing in Gushaini. Shaded by alders and willows, with pure alpine water rushing past smooth river boulders.",
    location: "Gushaini, Tirthan Valley, Himachal Pradesh",
    price: 1550,
    category: "Riverside Meadow",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Fly Fishing Rod & Reel", hourlyPrice: 350, price: 350 },
      { name: "River Camp Chairs", hourlyPrice: 150, price: 150 },
    ],
  },
  {
    title: "Parvati Valley Chalal Riverbanks Meadow",
    description: "Quiet sandy meadow bordered by tall pines along the rushing Parvati River. Unmatched natural serenity for hammocks, acoustic tunes, and outdoor camping.",
    location: "Chalal, Kasol, Himachal Pradesh",
    price: 1450,
    category: "Riverside Meadow",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Riverside Firepit Setup", hourlyPrice: 300, price: 300 },
      { name: "Waterproof Tarp Canopy", hourlyPrice: 200, price: 200 },
    ],
  },
  {
    title: "Beas River Sandbar Camping Glade",
    description: "Natural sand and pebble island clearing in the upper Beas river near Bahang. Dramatic mountain walls rise up on either side with cool river spray.",
    location: "Bahang, Manali, Himachal Pradesh",
    price: 1400,
    category: "Riverside Meadow",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Barbecue Grill Station", hourlyPrice: 350, price: 350 },
      { name: "Campfire Pine Logs", hourlyPrice: 250, price: 250 },
    ],
  },
  {
    title: "Lidder River Pine Shore Meadow",
    description: "Vibrant grassy clearing beside the crystal glacier waters of the Lidder River in Pahalgam. Shaded by blue pines with snow peaks glittering above.",
    location: "Lidder Valley, Pahalgam, Jammu & Kashmir",
    price: 1700,
    category: "Riverside Meadow",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Trout Angling Gear", hourlyPrice: 300, price: 300 },
      { name: "Samovar Kahwa Service", hourlyPrice: 200, price: 200 },
    ],
  },
  {
    title: "Alaknanda Confluence River Meadow",
    description: "Elevated river terrace overlooking the emerald waters of the Alaknanda in Devprayag. Breathtaking spiritual tranquility and clean mountain breezes.",
    location: "Devprayag, Tehri Garhwal, Uttarakhand",
    price: 1500,
    category: "Riverside Meadow",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Sunset Meditation Cushions", hourlyPrice: 150, price: 150 },
      { name: "Acoustic Flute & Sound Bowls", hourlyPrice: 250, price: 250 },
    ],
  },

  // ==========================================
  // 7. EMPTY PLOTS (6 spots)
  // ==========================================
  {
    title: "Pahalgam Pine Valley Terraced Glade",
    description: "A stunning green terraced meadow plot in Aru Valley, bordered by pine forests and crystal glacier streams. Open sky views with complete silence for mindful travelers, campouts, and creators.",
    location: "Aru Valley, Pahalgam, Jammu & Kashmir",
    price: 1400,
    category: "Empty Plot",
    isFeatured: true,
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Wood Log Firepit", hourlyPrice: 400, price: 400 },
      { name: "Weatherproof Canvas Canopy", hourlyPrice: 350, price: 350 },
      { name: "Samovar Herbal Kahwa", hourlyPrice: 300, price: 300 },
    ],
  },
  {
    title: "Spiti High-Desert Stargazing Plateau",
    description: "Expansive raw mountain land in Kaza facing the stark cold-desert peaks of Spiti. Zero light pollution, offering the purest stargazing and astro-photography in India.",
    location: "Kaza, Spiti Valley, Himachal Pradesh",
    price: 1600,
    category: "Empty Plot",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Professional Astro Telescope", hourlyPrice: 400, price: 400 },
      { name: "Sub-Zero Sleeping Bags", hourlyPrice: 300, price: 300 },
    ],
  },
  {
    title: "Hatu Peak Ridge Apple Plateau Plot",
    description: "Sunny private hilltop land in Narkanda overlooking dense fir forests and 360-degree snow lines. Open canvas for yoga retreats, small events, or custom tent camping.",
    location: "Narkanda, Shimla Hills, Himachal Pradesh",
    price: 1350,
    category: "Empty Plot",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Campfire Kit & Wood", hourlyPrice: 300, price: 300 },
      { name: "Drinking Water Dispenser", hourlyPrice: 100, price: 100 },
    ],
  },
  {
    title: "Chakrata Tiger Falls Overlook Plot",
    description: "Quiet mountain ridge field above the Tiger Falls canyon in Chakrata. Pristine pine scented air, total seclusion, and natural stone seating boulders.",
    location: "Chakrata, Dehradun Hills, Uttarakhand",
    price: 1250,
    category: "Empty Plot",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Alpine Tent Pitch Assistance", hourlyPrice: 200, price: 200 },
      { name: "Firewood Bundle", hourlyPrice: 250, price: 250 },
    ],
  },
  {
    title: "Pangong Tso Wilderness Shore Glade",
    description: "Spectacular barren lakeside land on the shores of Pangong Lake in Spangmik. Surreal blue waters reflecting snow summits, ideal for self-sustained expedition campouts.",
    location: "Spangmik, Pangong Tso, Ladakh",
    price: 1800,
    category: "Empty Plot",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "High-Altitude Oxygen Cylinder", hourlyPrice: 350, price: 350 },
      { name: "Wind-Resistant Dome Tent", hourlyPrice: 450, price: 450 },
    ],
  },
  {
    title: "Barot Valley Uhl Terraced Farmland",
    description: "Picturesque terraced plot directly above the Uhl river in Barot. Fertile grass terraces lined with cedar trees, ideal for quiet creative work and camping.",
    location: "Barot Valley, Mandi, Himachal Pradesh",
    price: 1200,
    category: "Empty Plot",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Trout Fishing Permit & Kit", hourlyPrice: 300, price: 300 },
      { name: "Firepit Setup", hourlyPrice: 250, price: 250 },
    ],
  },

  // ==========================================
  // 8. CAMPFIRE STAYS (6 spots)
  // ==========================================
  {
    title: "Kasol Pine Forest Night Campfire Glade",
    description: "Deep pine forest clearing on the Grahan trail in Kasol. Custom stone firepit, crackling deodar logs, ambient lantern lighting, and stargazing blankets.",
    location: "Grahan Forest Trail, Kasol, Himachal Pradesh",
    price: 1400,
    category: "Campfire Stays",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Unlimited Campfire Logs", hourlyPrice: 350, price: 350 },
      { name: "Barbecue Grill & Skewers", hourlyPrice: 300, price: 300 },
      { name: "Warm Wool Blankets", hourlyPrice: 150, price: 150 },
    ],
  },
  {
    title: "Byasi Cliffside Firepit Glamping Plot",
    description: "High riverbank terrace overlooking the Ganges gorge in Byasi. Enjoy roaring bonfire circles under the stars accompanied by the steady sound of rushing water.",
    location: "Byasi, Rishikesh, Uttarakhand",
    price: 1500,
    category: "Campfire Stays",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Roaring Bonfire & Pine Cones", hourlyPrice: 400, price: 400 },
      { name: "Outdoor Acoustic Guitar", hourlyPrice: 200, price: 200 },
    ],
  },
  {
    title: "Chail Sanctuary Deodar Night Hearth",
    description: "Enchanted night clearing inside the pine forests of Chail. Circular stone fire hearth, log seats, and crisp pine air in complete mountain tranquility.",
    location: "Chail Sanctuary Road, Solan, Himachal Pradesh",
    price: 1450,
    category: "Campfire Stays",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Campfire & Marshmallow Kit", hourlyPrice: 250, price: 250 },
      { name: "Pine Wood Stash", hourlyPrice: 300, price: 300 },
    ],
  },
  {
    title: "Binsar Oak Wilderness Fire Clearing",
    description: "Panoramic clearing in the Binsar sanctuary. Unmatched 300-km Himalayan snow panorama during sunset, transitioning to a blazing campfire under the stars.",
    location: "Binsar Sanctuary, Almora, Uttarakhand",
    price: 1600,
    category: "Campfire Stays",
    owner: owner1._id,
    image: "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Himalayan Herbal Tea Kettle", hourlyPrice: 150, price: 150 },
      { name: "Campfire Logs Bundle", hourlyPrice: 350, price: 350 },
    ],
  },
  {
    title: "Sethan Igloo & Starlight Campfire Plot",
    description: "High-altitude mountain clearing in Sethan village (Hampta Pass base). Surrounded by pristine snowbanks and deep pine forests with blazing central firepit.",
    location: "Sethan Village, Manali, Himachal Pradesh",
    price: 1750,
    category: "Campfire Stays",
    owner: owner2._id,
    image: "https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Sub-Zero Thermal Blankets", hourlyPrice: 250, price: 250 },
      { name: "Hot Mountain Soup Station", hourlyPrice: 200, price: 200 },
    ],
  },
  {
    title: "Yusmarg Meadow Twilight Fire Stay",
    description: "Quiet alpine pine glade in Yusmarg (Meadow of Jesus). A gentle stream nearby, crackling firelogs, and panoramic views of the Sunset Peak.",
    location: "Yusmarg, Budgam, Jammu & Kashmir",
    price: 1500,
    category: "Campfire Stays",
    owner: owner3._id,
    image: "https://images.unsplash.com/photo-1496545672447-f699b503d270?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1496545672447-f699b503d270?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { name: "Kashmiri Samovar Kahwa", hourlyPrice: 250, price: 250 },
      { name: "Campfire Log Hearth", hourlyPrice: 350, price: 350 },
    ],
  },
];

  // Distribute realistic ratings (range 4.3 – 5.0) and guest capacities (2 – 12)
  const ratingsPool = [4.8, 4.6, 4.9, 4.7, 4.5, 5.0, 4.4, 4.9, 4.7, 4.8, 4.6, 4.9];
  const guestsPool = [4, 6, 8, 2, 10, 6, 4, 12, 6, 8, 4, 10];

  return rawSpots.map((spot, idx) => ({
    ...spot,
    rating: spot.rating !== undefined ? spot.rating : ratingsPool[idx % ratingsPool.length],
    maxGuests: spot.maxGuests !== undefined ? spot.maxGuests : guestsPool[idx % guestsPool.length],
  }));
};
