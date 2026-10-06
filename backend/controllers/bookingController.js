const Booking = require("../models/Booking");
const Spot = require("../models/Spot");
const Experience = require("../models/Experience");
const Restaurant = require("../models/Restaurant");
const asyncHandler = require("../utils/asyncHandler");
const availabilityService = require("../services/availabilityService");
const pricingService = require("../services/pricingService");
const promotionService = require("../services/promotionService");
const referralService = require("../services/referralService");
const User = require("../models/User");
const { sendBookingApprovedEmail, sendBookingRejectedEmail } = require("../services/emailService");

// Helper to convert "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const mins = parseInt(parts[1], 10) || 0;
  return hours * 60 + mins;
};

// 1. CREATE CUSTOMER BOOKING (Supports both direct Plot & Experience Packages)
const createBooking = asyncHandler(async (req, res) => {
  const {
    spotId,
    spot,
    experienceId,
    experience: bodyExperience,
    date,
    startTime = "09:00",
    endTime: bodyEndTime,
    durationHours,
    selectedAmenities = [],
    selectedAddOns = [],
    foodOrder,
    guests = 1,
  } = req.body;

  // Check if booking an Experience Package
  let experienceDoc = null;
  const targetExpId = experienceId || bodyExperience;
  if (targetExpId) {
    experienceDoc = await Experience.findById(targetExpId).populate("spot");
    if (!experienceDoc) {
      return res.status(404).json({
        success: false,
        message: "Selected experience package was not found",
      });
    }
  }

  const targetSpotId = experienceDoc ? experienceDoc.spot._id : (spotId || spot);
  if (!targetSpotId) {
    return res.status(400).json({
      success: false,
      message: "Spot ID or Experience ID is required",
    });
  }

  if (!date) {
    return res.status(400).json({
      success: false,
      message: "Booking date is required",
    });
  }

  // 1. Validate spot exists
  const spotObj = experienceDoc ? experienceDoc.spot : await Spot.findById(targetSpotId);
  if (!spotObj) {
    return res.status(404).json({
      success: false,
      message: "Spot listing not found",
    });
  }
  const targetSpotOwnerId = spotObj.owner?._id ? spotObj.owner._id.toString() : spotObj.owner?.toString();

  // 2. Compute duration in hours and end time
  let hours = experienceDoc ? experienceDoc.durationHours : Number(durationHours);
  let endTime = bodyEndTime || "17:00";
  const startMins = timeToMinutes(startTime);

  if (experienceDoc) {
    // Automatically calculate end time for fixed-duration experience
    const eMins = startMins + hours * 60;
    const endH = Math.floor(eMins / 60) % 24;
    const endM = eMins % 60;
    endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  } else if (!hours || hours <= 0) {
    const endMins = timeToMinutes(endTime);
    if (endMins > startMins) {
      hours = Math.max(1, Math.round(((endMins - startMins) / 60) * 10) / 10);
    } else {
      hours = 1;
    }
  }

  // 3. SERVER-SIDE PRICING CALCULATION (Authoritative Single Source of Truth)
  let calculatedTotal = 0;
  let pricingResult = null;
  let validatedAmenities = [];
  let savedFoodOrder = null;
  const validatedAddOns = [];

  if (experienceDoc) {
    // A. Experience Package Base Price
    const basePackagePrice = experienceDoc.price;
    calculatedTotal = basePackagePrice;

    // B. Included Amenities (bundled, ₹0)
    const includedLines = (experienceDoc.includedAmenities || []).map((inc) => ({
      label: `${inc.name} (Included in Package)`,
      amount: 0,
      type: "included_amenity",
    }));

    // C. Process Selected Optional Add-Ons
    const itemizedAddOns = [];
    if (Array.isArray(selectedAddOns)) {
      selectedAddOns.forEach((addonReq) => {
        const addonName = typeof addonReq === "string" ? addonReq.trim() : (addonReq.name || "").trim();
        const matched = (experienceDoc.optionalAddOns || []).find(
          (opt) => opt.name.toLowerCase() === addonName.toLowerCase()
        );
        if (matched) {
          calculatedTotal += matched.price;
          validatedAddOns.push({ name: matched.name, price: matched.price });
          itemizedAddOns.push({
            label: `${matched.name} (Add-On Upgrade)`,
            amount: matched.price,
            type: "optional_addon",
          });
        }
      });
    }

    // D. Food Order subtotal if any
    let foodSubtotal = 0;
    if (foodOrder && Array.isArray(foodOrder.items) && foodOrder.items.length > 0) {
      foodSubtotal = foodOrder.items.reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
        0
      );
      calculatedTotal += foodSubtotal;
      savedFoodOrder = {
        restaurant: foodOrder.restaurant || null,
        restaurantName: foodOrder.restaurantName || "",
        items: foodOrder.items,
        subtotal: foodSubtotal,
      };
    }

    pricingResult = {
      isExperience: true,
      experienceId: experienceDoc._id,
      experienceTitle: experienceDoc.title,
      durationHours: experienceDoc.durationHours,
      basePackagePrice,
      includedAmenities: experienceDoc.includedAmenities,
      selectedAddOns: validatedAddOns,
      foodSubtotal,
      grandTotal: calculatedTotal,
      itemizedLines: [
        {
          label: `${experienceDoc.title} (${experienceDoc.durationHours}h Package)`,
          amount: basePackagePrice,
          type: "experience_base",
        },
        ...includedLines,
        ...itemizedAddOns,
        ...(foodSubtotal > 0
          ? [{ label: `Food Order (${savedFoodOrder.restaurantName || "Kitchen"})`, amount: foodSubtotal, type: "food" }]
          : []),
      ],
    };
  } else {
    // Normal spot hourly reservation pricing
    pricingResult = await pricingService.calculatePrice({
      spot: spotObj,
      date,
      startTime,
      endTime,
      durationHours: hours,
      selectedAmenities,
      foodOrder,
      customRequests: req.body.customRequests,
    });

    calculatedTotal = pricingResult.grandTotal;
    validatedAmenities = pricingResult.validatedAmenities;
    savedFoodOrder = pricingResult.savedFoodOrder;
  }

  // 3b. PROMOTION / DISCOUNT CODE EVALUATION (Feature 6: Landowner Growth Tools)
  let appliedPromotion = null;
  let promoDocToRecord = null;
  const rawPromoCode = req.body.promoCode || req.body.code;

  if (rawPromoCode && typeof rawPromoCode === "string" && rawPromoCode.trim()) {
    const promoValidation = await promotionService.validatePromotion({
      code: rawPromoCode,
      hostId: targetSpotOwnerId,
      spotId: targetSpotId,
      experienceId: experienceDoc ? experienceDoc._id : null,
      subtotal: calculatedTotal,
      date,
    });

    if (!promoValidation.valid) {
      return res.status(400).json({
        success: false,
        message: promoValidation.message,
      });
    }

    const discountAmount = promoValidation.discountAmount;
    calculatedTotal = Math.max(0, calculatedTotal - discountAmount);

    appliedPromotion = {
      promoId: promoValidation.promo._id,
      code: promoValidation.promo.code,
      title: promoValidation.promo.title,
      promoType: promoValidation.promo.promoType,
      discountType: promoValidation.promo.discountType,
      discountValue: promoValidation.promo.discountValue,
      discountAmount,
    };
    promoDocToRecord = promoValidation.promo._id;

    if (pricingResult && Array.isArray(pricingResult.itemizedLines)) {
      pricingResult.itemizedLines.push({
        label: `Promo Code "${promoValidation.promo.code}" (${
          promoValidation.promo.discountType === "percentage"
            ? `${promoValidation.promo.discountValue}% Off`
            : `₹${promoValidation.promo.discountValue} Off`
        })`,
        amount: -discountAmount,
        type: "promo_code",
      });
    }
  } else {
    // Check automatic discounts (Early-bird or Repeat Customer)
    const autoPromo = await promotionService.evaluateAutomaticDiscounts({
      hostId: targetSpotOwnerId,
      spotId: targetSpotId,
      subtotal: calculatedTotal,
      date,
      userId: req.user?._id,
    });

    if (autoPromo && autoPromo.valid && autoPromo.discountAmount > 0) {
      calculatedTotal = Math.max(0, calculatedTotal - autoPromo.discountAmount);
      appliedPromotion = {
        promoId: autoPromo.promo._id,
        code: autoPromo.promo.code,
        title: autoPromo.promo.title,
        promoType: autoPromo.promo.promoType,
        discountType: autoPromo.promo.discountType,
        discountValue: autoPromo.promo.discountValue,
        discountAmount: autoPromo.discountAmount,
      };
      promoDocToRecord = autoPromo.promo._id;

      if (pricingResult && Array.isArray(pricingResult.itemizedLines)) {
        pricingResult.itemizedLines.push({
          label: `${autoPromo.promo.title} (${
            autoPromo.promo.discountType === "percentage"
              ? `${autoPromo.promo.discountValue}% Off`
              : `₹${autoPromo.promo.discountValue} Off`
          })`,
          amount: -autoPromo.discountAmount,
          type: "auto_promotion",
        });
      }
    }
  }

  // 3c. WALLET CREDIT EVALUATION (Feature 8: Referral System & Customer Wallet)
  let appliedWalletCredits = 0;
  const wantWalletCredits =
    req.body.useWalletCredits === true ||
    req.body.useWalletCredits === "true" ||
    Number(req.body.appliedWalletCredits) > 0;

  if (wantWalletCredits && req.user) {
    const userDoc = await User.findById(req.user._id);
    if (userDoc && userDoc.walletBalance > 0) {
      const walletCalc = referralService.calculateApplicableCredits({
        userWalletBalance: userDoc.walletBalance,
        bookingTotal: calculatedTotal,
        requestedCredits: req.body.appliedWalletCredits,
      });

      if (walletCalc.canApply && walletCalc.applicableCredits > 0) {
        appliedWalletCredits = walletCalc.applicableCredits;
        calculatedTotal = walletCalc.payableTotal;

        if (pricingResult && Array.isArray(pricingResult.itemizedLines)) {
          pricingResult.itemizedLines.push({
            label: `Thikana Wallet Credits (Balance: ₹${userDoc.walletBalance})`,
            amount: -appliedWalletCredits,
            type: "wallet_credit",
          });
        }
      }
    }
  }

  if (pricingResult) {
    pricingResult.grandTotal = calculatedTotal;
    pricingResult.appliedWalletCredits = appliedWalletCredits;
  }

  // 4. INTELLIGENT AVAILABILITY & CONFLICT VALIDATION ON SPOT
  const dateStr = pricingService.formatDateStr(date);
  const bookingDate = new Date(date);
  const availResult = await availabilityService.checkSlotAvailability({
    spotId: targetSpotId,
    date,
    startTime,
    endTime,
    durationHours: hours,
  });

  if (!availResult.available) {
    return res.status(400).json({
      success: false,
      code: availResult.code,
      message: availResult.message,
      conflictBooking: availResult.conflictBooking,
    });
  }

  // 5. Custom Requests
  const validatedCustomRequests = [];
  if (req.body.customRequests) {
    const rawReqs = Array.isArray(req.body.customRequests)
      ? req.body.customRequests
      : [req.body.customRequests];
    rawReqs.forEach((cr) => {
      const desc = typeof cr === "string" ? cr.trim() : (cr.description || "").trim();
      if (desc) {
        validatedCustomRequests.push({
          description: desc,
          ownerResponse: "pending",
          ownerQuotedPrice: null,
          customerAccepted: false,
        });
      }
    });
  }

  // Determine if booking is fully paid via wallet credits
  const isFullyPaidByCredits = calculatedTotal === 0 && appliedWalletCredits > 0;

  // 6. Create booking with status "pending"
  const booking = await Booking.create({
    user: req.user._id,
    spot: targetSpotId,
    experience: experienceDoc ? experienceDoc._id : null,
    experienceTitle: experienceDoc ? experienceDoc.title : "",
    selectedAddOns: validatedAddOns,
    date: bookingDate,
    startTime,
    endTime,
    durationHours: hours,
    checkIn: bookingDate,
    checkOut: bookingDate,
    guests: guests || 1,
    selectedAmenities: validatedAmenities,
    foodOrder: savedFoodOrder,
    customRequests: validatedCustomRequests,
    totalPrice: calculatedTotal,
    appliedWalletCredits: appliedWalletCredits,
    pricingBreakdown: pricingResult,
    promoCode: appliedPromotion?.code || null,
    appliedPromotion: appliedPromotion || undefined,
    status: "pending",
    paymentStatus: isFullyPaidByCredits ? "paid" : "unpaid",
    amountPaid: isFullyPaidByCredits ? appliedWalletCredits : 0,
    paidAt: isFullyPaidByCredits ? new Date() : null,
    razorpayPaymentId: isFullyPaidByCredits ? "wallet_credit_full" : null,
  });

  // 7. ATOMIC DATABASE-LEVEL SLOT LOCK ACQUISITION (Concurrency & Race-Condition Safe)
  const lockResult = await availabilityService.acquireSlotLocks({
    spotId: targetSpotId,
    bookingId: booking._id,
    dateStr,
    startTime,
    endTime,
    bufferMinutes: availResult.bufferMinutes,
  });

  if (!lockResult.success) {
    // If a collision was caught at the database index level, roll back the created booking
    await Booking.findByIdAndDelete(booking._id);
    return res.status(409).json({
      success: false,
      code: lockResult.code,
      message: lockResult.message,
    });
  }

  // Record promo code usage after lock acquisition succeeds
  if (promoDocToRecord) {
    await promotionService.recordPromotionUsage(promoDocToRecord);
  }

  // Deduct applied wallet credits from user's balance
  if (appliedWalletCredits > 0) {
    await referralService.deductWalletCredits({
      userId: req.user._id,
      amount: appliedWalletCredits,
      bookingId: booking._id,
      spotTitle: spotObj.title,
    });
  }

  const populatedBooking = await Booking.findById(booking._id)
    .populate("spot")
    .populate("user", "name email")
    .populate("foodOrder.restaurant");

  res.status(201).json({
    success: true,
    data: populatedBooking,
    ...populatedBooking.toObject(),
    message: "Booking submitted successfully",
  });
});

// 2. GET CUSTOMER BOOKINGS (req.user)
const getCustomerBookings = asyncHandler(async (req, res) => {
  const query = { user: req.user._id };

  if (req.query.status) {
    query.status = req.query.status;
  }

  const bookings = await Booking.find(query)
    .populate("spot")
    .populate("user", "name email")
    .populate("foodOrder.restaurant")
    .sort({ createdAt: -1 });

  res.json(bookings);
});

// 3. GET OWNER'S SPOT BOOKINGS (with filters: status, spotId, date range)
const getOwnerBookings = asyncHandler(async (req, res) => {
  // Find all spots owned by current authenticated owner
  const ownerSpots = await Spot.find({ owner: req.user._id }).select("_id");
  const spotIds = ownerSpots.map((s) => s._id.toString());

  if (spotIds.length === 0) {
    return res.json([]);
  }

  // Build query
  let query = { spot: { $in: spotIds } };

  // Filter by specific spot if provided
  if (req.query.spotId) {
    query.spot = req.query.spotId;
  }

  // Filter by status if provided
  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  // Filter by date range if provided
  if (req.query.startDate || req.query.endDate) {
    query.date = {};
    if (req.query.startDate) {
      query.date.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  const bookings = await Booking.find(query)
    .populate("spot")
    .populate("user", "name email")
    .populate("foodOrder.restaurant")
    .sort({ createdAt: -1 });

  res.json(bookings);
});

// 4. UPDATE BOOKING STATUS (CONFIRM / REJECT / CANCEL)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id).populate("spot");

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found",
    });
  }

  const isOwner =
    booking.spot &&
    booking.spot.owner &&
    booking.spot.owner.toString() === req.user._id.toString();
  const isCustomer =
    booking.user && booking.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  // Validate allowed status transitions
  const validStatuses = ["pending", "approved", "confirmed", "rejected", "cancelled", "expired"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status '${status}'. Allowed values: ${validStatuses.join(", ")}`,
    });
  }

  // Enforce security rule: 'confirmed' can ONLY be set via verified payment flow
  if (status === "confirmed") {
    return res.status(400).json({
      success: false,
      message: "Direct confirmation is not permitted. Bookings can only be confirmed upon successful payment verification.",
    });
  }

  // Customer Cancellation
  if (status === "cancelled") {
    if (!isCustomer && !isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (booking.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a booking that has already been rejected",
      });
    }
  } else {
    // Owner Approval / Rejection
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only the property owner can accept or reject bookings",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot modify a booking that is already cancelled",
      });
    }

    // On Owner Approval: check for conflict against other confirmed/approved reservations
    if (status === "approved") {
      const recheck = await availabilityService.checkSlotAvailability({
        spotId: booking.spot._id,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        durationHours: booking.durationHours,
        excludeBookingId: booking._id,
      });

      if (!recheck.available) {
        return res.status(400).json({
          success: false,
          code: recheck.code,
          message: `Approval conflict: ${recheck.message}`,
        });
      }
    }
  }

  booking.status = status;
  await booking.save();

  // Release database-level slot locks if booking is cancelled, rejected, or expired
  if (["cancelled", "rejected", "expired"].includes(status)) {
    await availabilityService.releaseSlotLocks(booking._id);
    // Refund wallet credits and handle referral qualification adjustment if applicable
    await referralService.handleBookingCancellation(booking);
  }

  const populated = await Booking.findById(booking._id)
    .populate("spot")
    .populate("user", "name email")
    .populate("foodOrder.restaurant");

  // Asynchronously dispatch email notification on approval or rejection
  try {
    const customerEmail = populated.user?.email;
    const customerName = populated.user?.name;
    const spotTitle = populated.spot?.title || populated.experienceTitle || "Scenic Spot";
    const dateFormatted = populated.date ? new Date(populated.date).toLocaleDateString("en-IN") : "Upcoming";

    if (customerEmail) {
      if (status === "approved") {
        const rawClientUrls = process.env.CLIENT_URL
          ? process.env.CLIENT_URL.split(",").map((u) => u.trim().replace(/\/$/, ""))
          : [];
        const clientBaseUrl = rawClientUrls[0] || "http://localhost:5173";
        const paymentUrl = `${clientBaseUrl}/my-bookings`;

        sendBookingApprovedEmail({
          to: customerEmail,
          name: customerName,
          spotTitle,
          bookingDate: dateFormatted,
          startTime: populated.startTime || "09:00",
          endTime: populated.endTime || "17:00",
          totalPrice: populated.totalPrice,
          paymentUrl,
        }).catch((err) => console.error("[Booking] Error sending approval email:", err.message));
      } else if (status === "rejected") {
        sendBookingRejectedEmail({
          to: customerEmail,
          name: customerName,
          spotTitle,
          bookingDate: dateFormatted,
          reason: req.body.reason || "The host is unable to accommodate this reservation schedule.",
        }).catch((err) => console.error("[Booking] Error sending rejection email:", err.message));
      }
    }
  } catch (emailErr) {
    console.error("[Booking] Status change notification dispatch error:", emailErr.message);
  }

  res.json({
    success: true,
    data: populated,
    ...populated.toObject(),
    message: `Booking status successfully updated to ${status}`,
  });
});

const cancelBooking = asyncHandler(async (req, res) => {
  req.body.status = "cancelled";
  return updateBookingStatus(req, res);
});

// 5. OWNER RESPONDS TO CUSTOM REQUEST (Approve with price quote / Reject)
const respondToCustomRequest = asyncHandler(async (req, res) => {
  const { id, index } = req.params;
  const { ownerResponse, ownerQuotedPrice } = req.body;

  const idx = parseInt(index, 10);
  if (isNaN(idx)) {
    return res.status(400).json({
      success: false,
      message: "Invalid custom request index",
    });
  }

  const booking = await Booking.findById(id).populate("spot");
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found",
    });
  }

  // Check owner authorization
  const spotOwner = booking.spot?.owner;
  if (
    spotOwner &&
    spotOwner.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to manage custom requests for this property",
    });
  }

  if (!booking.customRequests || !booking.customRequests[idx]) {
    return res.status(404).json({
      success: false,
      message: "Custom request item not found at this index",
    });
  }

  if (!["approved", "rejected", "pending"].includes(ownerResponse)) {
    return res.status(400).json({
      success: false,
      message: "ownerResponse must be 'approved', 'rejected', or 'pending'",
    });
  }

  booking.customRequests[idx].ownerResponse = ownerResponse;

  if (ownerResponse === "approved") {
    const quoted = Number(ownerQuotedPrice);
    booking.customRequests[idx].ownerQuotedPrice = !isNaN(quoted) && quoted >= 0 ? quoted : 0;
  } else if (ownerResponse === "rejected") {
    booking.customRequests[idx].ownerQuotedPrice = null;
    booking.customRequests[idx].customerAccepted = false;
  }

  await booking.save();

  const populated = await Booking.findById(booking._id)
    .populate("spot")
    .populate("user", "name email")
    .populate("foodOrder.restaurant");

  res.json({
    success: true,
    data: populated,
    message: `Custom request #${idx + 1} marked as ${ownerResponse}`,
  });
});

// 6. CUSTOMER ACCEPTS QUOTED PRICE FOR CUSTOM REQUEST
const acceptCustomRequestPrice = asyncHandler(async (req, res) => {
  const { id, index } = req.params;
  const idx = parseInt(index, 10);

  if (isNaN(idx)) {
    return res.status(400).json({
      success: false,
      message: "Invalid custom request index",
    });
  }

  const booking = await Booking.findById(id).populate("spot");
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found",
    });
  }

  // Check customer authorization
  if (
    booking.user.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to accept quotes for this booking",
    });
  }

  if (!booking.customRequests || !booking.customRequests[idx]) {
    return res.status(404).json({
      success: false,
      message: "Custom request item not found at this index",
    });
  }

  const targetReq = booking.customRequests[idx];
  if (targetReq.ownerResponse !== "approved") {
    return res.status(400).json({
      success: false,
      message: "Cannot accept quote for a request that has not been approved by the host",
    });
  }

  if (targetReq.customerAccepted) {
    return res.status(400).json({
      success: false,
      message: "Quote has already been accepted",
    });
  }

  const quotedPrice = Number(targetReq.ownerQuotedPrice) || 0;
  targetReq.customerAccepted = true;
  booking.totalPrice = Math.round(Number(booking.totalPrice || 0) + quotedPrice);

  await booking.save();

  const populated = await Booking.findById(booking._id)
    .populate("spot")
    .populate("user", "name email")
    .populate("foodOrder.restaurant");

  res.json({
    success: true,
    data: populated,
    message: `Accepted quote of ₹${quotedPrice} for "${targetReq.description}". Total updated!`,
  });
});

module.exports = {
  createBooking,
  getCustomerBookings,
  getUserBookings: getCustomerBookings,
  getOwnerBookings,
  updateBookingStatus,
  cancelBooking,
  respondToCustomRequest,
  acceptCustomRequestPrice,
};