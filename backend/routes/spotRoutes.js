const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const {
  createSpot,
  getAllSpots,
  getSpotById,
  updateSpot,
  deleteSpot,
} = require("../controllers/spotController");

const { protect, ownerOnly } = require("../middleware/authMiddleware");


// CREATE
router.post(
  "/",
  protect,
  ownerOnly,
  upload.single("image"),
  createSpot
);

// GET ALL
router.get("/", getAllSpots);

// GET SINGLE
router.get("/:id", getSpotById);

// UPDATE
router.put("/:id", protect, ownerOnly, updateSpot);

// DELETE
router.delete("/:id", protect, ownerOnly, deleteSpot);


module.exports = router;