const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const {
  forgotPassword,
  resetPassword,
  loginUser,
} = require("../controllers/authController");

// Helper to mock express req/res
const createMockReqRes = (reqData = {}) => {
  const req = {
    params: reqData.params || {},
    body: reqData.body || {},
    query: reqData.query || {},
    headers: reqData.headers || {},
  };

  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };

  return { req, res };
};

async function runPasswordResetSanityCheck() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Password Reset Sanity Check.\n");

    const testEmail = "reset_tester@thikana.com";
    const oldPassword = "InitialPassword123";
    const newPassword = "UpdatedSecurePassword456";

    // Clean up any existing test user
    await User.deleteOne({ email: testEmail });

    // Hash initial password
    const salt = await bcrypt.genSalt(10);
    const initialHashedPassword = await bcrypt.hash(oldPassword, salt);

    const testUser = await User.create({
      name: "Reset Test User",
      email: testEmail,
      password: initialHashedPassword,
      role: "customer",
    });

    console.log(`Created test user: ${testUser.email} (${testUser._id})\n`);

    // ========================================================
    // SANITY CHECK 1: No email enumeration (identical responses)
    // ========================================================
    console.log("--- TEST 1: Generic Response to Prevent Email Enumeration ---");
    // 1a. Existing user email
    let existingUserRes;
    {
      const { req, res } = createMockReqRes({
        body: { email: testEmail },
      });
      await forgotPassword(req, res);
      existingUserRes = res.data;
      console.log(`Existing email response: status=${res.statusCode}, message="${res.data?.message}"`);
    }

    // 1b. Non-existent email
    let nonExistentUserRes;
    {
      const { req, res } = createMockReqRes({
        body: { email: "completely_unregistered_email@nowhere.com" },
      });
      await forgotPassword(req, res);
      nonExistentUserRes = res.data;
      console.log(`Unknown email response: status=${res.statusCode}, message="${res.data?.message}"`);
    }

    if (
      existingUserRes.message === nonExistentUserRes.message &&
      existingUserRes.success === true &&
      nonExistentUserRes.success === true
    ) {
      console.log("✅ PASSED: Forgot-password response is identical for existing and non-existing emails.\n");
    } else {
      throw new Error("Forgot-password leaked account existence!");
    }

    // ========================================================
    // SANITY CHECK 2: Token is securely hashed in database
    // ========================================================
    console.log("--- TEST 2: Token Security & Hashing in Database ---");
    const updatedUserInDb = await User.findById(testUser._id);
    console.log(`User resetPasswordToken in DB: ${updatedUserInDb.resetPasswordToken}`);
    console.log(`User resetPasswordExpires in DB: ${updatedUserInDb.resetPasswordExpires}`);

    if (
      updatedUserInDb.resetPasswordToken &&
      updatedUserInDb.resetPasswordToken.length === 64 && // SHA-256 hex string length
      updatedUserInDb.resetPasswordExpires > new Date()
    ) {
      console.log("✅ PASSED: Reset token is hashed with SHA-256 in DB and expiry is in the future.\n");
    } else {
      throw new Error("Token was not properly hashed or expiry not set in DB");
    }

    // ========================================================
    // SANITY CHECK 3: Expired token is rejected
    // ========================================================
    console.log("--- TEST 3: Expired Token Rejection ---");
    // Create an expired token for test
    const rawExpiredToken = crypto.randomBytes(32).toString("hex");
    const hashedExpiredToken = crypto.createHash("sha256").update(rawExpiredToken).digest("hex");

    testUser.resetPasswordToken = hashedExpiredToken;
    testUser.resetPasswordExpires = new Date(Date.now() - 1000 * 60 * 5); // 5 minutes in the past
    await testUser.save();

    {
      const { req, res } = createMockReqRes({
        params: { token: rawExpiredToken },
        body: { password: "SomeNewPassword123" },
      });

      await resetPassword(req, res);
      console.log(`Expired token status: ${res.statusCode}, message: "${res.data?.message}"`);

      if (res.statusCode === 400 && res.data?.message.toLowerCase().includes("expired")) {
        console.log("✅ PASSED: Expired token was rejected with clear error message.\n");
      } else {
        throw new Error(`Expected 400 for expired token, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }
    }

    // ========================================================
    // SANITY CHECK 4: Successful reset & Single-Use token
    // ========================================================
    console.log("--- TEST 4: Successful Reset & Single-Use Enforcement ---");
    // Generate fresh valid token
    const rawValidToken = crypto.randomBytes(32).toString("hex");
    const hashedValidToken = crypto.createHash("sha256").update(rawValidToken).digest("hex");

    testUser.resetPasswordToken = hashedValidToken;
    testUser.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour future
    await testUser.save();

    // 4a. Reset password with valid token
    {
      const { req, res } = createMockReqRes({
        params: { token: rawValidToken },
        body: { password: newPassword },
      });

      await resetPassword(req, res);
      console.log(`Valid reset status: ${res.statusCode}, message: "${res.data?.message}"`);

      if (res.statusCode === 200 && res.data?.success) {
        console.log("✅ PASSED: Password reset succeeded with valid token.");
      } else {
        throw new Error(`Password reset failed: ${JSON.stringify(res.data)}`);
      }
    }

    // 4b. Verify token cleared in DB
    const userAfterReset = await User.findById(testUser._id);
    if (!userAfterReset.resetPasswordToken && !userAfterReset.resetPasswordExpires) {
      console.log("✅ PASSED: Reset token and expiry fields were cleared from database.");
    } else {
      throw new Error("Reset token fields were not cleared from user record!");
    }

    // 4c. Reusing the same token should fail (single-use token)
    {
      const { req, res } = createMockReqRes({
        params: { token: rawValidToken },
        body: { password: "AnotherAttemptPassword789" },
      });

      await resetPassword(req, res);
      console.log(`Reused token status: ${res.statusCode}, message: "${res.data?.message}"`);

      if (res.statusCode === 400) {
        console.log("✅ PASSED: Reusing the same token was rejected (single-use enforced).\n");
      } else {
        throw new Error(`Reused token should return 400, got ${res.statusCode}`);
      }
    }

    // ========================================================
    // SANITY CHECK 5: Old password fails, new password works
    // ========================================================
    console.log("--- TEST 5: Password Update Verification (Login Checks) ---");
    // 5a. Login with OLD password must FAIL (401)
    {
      const { req, res } = createMockReqRes({
        body: { email: testEmail, password: oldPassword },
      });

      await loginUser(req, res);
      console.log(`Old password login status: ${res.statusCode}, message: "${res.data?.message}"`);

      if (res.statusCode === 401) {
        console.log("✅ PASSED: Old password no longer works for authentication.");
      } else {
        throw new Error(`Old password should fail with 401, got ${res.statusCode}`);
      }
    }

    // 5b. Login with NEW password must SUCCEED (200)
    {
      const { req, res } = createMockReqRes({
        body: { email: testEmail, password: newPassword },
      });

      await loginUser(req, res);
      console.log(`New password login status: ${res.statusCode}, message: "${res.data?.message}"`);

      if (res.statusCode === 200 && res.data?.token) {
        console.log("✅ PASSED: New password successfully authenticated user and issued JWT.\n");
      } else {
        throw new Error(`New password login failed: ${JSON.stringify(res.data)}`);
      }
    }

    // Cleanup
    await User.deleteOne({ _id: testUser._id });
    console.log("✅ Cleaned up temporary test user.");

    await mongoose.connection.close();
    console.log("🎉 ALL PASSWORD RESET SANITY CHECKS PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ PASSWORD RESET TEST ERROR:", err);
    process.exit(1);
  }
}

runPasswordResetSanityCheck();
