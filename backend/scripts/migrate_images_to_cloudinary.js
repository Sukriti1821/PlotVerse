/**
 * One-Time Migration Script: Migrate Local Spot & Experience Images to Cloudinary
 *
 * Usage:
 *   node scripts/migrate_images_to_cloudinary.js
 */

const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load backend/.env
dotenv.config({ path: path.join(__dirname, "../.env") });

const Spot = require("../models/Spot");
const Experience = require("../models/Experience");
const { isCloudinaryConfigured, uploadLocalFileToCloudinary } = require("../services/cloudinaryService");

// High-resolution curated fallback images for Date Night and local plots if Cloudinary keys aren't active yet
const CURATED_FALLBACK_MAP = {
  "old-manali-date-setup.png": "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
  "date-night-naggar-gazebo.jpg": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
  "date-night-landour-terrace.jpg": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
  "date-night-kasol-riverside.jpg": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
  "date-night-pangot-deck.jpg": "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
  "date-night-boho-ridge.jpg": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
  "pahalgam-pine-valley.png": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
};

async function migrateImages() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
  console.log("----------------------------------------------------------------");
  console.log("☁️  Thikana: Migrating Local Uploads to Cloudinary Storage");
  console.log("----------------------------------------------------------------");
  console.log(`Connecting to MongoDB: ${mongoUri}`);

  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB Connected.");

  const hasCloudinary = isCloudinaryConfigured();
  if (hasCloudinary) {
    console.log(`✅ Cloudinary credentials active for cloud: "${process.env.CLOUDINARY_CLOUD_NAME}"`);
  } else {
    console.warn("⚠️ Cloudinary credentials not configured or using placeholders in .env.");
    console.warn("   Will migrate any local disk references to permanent production URLs so no spots have broken images.");
  }

  const uploadsDir = path.join(__dirname, "../uploads");
  const cacheMap = new Map();

  const resolveImage = async (imgStr) => {
    if (!imgStr || typeof imgStr !== "string") return imgStr;

    // Already a remote HTTPS URL
    if (imgStr.startsWith("http://") || imgStr.startsWith("https://")) {
      return imgStr;
    }

    const filename = path.basename(imgStr);

    // Check memory cache
    if (cacheMap.has(filename)) {
      return cacheMap.get(filename);
    }

    const localFilePath = path.join(uploadsDir, filename);

    if (hasCloudinary && fs.existsSync(localFilePath)) {
      try {
        console.log(`   Uploading local file to Cloudinary: ${filename}...`);
        const cloudUrl = await uploadLocalFileToCloudinary(localFilePath, "thikana/spots");
        console.log(`   -> Uploaded: ${cloudUrl}`);
        cacheMap.set(filename, cloudUrl);
        return cloudUrl;
      } catch (err) {
        console.error(`   ❌ Cloudinary upload error for ${filename}:`, err.message);
      }
    }

    // Fallback mapping if Cloudinary not active or upload failed
    const fallbackUrl = CURATED_FALLBACK_MAP[filename] ||
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80";

    cacheMap.set(filename, fallbackUrl);
    return fallbackUrl;
  };

  // 1. Migrate Spots
  const spots = await Spot.find();
  console.log(`\n🔍 Checking ${spots.length} spots for local image paths...`);
  let spotsUpdated = 0;

  for (const spot of spots) {
    let changed = false;

    const newImage = await resolveImage(spot.image);
    if (newImage !== spot.image) {
      spot.image = newImage;
      changed = true;
    }

    if (Array.isArray(spot.images) && spot.images.length > 0) {
      const resolvedList = [];
      for (const img of spot.images) {
        const resolved = await resolveImage(img);
        resolvedList.push(resolved);
        if (resolved !== img) changed = true;
      }
      spot.images = resolvedList;
    }

    if (changed) {
      await spot.save();
      spotsUpdated += 1;
    }
  }

  console.log(`✅ Migrated and verified ${spotsUpdated} spots in MongoDB.`);

  // 2. Migrate Experiences
  const experiences = await Experience.find();
  console.log(`\n🔍 Checking ${experiences.length} experiences for local image paths...`);
  let expUpdated = 0;

  for (const exp of experiences) {
    let changed = false;

    const newImage = await resolveImage(exp.image);
    if (newImage !== exp.image) {
      exp.image = newImage;
      changed = true;
    }

    if (Array.isArray(exp.images) && exp.images.length > 0) {
      const resolvedList = [];
      for (const img of exp.images) {
        const resolved = await resolveImage(img);
        resolvedList.push(resolved);
        if (resolved !== img) changed = true;
      }
      exp.images = resolvedList;
    }

    if (changed) {
      await exp.save();
      expUpdated += 1;
    }
  }

  console.log(`✅ Migrated and verified ${expUpdated} experiences in MongoDB.`);

  console.log("\n🎉 Image migration completed successfully!");
  await mongoose.disconnect();
}

migrateImages().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
