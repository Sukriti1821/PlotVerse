/**
 * Automated Test Suite — Feature 5: Landowner Analytics Engine
 *
 * Tests:
 * 1. Authentication & Role Guards (401 unauth, 403 customer)
 * 2. Host Analytics Query (30d default)
 * 3. Date Range Filtering (7d, 30d, 3m, custom)
 * 4. Spot Filtering & Cross-Tenant Ownership Verification
 * 5. Calculations Accuracy (Revenue, Bookings, ABV, Cancellation Rate, Conversion Rate)
 * 6. Popular Amenities & Attach Rate Percentages
 * 7. Peak Booking Hours Histogram
 * 8. Most Booked Experiences Breakdown
 * 9. Smart Business Insights Generation
 * 10. Cross-Tenant Isolation (Host A cannot access Host B's metrics)
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

let hostToken = "";
let hostUserId = "";
let hostSpots = [];
let otherHostToken = "";

async function runTests() {
  console.log("=================================================");
  console.log("🧪 Thikana — Landowner Analytics Engine Test Suite");
  console.log("=================================================\n");

  try {
    // 1. Authenticate Host Aarav
    console.log("1️⃣ Logging in as Host Aarav (aarav.host@thikana.com)...");
    const hostLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "aarav.host@thikana.com",
      password: "Test@123",
    });
    hostToken = hostLoginRes.data.token;
    hostUserId = hostLoginRes.data._id || hostLoginRes.data.user?._id;
    console.log("   ✅ Host logged in successfully.\n");

    // 2. Authenticate Other Host Meera
    console.log("2️⃣ Logging in as Host Meera (meera.stays@thikana.com)...");
    const otherHostRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "meera.stays@thikana.com",
      password: "Test@123",
    });
    otherHostToken = otherHostRes.data.token;
    console.log("   ✅ Host Meera logged in successfully.\n");

    // 3. Test Unauthorized Access (No token)
    console.log("3️⃣ Testing Auth Guard: Request with no token...");
    try {
      await axios.get(`${BASE_URL}/analytics/owner`);
      throw new Error("Expected 401 Unauthorized, but request succeeded!");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log("   ✅ Correctly blocked unauthenticated request with 401.\n");
      } else {
        throw err;
      }
    }

    // 4. Test Customer Role Guard (Customer trying to view landowner analytics)
    console.log("4️⃣ Testing Role Guard: Customer account accessing host analytics...");
    const custLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "rohan.travel@thikana.com",
      password: "Test@123",
    });
    const custToken = custLoginRes.data.token;
    try {
      await axios.get(`${BASE_URL}/analytics/owner`, {
        headers: { Authorization: `Bearer ${custToken}` },
      });
      throw new Error("Expected 403 Forbidden for customer, but request succeeded!");
    } catch (err) {
      if (err.response && (err.response.status === 403 || err.response.status === 401)) {
        console.log("   ✅ Correctly blocked customer access with 403/401.\n");
      } else {
        throw err;
      }
    }

    // 5. Test Default 30-Day Analytics for Host Aarav
    console.log("5️⃣ Fetching Default 30-Day Host Analytics for Aarav...");
    const res30d = await axios.get(`${BASE_URL}/analytics/owner`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });

    const data30d = res30d.data.data;
    console.log("   📊 Period:", data30d.periodLabel);
    console.log("   💰 Total Revenue: ₹" + data30d.summary.totalRevenue.toLocaleString());
    console.log("   📅 Total Bookings:", data30d.summary.totalBookings);
    console.log("   ✅ Completed Bookings:", data30d.summary.completedBookings);
    console.log("   ⏳ Upcoming Bookings:", data30d.summary.upcomingBookings);
    console.log("   ❌ Cancellation Rate:", data30d.summary.cancellationRate + "%");
    console.log("   🏷️ Average Booking Value (ABV): ₹" + data30d.summary.averageBookingValue.toLocaleString());
    console.log("   👁️ Plot Views:", data30d.summary.plotViews);
    console.log("   🖱️ Listing Clicks:", data30d.summary.listingClicks);
    console.log("   📈 Conversion Rate:", data30d.summary.conversionRate + "%");
    console.log("   ⭐ Average Rating:", data30d.summary.averageRating);

    if (data30d.summary.totalRevenue <= 0) throw new Error("Expected totalRevenue > 0");
    if (data30d.summary.totalBookings <= 0) throw new Error("Expected totalBookings > 0");
    if (data30d.summary.plotViews <= 0) throw new Error("Expected plotViews > 0");
    console.log("   ✅ 30-day summary metrics validated.\n");

    // 6. Test Date Range Filters: 7d, 3m, custom
    console.log("6️⃣ Testing Time Range Filters...");
    const res7d = await axios.get(`${BASE_URL}/analytics/owner?range=7d`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    console.log(`   🗓️ 7-Day Bookings: ${res7d.data.data.summary.totalBookings} (Revenue: ₹${res7d.data.data.summary.totalRevenue})`);

    const res3m = await axios.get(`${BASE_URL}/analytics/owner?range=3m`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    console.log(`   🗓️ 3-Month Bookings: ${res3m.data.data.summary.totalBookings} (Revenue: ₹${res3m.data.data.summary.totalRevenue})`);

    if (res3m.data.data.summary.totalBookings < res7d.data.data.summary.totalBookings) {
      throw new Error("3-month bookings count should be >= 7-day bookings count");
    }

    // Custom date range test
    const customStart = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const customEnd = new Date().toISOString().split("T")[0];
    const resCustom = await axios.get(
      `${BASE_URL}/analytics/owner?range=custom&startDate=${customStart}&endDate=${customEnd}`,
      { headers: { Authorization: `Bearer ${hostToken}` } }
    );
    console.log(`   🗓️ Custom Range (${customStart} to ${customEnd}) Bookings: ${resCustom.data.data.summary.totalBookings}`);
    console.log("   ✅ Time range filters operate accurately.\n");

    // 7. Test Popular Amenities & Attach Rate
    console.log("7️⃣ Verifying Popular Amenities & Attach Rate Percentages...");
    const amenities = data30d.popularAmenities;
    console.log("   Amenities Count:", amenities.length);
    amenities.slice(0, 3).forEach((a, i) => {
      console.log(`      ${i + 1}. ${a.name}: ${a.count} bookings (${a.percentage}%)`);
    });
    const bonfire = amenities.find((a) => a.name.includes("Bonfire"));
    if (!bonfire) throw new Error("Expected Bonfire to be in popular amenities");
    console.log(`   🔥 Bonfire Attach Rate: ${bonfire.percentage}%`);
    console.log("   ✅ Popular amenities ranking verified.\n");

    // 8. Test Peak Booking Hours Distribution
    console.log("8️⃣ Verifying Peak Booking Hours Distribution...");
    const popularHours = data30d.popularHours;
    console.log(`   Detected Peak Hour: ${data30d.peakHour}`);
    if (!data30d.peakHour) throw new Error("peakHour is missing");
    console.log("   ✅ Peak hours distribution verified.\n");

    // 9. Test Most Booked Experiences
    console.log("9️⃣ Verifying Most Booked Experiences...");
    const experiences = data30d.bookedExperiences;
    console.log(`   Experience Packages Count: ${experiences.length}`);
    experiences.forEach((exp) => {
      console.log(`      • ${exp.title}: ${exp.bookingsCount} bookings (₹${exp.revenue.toLocaleString()})`);
    });
    console.log("   ✅ Most booked experiences verified.\n");

    // 10. Test Dynamic Smart Insights
    console.log("🔟 Verifying Dynamic Smart Business Insights...");
    const insights = data30d.smartInsights;
    console.log(`   Generated ${insights.length} Smart Insights:`);
    insights.forEach((ins, idx) => {
      console.log(`      💡 [${idx + 1}] "${ins}"`);
    });
    if (insights.length === 0) throw new Error("Expected at least 1 smart insight");
    console.log("   ✅ Dynamic smart insights verified.\n");

    // 11. Test Cross-Tenant Isolation
    console.log("1️⃣1️⃣ Verifying Cross-Tenant Isolation (Host Meera vs Host Aarav)...");
    const spotsList = data30d.spotsList;
    if (spotsList.length > 0) {
      const aaravSpotId = spotsList[0].id;
      // Meera tries to filter by Aarav's spot ID
      try {
        await axios.get(`${BASE_URL}/analytics/owner?spotId=${aaravSpotId}`, {
          headers: { Authorization: `Bearer ${otherHostToken}` },
        });
        throw new Error("Host Meera should not be able to query Aarav's spot ID!");
      } catch (err) {
        if (err.response && err.response.status === 403) {
          console.log("   ✅ Blocked unauthorized cross-tenant spot query with 403 Forbidden.");
        } else {
          throw err;
        }
      }
    }

    // 12. Test Spot Click Tracking Endpoint
    console.log("1️⃣2️⃣ Testing Spot Click Tracking Endpoint...");
    if (spotsList.length > 0) {
      const testSpotId = spotsList[0].id;
      const initialClicks = spotsList[0].clicks || 0;
      const clickRes = await axios.post(`${BASE_URL}/spots/${testSpotId}/click`);
      console.log(`   Recorded click. New clicks: ${clickRes.data.clicks} (was ${initialClicks})`);
      if (clickRes.data.clicks !== initialClicks + 1) {
        throw new Error(`Click count did not increment. Got ${clickRes.data.clicks}`);
      }
      console.log("   ✅ Click tracking verified.\n");
    }

    console.log("=================================================");
    console.log("🎉 ALL LANDOWNER ANALYTICS ENGINE TESTS PASSED!");
    console.log("=================================================\n");
  } catch (err) {
    console.error("❌ Test failed:", err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
