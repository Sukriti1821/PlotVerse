const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Spot = require("../models/Spot");

async function updateManaliSpot() {
  const src = "C:\\Users\\sukriti sharma\\.gemini\\antigravity-ide\\brain\\0ed14c79-17fa-41bd-9ac0-0e9d115646ee\\.user_uploaded\\media_1788934609356.png";
  const backendDest = path.join(__dirname, "../uploads/old-manali-date-setup.png");
  const frontendDest = path.join(__dirname, "../../frontend/public/uploads/old-manali-date-setup.png");

  // Ensure directories exist
  fs.mkdirSync(path.dirname(backendDest), { recursive: true });
  fs.mkdirSync(path.dirname(frontendDest), { recursive: true });

  // Bit-for-bit copy without re-encoding to maintain 100% original quality
  fs.copyFileSync(src, backendDest);
  fs.copyFileSync(src, frontendDest);

  console.log("Image copied to backend uploads:", fs.existsSync(backendDest), fs.statSync(backendDest).size);
  console.log("Image copied to frontend public uploads:", fs.existsSync(frontendDest), fs.statSync(frontendDest).size);

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  // Find the Old Manali spot
  const spot = await Spot.findOne({ title: { $regex: /Old Manali/i } });
  if (!spot) {
    console.error("Old Manali spot not found in MongoDB!");
    process.exit(1);
  }

  console.log("Found spot:");
  console.log("  Previous Title   :", spot.title);
  console.log("  Previous Location:", spot.location);
  console.log("  Previous Image   :", spot.image);

  // User requested: "change the location name to just Old manali sunset date setup"
  spot.location = "Old manali sunset date setup";
  spot.image = "uploads/old-manali-date-setup.png";
  spot.images = [
    "uploads/old-manali-date-setup.png",
    ...(spot.images || []).filter((img) => img !== "uploads/old-manali-date-setup.png")
  ];

  await spot.save();

  console.log("\nUpdated spot successfully:");
  console.log("  New Location:", spot.location);
  console.log("  New Image   :", spot.image);
  console.log("  Images Array:", spot.images);

  await mongoose.connection.close();
  process.exit(0);
}

updateManaliSpot().catch((err) => {
  console.error("Error updating spot:", err);
  process.exit(1);
});
