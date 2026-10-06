const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  getOwners,
  getOwnerSpots,
  updateOwnerStatus,
  updateOwnerApproval,
  getSpotsForModeration,
  moderateSpot,
  getBookingsOversight,
  getSettings,
  updateSettings,
  getPayouts,
  markPayoutsAsPaid,
  backfillHistoricalBookings,
} = require("../controllers/adminController");

// Protect all admin endpoints with JWT token and strict adminOnly role check
router.use(protect, adminOnly);

// 1. Dashboard Overview Stats
router.get("/stats", getDashboardStats);

// 2. Owner Management
router.get("/owners", getOwners);
router.get("/owners/:id/spots", getOwnerSpots);
router.patch("/owners/:id/status", updateOwnerStatus);
router.patch("/owners/:id/approval", updateOwnerApproval);

// 3. Spot Moderation
router.get("/spots", getSpotsForModeration);
router.patch("/spots/:id/moderate", moderateSpot);

// 4. Bookings Oversight
router.get("/bookings", getBookingsOversight);

// 5. Global Settings & Commission Control
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

// 6. Payout Tracking & Settlements
router.get("/payouts", getPayouts);
router.patch("/payouts/mark-paid", markPayoutsAsPaid);

// 7. Migration / Backfill
router.post("/migrate-backfill", backfillHistoricalBookings);

module.exports = router;
