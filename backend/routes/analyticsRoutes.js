const express = require("express");
const router = express.Router();
const { protect, ownerOnly } = require("../middleware/authMiddleware");
const { getOwnerAnalytics } = require("../controllers/analyticsController");

// GET /api/analytics/owner — Landowner Business Intelligence & Metrics (Protected)
router.get("/owner", protect, ownerOnly, getOwnerAnalytics);

module.exports = router;
