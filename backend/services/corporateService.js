const mongoose = require("mongoose");
const Organization = require("../models/Organization");
const User = require("../models/User");
const Spot = require("../models/Spot");
const Experience = require("../models/Experience");
const Booking = require("../models/Booking");
const availabilityService = require("./availabilityService");
const pricingService = require("./pricingService");

// 1. CREATE OR UPDATE ORGANIZATION PROFILE
const createOrUpdateOrganization = async ({ userId, orgData }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  let org = null;
  if (user.organization) {
    org = await Organization.findById(user.organization);
  }

  if (!org) {
    org = await Organization.findOne({ creator: userId });
  }

  const payload = {
    name: orgData.name || orgData.companyName,
    industry: orgData.industry || "Technology",
    companySize: orgData.companySize || "11-50",
    gstin: orgData.gstin ? orgData.gstin.trim().toUpperCase() : "",
    billingAddress: orgData.billingAddress || "",
    contactEmail: orgData.contactEmail || user.email,
    contactPhone: orgData.contactPhone || "",
    website: orgData.website || "",
    logo: orgData.logo || "",
  };

  if (org) {
    Object.assign(org, payload);
    await org.save();
  } else {
    org = await Organization.create({
      ...payload,
      creator: userId,
      members: [
        {
          user: userId,
          name: user.name,
          email: user.email,
          designation: orgData.designation || "Corporate Organizer",
          role: "admin",
        },
      ],
    });

    user.organization = org._id;
    user.organizationRole = "admin";
    // Upgrade role to corporate if currently regular customer
    if (user.role === "customer" || user.role === "tourist") {
      user.role = "corporate";
    }
    await user.save();
  }

  return org;
};

// 2. GET USER ORGANIZATION
const getOrganizationByUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  if (user.organization) {
    return await Organization.findById(user.organization);
  }

  return await Organization.findOne({
    $or: [{ creator: userId }, { "members.user": userId }],
  });
};

// 3. GET CORPORATE-FRIENDLY SPACES & PACKAGES
const getCorporateSpaces = async ({
  minCapacity = 10,
  eventType = null,
  location = null,
  amenity = null,
}) => {
  const query = {
    isActive: true,
    "corporateFriendly.isCorporateFriendly": true,
  };

  if (minCapacity) {
    query["corporateFriendly.maxCorporateCapacity"] = {
      $gte: Number(minCapacity),
    };
  }

  if (location && location.trim()) {
    query.location = { $regex: location.trim(), $options: "i" };
  }

  if (amenity && amenity.trim()) {
    query["corporateFriendly.corporateAmenities"] = {
      $regex: amenity.trim(),
      $options: "i",
    };
  }

  const spots = await Spot.find(query)
    .populate("owner", "name email avatar")
    .sort({ rating: -1, createdAt: -1 });

  // Also query corporate curated experience packages
  const expQuery = {
    isActive: true,
    isCorporate: true,
  };

  if (eventType && eventType !== "all") {
    expQuery.corporateType = eventType;
  }

  const experiences = await Experience.find(expQuery)
    .populate({
      path: "spot",
      select: "title location images address corporateFriendly",
    })
    .populate("owner", "name email")
    .sort({ rating: -1 });

  return {
    spots,
    experiences,
    totalSpots: spots.length,
    totalExperiences: experiences.length,
  };
};

// 4. SUBMIT CORPORATE BOOKING OR CUSTOM QUOTE REQUEST
const submitCorporateBookingRequest = async ({
  userId,
  spotId,
  experienceId,
  date,
  startTime = "09:00",
  durationHours = 4,
  corporateDetails,
  requiresCustomQuote = true,
}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  let org = await getOrganizationByUser(userId);
  if (!org && corporateDetails?.companyName) {
    // Auto-create lightweight organization if companyName provided
    org = await createOrUpdateOrganization({
      userId,
      orgData: {
        companyName: corporateDetails.companyName,
        gstin: corporateDetails.gstin,
        contactEmail: corporateDetails.contactEmail || user.email,
        contactPhone: corporateDetails.contactPhone,
      },
    });
  }

  let targetSpot = null;
  let experienceDoc = null;

  if (experienceId) {
    experienceDoc = await Experience.findById(experienceId).populate("spot");
    if (!experienceDoc) {
      throw new Error("Selected corporate experience package was not found");
    }
    targetSpot = experienceDoc.spot;
  } else if (spotId) {
    targetSpot = await Spot.findById(spotId);
    if (!targetSpot) {
      throw new Error("Selected plot was not found");
    }
  } else {
    throw new Error("Spot ID or Experience ID is required");
  }

  const bookingDate = new Date(date);
  if (isNaN(bookingDate.getTime())) {
    throw new Error("Valid event date is required");
  }

  const hours = Number(durationHours) || (experienceDoc ? experienceDoc.durationHours : 4);
  const [startH, startM] = startTime.split(":").map(Number);
  const endH = startH + hours;
  const endTime = `${String(endH).padStart(2, "0")}:${String(startM || 0).padStart(2, "0")}`;

  const attendees = Number(corporateDetails?.attendeesCount) || 10;

  // Check capacity limits
  const maxAllowed = targetSpot.corporateFriendly?.maxCorporateCapacity || targetSpot.maxGuests || 50;
  if (attendees > maxAllowed * 2) {
    throw new Error(`Attendees (${attendees}) exceed maximum plot capacity (${maxAllowed})`);
  }

  const formattedCorporateDetails = {
    companyName: corporateDetails?.companyName || org?.name || "Corporate Organization",
    gstin: corporateDetails?.gstin || org?.gstin || "",
    contactPerson: corporateDetails?.contactPerson || user.name,
    contactEmail: corporateDetails?.contactEmail || user.email,
    contactPhone: corporateDetails?.contactPhone || "",
    eventType: corporateDetails?.eventType || "team_outing",
    attendeesCount: attendees,
    participants: Array.isArray(corporateDetails?.participants)
      ? corporateDetails.participants
      : [],
    eventObjectives: corporateDetails?.eventObjectives || "",
    requiredAmenities: Array.isArray(corporateDetails?.requiredAmenities)
      ? corporateDetails.requiredAmenities
      : [],
    cateringNeeded: Boolean(corporateDetails?.cateringNeeded),
    cateringNotes: corporateDetails?.cateringNotes || "",
    avTechNeeded: Boolean(corporateDetails?.avTechNeeded),
    estimatedBudget: Number(corporateDetails?.estimatedBudget) || null,
    purchaseOrderNumber: corporateDetails?.purchaseOrderNumber || "",
    quoteDetails: {
      quotedAmount: null,
      quotedPerHeadPrice: null,
      quoteNotes: "",
      quoteProvidedAt: null,
      quoteExpiresAt: null,
      termsAndInclusions: [],
    },
  };

  // Determine if instant booking or quote request
  const isInstant =
    !requiresCustomQuote &&
    targetSpot.corporateFriendly?.allowInstantCorporateBooking;

  if (isInstant) {
    // Intelligent Availability Validation
    const avail = await availabilityService.checkSlotAvailability({
      spotId: targetSpot._id,
      date,
      startTime,
      endTime,
      durationHours: hours,
    });

    if (!avail.available) {
      throw new Error(avail.message || "Requested time slot is unavailable");
    }

    const calculatedTotal = experienceDoc
      ? experienceDoc.price
      : (targetSpot.corporateFriendly?.corporateHourlyRate || targetSpot.price) * hours;

    const booking = await Booking.create({
      user: userId,
      spot: targetSpot._id,
      experience: experienceDoc ? experienceDoc._id : null,
      experienceTitle: experienceDoc ? experienceDoc.title : "",
      date: bookingDate,
      startTime,
      endTime,
      durationHours: hours,
      checkIn: bookingDate,
      checkOut: bookingDate,
      guests: attendees,
      isCorporate: true,
      organization: org ? org._id : null,
      corporateDetails: formattedCorporateDetails,
      totalPrice: calculatedTotal,
      status: "pending",
      paymentStatus: "unpaid",
    });

    // Acquire slot locks
    await availabilityService.acquireSlotLocks({
      spotId: targetSpot._id,
      bookingId: booking._id,
      dateStr: pricingService.formatDateStr(date),
      startTime,
      endTime,
      bufferMinutes: avail.bufferMinutes || 30,
    });

    return {
      booking,
      workflow: "instant_booking",
      message: "Corporate booking created! Awaiting host final confirmation.",
    };
  } else {
    // Custom Quote Request Workflow
    // Does not lock slot yet; created as 'quote_requested'
    const estimatedTotal =
      formattedCorporateDetails.estimatedBudget ||
      (experienceDoc ? experienceDoc.price : targetSpot.price * hours);

    const booking = await Booking.create({
      user: userId,
      spot: targetSpot._id,
      experience: experienceDoc ? experienceDoc._id : null,
      experienceTitle: experienceDoc ? experienceDoc.title : "",
      date: bookingDate,
      startTime,
      endTime,
      durationHours: hours,
      checkIn: bookingDate,
      checkOut: bookingDate,
      guests: attendees,
      isCorporate: true,
      organization: org ? org._id : null,
      corporateDetails: formattedCorporateDetails,
      totalPrice: estimatedTotal,
      status: "quote_requested",
      paymentStatus: "unpaid",
    });

    return {
      booking,
      workflow: "quote_requested",
      message: "Corporate RFP quote request submitted to landowner!",
    };
  }
};

// 5. LANDOWNER PROVIDES CUSTOM QUOTE
const provideHostQuote = async ({
  hostUserId,
  bookingId,
  quotedAmount,
  quotedPerHeadPrice,
  quoteNotes,
  quoteExpiresInDays = 7,
  termsAndInclusions = [],
}) => {
  const booking = await Booking.findById(bookingId).populate("spot");
  if (!booking) {
    throw new Error("Booking request not found");
  }

  if (!booking.isCorporate) {
    throw new Error("This is not a corporate booking request");
  }

  // Ensure host owns this spot (or is admin)
  const isOwner =
    booking.spot.owner.toString() === hostUserId.toString();
  if (!isOwner) {
    const user = await User.findById(hostUserId);
    if (user?.role !== "admin") {
      throw new Error("Unauthorized: You do not own this plot");
    }
  }

  const numQuotedAmount = Number(quotedAmount);
  if (isNaN(numQuotedAmount) || numQuotedAmount <= 0) {
    throw new Error("Please provide a valid quoted amount");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (Number(quoteExpiresInDays) || 7));

  booking.corporateDetails.quoteDetails = {
    quotedAmount: numQuotedAmount,
    quotedPerHeadPrice: Number(quotedPerHeadPrice) || Math.round(numQuotedAmount / (booking.guests || 1)),
    quoteNotes: quoteNotes || "Custom corporate package tailored for your team.",
    quoteProvidedAt: new Date(),
    quoteExpiresAt: expiresAt,
    termsAndInclusions: Array.isArray(termsAndInclusions) ? termsAndInclusions : [],
  };

  booking.totalPrice = numQuotedAmount;
  booking.status = "quote_provided";
  await booking.save();

  return booking;
};

// 6. CORPORATE ORGANIZER ACCEPTS HOST QUOTE
const acceptHostQuote = async ({ userId, bookingId }) => {
  const booking = await Booking.findById(bookingId).populate("spot");
  if (!booking) {
    throw new Error("Booking request not found");
  }

  if (!booking.isCorporate) {
    throw new Error("Not a corporate booking");
  }

  // Ensure caller is the booking user or an organization member
  if (booking.user.toString() !== userId.toString()) {
    const user = await User.findById(userId);
    if (!user.organization || user.organization.toString() !== booking.organization?.toString()) {
      throw new Error("Unauthorized: Only the event coordinator or company member can accept this quote");
    }
  }

  if (booking.status !== "quote_provided") {
    throw new Error(`Cannot accept quote for booking in status "${booking.status}"`);
  }

  // Check expiry
  if (
    booking.corporateDetails?.quoteDetails?.quoteExpiresAt &&
    new Date(booking.corporateDetails.quoteDetails.quoteExpiresAt) < new Date()
  ) {
    booking.status = "expired";
    await booking.save();
    throw new Error("This quote has expired. Please request an updated quote.");
  }

  // Check slot availability and acquire atomic lock
  const dateStr = pricingService.formatDateStr(booking.date);
  const avail = await availabilityService.checkSlotAvailability({
    spotId: booking.spot._id,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    durationHours: booking.durationHours,
  });

  if (!avail.available) {
    throw new Error(`Schedule conflict: ${avail.message || "Time slot is no longer available"}`);
  }

  // Acquire slot locks
  await availabilityService.acquireSlotLocks({
    spotId: booking.spot._id,
    bookingId: booking._id,
    dateStr,
    startTime: booking.startTime,
    endTime: booking.endTime,
    bufferMinutes: avail.bufferMinutes || 30,
  });

  booking.status = "confirmed";
  booking.paymentStatus = "paid"; // Quote confirmed / billed to company
  booking.amountPaid = booking.totalPrice;
  booking.paidAt = new Date();
  await booking.save();

  return booking;
};

// 7. DECLINE HOST QUOTE OR CANCEL REQUEST
const declineHostQuote = async ({ userId, bookingId, reason }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.user.toString() !== userId.toString()) {
    throw new Error("Unauthorized: Only the booking organizer can decline");
  }

  booking.status = "cancelled";
  if (reason) {
    booking.corporateDetails.quoteDetails.quoteNotes += ` [Declined by company: ${reason}]`;
  }
  await booking.save();

  // Release any slot locks if held
  await availabilityService.releaseSlotLocks(booking._id);

  return booking;
};

// 8. GET MY CORPORATE BOOKINGS (For Organizer)
const getMyCorporateBookings = async (userId) => {
  const user = await User.findById(userId);
  const conditions = [{ user: userId, isCorporate: true }];

  if (user?.organization) {
    conditions.push({ organization: user.organization, isCorporate: true });
  }

  return await Booking.find({ $or: conditions })
    .populate("spot", "title location images address price corporateFriendly")
    .populate("experience", "title image durationHours category")
    .sort({ createdAt: -1 });
};

// 9. GET HOST CORPORATE REQUESTS (For Landowner)
const getHostCorporateRequests = async (hostUserId) => {
  const spots = await Spot.find({ owner: hostUserId }).select("_id");
  const spotIds = spots.map((s) => s._id);

  return await Booking.find({
    spot: { $in: spotIds },
    isCorporate: true,
  })
    .populate("user", "name email avatar")
    .populate("organization", "name gstin industry companySize contactPhone")
    .populate("spot", "title location images price corporateFriendly")
    .populate("experience", "title image durationHours")
    .sort({ createdAt: -1 });
};

module.exports = {
  createOrUpdateOrganization,
  getOrganizationByUser,
  getCorporateSpaces,
  submitCorporateBookingRequest,
  provideHostQuote,
  acceptHostQuote,
  declineHostQuote,
  getMyCorporateBookings,
  getHostCorporateRequests,
};
