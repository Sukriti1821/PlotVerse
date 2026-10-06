const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const {
  createSpot,
  getAllSpots,
  getSpotById,
  getOwnerSpots,
  getAvailableAmenities,
  updateSpot,
  deleteSpot,
  getSpotAvailability,
  checkSpotSlot,
  calculateSpotPrice,
  trackSpotClick,
  toggleWishlist,
  getUserWishlist,
} = require("../controllers/spotController");
const { getRecommendations } = require("../controllers/recommendationController");

const { protect, ownerOnly, optionalAuth } = require("../middleware/authMiddleware");
const { validateCreateSpot, validateUpdateSpot } = require("../middleware/validationMiddleware");

// CREATE (Up to 5 images)
router.post(
  "/",
  protect,
  ownerOnly,
  upload.array("images", 5),
  validateCreateSpot,
  createSpot
);

// GET DISTINCT AMENITIES (Public catalog)
router.get("/amenities", getAvailableAmenities);

// GET SMART RECOMMENDATIONS (Contextual, intent-based, and personalized plot recommendations)
router.get("/recommendations", optionalAuth, getRecommendations);

// GET OWNER LISTINGS (Protected, shows both active and inactive spots for the logged-in owner)
router.get("/owner/me", protect, ownerOnly, getOwnerSpots);

// GET ALL (Public: active spots only, dynamic search, filters, sorting, pagination)
router.get("/", optionalAuth, getAllSpots);

// GET SPOT AVAILABILITY SCHEDULE (Public: real-time operating hours, booked slots, buffer, timeline)
router.get("/:id/availability", getSpotAvailability);

// PRE-FLIGHT SLOT VALIDATION (Public: checks overlap, operating hours, buffer, min/max duration)
router.post("/:id/check-slot", checkSpotSlot);

// CALCULATE DYNAMIC PRICING BREAKDOWN (Public: returns itemized rate, adjustments, discounts)
router.post("/:id/calculate-price", calculateSpotPrice);

// GET USER WISHLIST (Protected: returns saved favorite spots)
router.get("/user/wishlist", protect, getUserWishlist);

// GET SINGLE (Public: active spots; inactive spots accessible only by owning host)
router.get("/:id", optionalAuth, getSpotById);

// TRACK SPOT CLICK (Public: records listing click)
router.post("/:id/click", trackSpotClick);

// TOGGLE SPOT WISHLIST (Protected: saves or unsaves destination from user favorites)
router.post("/:id/wishlist", protect, toggleWishlist);

// UPDATE (PATCH - standard endpoint)
router.patch(
  "/:id",
  protect,
  ownerOnly,
  upload.array("images", 5),
  validateUpdateSpot,
  updateSpot
);

// UPDATE (PUT - backwards compatibility)
router.put(
  "/:id",
  protect,
  ownerOnly,
  upload.array("images", 5),
  validateUpdateSpot,
  updateSpot
);

// DELETE (Protected, ownership + active bookings check)
router.delete("/:id", protect, ownerOnly, deleteSpot);

module.exports = router;