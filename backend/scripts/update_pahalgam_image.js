const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Spot = require("../models/Spot");

async function updatePahalgamImage() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const spot = await Spot.findOne({ title: { $regex: /Pahalgam/i } });
  if (!spot) {
    console.error("Pahalgam spot not found!");
    process.exit(1);
  }

  console.log("Found spot:", spot.title);
  console.log("Previous image:", spot.image);

  spot.image = "uploads/pahalgam-pine-valley.png";
  spot.images = [
    "uploads/pahalgam-pine-valley.png",
    ...(spot.images || []).filter((img) => img !== "uploads/pahalgam-pine-valley.png")
  ];

  await spot.save();
  console.log("Successfully updated Pahalgam spot image to:", spot.image);
  console.log("Full images array:", spot.images);

  await mongoose.connection.close();
  process.exit(0);
}

updatePahalgamImage().catch((err) => {
  console.error("Error updating spot:", err);
  process.exit(1);
});
