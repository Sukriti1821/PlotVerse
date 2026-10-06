const path = require("path");
const fs = require("fs");
const Spot = require("../models/Spot");
const Booking = require("../models/Booking");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const availabilityService = require("../services/availabilityService");
const pricingService = require("../services/pricingService");
const { deleteFromCloudinary } = require("../services/cloudinaryService");

// Helper to safely delete images (local uploads or Cloudinary)
const deleteLocalImage = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return;

  // If Cloudinary asset, clean up from Cloudinary
  if (imagePath.includes("cloudinary.com")) {
    deleteFromCloudinary(imagePath).catch(() => {});
    return;
  }

  // Never attempt to delete generic external URLs (e.g. Unsplash)
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return;
  }

  try {
    const normalizedPath = imagePath.replace(/\\/g, "/").replace(/^\/+/, "");
    const absolutePath = path.join(__dirname, "../", normalizedPath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`[SpotController] Deleted local image file: ${absolutePath}`);
    }
  } catch (err) {
    console.error(`[SpotController] Error deleting image file ${imagePath}:`, err.message);
  }
};

// Helper to format incoming uploaded files into stored paths or Cloudinary secure URLs
const extractUploadedPaths = (req) => {
  const paths = [];

  const processFile = (file) => {
    if (!file) return;
    // If multer-storage-cloudinary was used, file.path or file.secure_url contains the HTTPS URL
    const remoteUrl = file.secure_url || file.url || (file.path && (file.path.startsWith("http://") || file.path.startsWith("https://")) ? file.path : null);

    if (remoteUrl) {
      paths.push(remoteUrl);
    } else if (file.filename) {
      paths.push(`uploads/${file.filename}`);
    } else if (file.path) {
      paths.push(file.path);
    }
  };

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    req.files.forEach(processFile);
  } else if (req.file) {
    processFile(req.file);
  }

  return paths;
};

// Helper to parse amenities from JSON string, comma string, or array
const parseAmenities = (amenitiesInput) => {
  if (!amenitiesInput) return [];
  if (Array.isArray(amenitiesInput)) return amenitiesInput;

  if (typeof amenitiesInput === "string") {
    try {
      const parsed = JSON.parse(amenitiesInput);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // If comma-separated strings
      return amenitiesInput
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
        .map((name) => ({ name, hourlyPrice: 0, price: 0 }));
    }
  }

  return [];
};

// Helper to convert "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const mins = parseInt(parts[1], 10) || 0;
  return hours * 60 + mins;
};

// Helper to escape special regex characters safely
const escapeRegex = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Helper to parse pricing rules from request body
const parsePricingRules = (raw) => {
  if (!raw) return undefined;
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return undefined;
    }
  }
  if (!parsed || typeof parsed !== "object") return undefined;

  const rules = {};
  if (parsed.weekdayPrice !== undefined && parsed.weekdayPrice !== "") {
    rules.weekdayPrice = Number(parsed.weekdayPrice);
  }
  if (parsed.weekendPrice !== undefined && parsed.weekendPrice !== "") {
    rules.weekendPrice = Number(parsed.weekendPrice);
  }
  if (parsed.peakSeasonPrice !== undefined && parsed.peakSeasonPrice !== "") {
    rules.peakSeasonPrice = Number(parsed.peakSeasonPrice);
  }
  if (Array.isArray(parsed.peakSeasonMonths)) {
    rules.peakSeasonMonths = parsed.peakSeasonMonths.map(Number).filter((m) => m >= 1 && m <= 12);
  }
  if (parsed.holidayPrice !== undefined && parsed.holidayPrice !== "") {
    rules.holidayPrice = Number(parsed.holidayPrice);
  }
  if (Array.isArray(parsed.holidays)) {
    rules.holidays = parsed.holidays.map((h) => ({
      name: h.name ? String(h.name).trim() : "Holiday",
      date: h.date,
      price: Number(h.price || 0),
    }));
  }
  if (Array.isArray(parsed.specialDates)) {
    rules.specialDates = parsed.specialDates.map((s) => ({
      name: s.name ? String(s.name).trim() : "Special Date",
      date: s.date,
      price: Number(s.price || 0),
    }));
  }
  if (Array.isArray(parsed.durationDiscounts)) {
    rules.durationDiscounts = parsed.durationDiscounts.map((d) => ({
      minHours: Number(d.minHours || 0),
      discountPercentage: Number(d.discountPercentage || 0),
      label: d.label ? String(d.label).trim() : `${d.discountPercentage}% off`,
    }));
  }
  return rules;
};

// ==========================================
// CREATE SPOT (Supports multipart/form-data)
// ==========================================
const createSpot = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    location,
    price,
    category,
    amenities,
    pricingRules,
    image: bodyImage,
    images: bodyImages,
  } = req.body;

  if (!title || !location || !price) {
    return res.status(400).json({
      success: false,
      message: "Please provide title, location, and base price for the spot",
    });
  }

  // Collect uploaded images
  const uploadedPaths = extractUploadedPaths(req);

  // Collect any body image URLs
  let existingOrUrlImages = [];
  if (bodyImages) {
    if (Array.isArray(bodyImages)) {
      existingOrUrlImages = bodyImages;
    } else if (typeof bodyImages === "string") {
      try {
        const parsed = JSON.parse(bodyImages);
        if (Array.isArray(parsed)) existingOrUrlImages = parsed;
        else existingOrUrlImages = [bodyImages];
      } catch (e) {
        existingOrUrlImages = [bodyImages];
      }
    }
  } else if (bodyImage && typeof bodyImage === "string") {
    existingOrUrlImages = [bodyImage];
  }

  const allImages = [...uploadedPaths, ...existingOrUrlImages].filter(Boolean);
  const primaryImage = allImages.length > 0 ? allImages[0] : "";

  const parsedAmenities = parseAmenities(amenities);
  const parsedRules = parsePricingRules(pricingRules);

  const spotData = {
    title: title.trim(),
    description: description ? description.trim() : "",
    location: location.trim(),
    price: Number(price),
    category: category || "Scenic Spot",
    amenities: parsedAmenities,
    image: primaryImage,
    images: allImages,
    owner: req.user._id,
  };

  if (parsedRules) {
    spotData.pricingRules = parsedRules;
  }

  const spot = await Spot.create(spotData);

  const populatedSpot = await Spot.findById(spot._id).populate("owner", "name email");

  res.status(201).json({
    success: true,
    data: populatedSpot,
    ...populatedSpot.toObject(),
  });
});

// ==========================================
// GET ALL SPOTS (Dynamic Search, Filter, Sort, Pagination)
// ==========================================
const getAllSpots = asyncHandler(async (req, res) => {
  const {
    location,
    search,
    minPrice,
    maxPrice,
    category,
    amenities,
    featured,
    date,
    startTime,
    endTime,
    guests,
    sort = "newest",
    page = 1,
    limit = 9,
  } = req.query;

  // Base condition: exclude inactive and admin-unpublished spots from public listings
  const query = { isActive: { $ne: false }, isUnpublishedByAdmin: { $ne: true } };

  // Filter by guest capacity if provided
  if (guests) {
    const guestNum = parseInt(guests, 10);
    if (!isNaN(guestNum) && guestNum > 0) {
      query.maxGuests = { $gte: guestNum };
    }
  }

  // 1. Location / Keyword search (partial match on state, city, region, or title)
  const locationKeyword = (location || search || "").trim();
  if (locationKeyword) {
    const escaped = escapeRegex(locationKeyword);
    query.$or = [
      { location: { $regex: escaped, $options: "i" } },
      { title: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
    ];
  }

  // 2. Price filter (filter by base hourly rate)
  if (minPrice !== undefined && minPrice !== "") {
    const minVal = Number(minPrice);
    if (!isNaN(minVal)) {
      query.price = { ...(query.price || {}), $gte: minVal };
    }
  }
  if (maxPrice !== undefined && maxPrice !== "") {
    const maxVal = Number(maxPrice);
    if (!isNaN(maxVal)) {
      query.price = { ...(query.price || {}), $lte: maxVal };
    }
  }

  // 3. Category filter (matches singular and plural forms gracefully)
  if (category && category !== "all") {
    const trimmed = category.trim();
    const baseCat = trimmed.replace(/s$/i, "");
    query.category = {
      $regex: `^(${escapeRegex(trimmed)}|${escapeRegex(baseCat)})s?$`,
      $options: "i",
    };
  }

  // 4. Amenities filter (comma-separated list or array)
  // Matching policy: Spots must have ALL requested amenities to fulfill specific customer requirements
  if (amenities) {
    let amenityList = [];
    if (Array.isArray(amenities)) {
      amenityList = amenities;
    } else if (typeof amenities === "string") {
      amenityList = amenities.split(",").map((a) => a.trim()).filter(Boolean);
    }

    if (amenityList.length > 0) {
      const amenityConditions = amenityList.map((item) => {
        const escaped = escapeRegex(item);
        return {
          $or: [
            { "amenities.name": { $regex: escaped, $options: "i" } },
            { "amenities.title": { $regex: escaped, $options: "i" } },
            { amenities: { $regex: escaped, $options: "i" } },
          ],
        };
      });

      if (query.$and) {
        query.$and.push(...amenityConditions);
      } else {
        query.$and = amenityConditions;
      }
    }
  }

  // 5. Featured filter
  if (featured === "true") {
    query.isFeatured = true;
  }

  // 6. Date & Time availability conflict check (against confirmed bookings)
  if (date) {
    const bookingDate = new Date(date);
    if (!isNaN(bookingDate.getTime())) {
      const startOfDay = new Date(bookingDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(bookingDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find all confirmed bookings on this day
      const confirmedBookings = await Booking.find({
        date: { $gte: startOfDay, $lte: endOfDay },
        status: "confirmed",
      });

      const searchStartMins = startTime ? timeToMinutes(startTime) : 0;
      const searchEndMins = endTime ? timeToMinutes(endTime) : 1440; // 24:00

      const conflictingSpotIds = [];

      confirmedBookings.forEach((b) => {
        const bStart = timeToMinutes(b.startTime || "00:00");
        const bEnd = timeToMinutes(b.endTime || "23:59");

        // Overlap condition: startA < endB && endA > startB
        if (searchStartMins < bEnd && searchEndMins > bStart) {
          conflictingSpotIds.push(b.spot.toString());
        }
      });

      if (conflictingSpotIds.length > 0) {
        query._id = { ...(query._id || {}), $nin: conflictingSpotIds };
      }
    }
  }

  // 7. Sorting
  let sortObj = { isFeatured: -1, createdAt: -1 };
  if (sort === "priceAsc") {
    sortObj = { price: 1, createdAt: -1 };
  } else if (sort === "priceDesc") {
    sortObj = { price: -1, createdAt: -1 };
  } else if (sort === "newest") {
    sortObj = { isFeatured: -1, createdAt: -1 };
  }

  // 7. Pagination
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 9));
  const skip = (pageNum - 1) * limitNum;

  const totalCount = await Spot.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limitNum) || 1;

  const spots = await Spot.find(query)
    .populate("owner", "name email")
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum);

  // Return standard paginated payload
  res.json({
    success: true,
    data: spots,
    spots,
    totalCount,
    totalPages,
    currentPage: pageNum,
    limit: limitNum,
  });
});

// ==========================================
// GET AVAILABLE AMENITIES (For dynamic filter lists)
// ==========================================
const getAvailableAmenities = asyncHandler(async (req, res) => {
  const spots = await Spot.find({ isActive: { $ne: false }, isUnpublishedByAdmin: { $ne: true } }).select("amenities");

  const amenitySet = new Set();
  spots.forEach((spot) => {
    if (Array.isArray(spot.amenities)) {
      spot.amenities.forEach((a) => {
        const name = typeof a === "string" ? a.trim() : (a.name || a.title || "").trim();
        if (name) {
          amenitySet.add(name);
        }
      });
    }
  });

  const amenities = Array.from(amenitySet).sort();
  res.json({
    success: true,
    data: amenities,
  });
});

// ==========================================
// GET SINGLE SPOT (Owner or Admin can view if inactive/unpublished)
// ==========================================
const getSpotById = asyncHandler(async (req, res) => {
  const spot = await Spot.findById(req.params.id).populate("owner", "name email");

  if (!spot) {
    return res.status(404).json({
      success: false,
      message: "Spot not found",
    });
  }

  // If spot is inactive or unpublished by admin, hide from public visitors; allow only the owner or platform admin
  if (spot.isActive === false || spot.isUnpublishedByAdmin === true) {
    const spotOwnerId = spot.owner?._id ? spot.owner._id.toString() : spot.owner?.toString();
    const userId = (req.user?._id || req.user?.id)?.toString();
    const isAdmin = req.user?.role === "admin";

    if (!isAdmin && (!userId || spotOwnerId !== userId)) {
      return res.status(404).json({
        success: false,
        message: "Spot not found or is currently inactive",
      });
    }
  }

  // Feature 5: Increment views for public visitors (ignore requests by the spot owner themselves)
  const ownerId = spot.owner?._id ? spot.owner._id.toString() : spot.owner?.toString();
  const currentUserId = (req.user?._id || req.user?.id)?.toString();
  if (!currentUserId || currentUserId !== ownerId) {
    Spot.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).catch(() => {});
  }

  res.json(spot);
});

// ==========================================
// TRACK SPOT CLICK (Public / Customer click)
// ==========================================
const trackSpotClick = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const spot = await Spot.findByIdAndUpdate(
    id,
    { $inc: { clicks: 1 } },
    { new: true }
  ).select("_id clicks views");

  if (!spot) {
    return res.status(404).json({ success: false, message: "Spot not found" });
  }

  res.json({ success: true, clicks: spot.clicks, views: spot.views });
});

// ==========================================
// GET OWNER SPOTS (Protected: Host listings)
// ==========================================
const getOwnerSpots = asyncHandler(async (req, res) => {
  const spots = await Spot.find({ owner: req.user._id })
    .populate("owner", "name email")
    .sort({ createdAt: -1 });

  res.json(spots);
});

// ==========================================
// UPDATE SPOT (Supports image additions/removals)
// ==========================================
const updateSpot = asyncHandler(async (req, res) => {
  const spot = await Spot.findById(req.params.id);

  if (!spot) {
    return res.status(404).json({
      success: false,
      message: "Spot not found",
    });
  }

  // Strict ownership check: only the owner who created the spot can update it
  const spotOwnerId = spot.owner?._id ? spot.owner._id.toString() : spot.owner?.toString();
  const userId = (req.user?._id || req.user?.id)?.toString();

  if (!spotOwnerId || spotOwnerId !== userId) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You are not authorized to update this spot listing",
    });
  }

  const {
    title,
    description,
    location,
    price,
    hourlyRate,
    basePrice,
    category,
    amenities,
    isActive,
    keepImages,
    existingImages,
  } = req.body;

  const updateFields = {};

  if (title !== undefined) updateFields.title = title.trim();
  if (description !== undefined) updateFields.description = description.trim();
  if (location !== undefined) updateFields.location = location.trim();
  if (category !== undefined) updateFields.category = category;

  // Validate and update base price / hourly rate
  const rateInput = price !== undefined ? price : (hourlyRate !== undefined ? hourlyRate : basePrice);
  if (rateInput !== undefined) {
    const numPrice = Number(rateInput);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Base hourly price must be a valid number greater than 0",
      });
    }
    updateFields.price = numPrice;
  }

  // Validate and update amenities: prices must be numbers > 0
  if (amenities !== undefined) {
    const parsedAmenities = parseAmenities(amenities);
    for (const amenity of parsedAmenities) {
      const aPrice = Number(amenity.hourlyPrice !== undefined ? amenity.hourlyPrice : amenity.price);
      if (isNaN(aPrice) || aPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: `Amenity '${amenity.name || "unnamed"}' must have a valid price greater than 0`,
        });
      }
    }
    updateFields.amenities = parsedAmenities.map((a) => {
      const p = Number(a.hourlyPrice !== undefined ? a.hourlyPrice : a.price);
      return {
        name: (a.name || a.title || "").trim(),
        hourlyPrice: p,
        price: p,
      };
    });
  }

  // Update active state if provided
  if (isActive !== undefined) {
    updateFields.isActive = isActive === true || isActive === "true";
  }

  // Update dynamic pricing rules if provided
  if (req.body.pricingRules !== undefined) {
    const parsedRules = parsePricingRules(req.body.pricingRules);
    if (parsedRules) {
      updateFields.pricingRules = parsedRules;
    }
  }

  // Determine existing images to keep
  let keptImages = [];
  const rawKeep = keepImages || existingImages;
  if (rawKeep) {
    if (Array.isArray(rawKeep)) {
      keptImages = rawKeep;
    } else if (typeof rawKeep === "string") {
      try {
        const parsed = JSON.parse(rawKeep);
        if (Array.isArray(parsed)) keptImages = parsed;
        else keptImages = [rawKeep];
      } catch (e) {
        keptImages = rawKeep.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
  } else if (rawKeep === undefined) {
    // If no keepImages param was passed, retain existing spot images unless overridden
    keptImages = spot.images && spot.images.length > 0 ? spot.images : (spot.image ? [spot.image] : []);
  }

  // Newly uploaded images
  const newUploadedPaths = extractUploadedPaths(req);

  // Clean up any old images that were removed by the owner
  const currentImages = spot.images && spot.images.length > 0 ? spot.images : (spot.image ? [spot.image] : []);
  currentImages.forEach((oldImg) => {
    if (!keptImages.includes(oldImg)) {
      deleteLocalImage(oldImg);
    }
  });

  const finalImages = [...keptImages, ...newUploadedPaths].filter(Boolean);
  if (finalImages.length > 0 || rawKeep !== undefined || newUploadedPaths.length > 0) {
    updateFields.images = finalImages;
    updateFields.image = finalImages.length > 0 ? finalImages[0] : "";
  }

  const updatedSpot = await Spot.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true, runValidators: true }
  ).populate("owner", "name email");

  res.json({
    success: true,
    data: updatedSpot,
    ...updatedSpot.toObject(),
  });
});

// ==========================================
// DELETE SPOT (Checks active bookings / soft delete)
// ==========================================
const deleteSpot = asyncHandler(async (req, res) => {
  const spot = await Spot.findById(req.params.id);

  if (!spot) {
    return res.status(404).json({
      success: false,
      message: "Spot not found",
    });
  }

  // Check ownership
  const spotOwnerId = spot.owner?._id ? spot.owner._id.toString() : spot.owner?.toString();
  const userId = (req.user?._id || req.user?.id)?.toString();

  if (!spotOwnerId || spotOwnerId !== userId) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You are not authorized to delete this spot listing",
    });
  }

  // Check for any active/pending/confirmed bookings tied to this spot
  const activeBookings = await Booking.find({
    spot: spot._id,
    status: { $in: ["pending", "confirmed"] },
  });

  if (activeBookings.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Cancel or resolve existing bookings before deleting this spot",
      activeBookingsCount: activeBookings.length,
    });
  }

  // Soft-delete if historical bookings exist to avoid orphaning historical data,
  // or if hard delete not requested
  const totalBookingsCount = await Booking.countDocuments({ spot: spot._id });

  if (totalBookingsCount > 0 && req.query.hard !== "true") {
    spot.isActive = false;
    await spot.save();
    return res.json({
      success: true,
      message: "Spot listing deactivated and archived to preserve historical booking records",
      softDeleted: true,
      data: spot,
    });
  }

  // If no bookings exist at all or hard delete requested:
  const allImages = spot.images && spot.images.length > 0 ? spot.images : (spot.image ? [spot.image] : []);
  allImages.forEach((img) => {
    deleteLocalImage(img);
  });

  await spot.deleteOne();

  res.json({
    success: true,
    message: "Spot listing and associated images deleted successfully",
    deleted: true,
  });
});

// GET SPOT AVAILABILITY SCHEDULE & TIMELINE
const getSpotAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  const dateStr = availabilityService.dateToDateStr(date || new Date());
  const schedule = await availabilityService.getSpotDailySchedule({
    spotId: id,
    dateStr,
  });

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: "Plot not found",
    });
  }

  res.json({
    success: true,
    data: schedule,
    ...schedule,
  });
});

// PRE-FLIGHT VALIDATION FOR CANDIDATE TIME SLOT
const checkSpotSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, startTime, endTime, durationHours } = req.body;

  const result = await availabilityService.checkSlotAvailability({
    spotId: id,
    date,
    startTime,
    endTime,
    durationHours,
  });

  if (!result.available) {
    return res.status(200).json({
      success: true,
      available: false,
      code: result.code,
      message: result.message,
      conflictBooking: result.conflictBooking || null,
    });
  }

  res.json({
    success: true,
    available: true,
    message: "Time slot is available for reservation",
    data: {
      dateStr: result.dateStr,
      durationHours: result.durationHours,
      bufferMinutes: result.bufferMinutes,
    },
  });
});

// CALCULATE DYNAMIC PRICE BREAKDOWN (Authoritative Real-Time Pricing)
const calculateSpotPrice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, startTime, endTime, durationHours, selectedAmenities, foodOrder, customRequests } = req.body;

  const spot = await Spot.findById(id);
  if (!spot) {
    return res.status(404).json({
      success: false,
      message: "Plot not found",
    });
  }

  const breakdown = await pricingService.calculatePrice({
    spot,
    date,
    startTime,
    endTime,
    durationHours,
    selectedAmenities,
    foodOrder,
    customRequests,
  });

  res.json({
    success: true,
    data: breakdown,
    ...breakdown,
  });
});

// TOGGLE SPOT WISHLIST (Protected: authenticated users)
const toggleWishlist = asyncHandler(async (req, res) => {
  const spotId = req.params.id;
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (!Array.isArray(user.wishlist)) {
    user.wishlist = [];
  }

  const spotIdStr = spotId.toString();
  const alreadySaved = user.wishlist.some(
    (w) => w && w.toString() === spotIdStr
  );

  if (alreadySaved) {
    user.wishlist = user.wishlist.filter(
      (w) => w && w.toString() !== spotIdStr
    );
  } else {
    user.wishlist.push(spotId);
  }

  await user.save();

  res.json({
    success: true,
    isSaved: !alreadySaved,
    wishlist: user.wishlist,
    message: !alreadySaved ? "Destination saved to favorites" : "Destination removed from favorites",
  });
});

// GET USER WISHLIST (Protected: authenticated users)
const getUserWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "wishlist",
    match: { isActive: true },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.json({
    success: true,
    data: user.wishlist || [],
    wishlist: user.wishlist || [],
  });
});

module.exports = {
  createSpot,
  getAllSpots,
  getSpotById,
  getOwnerSpots,
  getAvailableAmenities,
  updateSpot,
  deleteSpot,
  getSpotAvailability,
  checkSpotSlot,
  calculateSpotPrice,
  trackSpotClick,
  toggleWishlist,
  getUserWishlist,
  createListing: createSpot,
  getListings: getAllSpots,
  getSingleListing: getSpotById,
};