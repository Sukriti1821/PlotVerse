const User = require("../models/User");
const Spot = require("../models/Spot");
const Booking = require("../models/Booking");
const Settings = require("../models/Settings");
const asyncHandler = require("../utils/asyncHandler");

// ==========================================
// 1. DASHBOARD STATS OVERVIEW (GET /api/admin/stats)
// ==========================================
const getDashboardStats = asyncHandler(async (req, res) => {
  // User counts
  const totalOwners = await User.countDocuments({ role: "owner" });
  const totalCustomers = await User.countDocuments({
    role: { $in: ["customer", "tourist"] },
  });
  const suspendedOwners = await User.countDocuments({
    role: "owner",
    isSuspended: true,
  });
  const pendingOwnerApprovals = await User.countDocuments({
    role: "owner",
    isOwnerApproved: false,
  });

  // Spot counts
  const totalSpots = await Spot.countDocuments();
  const activeSpots = await Spot.countDocuments({
    isActive: true,
    isUnpublishedByAdmin: { $ne: true },
  });
  const softDeletedSpots = await Spot.countDocuments({ isActive: false });
  const unpublishedByAdminSpots = await Spot.countDocuments({
    isUnpublishedByAdmin: true,
  });

  // Booking counts
  const totalBookings = await Booking.countDocuments();
  const confirmedBookings = await Booking.countDocuments({
    status: "confirmed",
  });
  const pendingBookings = await Booking.countDocuments({
    status: { $in: ["pending", "quote_requested"] },
  });

  // Financial aggregates across paid bookings
  const revenueAggregation = await Booking.aggregate([
    { $match: { paymentStatus: "paid" } },
    {
      $group: {
        _id: null,
        totalGrossVolume: { $sum: "$totalPrice" },
        totalPlatformRevenue: { $sum: "$platformCommission" },
        totalOwnerPayoutsPaid: {
          $sum: {
            $cond: [{ $eq: ["$payoutStatus", "paid"] }, "$ownerPayoutAmount", 0],
          },
        },
        totalOwnerPayoutsPending: {
          $sum: {
            $cond: [
              { $in: ["$payoutStatus", ["pending", "processing"]] },
              "$ownerPayoutAmount",
              0,
            ],
          },
        },
      },
    },
  ]);

  const financialStats = revenueAggregation[0] || {
    totalGrossVolume: 0,
    totalPlatformRevenue: 0,
    totalOwnerPayoutsPaid: 0,
    totalOwnerPayoutsPending: 0,
  };

  // Recent 6 bookings for quick dashboard feed
  const recentBookings = await Booking.find()
    .populate("spot", "title location")
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(6);

  // Settings
  const settings = await Settings.getSettings();

  res.json({
    success: true,
    data: {
      totalOwners,
      totalCustomers,
      suspendedOwners,
      pendingOwnerApprovals,
      spots: {
        total: totalSpots,
        active: activeSpots,
        softDeleted: softDeletedSpots,
        unpublishedByAdmin: unpublishedByAdminSpots,
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings,
      },
      financials: {
        totalGrossVolume: financialStats.totalGrossVolume,
        totalPlatformRevenue: financialStats.totalPlatformRevenue,
        totalOwnerPayoutsPaid: financialStats.totalOwnerPayoutsPaid,
        totalOwnerPayoutsPending: financialStats.totalOwnerPayoutsPending,
        currentCommissionRate: settings.defaultCommissionRate,
      },
      recentBookings,
    },
  });
});

// ==========================================
// 2. OWNER MANAGEMENT
// ==========================================

// GET /api/admin/owners - List all owners with metrics
const getOwners = asyncHandler(async (req, res) => {
  const { search } = req.query;

  let query = { role: "owner" };
  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { name: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
    ];
  }

  const owners = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 });

  // Enrich each owner with their spots count and booking totals
  const enrichedOwners = await Promise.all(
    owners.map(async (owner) => {
      const spotsCount = await Spot.countDocuments({ owner: owner._id });
      const activeSpotsCount = await Spot.countDocuments({
        owner: owner._id,
        isActive: true,
        isUnpublishedByAdmin: { $ne: true },
      });

      // Find spots by this owner to aggregate bookings
      const ownerSpots = await Spot.find({ owner: owner._id }).select("_id");
      const spotIds = ownerSpots.map((s) => s._id);

      const ownerBookingStats = await Booking.aggregate([
        {
          $match: {
            spot: { $in: spotIds },
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,
            totalBookingsCount: { $sum: 1 },
            totalGross: { $sum: "$totalPrice" },
            totalCommission: { $sum: "$platformCommission" },
            totalPayoutsPaid: {
              $sum: {
                $cond: [{ $eq: ["$payoutStatus", "paid"] }, "$ownerPayoutAmount", 0],
              },
            },
            totalPayoutsPending: {
              $sum: {
                $cond: [
                  { $in: ["$payoutStatus", ["pending", "processing"]] },
                  "$ownerPayoutAmount",
                  0,
                ],
              },
            },
          },
        },
      ]);

      const stats = ownerBookingStats[0] || {
        totalBookingsCount: 0,
        totalGross: 0,
        totalCommission: 0,
        totalPayoutsPaid: 0,
        totalPayoutsPending: 0,
      };

      return {
        ...owner.toObject(),
        spotsCount,
        activeSpotsCount,
        stats,
      };
    })
  );

  res.json({
    success: true,
    data: enrichedOwners,
  });
});

// GET /api/admin/owners/:id/spots - View spots for a specific owner
const getOwnerSpots = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const owner = await User.findById(id).select("name email role isSuspended");
  if (!owner) {
    return res.status(404).json({ success: false, message: "Owner not found" });
  }

  const spots = await Spot.find({ owner: id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    owner,
    data: spots,
  });
});

// PATCH /api/admin/owners/:id/status - Suspend / reactivate owner account
const updateOwnerStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isSuspended, reason = "" } = req.body;

  if (typeof isSuspended !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Please specify isSuspended boolean status",
    });
  }

  const owner = await User.findById(id);
  if (!owner) {
    return res.status(404).json({ success: false, message: "Owner not found" });
  }

  owner.isSuspended = isSuspended;
  owner.suspendedAt = isSuspended ? new Date() : null;
  owner.suspensionReason = isSuspended ? reason : "";
  await owner.save();

  // Handle owner's spots: unpublish when suspended; re-publish when reactivated
  if (isSuspended) {
    await Spot.updateMany(
      { owner: owner._id, isUnpublishedByAdmin: false },
      {
        isUnpublishedByAdmin: true,
        adminFlagReason: reason ? `Host account suspended: ${reason}` : "Host account suspended by platform administrator",
        adminFlaggedAt: new Date(),
      }
    );
  } else {
    // Reactivated: un-flag spots that were flagged due to host suspension
    await Spot.updateMany(
      {
        owner: owner._id,
        isUnpublishedByAdmin: true,
        adminFlagReason: { $regex: /Host account suspended/i },
      },
      {
        isUnpublishedByAdmin: false,
        adminFlagReason: "",
        adminFlaggedAt: null,
      }
    );
  }

  res.json({
    success: true,
    message: isSuspended
      ? `Host account for ${owner.name} suspended and listings unpublished.`
      : `Host account for ${owner.name} reactivated successfully.`,
    data: {
      _id: owner._id,
      name: owner.name,
      email: owner.email,
      isSuspended: owner.isSuspended,
      suspendedAt: owner.suspendedAt,
      suspensionReason: owner.suspensionReason,
    },
  });
});

// PATCH /api/admin/owners/:id/approval - Approve / toggle approval status
const updateOwnerApproval = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isOwnerApproved } = req.body;

  if (typeof isOwnerApproved !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Please specify isOwnerApproved boolean value",
    });
  }

  const owner = await User.findById(id);
  if (!owner) {
    return res.status(404).json({ success: false, message: "Owner not found" });
  }

  owner.isOwnerApproved = isOwnerApproved;
  await owner.save();

  res.json({
    success: true,
    message: isOwnerApproved
      ? `Host ${owner.name} approved.`
      : `Host ${owner.name} marked as unapproved.`,
    data: {
      _id: owner._id,
      name: owner.name,
      email: owner.email,
      isOwnerApproved: owner.isOwnerApproved,
    },
  });
});

// ==========================================
// 3. SPOT MODERATION
// ==========================================

// GET /api/admin/spots - List all spots across platform
const getSpotsForModeration = asyncHandler(async (req, res) => {
  const {
    search,
    status = "all", // all | active | inactive | flagged
    page = 1,
    limit = 20,
  } = req.query;

  const query = {};

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { title: { $regex: s, $options: "i" } },
      { location: { $regex: s, $options: "i" } },
      { category: { $regex: s, $options: "i" } },
    ];
  }

  if (status === "active") {
    query.isActive = true;
    query.isUnpublishedByAdmin = { $ne: true };
  } else if (status === "inactive") {
    query.isActive = false;
  } else if (status === "flagged") {
    query.isUnpublishedByAdmin = true;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const totalCount = await Spot.countDocuments(query);
  const spots = await Spot.find(query)
    .populate("owner", "name email isSuspended")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Attach booking count for each spot
  const enrichedSpots = await Promise.all(
    spots.map(async (spot) => {
      const bookingCount = await Booking.countDocuments({ spot: spot._id });
      return {
        ...spot.toObject(),
        bookingCount,
      };
    })
  );

  res.json({
    success: true,
    data: enrichedSpots,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
    currentPage: pageNum,
  });
});

// PATCH /api/admin/spots/:id/moderate - Flag / Unpublish or restore spot
const moderateSpot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isUnpublishedByAdmin, reason = "" } = req.body;

  if (typeof isUnpublishedByAdmin !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Please specify isUnpublishedByAdmin boolean value",
    });
  }

  const spot = await Spot.findById(id).populate("owner", "name email");
  if (!spot) {
    return res.status(404).json({ success: false, message: "Spot not found" });
  }

  spot.isUnpublishedByAdmin = isUnpublishedByAdmin;
  spot.adminFlagReason = isUnpublishedByAdmin ? reason : "";
  spot.adminFlaggedAt = isUnpublishedByAdmin ? new Date() : null;
  await spot.save();

  res.json({
    success: true,
    message: isUnpublishedByAdmin
      ? `Spot "${spot.title}" has been flagged and unpublished from the platform.`
      : `Spot "${spot.title}" moderation flag cleared and published.`,
    data: spot,
  });
});

// ==========================================
// 4. BOOKINGS OVERSIGHT
// ==========================================

// GET /api/admin/bookings - Searchable/Filterable table of all bookings
const getBookingsOversight = asyncHandler(async (req, res) => {
  const {
    search,
    ownerId,
    customerId,
    status = "all",
    paymentStatus = "all",
    payoutStatus = "all",
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sort = "newest",
  } = req.query;

  const query = {};

  if (status && status !== "all") {
    query.status = status;
  }

  if (paymentStatus && paymentStatus !== "all") {
    query.paymentStatus = paymentStatus;
  }

  if (payoutStatus && payoutStatus !== "all") {
    query.payoutStatus = payoutStatus;
  }

  if (customerId) {
    query.user = customerId;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  // Filter by owner
  if (ownerId) {
    const ownerSpots = await Spot.find({ owner: ownerId }).select("_id");
    query.spot = { $in: ownerSpots.map((s) => s._id) };
  }

  // Text search on guest or spot title
  let populatedQuery = Booking.find(query)
    .populate({
      path: "spot",
      select: "title location price image owner",
      populate: { path: "owner", select: "name email isSuspended" },
    })
    .populate("user", "name email");

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  let sortObj = { createdAt: -1 };
  if (sort === "oldest") sortObj = { createdAt: 1 };
  if (sort === "amount_high") sortObj = { totalPrice: -1 };
  if (sort === "amount_low") sortObj = { totalPrice: 1 };
  if (sort === "booking_date") sortObj = { date: -1 };

  let allResults = await populatedQuery.sort(sortObj);

  // If search query is provided, filter populated results in-memory
  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    allResults = allResults.filter((b) => {
      const spotTitle = b.spot?.title?.toLowerCase() || "";
      const spotLocation = b.spot?.location?.toLowerCase() || "";
      const guestName = b.user?.name?.toLowerCase() || "";
      const guestEmail = b.user?.email?.toLowerCase() || "";
      const ownerName = b.spot?.owner?.name?.toLowerCase() || "";
      const ownerEmail = b.spot?.owner?.email?.toLowerCase() || "";
      const bookingId = b._id.toString().toLowerCase();

      return (
        spotTitle.includes(s) ||
        spotLocation.includes(s) ||
        guestName.includes(s) ||
        guestEmail.includes(s) ||
        ownerName.includes(s) ||
        ownerEmail.includes(s) ||
        bookingId.includes(s)
      );
    });
  }

  const totalCount = allResults.length;
  const skip = (pageNum - 1) * limitNum;
  const paginatedResults = allResults.slice(skip, skip + limitNum);

  res.json({
    success: true,
    data: paginatedResults,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
    currentPage: pageNum,
  });
});

// ==========================================
// 5. COMMISSION & SETTINGS CONTROL
// ==========================================

// GET /api/admin/settings
const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  res.json({
    success: true,
    data: settings,
  });
});

// PUT /api/admin/settings
const updateSettings = asyncHandler(async (req, res) => {
  const { defaultCommissionRate, requireOwnerApproval, platformName } = req.body;

  const settings = await Settings.getSettings();

  if (defaultCommissionRate !== undefined) {
    const rate = Number(defaultCommissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({
        success: false,
        message: "Default commission percentage must be a valid number between 0 and 100",
      });
    }
    settings.defaultCommissionRate = rate;
  }

  if (requireOwnerApproval !== undefined) {
    settings.requireOwnerApproval = Boolean(requireOwnerApproval);
  }

  if (platformName && platformName.trim()) {
    settings.platformName = platformName.trim();
  }

  settings.lastUpdatedBy = req.user._id;
  await settings.save();

  res.json({
    success: true,
    message: "Platform settings updated successfully",
    data: settings,
  });
});

// ==========================================
// 6. PAYOUT TRACKING & MANUAL PAYOUT MVP
// ==========================================

// GET /api/admin/payouts - Aggregated payout breakdown grouped by owner
const getPayouts = asyncHandler(async (req, res) => {
  // Find all confirmed & paid bookings
  const paidBookings = await Booking.find({ paymentStatus: "paid" })
    .populate({
      path: "spot",
      select: "title location owner",
      populate: { path: "owner", select: "name email isSuspended" },
    })
    .populate("user", "name email")
    .sort({ paidAt: -1, createdAt: -1 });

  // Group bookings by owner
  const ownerMap = new Map();

  for (const b of paidBookings) {
    const owner = b.spot?.owner;
    if (!owner) continue;

    const ownerId = owner._id.toString();

    if (!ownerMap.has(ownerId)) {
      ownerMap.set(ownerId, {
        owner: {
          _id: owner._id,
          name: owner.name,
          email: owner.email,
          isSuspended: owner.isSuspended,
        },
        totalGross: 0,
        totalCommission: 0,
        totalPayoutsDue: 0,
        totalPayoutsPaid: 0,
        pendingBookingsCount: 0,
        paidBookingsCount: 0,
        bookings: [],
      });
    }

    const group = ownerMap.get(ownerId);
    const gross = Number(b.totalPrice) || 0;
    const commission = Number(b.platformCommission) || 0;
    const netPayout = Number(b.ownerPayoutAmount) || Math.max(0, gross - commission);

    group.totalGross += gross;
    group.totalCommission += commission;

    if (b.payoutStatus === "paid") {
      group.totalPayoutsPaid += netPayout;
      group.paidBookingsCount += 1;
    } else {
      group.totalPayoutsDue += netPayout;
      group.pendingBookingsCount += 1;
    }

    group.bookings.push({
      _id: b._id,
      spotTitle: b.spot?.title,
      customerName: b.user?.name,
      customerEmail: b.user?.email,
      date: b.date,
      paidAt: b.paidAt,
      totalPrice: gross,
      commissionRate: b.commissionRate || 10,
      platformCommission: commission,
      ownerPayoutAmount: netPayout,
      payoutStatus: b.payoutStatus || "pending",
      payoutDate: b.payoutDate,
      payoutNote: b.payoutNote,
      payoutTransactionId: b.payoutTransactionId,
    });
  }

  const payoutsSummary = Array.from(ownerMap.values());

  // Platform-wide totals
  const overallPendingPayouts = payoutsSummary.reduce(
    (sum, o) => sum + o.totalPayoutsDue,
    0
  );
  const overallCompletedPayouts = payoutsSummary.reduce(
    (sum, o) => sum + o.totalPayoutsPaid,
    0
  );
  const overallCommissionRetained = payoutsSummary.reduce(
    (sum, o) => sum + o.totalCommission,
    0
  );

  res.json({
    success: true,
    data: {
      summary: {
        overallPendingPayouts,
        overallCompletedPayouts,
        overallCommissionRetained,
        totalOwnersWithPayouts: payoutsSummary.length,
      },
      owners: payoutsSummary,
    },
  });
});

// PATCH /api/admin/payouts/mark-paid - Mark one or multiple bookings as paid
const markPayoutsAsPaid = asyncHandler(async (req, res) => {
  const { bookingIds, payoutNote = "", payoutTransactionId = "" } = req.body;

  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide an array of booking IDs to mark as paid",
    });
  }

  const now = new Date();
  const updateResult = await Booking.updateMany(
    {
      _id: { $in: bookingIds },
      paymentStatus: "paid",
    },
    {
      payoutStatus: "paid",
      payoutDate: now,
      payoutNote: payoutNote.trim(),
      payoutTransactionId: payoutTransactionId.trim(),
    }
  );

  const updatedBookings = await Booking.find({ _id: { $in: bookingIds } })
    .populate("spot", "title")
    .populate("user", "name email");

  res.json({
    success: true,
    message: `Successfully marked ${updateResult.modifiedCount} booking(s) as paid.`,
    modifiedCount: updateResult.modifiedCount,
    data: updatedBookings,
  });
});

// ==========================================
// 7. HISTORICAL COMMISSION BACKFILL MIGRATION
// ==========================================
const backfillHistoricalBookings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  const defaultRate = Number(settings.defaultCommissionRate) || 10;

  // Find all confirmed/paid bookings that need commission calculation
  const bookingsToBackfill = await Booking.find({
    $or: [
      { paymentStatus: "paid" },
      { status: "confirmed" },
    ],
    $or: [
      { commissionRate: { $exists: false } },
      { commissionRate: 0 },
      { ownerPayoutAmount: { $exists: false } },
      { ownerPayoutAmount: 0 },
    ],
  });

  let updatedCount = 0;
  for (const b of bookingsToBackfill) {
    const total = Number(b.totalPrice) || 0;
    if (total > 0) {
      const commission = Math.round((total * defaultRate) / 100);
      const payout = Math.max(0, total - commission);

      b.commissionRate = defaultRate;
      b.platformCommission = commission;
      b.ownerPayoutAmount = payout;
      if (!b.payoutStatus) {
        b.payoutStatus = "pending";
      }
      await b.save();
      updatedCount += 1;
    }
  }

  res.json({
    success: true,
    message: `Backfilled ${updatedCount} historical bookings with a ${defaultRate}% commission split.`,
    updatedCount,
    rateApplied: defaultRate,
  });
});

module.exports = {
  getDashboardStats,
  getOwners,
  getOwnerSpots,
  updateOwnerStatus,
  updateOwnerApproval,
  getSpotsForModeration,
  moderateSpot,
  getBookingsOversight,
  getSettings,
  updateSettings,
  getPayouts,
  markPayoutsAsPaid,
  backfillHistoricalBookings,
};
