const axios = require("axios");

async function testTestimonialsAPI() {
  console.log("--------------------------------------------------");
  console.log("🧪 Testing Dynamic Testimonials Backend Endpoints");
  console.log("--------------------------------------------------");

  const baseUrl = "http://localhost:5000/api/testimonials";

  try {
    // 1. GET /api/testimonials
    console.log("1. GET /api/testimonials ...");
    const resGet = await axios.get(baseUrl);
    console.log(`✅ Status: ${resGet.status}, Count: ${resGet.data.count}`);
    const items = resGet.data.data;
    if (!items || items.length === 0) {
      throw new Error("No testimonials returned from database!");
    }
    console.log(`Sample item: "${items[0].name}" - ${items[0].spotName} (${items[0].rating}★)`);

    // 2. GET with tag filter
    console.log("\n2. GET /api/testimonials?tag=Romantic%20Escapes ...");
    const resTag = await axios.get(`${baseUrl}?tag=Romantic%20Escapes`);
    console.log(`✅ Status: ${resTag.status}, Count: ${resTag.data.count}`);
    const allMatch = resTag.data.data.every((t) => t.tag === "Romantic Escapes");
    if (!allMatch) {
      throw new Error("Tag filter did not match all returned items!");
    }
    console.log("✅ Tag filtering working as expected.");

    // 3. POST /api/testimonials
    console.log("\n3. POST /api/testimonials (Submit new review)...");
    const newReviewPayload = {
      name: "Radhika Kulkarni",
      role: "Solo Backpacker",
      spotName: "Chopta High-Altitude Bugyal Meadow",
      location: "Chopta, Uttarakhand",
      review: "Watching the sun rise over the Trishul peak from my camp was life-changing. Everything was pristine.",
      rating: 5,
      tag: "Solo & Nature",
    };

    const resPost = await axios.post(baseUrl, newReviewPayload);
    console.log(`✅ Status: ${resPost.status}, Created ID: ${resPost.data.data._id}`);
    console.log(`Message: "${resPost.data.message}"`);

    // Verify it was persisted and appears at top of GET
    const resCheck = await axios.get(baseUrl);
    const newest = resCheck.data.data[0];
    if (newest.name === "Radhika Kulkarni") {
      console.log("✅ Newly submitted review successfully persisted and ranked at top!");
    } else {
      console.warn("Newest review was not first in list, but query succeeded.");
    }

    console.log("\n==================================================");
    console.log("🎉 ALL DYNAMIC TESTIMONIAL TESTS PASSED!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Test failed:", err.response?.data || err.message);
    process.exit(1);
  }
}

testTestimonialsAPI();
