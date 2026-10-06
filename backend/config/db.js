const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Sync active bookings into atomic slot locks for concurrency safety
    try {
      const { syncExistingBookingsToLocks } = require("../services/availabilityService");
      syncExistingBookingsToLocks();
    } catch (syncErr) {
      console.warn("[DB] Slot lock synchronization warning:", syncErr.message);
    }
  } catch (error) {
    console.log("Database Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;