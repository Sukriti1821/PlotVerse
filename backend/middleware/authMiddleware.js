const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 1. JWT PROTECT MIDDLEWARE
// Verifies Bearer token, attaches user (without password) to req.user
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
    }

    if (req.user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended by the platform administrator. Please contact support.",
      });
    }

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized, token invalid or expired",
    });
  }
};

// 2. OWNER ONLY ROLE MIDDLEWARE
// Runs AFTER protect middleware; returns 403 Forbidden on role mismatch
const ownerOnly = (req, res, next) => {
  if (req.user && (req.user.role === "owner" || req.user.role === "admin")) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Host/Owner role required.",
    });
  }
};

// 2b. ADMIN ONLY ROLE MIDDLEWARE
// Runs AFTER protect middleware; strictly requires admin role
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Platform Administrator role required.",
    });
  }
};

// 3. CUSTOMER ONLY ROLE MIDDLEWARE
const customerOnly = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "customer" ||
      req.user.role === "tourist" ||
      req.user.role === "admin")
  ) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Customer role required.",
    });
  }
};

// 4. OPTIONAL AUTH MIDDLEWARE
// Attaches req.user if a valid token is provided, otherwise proceeds without error
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
  } catch (error) {
    // If token is invalid/expired in optional auth, proceed as unauthenticated
    req.user = null;
  }

  next();
};

module.exports = {
  protect,
  ownerOnly,
  adminOnly,
  customerOnly,
  optionalAuth,
};