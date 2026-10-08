const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../utils/asyncHandler");
const { sendPasswordResetEmail } = require("../services/emailService");
const referralService = require("../services/referralService");

// Email format regex
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

// 1. REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, referralCode } = req.body;

  // 1. Validate required fields
  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Please provide your full name",
    });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({
      success: false,
      message: "Please provide your email address",
    });
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address",
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  // 2. Reject missing or invalid role — no silent default
  if (!role || typeof role !== "string") {
    return res.status(400).json({
      success: false,
      message: "Please explicitly select an account role: customer or owner",
    });
  }

  const normalizedRole = role.toLowerCase().trim();
  const validRoles = ["customer", "owner", "tourist"];
  if (!validRoles.includes(normalizedRole)) {
    return res.status(400).json({
      success: false,
      message: "Invalid account role. Must be 'customer' or 'owner'.",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 3. Check duplicate email
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "An account with this email address already exists",
    });
  }

  // 4. Validate referral code if provided (Feature 8: Referral System)
  let validatedReferral = null;
  if (referralCode && typeof referralCode === "string" && referralCode.trim()) {
    const valResult = await referralService.validateReferralCode({
      code: referralCode.trim(),
      userEmail: normalizedEmail,
    });

    if (!valResult.valid) {
      return res.status(400).json({
        success: false,
        message: valResult.message,
      });
    }
    validatedReferral = valResult;
  }

  // 5. Generate unique referral code for the newly registering user
  const newUserReferralCode = await referralService.generateUniqueReferralCode(name);

  // 6. Hash password with bcryptjs (10 rounds)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 7. Create user (persisting explicit role, referral code, and referrer linkage)
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: normalizedRole === "tourist" ? "customer" : normalizedRole,
    referralCode: newUserReferralCode,
    referredBy: validatedReferral ? validatedReferral.referrer._id : null,
    walletBalance: 0,
    hasCompletedFirstBooking: false,
  });

  // 8. Register referral document if invited by another user
  if (validatedReferral) {
    await referralService.registerReferral({
      referrerCode: validatedReferral.code,
      newUserId: user._id,
      newUserEmail: user.email,
    });
  }

  const token = generateToken(user._id, user.role);

  // 9. Return response without password hash
  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
      walletBalance: user.walletBalance || 0,
      token,
    },
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    referralCode: user.referralCode,
    walletBalance: user.walletBalance || 0,
    token,
    message: validatedReferral
      ? `Registration successful! You and ${validatedReferral.referrer.name} will each receive ₹${referralService.DEFAULT_REWARD_AMOUNT} Thikana credit on your first completed booking.`
      : "Registration successful",
  });
});

// 2. LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide both email and password",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  // Compare hashed password via bcrypt.compare
  if (user && (await bcrypt.compare(password, user.password))) {
    // Lazy initialize referralCode if missing from legacy account
    const referralCode = await referralService.ensureUserReferralCode(user);

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode,
        walletBalance: user.walletBalance || 0,
        token,
      },
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode,
      walletBalance: user.walletBalance || 0,
      token,
      message: "Login successful",
    });
  } else {
    // Generic error message prevents account enumeration
    res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }
});

// 3. FORGOT PASSWORD
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({
      success: false,
      message: "Please provide your email address",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  // Generic confirmation message returned in all cases to prevent email enumeration
  const genericResponse = {
    success: true,
    message: "If an account exists with that email address, a password reset link has been sent.",
  };

  if (!user) {
    return res.status(200).json(genericResponse);
  }

  // 1. Generate secure raw random token
  const rawToken = crypto.randomBytes(32).toString("hex");

  // 2. Hash token using SHA-256 before storing (never store raw tokens in DB)
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  // 3. Set token and 1-hour expiry
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  // 4. Construct client reset URL
  const rawClientUrls = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((u) => u.trim().replace(/\/$/, ""))
    : [];
  const clientBaseUrl = rawClientUrls[0] || "http://localhost:5173";
  const resetUrl = `${clientBaseUrl}/reset-password/${rawToken}`;

  // 5. Send password reset email
  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });
  } catch (emailErr) {
    console.error("[AuthController] Error sending password reset email:", emailErr.message);
    // Continue and return generic response so client flow is unblocked
  }

  res.status(200).json(genericResponse);
});

// 4. RESET PASSWORD
const resetPassword = asyncHandler(async (req, res) => {
  const { token: rawToken } = req.params;
  const { password } = req.body;

  if (!rawToken) {
    return res.status(400).json({
      success: false,
      message: "Reset token is required",
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  // 1. Hash the incoming token to match the database hash
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  // 2. Find user with matching token and valid expiry
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired password reset token",
    });
  }

  // 3. Hash new password with bcryptjs
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);

  // 4. Clear reset token fields (single-use enforcement)
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  // 5. Issue new JWT for instant auto-login
  const authToken = generateToken(user._id, user.role);

  res.json({
    success: true,
    message: "Password reset successful. You may now sign in with your new password.",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: authToken,
    },
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: authToken,
  });
});

// 5. BECOME HOST (Upgrade authenticated account to owner role)
const becomeHost = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  user.role = "owner";
  await user.save();

  const token = generateToken(user._id, user.role);

  res.json({
    success: true,
    message: "Congratulations! Your account has been upgraded to Plot Owner / Host.",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
      walletBalance: user.walletBalance || 0,
      token,
    },
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    referralCode: user.referralCode,
    walletBalance: user.walletBalance || 0,
    token,
  });
});

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  becomeHost,
};