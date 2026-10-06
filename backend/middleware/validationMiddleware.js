const { validationResult, body, param, query } = require("express-validator");

/**
 * Middleware to check validation results and return formatted 400 response
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach((err) => {
      const field = err.path || err.param || "general";
      if (!formattedErrors[field]) {
        formattedErrors[field] = err.msg;
      }
    });

    const firstMessage = errors.array()[0]?.msg || "Invalid request parameters";

    return res.status(400).json({
      success: false,
      message: firstMessage,
      errors: formattedErrors,
    });
  }
  next();
};

/**
 * Registration validation rules
 */
const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .optional()
    .trim()
    .isIn(["customer", "owner", "tourist", "admin"])
    .withMessage("Invalid user role. Allowed roles: customer, owner"),
  validate,
];

/**
 * Login validation rules
 */
const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  validate,
];

/**
 * Spot Creation & Update validation rules
 */
const validateCreateSpot = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Spot title is required")
    .isLength({ min: 3, max: 150 })
    .withMessage("Title must be between 3 and 150 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 4000 })
    .withMessage("Description must be between 10 and 4000 characters"),
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Location must be between 3 and 200 characters"),
  body("price")
    .notEmpty()
    .withMessage("Hourly rate / price is required")
    .isNumeric()
    .withMessage("Price must be a valid number")
    .custom((val) => Number(val) >= 0)
    .withMessage("Price cannot be negative"),
  body("category")
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage("Category name is too long"),
  validate,
];

/**
 * Booking creation validation rules
 */
const validateCreateBooking = [
  body(["spotId", "spot"])
    .custom((value, { req }) => {
      const target = req.body.spotId || req.body.spot;
      if (!target || !target.toString().trim()) {
        throw new Error("Spot ID is required");
      }
      return true;
    }),
  body("date")
    .notEmpty()
    .withMessage("Booking date is required")
    .isISO8601()
    .withMessage("Invalid date format (must be YYYY-MM-DD or ISO string)"),
  body("startTime")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Start time must be in HH:MM format (24-hour)"),
  body("endTime")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("End time must be in HH:MM format (24-hour)"),
  body("guests")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Guests must be an integer between 1 and 100"),
  validate,
];

/**
 * Spot Update validation rules (fields optional for partial updates)
 */
const validateUpdateSpot = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Spot title cannot be empty")
    .isLength({ min: 3, max: 150 })
    .withMessage("Title must be between 3 and 150 characters"),
  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Description cannot be empty")
    .isLength({ min: 10, max: 4000 })
    .withMessage("Description must be between 10 and 4000 characters"),
  body("location")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Location cannot be empty")
    .isLength({ min: 3, max: 200 })
    .withMessage("Location must be between 3 and 200 characters"),
  body("price")
    .optional()
    .isNumeric()
    .withMessage("Price must be a valid number")
    .custom((val) => Number(val) >= 0)
    .withMessage("Price cannot be negative"),
  body("category")
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage("Category name is too long"),
  validate,
];

/**
 * Forgot password validation rules
 */
const validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  validate,
];

/**
 * Reset password validation rules
 */
const validateResetPassword = [
  body("password")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  validate,
];

module.exports = {
  validate,
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateCreateSpot,
  validateUpdateSpot,
  validateCreateBooking,
};
