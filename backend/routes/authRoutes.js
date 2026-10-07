const express = require("express");

const rateLimit = require("express-rate-limit");

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require("../middleware/validationMiddleware");

// Stricter rate limiting specifically for Login and Register (10 attempts / 15 minutes per IP)
const loginRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  },
});

const router = express.Router();

router.post("/register", loginRegisterLimiter, validateRegister, registerUser);
router.post("/login", loginRegisterLimiter, validateLogin, loginUser);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password/:token", validateResetPassword, resetPassword);

module.exports = router;