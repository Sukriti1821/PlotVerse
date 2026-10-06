const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Spot = require("../models/Spot");

const imagesToCopy = [
  {
    src: "C:\\Users\\sukriti sharma\\.gemini\\antigravity-ide\\brain\\0ed14c79-17fa-41bd-9ac0-0e9d115646ee\\candlelit_ridge_dinner_1788935893372.jpg",
    destName: "date-night-naggar-gazebo.jpg",
    spotTitle: "Naggar Twilight Gazebo & Candlelit Hearth",
  },
  {
    src: "C:\\Users\\sukriti sharma\\.gemini\\antigravity-ide\\brain\\0ed14c79-17fa-41bd-9ac0-0e9d115646ee\\boho_mountain_date_1788935913946.jpg",
    destName: "date-night-boho-ridge.jpg",
    spotTitle: "Nigeen Shore Floating Candlelit Terrace", // or open field date
  },
  {
    src: "C:\\Users\\sukriti sharma\\.gemini\\antigravity-ide\\brain\\0ed14c79-17fa-41bd-9ac0-0e9d115646ee\\starlit_mountain_deck_1788935939312.jpg",
    destName: "date-night-landour-terrace.jpg",
    spotTitle: "Landour Starlit Terrace Date Setup",
  },
  {
    src: "C:\\Users\\sukriti sharma\\.gemini\\antigravity-ide\\brain\\0ed14c79-17fa-41bd-9ac0-0e9d115646ee\\riverside_date_deck_1788935965058.jpg",
    destName: "date-night-kasol-riverside.jpg",
    spotTitle: "Kasol Parvati Waterside Date Deck",
  },
  {
    src: "C:\\Users\\sukriti sharma\\.gemini\\antigravity-ide\\brain\\0ed14c79-17fa-41bd-9ac0-0e9d115646ee\\sunset_hill_deck_1788935989572.jpg",
    destName: "date-night-pangot-deck.jpg",
    spotTitle: "Pangot Hill Romantic Sunset Deck",
  },
];

async function updateDateNightImages() {
  const backendDir = path.join(__dirname, "../uploads");
  const frontendDir = path.join(__dirname, "../../frontend/public/uploads");

  fs.mkdirSync(backendDir, { recursive: true });
  fs.mkdirSync(frontendDir, { recursive: true });

  for (const item of imagesToCopy) {
    const backendTarget = path.join(backendDir, item.destName);
    const frontendTarget = path.join(frontendDir, item.destName);

    fs.copyFileSync(item.src, backendTarget);
    fs.copyFileSync(item.src, frontendTarget);

    console.log(`Copied ${item.destName}: ${fs.statSync(backendTarget).size} bytes`);
  }

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  for (const item of imagesToCopy) {
    const uploadPath = `uploads/${item.destName}`;
    const spot = await Spot.findOne({ title: item.spotTitle });
    if (spot) {
      spot.image = uploadPath;
      spot.images = [uploadPath, ...(spot.images || []).filter((i) => !i.includes(item.destName))];
      await spot.save();
      console.log(`✅ Updated MongoDB spot "${spot.title}" -> ${spot.image}`);
    } else {
      console.warn(`⚠️ Spot not found: ${item.spotTitle}`);
    }
  }

  await mongoose.connection.close();
  console.log("Finished updating date night setups.");
  process.exit(0);
}

updateDateNightImages().catch((err) => {
  console.error("Error updating date night images:", err);
  process.exit(1);
});
