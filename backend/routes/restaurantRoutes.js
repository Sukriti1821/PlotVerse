const express = require("express");
const router = express.Router();
const {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = require("../controllers/restaurantController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public routes
router.get("/", getAllRestaurants);
router.get("/:id", getRestaurantById);

// Admin-Only management routes
router.post("/", protect, adminOnly, createRestaurant);
router.put("/:id", protect, adminOnly, updateRestaurant);
router.delete("/:id", protect, adminOnly, deleteRestaurant);

module.exports = router;
