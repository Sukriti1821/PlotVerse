const asyncHandler = require("../utils/asyncHandler");
const corporateService = require("../services/corporateService");
const Spot = require("../models/Spot");

// 1. CREATE OR UPDATE USER ORGANIZATION (POST /api/corporate/organization)
const createOrUpdateOrg = asyncHandler(async (req, res) => {
  const org = await corporateService.createOrUpdateOrganization({
    userId: req.user._id,
    orgData: req.body,
  });

  res.status(200).json({
    success: true,
    data: org,
    message: "Organization profile saved successfully!",
  });
});

// 2. GET CURRENT USER'S ORGANIZATION (GET /api/corporate/organization)
const getMyOrg = asyncHandler(async (req, res) => {
  const org = await corporateService.getOrganizationByUser(req.user._id);

  res.status(200).json({
    success: true,
    data: org,
  });
});

// 3. GET CORPORATE SPACES & EXPERIENCES (GET /api/corporate/spaces)
const getSpaces = asyncHandler(async (req, res) => {
  const { minCapacity, eventType, location, amenity } = req.query;

  const result = await corporateService.getCorporateSpaces({
    minCapacity,
    eventType,
    location,
    amenity,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

// 4. SUBMIT CORPORATE BOOKING / QUOTE REQUEST (POST /api/corporate/book)
const createBookingOrQuote = asyncHandler(async (req, res) => {
  const {
    spotId,
    experienceId,
    date,
    startTime,
    durationHours,
    corporateDetails,
    requiresCustomQuote,
  } = req.body;

  const result = await corporateService.submitCorporateBookingRequest({
    userId: req.user._id,
    spotId,
    experienceId,
    date,
    startTime,
    durationHours,
    corporateDetails,
    requiresCustomQuote,
  });

  res.status(201).json({
    success: true,
    data: result.booking,
    workflow: result.workflow,
    message: result.message,
  });
});

// 5. GET ORGANIZER'S CORPORATE BOOKINGS (GET /api/corporate/my-bookings)
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await corporateService.getMyCorporateBookings(req.user._id);

  res.status(200).json({
    success: true,
    data: bookings,
  });
});

// 6. GET LANDOWNER'S CORPORATE REQUESTS (GET /api/corporate/owner-requests)
const getHostRequests = asyncHandler(async (req, res) => {
  const requests = await corporateService.getHostCorporateRequests(req.user._id);

  res.status(200).json({
    success: true,
    data: requests,
  });
});

// 7. LANDOWNER SUBMITS CUSTOM QUOTE (POST /api/corporate/quote/:bookingId)
const submitQuote = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const {
    quotedAmount,
    quotedPerHeadPrice,
    quoteNotes,
    quoteExpiresInDays,
    termsAndInclusions,
  } = req.body;

  const updatedBooking = await corporateService.provideHostQuote({
    hostUserId: req.user._id,
    bookingId,
    quotedAmount,
    quotedPerHeadPrice,
    quoteNotes,
    quoteExpiresInDays,
    termsAndInclusions,
  });

  res.status(200).json({
    success: true,
    data: updatedBooking,
    message: "Custom quote submitted to corporate organizer successfully!",
  });
});

// 8. ORGANIZER ACCEPTS HOST QUOTE (POST /api/corporate/accept-quote/:bookingId)
const acceptQuote = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const confirmedBooking = await corporateService.acceptHostQuote({
    userId: req.user._id,
    bookingId,
  });

  res.status(200).json({
    success: true,
    data: confirmedBooking,
    message: "Quote accepted! Reservation confirmed and schedule locked.",
  });
});

// 9. ORGANIZER DECLINES HOST QUOTE (POST /api/corporate/decline-quote/:bookingId)
const declineQuote = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { reason } = req.body;

  const cancelledBooking = await corporateService.declineHostQuote({
    userId: req.user._id,
    bookingId,
    reason,
  });

  res.status(200).json({
    success: true,
    data: cancelledBooking,
    message: "Quote declined and booking request closed.",
  });
});

// 10. LANDOWNER UPDATES CORPORATE SETTINGS (PUT /api/corporate/spot-settings/:spotId)
const updateSpotCorporateSettings = asyncHandler(async (req, res) => {
  const { spotId } = req.params;
  const spot = await Spot.findById(spotId);

  if (!spot) {
    return res.status(404).json({ success: false, message: "Spot not found" });
  }

  if (spot.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  spot.corporateFriendly = {
    ...spot.corporateFriendly,
    ...req.body,
  };
  await spot.save();

  res.status(200).json({
    success: true,
    data: spot,
    message: "Spot corporate settings updated!",
  });
});

module.exports = {
  createOrUpdateOrg,
  getMyOrg,
  getSpaces,
  createBookingOrQuote,
  getMyBookings,
  getHostRequests,
  submitQuote,
  acceptQuote,
  declineQuote,
  updateSpotCorporateSettings,
};
