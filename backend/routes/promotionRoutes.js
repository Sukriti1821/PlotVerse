const express = require("express");
const router = express.Router();
const { protect, ownerOnly } = require("../middleware/authMiddleware");
const {
  getOwnerPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionActive,
  featureSpotListing,
  validatePromoCode,
  getSpotPromotions,
} = require("../controllers/promotionController");

// Public endpoints
router.post("/validate", validatePromoCode);
router.get("/spot/:spotId", getSpotPromotions);

// Protected Landowner / Host endpoints
router.get("/owner", protect, ownerOnly, getOwnerPromotions);
router.post("/", protect, ownerOnly, createPromotion);
router.put("/:id", protect, ownerOnly, updatePromotion);
router.delete("/:id", protect, ownerOnly, deletePromotion);
router.patch("/:id/toggle", protect, ownerOnly, togglePromotionActive);
router.post("/spot/:spotId/feature", protect, ownerOnly, featureSpotListing);

module.exports = router;
