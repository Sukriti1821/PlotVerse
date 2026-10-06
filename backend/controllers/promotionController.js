const asyncHandler = require("../utils/asyncHandler");
const Promotion = require("../models/Promotion");
const Spot = require("../models/Spot");
const Experience = require("../models/Experience");
const promotionService = require("../services/promotionService");

// ==========================================
// GET OWNER PROMOTIONS (Protected: Host console)
// ==========================================
const getOwnerPromotions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const promotions = await Promotion.find({ owner: userId })
    .populate("applicableSpot", "title location price image")
    .populate("applicableExperience", "title price durationHours")
    .sort({ createdAt: -1 });

  // Get owner's spots with their current featured status
  const spots = await Spot.find({ owner: userId })
    .select("_id title location price image isFeatured featuredConfig isActive")
    .sort({ createdAt: -1 });

  // Host growth metrics
  const activePromosCount = promotions.filter((p) => p.isActive).length;
  const totalUses = promotions.reduce((sum, p) => sum + (p.timesUsed || 0), 0);
  const featuredSpotsCount = spots.filter(
    (s) => s.isFeatured || s.featuredConfig?.isFeatured
  ).length;

  res.json({
    success: true,
    data: {
      promotions,
      spots,
      metrics: {
        activePromosCount,
        totalUses,
        featuredSpotsCount,
        totalSpotsCount: spots.length,
      },
    },
  });
});

// ==========================================
// CREATE PROMOTION (Protected: Host only)
// ==========================================
const createPromotion = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    title,
    code,
    promoType = "coupon_code",
    discountType = "percentage",
    discountValue,
    applicableType = "all",
    applicableSpot,
    applicableExperience,
    startDate,
    endDate,
    usageLimit,
    minBookingValue = 0,
    advanceNoticeDays = 7,
    bannerText = "",
    allowStacking = false,
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: "Promotion title is required." });
  }

  const numDiscount = Number(discountValue) || 0;
  if (promoType !== "banner_announcement" && (isNaN(numDiscount) || numDiscount <= 0)) {
    return res.status(400).json({
      success: false,
      message: "Discount value must be a positive number.",
    });
  }

  if (discountType === "percentage" && numDiscount > 90) {
    return res.status(400).json({
      success: false,
      message: "Percentage discount cannot exceed 90%.",
    });
  }

  let cleanCode = null;
  if (code && typeof code === "string" && code.trim()) {
    cleanCode = code.trim().toUpperCase();
    // Check if code already exists for this host
    const existing = await Promotion.findOne({
      owner: userId,
      code: cleanCode,
      isActive: true,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Active promo code "${cleanCode}" already exists. Use a unique code or update the existing one.`,
      });
    }
  }

  // Verify spot ownership if scoping to a specific plot
  if (applicableType === "spot" && applicableSpot) {
    const spot = await Spot.findOne({ _id: applicableSpot, owner: userId });
    if (!spot) {
      return res.status(403).json({
        success: false,
        message: "You can only attach promotions to properties you own.",
      });
    }
  }

  const promotion = await Promotion.create({
    owner: userId,
    title: title.trim(),
    code: cleanCode,
    promoType,
    discountType,
    discountValue: numDiscount,
    applicableType,
    applicableSpot: applicableType === "spot" ? applicableSpot : null,
    applicableExperience: applicableType === "experience" ? applicableExperience : null,
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : null,
    usageLimit: usageLimit ? Number(usageLimit) : null,
    minBookingValue: Number(minBookingValue) || 0,
    advanceNoticeDays: Number(advanceNoticeDays) || 7,
    bannerText: bannerText.trim(),
    allowStacking: Boolean(allowStacking),
    isActive: true,
  });

  res.status(201).json({
    success: true,
    message: "Promotion created successfully.",
    data: promotion,
  });
});

// ==========================================
// UPDATE PROMOTION (Protected: Host only)
// ==========================================
const updatePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const promo = await Promotion.findById(id);
  if (!promo) {
    return res.status(404).json({ success: false, message: "Promotion not found." });
  }

  if (promo.owner.toString() !== userId.toString() && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: You do not own this promotion.",
    });
  }

  const allowedUpdates = [
    "title",
    "code",
    "discountType",
    "discountValue",
    "applicableType",
    "applicableSpot",
    "applicableExperience",
    "startDate",
    "endDate",
    "usageLimit",
    "minBookingValue",
    "advanceNoticeDays",
    "bannerText",
    "isActive",
    "allowStacking",
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "code" && typeof req.body[field] === "string") {
        promo[field] = req.body[field].trim().toUpperCase();
      } else {
        promo[field] = req.body[field];
      }
    }
  });

  await promo.save();

  res.json({
    success: true,
    message: "Promotion updated successfully.",
    data: promo,
  });
});

// ==========================================
// DELETE PROMOTION (Protected: Host only)
// ==========================================
const deletePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const promo = await Promotion.findById(id);
  if (!promo) {
    return res.status(404).json({ success: false, message: "Promotion not found." });
  }

  if (promo.owner.toString() !== userId.toString() && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: You do not own this promotion.",
    });
  }

  await Promotion.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Promotion deleted successfully.",
  });
});

// ==========================================
// TOGGLE PROMOTION ACTIVE (Protected: Host only)
// ==========================================
const togglePromotionActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const promo = await Promotion.findById(id);
  if (!promo) {
    return res.status(404).json({ success: false, message: "Promotion not found." });
  }

  if (promo.owner.toString() !== userId.toString() && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: You do not own this promotion.",
    });
  }

  promo.isActive = !promo.isActive;
  await promo.save();

  res.json({
    success: true,
    message: `Promotion "${promo.title}" is now ${promo.isActive ? "active" : "inactive"}.`,
    data: promo,
  });
});

// ==========================================
// FEATURE SPOT LISTING (Protected: Host only)
// ==========================================
const featureSpotListing = asyncHandler(async (req, res) => {
  const { spotId } = req.params;
  const userId = req.user._id;
  const {
    isFeatured = true,
    durationDays = 14,
    tier = "spotlight",
    sponsoredBadge = "Featured Retreat",
  } = req.body;

  const spot = await Spot.findOne({ _id: spotId, owner: userId });
  if (!spot) {
    return res.status(404).json({
      success: false,
      message: "Spot not found or you do not have host ownership.",
    });
  }

  const days = Math.max(1, parseInt(durationDays, 10) || 14);
  const featuredUntil = isFeatured ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

  spot.isFeatured = isFeatured;
  spot.featuredConfig = {
    isFeatured,
    featuredUntil,
    tier,
    paymentStatus: isFeatured ? "free_trial" : "none", // Flexible architecture ready for monetization
    sponsoredBadge: sponsoredBadge.trim() || "Featured Retreat",
  };

  await spot.save();

  res.json({
    success: true,
    message: isFeatured
      ? `"${spot.title}" is now featured on the homepage and catalog for ${days} days!`
      : `Featured status for "${spot.title}" has been removed.`,
    data: {
      spotId: spot._id,
      isFeatured: spot.isFeatured,
      featuredConfig: spot.featuredConfig,
    },
  });
});

// ==========================================
// VALIDATE PROMO CODE (Public: Pre-checkout check)
// ==========================================
const validatePromoCode = asyncHandler(async (req, res) => {
  const { code, spotId, experienceId, subtotal = 0, date } = req.body;

  let hostId = null;
  if (spotId) {
    const spot = await Spot.findById(spotId).select("owner");
    if (spot) {
      hostId = spot.owner;
    }
  } else if (experienceId) {
    const exp = await Experience.findById(experienceId).select("owner");
    if (exp) {
      hostId = exp.owner;
    }
  }

  const result = await promotionService.validatePromotion({
    code,
    hostId,
    spotId,
    experienceId,
    subtotal,
    date,
  });

  if (!result.valid) {
    return res.status(400).json({
      success: false,
      valid: false,
      message: result.message,
    });
  }

  res.json({
    success: true,
    valid: true,
    discountAmount: result.discountAmount,
    promo: result.promo,
    message: result.message,
  });
});

// ==========================================
// GET SPOT PROMOTIONS (Public: Active banners & offers)
// ==========================================
const getSpotPromotions = asyncHandler(async (req, res) => {
  const { spotId } = req.params;

  const spot = await Spot.findById(spotId).select("owner isFeatured featuredConfig");
  if (!spot) {
    return res.status(404).json({ success: false, message: "Spot not found." });
  }

  const now = new Date();
  // Fetch active promotions targeting this spot or all spots by this owner
  const promos = await Promotion.find({
    owner: spot.owner,
    isActive: true,
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
    $or: [{ applicableType: "all" }, { applicableType: "spot", applicableSpot: spotId }],
  }).select("title code promoType discountType discountValue bannerText advanceNoticeDays minBookingValue");

  res.json({
    success: true,
    data: {
      promotions: promos,
      featuredConfig: spot.featuredConfig || { isFeatured: spot.isFeatured },
    },
  });
});

module.exports = {
  getOwnerPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionActive,
  featureSpotListing,
  validatePromoCode,
  getSpotPromotions,
};
