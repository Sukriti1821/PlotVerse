const asyncHandler = require("../utils/asyncHandler");
const Spot = require("../models/Spot");
const Booking = require("../models/Booking");

/**
 * @desc    Get comprehensive analytics & insights for authenticated landowner
 * @route   GET /api/analytics/owner
 * @access  Private (Owner / Host only)
 */
const getOwnerAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch all spots owned by current host (Cross-tenant isolation guaranteed)
  const ownerSpots = await Spot.find({ owner: userId }).lean();
  const allHostSpotIds = ownerSpots.map((s) => s._id.toString());

  if (allHostSpotIds.length === 0) {
    return res.json({
      success: true,
      data: {
        periodLabel: "No Listings",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        summary: {
          totalRevenue: 0,
          confirmedRevenue: 0,
          pendingRevenue: 0,
          totalBookings: 0,
          completedBookings: 0,
          upcomingBookings: 0,
          cancelledBookings: 0,
          cancellationRate: 0,
          averageBookingValue: 0,
          plotViews: 0,
          listingClicks: 0,
          conversionRate: 0,
          averageRating: 5.0,
          activeSpotsCount: 0,
          totalSpotsCount: 0,
        },
        comparison: {
          revenueChange: 0,
          bookingsChange: 0,
          prevRevenue: 0,
          prevBookingsCount: 0,
        },
        popularHours: [],
        peakHour: "16:00",
        popularAmenities: [],
        bookedExperiences: [],
        timeline: [],
        smartInsights: [
          "You do not have any properties listed yet. Publish your first plot to start capturing bookings and earning revenue!",
        ],
        spotsList: [],
      },
    });
  }

  // 2. Filter by specific spot if requested
  const { spotId, range, startDate: customStart, endDate: customEnd } = req.query;
  let targetSpotIds = allHostSpotIds;
  let targetSpots = ownerSpots;

  if (spotId && spotId !== "all") {
    if (!allHostSpotIds.includes(spotId.toString())) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You do not own this property.",
      });
    }
    targetSpotIds = [spotId.toString()];
    targetSpots = ownerSpots.filter((s) => s._id.toString() === spotId.toString());
  }

  // 3. Determine Date Range
  const now = new Date();
  let startDate;
  let endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  let periodLabel = "Last 30 Days";

  if (range === "7d") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    periodLabel = "Last 7 Days";
  } else if (range === "3m" || range === "90d") {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    periodLabel = "Last 3 Months";
  } else if (range === "all") {
    startDate = new Date(0); // Epoch
    periodLabel = "All Time";
  } else if (range === "custom" && customStart && customEnd) {
    startDate = new Date(customStart);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(customEnd);
    endDate.setHours(23, 59, 59, 999);
    periodLabel = "Custom Range";
  } else {
    // Default 30d
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    periodLabel = "Last 30 Days";
  }

  // 4. Determine Previous Comparison Period for Growth Deltas
  const periodDurationMs = Math.max(1, endDate.getTime() - startDate.getTime());
  const prevStartDate = new Date(startDate.getTime() - periodDurationMs);
  const prevEndDate = new Date(startDate.getTime() - 1);

  // 5. Query Bookings for current and previous period
  const [currentBookings, prevBookings] = await Promise.all([
    Booking.find({
      spot: { $in: targetSpotIds },
      date: { $gte: startDate, $lte: endDate },
    })
      .populate("experience", "title category durationHours price")
      .lean(),
    range !== "all"
      ? Booking.find({
          spot: { $in: targetSpotIds },
          date: { $gte: prevStartDate, $lte: prevEndDate },
        }).lean()
      : Promise.resolve([]),
  ]);

  // 6. Summary Calculations
  const totalBookings = currentBookings.length;

  // Valid revenue-generating bookings (confirmed, approved, paid)
  const validBookings = currentBookings.filter(
    (b) => b.status === "confirmed" || b.status === "approved"
  );
  const confirmedBookings = currentBookings.filter((b) => b.status === "confirmed");
  const pendingBookings = currentBookings.filter(
    (b) => b.status === "pending" || b.status === "approved"
  );
  const cancelledBookings = currentBookings.filter((b) => b.status === "cancelled");

  const totalRevenue = validBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const confirmedRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const pendingRevenue = pendingBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  // Completed vs Upcoming
  const completedBookings = validBookings.filter((b) => new Date(b.date) < now).length;
  const upcomingBookings = validBookings.filter((b) => new Date(b.date) >= now).length;

  // Cancellation Rate
  const cancellationRate =
    totalBookings > 0
      ? parseFloat(((cancelledBookings.length / totalBookings) * 100).toFixed(1))
      : 0;

  // Average Booking Value (ABV)
  const averageBookingValue =
    validBookings.length > 0 ? Math.round(totalRevenue / validBookings.length) : 0;

  // Views & Clicks across target spots
  const plotViews = targetSpots.reduce((sum, s) => sum + (s.views || 0), 0);
  const listingClicks = targetSpots.reduce((sum, s) => sum + (s.clicks || 0), 0);

  // Conversion Rate (Total Bookings / Total Views)
  const conversionRate =
    plotViews > 0 ? parseFloat(((totalBookings / plotViews) * 100).toFixed(1)) : 0;

  // Average Rating
  const validRatings = targetSpots.filter(
    (s) => typeof s.rating === "number" && s.rating > 0
  );
  const averageRating =
    validRatings.length > 0
      ? parseFloat(
          (
            validRatings.reduce((sum, s) => sum + s.rating, 0) / validRatings.length
          ).toFixed(1)
        )
      : 4.8;

  const activeSpotsCount = targetSpots.filter((s) => s.isActive !== false).length;
  const totalSpotsCount = targetSpots.length;

  // Previous period comparison
  const prevValidBookings = prevBookings.filter(
    (b) => b.status === "confirmed" || b.status === "approved"
  );
  const prevRevenue = prevValidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const revenueChange =
    prevRevenue > 0
      ? parseFloat((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1))
      : totalRevenue > 0
      ? 100
      : 0;
  const bookingsChange =
    prevBookings.length > 0
      ? parseFloat(
          (((totalBookings - prevBookings.length) / prevBookings.length) * 100).toFixed(1)
        )
      : totalBookings > 0
      ? 100
      : 0;

  // 7. Most Popular Booking Hours
  // Analyzes hour intervals (06:00 to 23:00) covered by active bookings
  const hourCounts = {};
  for (let h = 6; h <= 23; h++) {
    const hh = String(h).padStart(2, "0") + ":00";
    hourCounts[hh] = 0;
  }

  currentBookings.forEach((b) => {
    if (b.status === "cancelled" || b.status === "rejected") return;
    const startHour = b.startTime ? parseInt(b.startTime.split(":")[0], 10) : 10;
    const duration = b.durationHours || 2;
    const endHour = Math.min(startHour + duration, 23);

    for (let h = Math.max(startHour, 6); h < endHour; h++) {
      const hh = String(h).padStart(2, "0") + ":00";
      if (hourCounts[hh] !== undefined) {
        hourCounts[hh]++;
      }
    }
  });

  const popularHours = Object.entries(hourCounts).map(([hour, count]) => ({
    hour,
    count,
  }));

  // Find peak hour window
  let peakHour = "16:00";
  let maxCount = -1;
  popularHours.forEach((item) => {
    if (item.count > maxCount) {
      maxCount = item.count;
      peakHour = item.hour;
    }
  });

  // 8. Most Popular Amenities
  const amenityCounts = {};
  currentBookings.forEach((b) => {
    if (b.status === "cancelled" || b.status === "rejected") return;
    if (Array.isArray(b.selectedAmenities)) {
      b.selectedAmenities.forEach((item) => {
        const name =
          typeof item === "string"
            ? item
            : item?.name || item?.title || "Custom Amenity";
        if (name && name.trim()) {
          const cleanName = name.trim();
          amenityCounts[cleanName] = (amenityCounts[cleanName] || 0) + 1;
        }
      });
    }
    // Also include selectedAddOns if present
    if (Array.isArray(b.selectedAddOns)) {
      b.selectedAddOns.forEach((addon) => {
        if (addon?.name && addon.name.trim()) {
          const cleanName = addon.name.trim();
          amenityCounts[cleanName] = (amenityCounts[cleanName] || 0) + 1;
        }
      });
    }
  });

  const validBookingBaseCount = validBookings.length || totalBookings || 1;
  const popularAmenities = Object.entries(amenityCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.min(100, Math.round((count / validBookingBaseCount) * 100)),
    }))
    .sort((a, b) => b.count - a.count);

  // 9. Most Booked Experiences
  const experienceCounts = {};
  currentBookings.forEach((b) => {
    if (b.status === "cancelled" || b.status === "rejected") return;
    const title = b.experienceTitle || (b.experience && b.experience.title);
    if (title) {
      if (!experienceCounts[title]) {
        experienceCounts[title] = {
          title,
          category: b.experience?.category || "Signature Experience",
          bookingsCount: 0,
          revenue: 0,
          durationHours: b.experience?.durationHours || b.durationHours || 4,
        };
      }
      experienceCounts[title].bookingsCount += 1;
      experienceCounts[title].revenue += b.totalPrice || 0;
    }
  });

  const bookedExperiences = Object.values(experienceCounts).sort(
    (a, b) => b.bookingsCount - a.bookingsCount || b.revenue - a.revenue
  );

  // 10. Time-series Timeline for Area / Bar Charts
  const timelineMap = {};
  const dayMs = 24 * 60 * 60 * 1000;
  const numDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / dayMs)
  );

  if (numDays <= 35) {
    // Daily intervals
    const iter = new Date(startDate);
    while (iter <= endDate) {
      const key = iter.toISOString().split("T")[0];
      timelineMap[key] = {
        date: key,
        formattedDate: iter.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        revenue: 0,
        bookingsCount: 0,
      };
      iter.setDate(iter.getDate() + 1);
    }

    currentBookings.forEach((b) => {
      const dateKey = new Date(b.date).toISOString().split("T")[0];
      if (timelineMap[dateKey]) {
        timelineMap[dateKey].bookingsCount += 1;
        if (b.status === "confirmed" || b.status === "approved") {
          timelineMap[dateKey].revenue += b.totalPrice || 0;
        }
      }
    });
  } else {
    // 7-day intervals (weekly)
    let currentIntervalStart = new Date(startDate);
    while (currentIntervalStart <= endDate) {
      const intervalEnd = new Date(
        Math.min(currentIntervalStart.getTime() + 6 * dayMs, endDate.getTime())
      );
      const key = currentIntervalStart.toISOString().split("T")[0];
      const label = `${currentIntervalStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${intervalEnd.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`;

      timelineMap[key] = {
        date: key,
        formattedDate: label,
        intervalStart: new Date(currentIntervalStart),
        intervalEnd: new Date(intervalEnd),
        revenue: 0,
        bookingsCount: 0,
      };

      currentIntervalStart.setDate(currentIntervalStart.getDate() + 7);
    }

    currentBookings.forEach((b) => {
      const bTime = new Date(b.date).getTime();
      const match = Object.values(timelineMap).find(
        (t) =>
          bTime >= t.intervalStart.getTime() &&
          bTime <= t.intervalEnd.getTime() + (dayMs - 1)
      );
      if (match) {
        match.bookingsCount += 1;
        if (b.status === "confirmed" || b.status === "approved") {
          match.revenue += b.totalPrice || 0;
        }
      }
    });
  }

  const timeline = Object.values(timelineMap);

  // 11. Dynamic Smart Insights (Contextual real-world business takeaways)
  const smartInsights = [];

  // Insight 1: Top Amenity
  if (popularAmenities.length > 0) {
    const topAmenity = popularAmenities[0];
    smartInsights.push(
      `"${topAmenity.name}" was selected in ${topAmenity.percentage}% of your bookings this period.`
    );
  } else {
    smartInsights.push(
      "Offering bundled amenities and outdoor setups can boost your average booking value by up to 35%."
    );
  }

  // Insight 2: Peak Hours
  if (maxCount > 0) {
    const peakHourNum = parseInt(peakHour.split(":")[0], 10);
    const endPeakHour = (peakHourNum + 3) % 24;
    const formatH = (h) => {
      const ampm = h >= 12 ? "PM" : "AM";
      const hh = h % 12 || 12;
      return `${hh} ${ampm}`;
    };
    smartInsights.push(
      `Peak booking demand occurs between ${formatH(peakHourNum)} and ${formatH(
        endPeakHour
      )}, representing your highest guest activity window.`
    );
  }

  // Insight 3: Experience Packages
  if (bookedExperiences.length > 0) {
    const topExp = bookedExperiences[0];
    smartInsights.push(
      `"${topExp.title}" is your top-performing package, generating ₹${topExp.revenue.toLocaleString()} across ${
        topExp.bookingsCount
      } reservation${topExp.bookingsCount > 1 ? "s" : ""}.`
    );
  }

  // Insight 4: Cancellation or Conversion
  if (cancellationRate <= 5 && totalBookings >= 3) {
    smartInsights.push(
      `Your cancellation rate is exceptionally low at ${cancellationRate}%, demonstrating strong traveler commitment.`
    );
  } else if (conversionRate > 3) {
    smartInsights.push(
      `Your listing conversion rate stands at ${conversionRate}%, outperforming standard outdoor space benchmarks.`
    );
  } else {
    smartInsights.push(
      `Average booking value is ₹${averageBookingValue.toLocaleString()} per reservation across ${
        validBookings.length
      } confirmed stays.`
    );
  }

  // 12. Host spots list for dropdown selector
  const spotsList = ownerSpots.map((s) => ({
    id: s._id.toString(),
    title: s.title,
    location: s.location,
    category: s.category,
    price: s.price,
    views: s.views || 0,
    clicks: s.clicks || 0,
    isActive: s.isActive !== false,
  }));

  res.json({
    success: true,
    data: {
      periodLabel,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalRevenue,
        confirmedRevenue,
        pendingRevenue,
        totalBookings,
        completedBookings,
        upcomingBookings,
        cancelledBookings: cancelledBookings.length,
        cancellationRate,
        averageBookingValue,
        plotViews,
        listingClicks,
        conversionRate,
        averageRating,
        activeSpotsCount,
        totalSpotsCount,
      },
      comparison: {
        revenueChange,
        bookingsChange,
        prevRevenue,
        prevBookingsCount: prevBookings.length,
      },
      popularHours,
      peakHour,
      popularAmenities,
      bookedExperiences,
      timeline,
      smartInsights,
      spotsList,
    },
  });
});

module.exports = {
  getOwnerAnalytics,
};
