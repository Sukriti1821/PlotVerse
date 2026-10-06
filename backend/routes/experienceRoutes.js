const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const {
  getAllExperiences,
  getExperienceById,
  getOwnerExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
} = require("../controllers/experienceController");
const { protect, ownerOnly, optionalAuth } = require("../middleware/authMiddleware");

// PUBLIC DISCOVERY (Filters, categories, duration, search)
router.get("/", optionalAuth, getAllExperiences);

// OWNER LISTINGS (All packages belonging to logged-in host)
router.get("/owner/me", protect, ownerOnly, getOwnerExperiences);

// SINGLE EXPERIENCE DETAILS
router.get("/:id", optionalAuth, getExperienceById);

// CREATE EXPERIENCE (Host Builder)
router.post(
  "/",
  protect,
  ownerOnly,
  upload.array("images", 5),
  createExperience
);

// UPDATE EXPERIENCE (Host Builder)
router.patch(
  "/:id",
  protect,
  ownerOnly,
  upload.array("images", 5),
  updateExperience
);

// DELETE / DEACTIVATE EXPERIENCE
router.delete("/:id", protect, ownerOnly, deleteExperience);

module.exports = router;
