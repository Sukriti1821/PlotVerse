const express = require("express");
const router = express.Router();

const {
  createBooking,
  getUserBookings,
  cancelBooking,
} = require("../controllers/bookingController");

const { protect } = require("../middleware/authMiddleware");

// Create booking
router.post("/", protect, createBooking);

// Get user bookings
router.get("/mybookings", protect, getUserBookings);

// Cancel booking
router.delete("/:id", protect, cancelBooking);

module.exports = router;