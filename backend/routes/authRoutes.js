const express = require("express");

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

const router = express.Router();

router.post("/register", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password/:token", validateResetPassword, resetPassword);

module.exports = router;