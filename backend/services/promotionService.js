const Promotion = require("../models/Promotion");
const Booking = require("../models/Booking");
const Spot = require("../models/Spot");

/**
 * Validate a promotional discount code against reservation parameters.
 * Deterministic server-authoritative validation.
 */
const validatePromotion = async ({
  code,
  hostId = null,
  spotId = null,
  experienceId = null,
  subtotal = 0,
  date = null,
}) => {
  if (!code || typeof code !== "string" || !code.trim()) {
    return { valid: false, message: "A promotion code is required." };
  }

  const cleanCode = code.trim().toUpperCase();
  const promo = await Promotion.findOne({ code: cleanCode });

  if (!promo) {
    return { valid: false, message: `Promo code "${cleanCode}" is invalid.` };
  }

  // 1. Active status check
  if (promo.isActive === false) {
    return { valid: false, message: `Promo code "${cleanCode}" is no longer active.` };
  }

  // 2. Ownership / Host check
  if (hostId && promo.owner.toString() !== hostId.toString()) {
    return {
      valid: false,
      message: `Promo code "${cleanCode}" is not applicable to properties owned by this host.`,
    };
  }

  // 3. Target Scope check (all vs specific plot vs specific experience)
  if (promo.applicableType === "spot" && promo.applicableSpot) {
    if (!spotId || promo.applicableSpot.toString() !== spotId.toString()) {
      return {
        valid: false,
        message: `Promo code "${cleanCode}" is only valid for a specific listed property.`,
      };
    }
  } else if (promo.applicableType === "experience" && promo.applicableExperience) {
    if (!experienceId || promo.applicableExperience.toString() !== experienceId.toString()) {
      return {
        valid: false,
        message: `Promo code "${cleanCode}" is only valid for a specific experience package.`,
      };
    }
  }

  // 4. Date validation
  const now = new Date();
  if (promo.startDate && now < new Date(promo.startDate)) {
    return {
      valid: false,
      message: `Promo code "${cleanCode}" is not active yet (starts ${new Date(
        promo.startDate
      ).toLocaleDateString()}).`,
    };
  }
  if (promo.endDate && now > new Date(promo.endDate)) {
    return {
      valid: false,
      message: `Promo code "${cleanCode}" has expired.`,
    };
  }

  // 5. Usage limit check
  if (typeof promo.usageLimit === "number" && promo.usageLimit > 0) {
    if (promo.timesUsed >= promo.usageLimit) {
      return {
        valid: false,
        message: `Promo code "${cleanCode}" has reached its maximum usage limit.`,
      };
    }
  }

  // 6. Minimum booking subtotal requirement
  const numericSubtotal = Number(subtotal) || 0;
  if (promo.minBookingValue > 0 && numericSubtotal < promo.minBookingValue) {
    return {
      valid: false,
      message: `Promo code "${cleanCode}" requires a minimum booking subtotal of ₹${promo.minBookingValue.toLocaleString()}. Current subtotal is ₹${numericSubtotal.toLocaleString()}.`,
    };
  }

  // 7. Calculate discount amount (never allowing negative grand totals)
  let discountAmount = 0;
  if (promo.discountType === "percentage") {
    discountAmount = Math.round(numericSubtotal * (promo.discountValue / 100));
  } else {
    discountAmount = Math.round(promo.discountValue);
  }

  // Clamp discount so it cannot exceed the subtotal and cannot be negative
  discountAmount = Math.max(0, Math.min(discountAmount, numericSubtotal));

  return {
    valid: true,
    promo: {
      _id: promo._id,
      code: promo.code,
      title: promo.title,
      promoType: promo.promoType,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      allowStacking: promo.allowStacking,
    },
    discountAmount,
    message: `Promo code "${promo.code}" applied successfully! You saved ₹${discountAmount.toLocaleString()}.`,
  };
};

/**
 * Evaluates automatic discounts (early-bird, repeat customer loyalty)
 * when no coupon code is explicitly provided or when stacking is permitted.
 */
const evaluateAutomaticDiscounts = async ({
  hostId = null,
  spotId = null,
  subtotal = 0,
  date = null,
  userId = null,
}) => {
  if (!hostId && !spotId) return null;
  const numericSubtotal = Number(subtotal) || 0;
  if (numericSubtotal <= 0) return null;

  // 1. Check for Early-Bird promotion
  if (date) {
    const bookingDate = new Date(date);
    const now = new Date();
    const daysInAdvance = Math.ceil((bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysInAdvance > 0) {
      const earlyBirdPromo = await Promotion.findOne({
        owner: hostId,
        promoType: "early_bird",
        isActive: true,
        advanceNoticeDays: { $lte: daysInAdvance },
        $or: [
          { applicableType: "all" },
          { applicableType: "spot", applicableSpot: spotId },
        ],
      });

      if (earlyBirdPromo) {
        let discountAmount =
          earlyBirdPromo.discountType === "percentage"
            ? Math.round(numericSubtotal * (earlyBirdPromo.discountValue / 100))
            : earlyBirdPromo.discountValue;
        discountAmount = Math.max(0, Math.min(discountAmount, numericSubtotal));

        return {
          valid: true,
          promo: {
            _id: earlyBirdPromo._id,
            code: earlyBirdPromo.code || "EARLYBIRD",
            title: earlyBirdPromo.title,
            promoType: "early_bird",
            discountType: earlyBirdPromo.discountType,
            discountValue: earlyBirdPromo.discountValue,
          },
          discountAmount,
          message: `Early Bird Discount applied: ${daysInAdvance} days advance booking reward!`,
        };
      }
    }
  }

  // 2. Check for Repeat-Customer Loyalty discount
  if (userId) {
    const repeatCustomerPromo = await Promotion.findOne({
      owner: hostId,
      promoType: "repeat_customer",
      isActive: true,
      $or: [
        { applicableType: "all" },
        { applicableType: "spot", applicableSpot: spotId },
      ],
    });

    if (repeatCustomerPromo) {
      const pastStaysCount = await Booking.countDocuments({
        user: userId,
        spot: spotId,
        status: "confirmed",
      });

      if (pastStaysCount > 0) {
        let discountAmount =
          repeatCustomerPromo.discountType === "percentage"
            ? Math.round(numericSubtotal * (repeatCustomerPromo.discountValue / 100))
            : repeatCustomerPromo.discountValue;
        discountAmount = Math.max(0, Math.min(discountAmount, numericSubtotal));

        return {
          valid: true,
          promo: {
            _id: repeatCustomerPromo._id,
            code: repeatCustomerPromo.code || "LOYALTY",
            title: repeatCustomerPromo.title,
            promoType: "repeat_customer",
            discountType: repeatCustomerPromo.discountType,
            discountValue: repeatCustomerPromo.discountValue,
          },
          discountAmount,
          message: `Repeat Guest Loyalty Discount applied (${pastStaysCount} previous stays)!`,
        };
      }
    }
  }

  return null;
};

/**
 * Record usage of a promotion by incrementing its timesUsed counter
 */
const recordPromotionUsage = async (promoId) => {
  if (!promoId) return;
  try {
    await Promotion.findByIdAndUpdate(promoId, { $inc: { timesUsed: 1 } });
  } catch (err) {
    console.error("Error recording promotion usage:", err);
  }
};

module.exports = {
  validatePromotion,
  evaluateAutomaticDiscounts,
  recordPromotionUsage,
};
