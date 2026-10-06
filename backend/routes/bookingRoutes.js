const express = require("express");
const router = express.Router();

const {
  createBooking,
  getCustomerBookings,
  getOwnerBookings,
  updateBookingStatus,
  cancelBooking,
  respondToCustomRequest,
  acceptCustomRequestPrice,
} = require("../controllers/bookingController");

const { protect, ownerOnly } = require("../middleware/authMiddleware");
const { validateCreateBooking } = require("../middleware/validationMiddleware");

// 1. Create booking (Customer)
router.post("/", protect, validateCreateBooking, createBooking);

// 2. Get customer bookings
router.get("/mine", protect, getCustomerBookings);
router.get("/mybookings", protect, getCustomerBookings);
router.get("/user", protect, getCustomerBookings);

// 3. Get owner's spot bookings
router.get("/owner", protect, ownerOnly, getOwnerBookings);

// 4. Update booking status (confirm/reject/cancel)
router.patch("/:id/status", protect, updateBookingStatus);
router.put("/:id/status", protect, updateBookingStatus);

// 5. Cancel booking
router.put("/:id/cancel", protect, cancelBooking);
router.delete("/:id", protect, cancelBooking);

// 6. Custom Request endpoints
router.patch("/:id/custom-request/:index", protect, ownerOnly, respondToCustomRequest);
router.patch("/:id/custom-request/:index/accept", protect, acceptCustomRequestPrice);

module.exports = router;