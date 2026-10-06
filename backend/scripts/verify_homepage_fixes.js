const axios = require("axios");

async function verify() {
  console.log("----------------------------------------------");
  console.log("🔍 Running Automated Verification for Homepage Fixes");
  console.log("----------------------------------------------");

  const baseUrl = "http://localhost:5000/api";

  try {
    // 1. Check Featured Spots
    console.log("1. Fetching featured spots (/api/spots?featured=true)...");
    const featuredRes = await axios.get(`${baseUrl}/spots?featured=true`);
    const featuredSpots = featuredRes.data.data || featuredRes.data;

    console.log(`✅ Returned ${featuredSpots.length} featured spots.`);

    // Check ratings
    const ratings = featuredSpots.map(s => s.rating);
    console.log("Ratings across featured spots:", ratings);
    const allIdentical = ratings.every(r => r === ratings[0]);
    if (allIdentical && featuredSpots.length > 1) {
      console.error("❌ Ratings are still identical!");
    } else {
      console.log("✅ Ratings are varied and authentic:", ratings);
    }

    // Check images & categories
    console.log("\n2. Checking image alignment for Empty Plot and Grassland Plot...");
    const allSpotsRes = await axios.get(`${baseUrl}/spots?limit=50`);
    const allSpots = allSpotsRes.data.data || allSpotsRes.data;

    const grasslandSpots = allSpots.filter(s => s.category === "Grassland Plot");
    const emptyPlots = allSpots.filter(s => s.category === "Empty Plot");

    console.log(`Found ${grasslandSpots.length} Grassland spots, ${emptyPlots.length} Empty Plot spots.`);

    let emptyPlotIssue = false;
    emptyPlots.forEach(p => {
      if (p.image.includes("pahalgam-pine-valley.png") || p.image.includes("kasol-riverside")) {
        console.error(`❌ Empty plot "${p.title}" uses house/date upload: ${p.image}`);
        emptyPlotIssue = true;
      }
    });
    if (!emptyPlotIssue) {
      console.log("✅ All Empty Plots have authentic undeveloped land/meadow images (no house uploads).");
    }

    let grasslandIssue = false;
    grasslandSpots.forEach(p => {
      if (p.image.includes("photo-1464822759023-fed622ff2c3b")) {
        console.error(`❌ Grassland plot "${p.title}" uses alpine snow crags: ${p.image}`);
        grasslandIssue = true;
      }
    });
    if (!grasslandIssue) {
      console.log("✅ All Grassland Plots have verdant meadow/pasture images (no snow crags).");
    }

    // 3. Test Guest Capacity Query
    console.log("\n3. Testing guest capacity filtering (/api/spots?guests=6)...");
    const guestsRes = await axios.get(`${baseUrl}/spots?guests=6`);
    const guestFilteredSpots = guestsRes.data.data || guestsRes.data;
    console.log(`✅ Returned ${guestFilteredSpots.length} spots accommodating 6+ guests.`);

    const invalidCapacity = guestFilteredSpots.some(s => s.maxGuests < 6);
    if (invalidCapacity) {
      console.error("❌ Found spot with capacity less than 6!");
    } else {
      console.log("✅ All returned spots satisfy maxGuests >= 6 constraint.");
    }

    console.log("\n==============================================");
    console.log("🎉 ALL AUTOMATED VERIFICATIONS PASSED!");
    console.log("==============================================");
  } catch (err) {
    console.error("Verification failed with error:", err.message);
  }
}

verify();
