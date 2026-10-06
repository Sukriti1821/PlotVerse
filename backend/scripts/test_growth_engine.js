/**
 * Automated Test Suite — Feature 6: Landowner Growth Tools
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

let hostToken = "";
let hostUserId = "";
let hostSpotId = "";
let otherHostToken = "";
let customerToken = "";
let createdPromoId = "";

async function runTests() {
  console.log("=================================================");
  console.log("🚀 Thikana — Landowner Growth Tools Test Suite");
  console.log("=================================================\n");

  try {
    // 1. Authenticate Host Aarav
    console.log("1️⃣ Authenticating Host Aarav (aarav.host@thikana.com)...");
    const hostLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "aarav.host@thikana.com",
      password: "Test@123",
    });
    hostToken = hostLoginRes.data.token;
    hostUserId = hostLoginRes.data._id || hostLoginRes.data.user?._id;

    // Clean up any existing test promos for idempotency
    const existingPromosRes = await axios.get(`${BASE_URL}/promotions/owner`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    for (const p of existingPromosRes.data?.data?.promotions || []) {
      if (p.code === "SUMMER20" || p.code === "FLAT500" || p.promoType === "banner_announcement") {
        await axios.delete(`${BASE_URL}/promotions/${p._id}`, {
          headers: { Authorization: `Bearer ${hostToken}` },
        });
      }
    }

    // Get a spot owned by Aarav
    const spotsRes = await axios.get(`${BASE_URL}/spots/owner/me`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    const spots = spotsRes.data?.data || spotsRes.data || [];
    if (spots.length === 0) throw new Error("Host Aarav has no spots listed");
    hostSpotId = spots[0]._id;
    console.log(`   ✅ Host logged in. Found spot "${spots[0].title}" (${hostSpotId})\n`);

    // 2. Authenticate Other Host Meera
    console.log("2️⃣ Authenticating Other Host Meera (meera.stays@thikana.com)...");
    const otherHostRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "meera.stays@thikana.com",
      password: "Test@123",
    });
    otherHostToken = otherHostRes.data.token;
    console.log("   ✅ Host Meera authenticated.\n");

    // 3. Authenticate Customer Rohan
    console.log("3️⃣ Authenticating Customer Rohan (rohan.travel@thikana.com)...");
    const custRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "rohan.travel@thikana.com",
      password: "Test@123",
    });
    customerToken = custRes.data.token;
    console.log("   ✅ Customer Rohan authenticated.\n");

    // 4. Create Promo Code (Percentage Discount)
    console.log("4️⃣ Host Aarav creates promo code 'SUMMER20' (20% off, min ₹1,500)...");
    const createRes = await axios.post(
      `${BASE_URL}/promotions`,
      {
        title: "Summer Sunshine 20% Off",
        code: "SUMMER20",
        promoType: "coupon_code",
        discountType: "percentage",
        discountValue: 20,
        applicableType: "all",
        minBookingValue: 1500,
        usageLimit: 50,
      },
      { headers: { Authorization: `Bearer ${hostToken}` } }
    );
    createdPromoId = createRes.data.data._id;
    console.log(`   ✅ Created promo code "${createRes.data.data.code}" (ID: ${createdPromoId})\n`);

    // 5. Create Fixed Discount Promo Code
    console.log("5️⃣ Host Aarav creates promo code 'FLAT500' (₹500 off, min ₹1,000)...");
    const flatRes = await axios.post(
      `${BASE_URL}/promotions`,
      {
        title: "Flat ₹500 Off Mountain Stays",
        code: "FLAT500",
        promoType: "coupon_code",
        discountType: "fixed",
        discountValue: 500,
        applicableType: "all",
        minBookingValue: 1000,
        usageLimit: 25,
      },
      { headers: { Authorization: `Bearer ${hostToken}` } }
    );
    console.log(`   ✅ Created fixed promo "${flatRes.data.data.code}" (₹${flatRes.data.data.discountValue} Off)\n`);

    // 6. Create Promotional Announcement Banner
    console.log("6️⃣ Host Aarav creates a promotional announcement banner on his spot...");
    const bannerRes = await axios.post(
      `${BASE_URL}/promotions`,
      {
        title: "Free Campfire Firewood This Weekend",
        promoType: "banner_announcement",
        discountType: "fixed",
        discountValue: 0,
        applicableType: "spot",
        applicableSpot: hostSpotId,
        bannerText: "🔥 Weekend Campfire Deal: Complimentary marsh-mallows with all bonfire bookings!",
      },
      { headers: { Authorization: `Bearer ${hostToken}` } }
    );
    console.log(`   ✅ Created banner: "${bannerRes.data.data.bannerText}"\n`);

    // 7. Verify Public Spot Promotions Endpoint
    console.log(`7️⃣ Testing GET /api/promotions/spot/${hostSpotId} (Public)...`);
    const publicSpotPromosRes = await axios.get(`${BASE_URL}/promotions/spot/${hostSpotId}`);
    const spotPromos = publicSpotPromosRes.data.data.promotions;
    console.log(`   Found ${spotPromos.length} active promotions/banners for this spot.`);
    if (spotPromos.length === 0) throw new Error("Expected active spot promotions");
    console.log("   ✅ Public spot promotions retrieved.\n");

    // 8. Test Promo Code Validation
    console.log("8️⃣ Testing POST /api/promotions/validate...");
    
    // Case A: Valid SUMMER20 on ₹2,000 subtotal (Expect ₹400 discount)
    const validCheckRes = await axios.post(`${BASE_URL}/promotions/validate`, {
      code: "SUMMER20",
      spotId: hostSpotId,
      subtotal: 2000,
    });
    console.log(`   Case A (Valid ₹2,000 subtotal): Discount = ₹${validCheckRes.data.discountAmount}`);
    if (validCheckRes.data.discountAmount !== 400) {
      throw new Error(`Expected ₹400 discount, got ₹${validCheckRes.data.discountAmount}`);
    }

    // Case B: Subtotal below minimum (₹1,000 < ₹1,500)
    try {
      await axios.post(`${BASE_URL}/promotions/validate`, {
        code: "SUMMER20",
        spotId: hostSpotId,
        subtotal: 1000,
      });
      throw new Error("Expected failure due to minBookingValue not met!");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`   Case B (Under minimum ₹1,500): Correctly rejected -> "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // Case C: Invalid Code
    try {
      await axios.post(`${BASE_URL}/promotions/validate`, {
        code: "INVALIDCODE123",
        spotId: hostSpotId,
        subtotal: 2000,
      });
      throw new Error("Expected failure for invalid code!");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`   Case C (Invalid code): Correctly rejected -> "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }
    console.log("   ✅ Promo code validation verified.\n");

    // 9. Test Cross-Tenant Security
    console.log("9️⃣ Testing Cross-Tenant Guard (Host Meera attempting to delete Host Aarav's promo)...");
    try {
      await axios.delete(`${BASE_URL}/promotions/${createdPromoId}`, {
        headers: { Authorization: `Bearer ${otherHostToken}` },
      });
      throw new Error("Host Meera should not be able to delete Aarav's promo!");
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log("   ✅ Correctly blocked cross-tenant deletion with 403 Forbidden.\n");
      } else {
        throw err;
      }
    }

    // 10. Test Booking Creation with Promo Code Applied
    console.log("🔟 Testing Booking Creation with 'SUMMER20' applied...");
    const randomDayOffset = 40 + Math.floor(Math.random() * 50);
    const futureDate = new Date(Date.now() + randomDayOffset * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const bookingRes = await axios.post(
      `${BASE_URL}/bookings`,
      {
        spotId: hostSpotId,
        date: futureDate,
        startTime: "11:00",
        endTime: "15:00",
        durationHours: 4,
        guests: 2,
        promoCode: "SUMMER20",
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );

    const createdBooking = bookingRes.data.data;
    console.log(`   Booking Created (ID: ${createdBooking._id})`);
    console.log(`   Total Price Paid: ₹${createdBooking.totalPrice}`);
    console.log(`   Applied Promo: ${createdBooking.appliedPromotion?.code} (-₹${createdBooking.appliedPromotion?.discountAmount})`);

    if (!createdBooking.appliedPromotion || createdBooking.appliedPromotion.code !== "SUMMER20") {
      throw new Error("appliedPromotion missing or incorrect on booking");
    }

    // Verify promo usage incremented
    const checkPromoRes = await axios.get(`${BASE_URL}/promotions/owner`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    const updatedPromo = checkPromoRes.data.data.promotions.find((p) => p._id === createdPromoId);
    console.log(`   Promo "${updatedPromo.code}" timesUsed: ${updatedPromo.timesUsed}`);
    if (updatedPromo.timesUsed !== 1) {
      throw new Error(`Expected timesUsed to be 1, got ${updatedPromo.timesUsed}`);
    }
    console.log("   ✅ Booking creation with promo and usage increment verified.\n");

    // 11. Test Featured Listing Sponsorship
    console.log("1️⃣1️⃣ Testing Featured Listing Sponsorship...");
    const featureRes = await axios.post(
      `${BASE_URL}/promotions/spot/${hostSpotId}/feature`,
      {
        isFeatured: true,
        durationDays: 14,
        tier: "spotlight",
        sponsoredBadge: "Top Pick Retreat",
      },
      { headers: { Authorization: `Bearer ${hostToken}` } }
    );

    console.log(`   Featured Status: ${featureRes.data.data.isFeatured}`);
    console.log(`   Tier: ${featureRes.data.data.featuredConfig.tier}`);
    console.log(`   Badge: "${featureRes.data.data.featuredConfig.sponsoredBadge}"`);
    console.log(`   Featured Until: ${featureRes.data.data.featuredConfig.featuredUntil}`);

    if (!featureRes.data.data.isFeatured) throw new Error("Spot was not marked as featured");
    console.log("   ✅ Featured listing sponsorship verified.\n");

    console.log("=================================================");
    console.log("🎉 ALL LANDOWNER GROWTH TOOLS TESTS PASSED!");
    console.log("=================================================\n");
  } catch (err) {
    console.error("❌ Test failed:", err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
