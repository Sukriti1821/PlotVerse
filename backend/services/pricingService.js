const Restaurant = require("../models/Restaurant");

/**
 * Format Date object or date string to "YYYY-MM-DD"
 */
const formatDateStr = (dateInput) => {
  if (!dateInput) return "";
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Evaluates the deterministic pricing priority hierarchy:
 * Priority 1: Special Date Pricing (Explicit landowner date override)
 * Priority 2: Holiday Pricing (Configured holiday match)
 * Priority 3: Peak-Season Pricing (Peak month match)
 * Priority 4: Weekend Pricing (Saturday / Sunday)
 * Priority 5: Weekday Pricing / Base Rate (Standard rate)
 */
const determineEffectiveRate = ({ spot, date }) => {
  const baseHourlyRate = Number(spot?.price) || 0;
  const pricingRules = spot?.pricingRules || {};

  const dateStr = formatDateStr(date);
  if (!dateStr) {
    return {
      baseHourlyRate,
      effectiveHourlyRate: baseHourlyRate,
      ruleType: "base",
      ruleLabel: "Standard Base Rate",
      adjustmentPerHour: 0,
    };
  }

  const d = new Date(`${dateStr}T00:00:00.000Z`);
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const monthNumber = d.getUTCMonth() + 1; // 1 = January, 12 = December
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // PRIORITY 1: Special Date Pricing
  if (Array.isArray(pricingRules.specialDates) && pricingRules.specialDates.length > 0) {
    const match = pricingRules.specialDates.find(
      (sd) => formatDateStr(sd.date) === dateStr
    );
    if (match && typeof match.hourlyPrice === "number") {
      const rate = Number(match.hourlyPrice);
      return {
        baseHourlyRate,
        effectiveHourlyRate: rate,
        ruleType: "special_date",
        ruleLabel: `Special Date (${match.reason || "Custom Date Rate"})`,
        adjustmentPerHour: rate - baseHourlyRate,
      };
    }
  }

  // PRIORITY 2: Holiday Pricing
  if (Array.isArray(pricingRules.holidays) && pricingRules.holidays.length > 0) {
    const holidayMatch = pricingRules.holidays.find(
      (h) => formatDateStr(h.date) === dateStr
    );
    if (holidayMatch) {
      const rate =
        typeof holidayMatch.hourlyPrice === "number" && holidayMatch.hourlyPrice > 0
          ? Number(holidayMatch.hourlyPrice)
          : typeof pricingRules.holidayPrice === "number"
          ? Number(pricingRules.holidayPrice)
          : baseHourlyRate;

      return {
        baseHourlyRate,
        effectiveHourlyRate: rate,
        ruleType: "holiday",
        ruleLabel: `Holiday Rate (${holidayMatch.name || "Public Holiday"})`,
        adjustmentPerHour: rate - baseHourlyRate,
      };
    }
  }

  // PRIORITY 3: Peak-Season Pricing
  const isPeakMonth =
    Array.isArray(pricingRules.peakSeasonMonths) &&
    pricingRules.peakSeasonMonths.includes(monthNumber);

  if (isPeakMonth && typeof pricingRules.peakSeasonPrice === "number") {
    const rate = Number(pricingRules.peakSeasonPrice);
    return {
      baseHourlyRate,
      effectiveHourlyRate: rate,
      ruleType: "peak_season",
      ruleLabel: "Peak Season Rate",
      adjustmentPerHour: rate - baseHourlyRate,
    };
  }

  // PRIORITY 4: Weekend Pricing (Saturday or Sunday)
  if (isWeekend && typeof pricingRules.weekendPrice === "number") {
    const rate = Number(pricingRules.weekendPrice);
    return {
      baseHourlyRate,
      effectiveHourlyRate: rate,
      ruleType: "weekend",
      ruleLabel: "Weekend Rate Adjustment",
      adjustmentPerHour: rate - baseHourlyRate,
    };
  }

  // PRIORITY 5: Weekday Pricing / Base Rate
  if (!isWeekend && typeof pricingRules.weekdayPrice === "number") {
    const rate = Number(pricingRules.weekdayPrice);
    return {
      baseHourlyRate,
      effectiveHourlyRate: rate,
      ruleType: "weekday",
      ruleLabel: "Weekday Rate",
      adjustmentPerHour: rate - baseHourlyRate,
    };
  }

  // DEFAULT: Standard Base Rate
  return {
    baseHourlyRate,
    effectiveHourlyRate: baseHourlyRate,
    ruleType: "base",
    ruleLabel: "Standard Base Rate",
    adjustmentPerHour: 0,
  };
};

/**
 * Calculates complete, verified itemized pricing for a booking attempt.
 * Server is the strict single source of truth.
 */
const calculatePrice = async ({
  spot,
  date,
  startTime,
  endTime,
  durationHours,
  selectedAmenities = [],
  foodOrder = null,
  customRequests = [],
}) => {
  const hours = Math.max(1, Number(durationHours) || 1);

  // 1. Resolve effective plot hourly rate via priority hierarchy
  const rateInfo = determineEffectiveRate({ spot, date });
  const { baseHourlyRate, effectiveHourlyRate, ruleType, ruleLabel, adjustmentPerHour } = rateInfo;

  const basePlotTotal = Math.round(baseHourlyRate * hours);
  const totalAdjustment = Math.round(adjustmentPerHour * hours);
  const unDiscountedPlotTotal = Math.round(effectiveHourlyRate * hours);

  // 2. Evaluate stay duration discounts
  let durationDiscount = {
    applied: false,
    percentage: 0,
    discountAmount: 0,
    label: "",
  };

  const discounts = spot?.pricingRules?.durationDiscounts;
  if (Array.isArray(discounts) && discounts.length > 0) {
    // Find all qualifying discount tiers and select the highest percentage
    const qualifying = discounts.filter((d) => hours >= Number(d.minHours));
    if (qualifying.length > 0) {
      qualifying.sort((a, b) => Number(b.discountPercentage) - Number(a.discountPercentage));
      const best = qualifying[0];
      const pct = Number(best.discountPercentage) || 0;
      const amount = Math.round(unDiscountedPlotTotal * (pct / 100));

      durationDiscount = {
        applied: true,
        percentage: pct,
        discountAmount: amount,
        label: best.label || `Stay ${best.minHours}+ Hours Discount (${pct}%)`,
      };
    }
  }

  const effectivePlotTotal = Math.max(0, unDiscountedPlotTotal - durationDiscount.discountAmount);

  // 3. Validate and calculate catalog amenities
  const catalogAmenities = Array.isArray(spot?.amenities) ? spot.amenities : [];
  let totalAmenityHourlyRate = 0;
  const validatedAmenities = [];
  const amenitiesBreakdown = [];

  if (Array.isArray(selectedAmenities)) {
    selectedAmenities.forEach((item) => {
      const itemName = typeof item === "string" ? item : item.name || item.title;
      if (!itemName) return;

      const catalogMatch = catalogAmenities.find((catalogItem) => {
        if (typeof catalogItem === "string") {
          return catalogItem.trim().toLowerCase() === itemName.trim().toLowerCase();
        }
        if (typeof catalogItem === "object" && catalogItem) {
          const catName = catalogItem.name || catalogItem.title || "";
          return catName.trim().toLowerCase() === itemName.trim().toLowerCase();
        }
        return false;
      });

      let amenityHourlyPrice = 0;
      if (catalogMatch && typeof catalogMatch === "object") {
        amenityHourlyPrice = Number(catalogMatch.price || catalogMatch.hourlyPrice) || 0;
      }

      const amenityLineTotal = Math.round(amenityHourlyPrice * hours);
      totalAmenityHourlyRate += amenityHourlyPrice;

      validatedAmenities.push({
        name: itemName,
        hourlyPrice: amenityHourlyPrice,
      });

      amenitiesBreakdown.push({
        name: itemName,
        hourlyPrice: amenityHourlyPrice,
        hours,
        total: amenityLineTotal,
      });
    });
  }

  const amenitiesTotal = Math.round(totalAmenityHourlyRate * hours);

  // 4. Validate and calculate food order subtotal if present
  let savedFoodOrder = undefined;
  let foodSubtotal = 0;

  if (foodOrder && foodOrder.items && Array.isArray(foodOrder.items) && foodOrder.items.length > 0) {
    const restaurantId =
      foodOrder.restaurantId || foodOrder.restaurant || (foodOrder._id ? foodOrder._id : null);

    if (restaurantId) {
      const restaurantObj = await Restaurant.findById(restaurantId);
      if (restaurantObj && Array.isArray(restaurantObj.menu)) {
        const validatedFoodItems = [];

        foodOrder.items.forEach((orderItem) => {
          const orderItemName = (orderItem.name || orderItem.title || "").trim().toLowerCase();
          const quantity = Math.max(1, parseInt(orderItem.quantity, 10) || 1);

          const menuItem = restaurantObj.menu.find(
            (m) => (m.name || "").trim().toLowerCase() === orderItemName
          );

          if (menuItem) {
            const itemPrice = Number(menuItem.price) || 0;
            const lineTotal = itemPrice * quantity;
            foodSubtotal += lineTotal;
            validatedFoodItems.push({
              name: menuItem.name,
              price: itemPrice,
              quantity,
            });
          }
        });

        if (validatedFoodItems.length > 0) {
          savedFoodOrder = {
            restaurant: restaurantObj._id,
            restaurantName: restaurantObj.name,
            items: validatedFoodItems,
            subtotal: foodSubtotal,
          };
        }
      }
    }
  }

  // 5. Accepted custom requests total
  let customRequestsTotal = 0;
  if (Array.isArray(customRequests)) {
    customRequests.forEach((cr) => {
      if (cr.customerAccepted && typeof cr.ownerQuotedPrice === "number") {
        customRequestsTotal += Number(cr.ownerQuotedPrice);
      }
    });
  }

  // 6. Compute Grand Total
  const grandTotal = Math.round(
    effectivePlotTotal + amenitiesTotal + foodSubtotal + customRequestsTotal
  );

  // 7. Format Itemized Lines matching required transparent bill structure
  const itemizedLines = [];

  // Plot Base Line
  itemizedLines.push({
    label: `Plot (${hours} ${hours === 1 ? "hr" : "hrs"} @ ₹${baseHourlyRate.toLocaleString()}/hr)`,
    amount: basePlotTotal,
    type: "base",
  });

  // Dynamic Rule Adjustment Line (Weekend, Peak Season, Holiday, Special Date)
  if (totalAdjustment !== 0) {
    const sign = totalAdjustment > 0 ? "+" : "-";
    const perHrSign = adjustmentPerHour > 0 ? "+" : "-";
    itemizedLines.push({
      label: `${ruleLabel} (${perHrSign}₹${Math.abs(adjustmentPerHour).toLocaleString()}/hr × ${hours}h)`,
      amount: totalAdjustment,
      type: "adjustment",
      ruleType,
    });
  }

  // Extended Stay Discount Line
  if (durationDiscount.applied) {
    itemizedLines.push({
      label: `${durationDiscount.label}`,
      amount: -durationDiscount.discountAmount,
      type: "discount",
    });
  }

  // Amenities Lines (Itemized)
  amenitiesBreakdown.forEach((a) => {
    itemizedLines.push({
      label: `${a.name}${a.hourlyPrice > 0 ? ` (+₹${a.hourlyPrice.toLocaleString()}/hr × ${hours}h)` : " (Included)"}`,
      amount: a.total,
      type: "amenity",
    });
  });

  // Food Subtotal Line
  if (foodSubtotal > 0) {
    itemizedLines.push({
      label: `Local Food & Beverages (${savedFoodOrder?.restaurantName || "Catering"})`,
      amount: foodSubtotal,
      type: "food",
    });
  }

  // Custom Requests Line
  if (customRequestsTotal > 0) {
    itemizedLines.push({
      label: "Custom Host Add-ons",
      amount: customRequestsTotal,
      type: "custom_requests",
    });
  }

  return {
    baseHourlyRate,
    effectiveHourlyRate,
    durationHours: hours,
    basePlotTotal,
    appliedRule: {
      ruleType,
      ruleLabel,
      effectiveHourlyRate,
      adjustmentPerHour,
      totalAdjustment,
    },
    durationDiscount,
    effectivePlotTotal,
    amenitiesBreakdown,
    amenitiesTotal,
    validatedAmenities,
    savedFoodOrder,
    foodSubtotal,
    customRequestsTotal,
    grandTotal,
    itemizedLines,
  };
};

module.exports = {
  formatDateStr,
  determineEffectiveRate,
  calculatePrice,
};
