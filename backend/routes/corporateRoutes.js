const express = require("express");
const router = express.Router();
const {
  createOrUpdateOrg,
  getMyOrg,
  getSpaces,
  createBookingOrQuote,
  getMyBookings,
  getHostRequests,
  submitQuote,
  acceptQuote,
  declineQuote,
  updateSpotCorporateSettings,
} = require("../controllers/corporateController");
const { protect, ownerOnly } = require("../middleware/authMiddleware");

// Public / open browsing of corporate-ready outdoor spaces and experiences
router.get("/spaces", getSpaces);

// Corporate Organization management
router.post("/organization", protect, createOrUpdateOrg);
router.get("/organization", protect, getMyOrg);

// Corporate Bookings & RFP Quote Workflow (Organizer endpoints)
router.post("/book", protect, createBookingOrQuote);
router.get("/my-bookings", protect, getMyBookings);
router.post("/accept-quote/:bookingId", protect, acceptQuote);
router.post("/decline-quote/:bookingId", protect, declineQuote);

// Landowner / Host controls
router.get("/owner-requests", protect, ownerOnly, getHostRequests);
router.post("/quote/:bookingId", protect, ownerOnly, submitQuote);
router.put("/spot-settings/:spotId", protect, ownerOnly, updateSpotCorporateSettings);

module.exports = router;
