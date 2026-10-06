const Spot = require("../models/Spot");
const Booking = require("../models/Booking");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Normalizes an amenity name from string or object to lowercase trimmed string
 */
const normalizeAmenity = (amenity) => {
  if (!amenity) return "";
  if (typeof amenity === "string") return amenity.toLowerCase().trim();
  return (amenity.name || amenity.title || "").toLowerCase().trim();
};

/**
 * Helper to convert "HH:MM" to minutes from midnight
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const mins = parseInt(parts[1], 10) || 0;
  return hours * 60 + mins;
};

/**
 * Calculates Jaccard similarity between two sets of amenities
 */
const calculateAmenitySimilarity = (amenitiesA, amenitiesB) => {
  const setA = new Set((amenitiesA || []).map(normalizeAmenity).filter(Boolean));
  const setB = new Set((amenitiesB || []).map(normalizeAmenity).filter(Boolean));

  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.2;

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }

  const unionCount = new Set([...setA, ...setB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
};

/**
 * Maps user intent/vibe to target category keywords and amenities
 */
const INTENT_PRESETS = {
  date_night: {
    categoryKeywords: ["date night", "sunset", "romantic", "ridge"],
    amenitiesKeywords: ["bonfire", "candle", "music", "lighting", "tent"],
    idealCapacity: 2,
    reasonLabel: "Perfect for intimate date night & sunset views",
  },
  campfire: {
    categoryKeywords: ["campfire", "grassland", "camping", "glade"],
    amenitiesKeywords: ["bonfire", "wood", "tent", "barbecue", "bbq", "campfire"],
    idealCapacity: 4,
    reasonLabel: "Top pick for cozy campfires & starry nights",
  },
  group: {
    categoryKeywords: ["get together", "grassland", "meadow", "farm"],
    amenitiesKeywords: ["music", "seating", "generator", "wifi", "games"],
    idealCapacity: 8,
    reasonLabel: "Spacious layout for friends & group gatherings",
  },
  riverside: {
    categoryKeywords: ["riverside", "meadow", "valley", "stream"],
    amenitiesKeywords: ["tent", "water", "fishing", "bonfire"],
    idealCapacity: 4,
    reasonLabel: "Serene waterside location & alpine breeze",
  },
  cafe: {
    categoryKeywords: ["mountain cafe", "hut", "terrace", "cottage"],
    amenitiesKeywords: ["wifi", "coffee", "power", "seating", "table"],
    idealCapacity: 4,
    reasonLabel: "Great for remote work, coffee & creative retreats",
  },
};

/**
 * @desc    Get Smart Recommendations for outdoor plots
 * @route   GET /api/spots/recommendations
 * @access  Public (Enhanced when authenticated via optionalAuth)
 */
const getRecommendations = asyncHandler(async (req, res) => {
  const {
    spotId,
    location,
    date,
    startTime = "09:00",
    duration = 4,
    endTime,
    guests,
    budget,
    category,
    experienceType,
    amenities,
    intent,
    limit = 6,
  } = req.query;

  const limitNum = Math.max(1, Math.min(20, parseInt(limit, 10) || 6));
  const requestedDuration = Math.max(1, Math.min(24, parseInt(duration, 10) || 4));
  const requestedGuests = guests ? Math.max(1, parseInt(guests, 10)) : null;
  const requestedBudget = budget ? Math.max(0, parseFloat(budget)) : null;

  // 1. Fetch active candidate spots
  const candidateQuery = { isActive: { $ne: false } };
  if (spotId) {
    candidateQuery._id = { $ne: spotId };
  }

  const candidateSpots = await Spot.find(candidateQuery)
    .populate("owner", "name email")
    .lean();

  if (!candidateSpots || candidateSpots.length === 0) {
    return res.json({
      success: true,
      data: [],
      spots: [],
      total: 0,
    });
  }

  // 2. Fetch booking conflicts if date is specified
  let conflictingSpotIds = new Set();
  let searchStartMins = timeToMinutes(startTime);
  let searchEndMins = endTime ? timeToMinutes(endTime) : searchStartMins + requestedDuration * 60;

  if (date) {
    const bookingDate = new Date(date);
    if (!isNaN(bookingDate.getTime())) {
      const startOfDay = new Date(bookingDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(bookingDate);
      endOfDay.setHours(23, 59, 59, 999);

      const confirmedBookings = await Booking.find({
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ["confirmed", "approved"] },
      }).lean();

      confirmedBookings.forEach((b) => {
        const bStart = timeToMinutes(b.startTime || "00:00");
        const bEnd = timeToMinutes(b.endTime || "23:59");

        // Overlap: searchStart < bEnd && searchEnd > bStart
        if (searchStartMins < bEnd && searchEndMins > bStart) {
          conflictingSpotIds.add(b.spot.toString());
        }
      });
    }
  }

  // 3. Get spot popularity data (confirmed bookings count per spot)
  const spotBookingCounts = {};
  try {
    const counts = await Booking.aggregate([
      { $match: { status: { $in: ["confirmed", "approved"] } } },
      { $group: { _id: "$spot", count: { $sum: 1 } } },
    ]);
    counts.forEach((c) => {
      if (c._id) spotBookingCounts[c._id.toString()] = c.count;
    });
  } catch (err) {
    console.warn("[RecommendationEngine] Error aggregating booking counts:", err.message);
  }

  // 4. Fetch reference spot for contextual recommendations if spotId provided
  let referenceSpot = null;
  if (spotId) {
    try {
      referenceSpot = await Spot.findById(spotId).lean();
    } catch (e) {
      referenceSpot = null;
    }
  }

  // 5. Fetch user signals (past bookings & wishlist) if authenticated
  let userPreferredCategories = new Set();
  let userWishlistSpotIds = new Set();
  let userAvgPrice = 0;
  let userBookingCount = 0;

  if (req.user && req.user._id) {
    try {
      const userBookings = await Booking.find({ user: req.user._id })
        .populate("spot", "category price location")
        .limit(10)
        .lean();

      let totalPrice = 0;
      userBookings.forEach((b) => {
        if (b.spot) {
          if (b.spot.category) {
            userPreferredCategories.add(b.spot.category.toLowerCase().trim());
          }
          if (b.spot.price) {
            totalPrice += b.spot.price;
            userBookingCount++;
          }
        }
      });

      if (userBookingCount > 0) {
        userAvgPrice = totalPrice / userBookingCount;
      }

      const userDoc = await User.findById(req.user._id).select("wishlist").lean();
      if (userDoc && Array.isArray(userDoc.wishlist)) {
        userDoc.wishlist.forEach((wId) => {
          userWishlistSpotIds.add(wId.toString());
        });
      }
    } catch (err) {
      console.warn("[RecommendationEngine] Error reading user signals:", err.message);
    }
  }

  // 6. Intent preset lookup
  const normalizedIntent = (intent || "").toLowerCase().trim().replace(/[- ]/g, "_");
  const intentPreset = INTENT_PRESETS[normalizedIntent] || null;

  // 7. Parse requested amenities
  let requestedAmenitiesList = [];
  if (amenities) {
    if (Array.isArray(amenities)) {
      requestedAmenitiesList = amenities.map(normalizeAmenity).filter(Boolean);
    } else if (typeof amenities === "string") {
      requestedAmenitiesList = amenities.split(",").map(normalizeAmenity).filter(Boolean);
    }
  }

  // Tokenize location search string
  const locationTokens = (location || "")
    .toLowerCase()
    .split(/[,\s]+/)
    .filter((t) => t.length >= 2);

  // Target experience/category
  const targetCategory = (category || experienceType || "").toLowerCase().trim();

  // 8. Execute Multi-Factor Rule-Based Scoring
  const scoredSpots = candidateSpots.map((spot) => {
    let score = 40; // Base score
    const reasons = [];
    const highlights = [];

    const spotIdStr = spot._id.toString();
    const spotCat = (spot.category || "").toLowerCase().trim();
    const spotPrice = Number(spot.price) || 1000;
    const spotRating = Number(spot.rating) || 4.8;
    const spotMaxGuests = Number(spot.maxGuests) || 6;
    const spotLocationStr = `${spot.location || ""} ${spot.title || ""} ${spot.description || ""}`.toLowerCase();
    const spotAmenitiesNormalized = (spot.amenities || []).map(normalizeAmenity).filter(Boolean);
    const estimatedTotal = spotPrice * requestedDuration;

    // A. Availability Factor (Weight: 20 points)
    const isConflict = conflictingSpotIds.has(spotIdStr);
    if (date) {
      if (isConflict) {
        score -= 40; // Heavily penalize unavailable slot
      } else {
        score += 20;
        reasons.push("Available on your requested date");
        highlights.push("Available");
      }
    } else {
      score += 10; // Neutral availability when no date specified
    }

    // B. Capacity / Group Size Match (Weight: 15 points)
    if (requestedGuests) {
      if (spotMaxGuests >= requestedGuests) {
        score += 15;
        // Perfect sizing bonus (e.g. 6 guests in plot with max 6-8)
        if (spotMaxGuests <= requestedGuests + 3) {
          score += 5;
        }
        reasons.push(`Accommodates party of ${requestedGuests} (up to ${spotMaxGuests} guests)`);
        highlights.push(`Fits ${requestedGuests} Guests`);
      } else {
        score -= 25; // Cannot fit the party
      }
    }

    // C. Budget Match (Weight: 20 points)
    if (requestedBudget) {
      if (estimatedTotal <= requestedBudget) {
        score += 20;
        // Value bonus
        if (estimatedTotal <= requestedBudget * 0.85) {
          score += 5;
        }
        reasons.push(`Within your ₹${requestedBudget.toLocaleString()} budget (₹${spotPrice}/hr × ${requestedDuration} hrs = ₹${estimatedTotal.toLocaleString()})`);
        highlights.push(`Under ₹${requestedBudget.toLocaleString()}`);
      } else {
        // Slightly over budget vs far over budget
        const overRatio = estimatedTotal / requestedBudget;
        if (overRatio <= 1.2) {
          score += 8; // Close to budget
        } else {
          score -= 15;
        }
      }
    }

    // D. Location Match (Weight: 15 points)
    if (locationTokens.length > 0) {
      let matchedTokens = 0;
      locationTokens.forEach((token) => {
        if (spotLocationStr.includes(token)) matchedTokens++;
      });

      if (matchedTokens > 0) {
        const locScore = Math.min(15, Math.round((matchedTokens / locationTokens.length) * 15));
        score += locScore;
        reasons.push(`Matches location: "${location}"`);
        highlights.push(spot.location.split(",")[0] || "Scenic Area");
      }
    }

    // E. Amenity Match (Weight: 15 points)
    if (requestedAmenitiesList.length > 0) {
      let matchedAmenityCount = 0;
      const matchedAmenityNames = [];

      requestedAmenitiesList.forEach((reqAmenity) => {
        const found = spotAmenitiesNormalized.some((a) =>
          a.includes(reqAmenity) || reqAmenity.includes(a)
        );
        if (found) {
          matchedAmenityCount++;
          matchedAmenityNames.push(reqAmenity);
        }
      });

      if (matchedAmenityCount > 0) {
        score += Math.round((matchedAmenityCount / requestedAmenitiesList.length) * 15);
        const namePreview = matchedAmenityNames[0].charAt(0).toUpperCase() + matchedAmenityNames[0].slice(1);
        reasons.push(`Includes requested amenity: ${namePreview}`);
        highlights.push(namePreview);
      }
    }

    // F. Experience / Category Match (Weight: 15 points)
    if (targetCategory) {
      if (spotCat === targetCategory || spotCat.includes(targetCategory) || targetCategory.includes(spotCat)) {
        score += 15;
        reasons.push(`Matches experience type: ${spot.category}`);
        highlights.push(spot.category);
      }
    }

    // G. Intent Preset Matching (e.g. Date Night, Campfire, etc.)
    if (intentPreset) {
      let matchesCategory = false;
      for (const kw of intentPreset.categoryKeywords) {
        if (spotCat.includes(kw) || spotLocationStr.includes(kw)) {
          matchesCategory = true;
          break;
        }
      }
      if (matchesCategory) {
        score += 20;
        reasons.push(intentPreset.reasonLabel);
      }
    }

    // H. Contextual Similarity to Reference Spot (when viewing a plot)
    if (referenceSpot) {
      const refCat = (referenceSpot.category || "").toLowerCase().trim();
      const refPrice = Number(referenceSpot.price) || 1000;

      if (spotCat === refCat) {
        score += 20;
        reasons.push(`Similar ${referenceSpot.category}`);
      }

      const priceRatio = Math.min(spotPrice, refPrice) / Math.max(spotPrice, refPrice);
      score += Math.round(priceRatio * 15);

      const amenitySim = calculateAmenitySimilarity(spot.amenities, referenceSpot.amenities);
      score += Math.round(amenitySim * 10);
    }

    // I. Authenticated Personalization (Past Bookings & Wishlist)
    if (userWishlistSpotIds.has(spotIdStr)) {
      score += 10;
      reasons.push("From your saved wishlist");
      highlights.push("In Wishlist");
    }
    if (userPreferredCategories.has(spotCat)) {
      score += 10;
      reasons.push("Matches your past booking style");
    }

    // J. Rating & Popularity Signals
    if (spotRating >= 4.8) {
      score += 10;
      reasons.push(`Highly rated (${spotRating.toFixed(1)} ★)`);
    } else if (spotRating >= 4.5) {
      score += 6;
    }

    const bookingVolume = spotBookingCounts[spotIdStr] || 0;
    if (bookingVolume > 0) {
      score += Math.min(8, bookingVolume * 2);
      if (bookingVolume >= 2) {
        reasons.push("Popular with returning travelers");
      }
    }

    if (spot.isFeatured) {
      score += 5;
      highlights.push("Featured Host");
    }

    // Normalize final match score to 70% - 99%
    const normalizedScore = Math.min(99, Math.max(65, Math.round(score * 0.75)));
    const primaryReason = reasons[0] || (spot.isFeatured ? "Featured Pick" : "Top Rated Nature Plot");

    return {
      ...spot,
      matchScore: normalizedScore,
      matchReason: primaryReason,
      allMatchReasons: reasons,
      highlights: Array.from(new Set(highlights)).slice(0, 3),
      estimatedTotal,
      duration: requestedDuration,
      isAvailable: !isConflict,
    };
  });

  // 9. Separate available vs unavailable if date was requested
  let availableScored = scoredSpots;
  if (date) {
    availableScored = scoredSpots.filter((s) => s.isAvailable);
    // If all spots are conflicting, keep all but marked as fallback
    if (availableScored.length === 0) {
      availableScored = scoredSpots;
    }
  }

  // 10. Sort by matchScore descending
  availableScored.sort((a, b) => b.matchScore - a.matchScore);

  // 11. Top N recommendations
  const recommendations = availableScored.slice(0, limitNum);

  res.json({
    success: true,
    data: recommendations,
    spots: recommendations,
    total: recommendations.length,
    queryCriteria: {
      location: location || null,
      date: date || null,
      startTime: startTime || null,
      duration: requestedDuration,
      guests: requestedGuests,
      budget: requestedBudget,
      category: targetCategory || null,
      amenities: requestedAmenitiesList,
    },
  });
});

module.exports = {
  getRecommendations,
  INTENT_PRESETS,
};
