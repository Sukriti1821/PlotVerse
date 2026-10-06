const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Spot = require("../models/Spot");
const Booking = require("../models/Booking");
const Settings = require("../models/Settings");

async function testApiEndpoints() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
  await mongoose.connect(mongoUri);

  try {
    console.log("🌐 Testing Admin Endpoints Logic...");

    const admin = await User.findOne({ role: "admin" });
    const customer = await User.findOne({ role: "customer" });
    const owner = await User.findOne({ role: "owner" });

    const adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || "spotscape_secret_key");
    const customerToken = jwt.sign({ id: customer._id, role: customer.role }, process.env.JWT_SECRET || "spotscape_secret_key");

    // Require express app
    // We can directly invoke controller functions or use supertest if available
    const adminController = require("../controllers/adminController");

    // Mock Express req/res helper
    const mockReqRes = (params = {}, body = {}, query = {}, user = admin) => {
      const req = { params, body, query, user };
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

    // 1. Test getDashboardStats
    const { req: r1, res: s1 } = mockReqRes();
    await adminController.getDashboardStats(r1, s1);
    if (!s1.data.success || s1.data.data.totalOwners === undefined) {
      throw new Error("getDashboardStats returned invalid response");
    }
    console.log(`✅ getDashboardStats returned: ${s1.data.data.totalOwners} owners, ${s1.data.data.totalCustomers} customers, ${s1.data.data.spots.total} spots`);

    // 2. Test getOwners
    const { req: r2, res: s2 } = mockReqRes({}, {}, { search: "Aarav" });
    await adminController.getOwners(r2, s2);
    if (!s2.data.success || !Array.isArray(s2.data.data)) {
      throw new Error("getOwners failed");
    }
    console.log(`✅ getOwners search returned ${s2.data.data.length} owners`);

    // 3. Test getPayouts
    const { req: r3, res: s3 } = mockReqRes();
    await adminController.getPayouts(r3, s3);
    if (!s3.data.success || !s3.data.data.summary) {
      throw new Error("getPayouts failed");
    }
    console.log(`✅ getPayouts summary: Pending ₹${s3.data.data.summary.overallPendingPayouts}, Retained Commission ₹${s3.data.data.summary.overallCommissionRetained}`);

    // 4. Test Settings update
    const { req: r4, res: s4 } = mockReqRes({}, { defaultCommissionRate: 12 });
    await adminController.updateSettings(r4, s4);
    if (!s4.data.success || s4.data.data.defaultCommissionRate !== 12) {
      throw new Error("updateSettings failed");
    }
    console.log(`✅ updateSettings updated rate to ${s4.data.data.defaultCommissionRate}%`);

    // Reset back to 10%
    const { req: r5, res: s5 } = mockReqRes({}, { defaultCommissionRate: 10 });
    await adminController.updateSettings(r5, s5);
    console.log(`✅ reset commission back to 10%`);

    console.log("\n🎉 ALL CONTROLLER LOGIC TESTS PASSED!");
  } finally {
    await mongoose.disconnect();
  }
}

testApiEndpoints().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
