const express = require("express");

const { protect } = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// Protected Route
router.get("/profile", protect, (req, res) => {

  res.json({
    message: "Protected profile route accessed",
    user: req.user,
  });
});


// Owner Only Route
router.get(
  "/owner",
  protect,
  authorizeRoles("owner"),
  (req, res) => {

    res.json({
      message: "Owner dashboard accessed",
    });
  }
);


// Admin Only Route
router.get(
  "/admin",
  protect,
  authorizeRoles("admin"),
  (req, res) => {

    res.json({
      message: "Admin dashboard accessed",
    });
  }
);

module.exports = router;