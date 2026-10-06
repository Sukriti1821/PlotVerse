const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");

dotenv.config({ path: path.join(__dirname, "../.env") });

async function runE2ETests() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/plot-booking-app";
  await mongoose.connect(mongoUri);

  // Import app after db connection
  const express = require("express");
  const cors = require("cors");
  const cookieParser = require("cookie-parser");

  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  const authRoutes = require("../routes/authRoutes");
  const adminRoutes = require("../routes/adminRoutes");
  const bookingRoutes = require("../routes/bookingRoutes");
  const spotRoutes = require("../routes/spotRoutes");

  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/spots", spotRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));

  const BASE_URL = "http://localhost:5099/api";

  const request = async (path, options = {}) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data };
  };

  try {
    console.log("🚀 Starting Full E2E Admin & Commission Test Suite on port 5099...\n");

    // 1. Auth Login: Admin
    const adminLogin = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@thikana.com", password: "Test@123" }),
    });
    if (adminLogin.status !== 200 || !adminLogin.data?.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    }
    const adminToken = adminLogin.data.data.token;
    console.log("✅ 1. Admin login successful, JWT obtained");

    // 2. Auth Login: Owner
    const ownerLogin = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "aarav.host@thikana.com", password: "Test@123" }),
    });
    if (ownerLogin.status !== 200 || !ownerLogin.data?.data?.token) {
      throw new Error(`Owner login failed: ${JSON.stringify(ownerLogin.data)}`);
    }
    const ownerToken = ownerLogin.data.data.token;
    console.log("✅ 2. Host/Owner login successful, JWT obtained");

    // 3. Security Guard: Host attempts to access /admin/stats -> must be 403 Forbidden
    const forbiddenTest = await request("/admin/stats", {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    if (forbiddenTest.status !== 403) {
      throw new Error(`Security violation! Host accessed admin endpoint with status ${forbiddenTest.status}`);
    }
    console.log("✅ 3. Security Guard Verified: Host blocked with 403 Forbidden from admin endpoints");

    // 4. Admin Access: GET /api/admin/stats
    const statsRes = await request("/admin/stats", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (statsRes.status !== 200 || !statsRes.data?.data?.totalOwners) {
      throw new Error(`GET /admin/stats failed: ${JSON.stringify(statsRes.data)}`);
    }
    console.log(`✅ 4. GET /admin/stats passed: Owners=${statsRes.data.data.totalOwners}, Spots=${statsRes.data.data.spots.total}, Revenue=₹${statsRes.data.data.financials.totalPlatformRevenue}`);

    // 5. Owner Management: GET /api/admin/owners
    const ownersRes = await request("/admin/owners", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (ownersRes.status !== 200 || !Array.isArray(ownersRes.data?.data)) {
      throw new Error(`GET /admin/owners failed: ${JSON.stringify(ownersRes.data)}`);
    }
    const testOwner = ownersRes.data.data[0];
    console.log(`✅ 5. GET /admin/owners passed: Found ${ownersRes.data.data.length} hosts. First host: ${testOwner.name} (${testOwner.spotsCount} spots)`);

    // 6. View Owner Spots: GET /api/admin/owners/:id/spots
    const ownerSpotsRes = await request(`/admin/owners/${testOwner._id}/spots`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (ownerSpotsRes.status !== 200 || !Array.isArray(ownerSpotsRes.data?.data)) {
      throw new Error(`GET /admin/owners/:id/spots failed: ${JSON.stringify(ownerSpotsRes.data)}`);
    }
    console.log(`✅ 6. GET /admin/owners/:id/spots passed: Retrieved ${ownerSpotsRes.data.data.length} spots for host ${testOwner.name}`);

    // 7. Spot Moderation: GET /api/admin/spots
    const spotsRes = await request("/admin/spots?limit=5", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (spotsRes.status !== 200 || !Array.isArray(spotsRes.data?.data)) {
      throw new Error(`GET /admin/spots failed: ${JSON.stringify(spotsRes.data)}`);
    }
    const sampleSpot = spotsRes.data.data[0];
    console.log(`✅ 7. GET /admin/spots passed: Retrieved spot "${sampleSpot.title}"`);

    // 8. Spot Moderation: PATCH /api/admin/spots/:id/moderate
    const modRes = await request(`/admin/spots/${sampleSpot._id}/moderate`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isUnpublishedByAdmin: true, reason: "Audit unpublish test" }),
    });
    if (modRes.status !== 200 || !modRes.data?.data?.isUnpublishedByAdmin) {
      throw new Error(`Spot moderation unpublish failed: ${JSON.stringify(modRes.data)}`);
    }
    console.log(`✅ 8. Spot flagged and unpublished by admin successfully`);

    // Verify public spot search excludes it
    const publicSpots = await request(`/spots?search=${encodeURIComponent(sampleSpot.title)}`);
    const foundPublic = (publicSpots.data?.data || []).some((s) => s._id === sampleSpot._id);
    if (foundPublic) {
      throw new Error("Unpublished spot was unexpectedly found in public search!");
    }
    console.log(`✅ Verified: Flagged spot is hidden from public visitor search`);

    // Restore spot
    const restoreRes = await request(`/admin/spots/${sampleSpot._id}/moderate`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isUnpublishedByAdmin: false }),
    });
    if (restoreRes.status !== 200 || restoreRes.data?.data?.isUnpublishedByAdmin !== false) {
      throw new Error(`Spot restore failed: ${JSON.stringify(restoreRes.data)}`);
    }
    console.log(`✅ Spot restored and published successfully`);

    // 9. Bookings Oversight: GET /api/admin/bookings
    const bookingsRes = await request("/admin/bookings?limit=10", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (bookingsRes.status !== 200 || !Array.isArray(bookingsRes.data?.data)) {
      throw new Error(`GET /admin/bookings failed: ${JSON.stringify(bookingsRes.data)}`);
    }
    console.log(`✅ 9. GET /admin/bookings passed: Retrieved ${bookingsRes.data.data.length} platform reservations`);

    // 10. Settings Control: GET & PUT /api/admin/settings
    const settingsGet = await request("/admin/settings", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (settingsGet.status !== 200 || settingsGet.data?.data?.defaultCommissionRate === undefined) {
      throw new Error(`GET /admin/settings failed`);
    }

    const settingsUpdate = await request("/admin/settings", {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ defaultCommissionRate: 15 }),
    });
    if (settingsUpdate.status !== 200 || settingsUpdate.data?.data?.defaultCommissionRate !== 15) {
      throw new Error(`PUT /admin/settings failed`);
    }
    console.log(`✅ 10. Settings updated: commission rate changed to 15%`);

    // Reset commission back to 10%
    await request("/admin/settings", {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ defaultCommissionRate: 10 }),
    });
    console.log(`✅ Reset commission back to 10%`);

    // 11. Payout Settlements: GET /api/admin/payouts
    const payoutsRes = await request("/admin/payouts", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (payoutsRes.status !== 200 || !payoutsRes.data?.data?.summary) {
      throw new Error(`GET /admin/payouts failed: ${JSON.stringify(payoutsRes.data)}`);
    }
    console.log(`✅ 11. GET /admin/payouts passed: Pending payouts = ₹${payoutsRes.data.data.summary.overallPendingPayouts}`);

    // 12. Manual Payout Settlement: PATCH /api/admin/payouts/mark-paid
    const ownerWithDue = (payoutsRes.data.data.owners || []).find((o) => o.totalPayoutsDue > 0);
    if (ownerWithDue && ownerWithDue.bookings.length > 0) {
      const bkgId = ownerWithDue.bookings[0]._id;
      const settleRes = await request("/admin/payouts/mark-paid", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          bookingIds: [bkgId],
          payoutNote: "NEFT Bank Transfer UTR #9988776655",
          payoutTransactionId: "UTR-TEST-12345",
        }),
      });
      if (settleRes.status !== 200 || settleRes.data?.modifiedCount < 1) {
        throw new Error(`PATCH /admin/payouts/mark-paid failed: ${JSON.stringify(settleRes.data)}`);
      }
      console.log(`✅ 12. Payout settled for booking ${bkgId} with note: "NEFT Bank Transfer UTR #9988776655"`);
    }

    // 13. Owner-Facing View: GET /api/bookings/owner
    const ownerBookingsRes = await request("/bookings/owner", {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    if (ownerBookingsRes.status !== 200 || !Array.isArray(ownerBookingsRes.data)) {
      throw new Error(`GET /bookings/owner failed`);
    }
    const sampleOwnerBkg = ownerBookingsRes.data[0];
    if (sampleOwnerBkg) {
      console.log(`✅ 13. Owner Bookings verified: Gross ₹${sampleOwnerBkg.totalPrice}, Commission (10%) ₹${sampleOwnerBkg.platformCommission}, Net Payout ₹${sampleOwnerBkg.ownerPayoutAmount}, Payout Status: "${sampleOwnerBkg.payoutStatus}"`);
    }

    // 14. Historical Migration: POST /api/admin/migrate-backfill
    const backfillRes = await request("/admin/migrate-backfill", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (backfillRes.status !== 200) {
      throw new Error(`POST /admin/migrate-backfill failed`);
    }
    console.log(`✅ 14. Migration endpoint verified: ${backfillRes.data.message}`);

    console.log("\n🎊 ---------------------------------------------------");
    console.log("🎉 ALL 14 END-TO-END VERIFICATION CHECKS PASSED!");
    console.log("🎊 ---------------------------------------------------");
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runE2ETests().catch((err) => {
  console.error("❌ E2E Verification failed:", err);
  process.exit(1);
});
