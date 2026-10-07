const asyncHandler = require("../utils/asyncHandler");
const Experience = require("../models/Experience");
const Spot = require("../models/Spot");
const Booking = require("../models/Booking");
const path = require("path");
const fs = require("fs");

// Helper to safely parse JSON arrays or comma strings
const safeParseArray = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return raw.split(",").map((s) => s.trim()).filter(Boolean).map((name) => ({ name }));
    }
  }
  return [];
};

// Helper to extract uploaded file paths from Multer
const extractUploadedPaths = (req) => {
  const paths = [];
  const processFile = (file) => {
    if (!file) return;
    const remoteUrl = file.secure_url || file.url || (file.path && (file.path.startsWith("http://") || file.path.startsWith("https://")) ? file.path : null);
    if (remoteUrl) {
      paths.push(remoteUrl);
    } else if (file.filename) {
      const cleanPath = `/uploads/${file.filename}`.replace(/\\/g, "/");
      paths.push(cleanPath);
    } else if (file.path) {
      paths.push(file.path);
    }
  };

  if (req.files && Array.isArray(req.files)) {
    req.files.forEach(processFile);
  } else if (req.files && typeof req.files === "object") {
    Object.values(req.files).flat().forEach(processFile);
  } else if (req.file) {
    processFile(req.file);
  }

  return paths;
};

// Helper to escape special regex characters safely
const escapeRegex = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ==========================================
// GET ALL EXPERIENCES (Public Discovery)
// ==========================================
const getAllExperiences = asyncHandler(async (req, res) => {
  const {
    category,
    duration,
    minPrice,
    maxPrice,
    search,
    spotId,
    featured,
    sort = "recommended",
  } = req.query;

  const query = { isActive: true };

  if (spotId) {
    query.spot = spotId;
  }

  if (category && category !== "all") {
    if (/friends'?\s*escape|group\s*gathering/i.test(category)) {
      query.category = { $regex: /friends'?\s*escape|group\s*gathering/i };
    } else {
      query.category = { $regex: new RegExp(`^${escapeRegex(category)}$`, "i") };
    }
  }

  if (featured === "true") {
    query.isFeatured = true;
  }

  if (duration) {
    const durNum = Number(duration);
    if (!isNaN(durNum) && durNum > 0) {
      query.durationHours = { $lte: durNum };
    }
  }

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

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    query.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
      { category: { $regex: escaped, $options: "i" } },
    ];
  }

  let sortObj = { isFeatured: -1, createdAt: -1 };
  if (sort === "priceAsc") sortObj = { price: 1, createdAt: -1 };
  else if (sort === "priceDesc") sortObj = { price: -1, createdAt: -1 };
  else if (sort === "durationAsc") sortObj = { durationHours: 1, createdAt: -1 };
  else if (sort === "durationDesc") sortObj = { durationHours: -1, createdAt: -1 };
  else if (sort === "rating") sortObj = { rating: -1, createdAt: -1 };

  const experiences = await Experience.find(query)
    .populate({
      path: "spot",
      select: "title location image images price rating category amenities availability",
    })
    .populate("owner", "name email")
    .sort(sortObj);

  res.json({
    success: true,
    count: experiences.length,
    data: experiences,
  });
});

// ==========================================
// GET SINGLE EXPERIENCE BY ID (Public View)
// ==========================================
const getExperienceById = asyncHandler(async (req, res) => {
  const experience = await Experience.findById(req.params.id)
    .populate({
      path: "spot",
      select: "title description location image images price rating category amenities availability pricingRules owner",
      populate: {
        path: "owner",
        select: "name email",
      },
    })
    .populate("owner", "name email");

  if (!experience) {
    return res.status(404).json({
      success: false,
      message: "Experience package not found",
    });
  }

  // If inactive, only the owning host can view it
  if (!experience.isActive) {
    const ownerId = experience.owner?._id ? experience.owner._id.toString() : experience.owner?.toString();
    const userId = (req.user?._id || req.user?.id)?.toString();

    if (!userId || ownerId !== userId) {
      return res.status(404).json({
        success: false,
        message: "This experience is currently unavailable",
      });
    }
  }

  res.json({
    success: true,
    data: experience,
    ...experience.toObject(),
  });
});

// ==========================================
// GET OWNER'S EXPERIENCES (Host Management)
// ==========================================
const getOwnerExperiences = asyncHandler(async (req, res) => {
  const experiences = await Experience.find({ owner: req.user._id })
    .populate({
      path: "spot",
      select: "title location image images price",
    })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: experiences.length,
    data: experiences,
  });
});

// ==========================================
// CREATE EXPERIENCE (Host Builder)
// ==========================================
const createExperience = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    spotId,
    spot: bodySpot,
    category,
    durationHours,
    price,
    includedAmenities,
    optionalAddOns,
    maxGuests,
    isActive,
    image: bodyImage,
    images: bodyImages,
  } = req.body;

  const targetSpotId = spotId || bodySpot;

  if (!title || !description || !targetSpotId || !durationHours || price === undefined) {
    return res.status(400).json({
      success: false,
      message: "Please provide title, description, plot, duration, and package price",
    });
  }

  // Verify plot exists and belongs to this host
  const spotDoc = await Spot.findById(targetSpotId);
  if (!spotDoc) {
    return res.status(404).json({
      success: false,
      message: "Associated plot listing was not found",
    });
  }

  const spotOwnerId = spotDoc.owner?._id ? spotDoc.owner._id.toString() : spotDoc.owner?.toString();
  if (spotOwnerId !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "You can only build experience packages for plots you own",
    });
  }

  // Parse included amenities
  const rawIncluded = safeParseArray(includedAmenities);
  const parsedIncluded = rawIncluded.map((item) => {
    if (typeof item === "string") return { name: item.trim(), description: "" };
    return {
      name: (item.name || item.title || "").trim(),
      description: (item.description || "").trim(),
    };
  }).filter((i) => Boolean(i.name));

  // Parse optional add-ons
  const rawOptional = safeParseArray(optionalAddOns);
  const parsedOptional = rawOptional.map((item) => ({
    name: (item.name || item.title || "").trim(),
    price: Math.max(0, Number(item.price || 0)),
    description: (item.description || "").trim(),
  })).filter((i) => Boolean(i.name));

  // Collect uploaded images
  const uploadedPaths = extractUploadedPaths(req);
  let existingOrUrlImages = [];
  if (bodyImages) {
    existingOrUrlImages = safeParseArray(bodyImages);
  } else if (bodyImage) {
    existingOrUrlImages = [bodyImage];
  }

  // If no images uploaded, fall back to the underlying plot's images!
  let allImages = [...uploadedPaths, ...existingOrUrlImages].filter(Boolean);
  if (allImages.length === 0 && spotDoc.images && spotDoc.images.length > 0) {
    allImages = [...spotDoc.images];
  } else if (allImages.length === 0 && spotDoc.image) {
    allImages = [spotDoc.image];
  }

  const primaryImage = allImages.length > 0 ? allImages[0] : "";

  const experience = await Experience.create({
    title: title.trim(),
    description: description.trim(),
    spot: targetSpotId,
    owner: req.user._id,
    category: category || "Romantic Date",
    durationHours: Math.max(1, Number(durationHours)),
    price: Math.max(0, Number(price)),
    includedAmenities: parsedIncluded,
    optionalAddOns: parsedOptional,
    maxGuests: maxGuests ? Math.max(1, Number(maxGuests)) : 6,
    image: primaryImage,
    images: allImages,
    isActive: isActive !== undefined ? Boolean(isActive === true || isActive === "true") : true,
  });

  const populated = await Experience.findById(experience._id)
    .populate("spot", "title location image images price")
    .populate("owner", "name email");

  res.status(201).json({
    success: true,
    data: populated,
    message: "Experience package created successfully",
  });
});

// ==========================================
// UPDATE EXPERIENCE (Host Builder)
// ==========================================
const updateExperience = asyncHandler(async (req, res) => {
  const experience = await Experience.findById(req.params.id);
  if (!experience) {
    return res.status(404).json({
      success: false,
      message: "Experience package not found",
    });
  }

  // Strict ownership check
  if (experience.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to update this experience",
    });
  }

  const {
    title,
    description,
    category,
    durationHours,
    price,
    includedAmenities,
    optionalAddOns,
    maxGuests,
    isActive,
    isFeatured,
    keepImages,
  } = req.body;

  const updateFields = {};

  if (title !== undefined) updateFields.title = title.trim();
  if (description !== undefined) updateFields.description = description.trim();
  if (category !== undefined) updateFields.category = category.trim();
  if (durationHours !== undefined) updateFields.durationHours = Math.max(1, Number(durationHours));
  if (price !== undefined) updateFields.price = Math.max(0, Number(price));
  if (maxGuests !== undefined) updateFields.maxGuests = Math.max(1, Number(maxGuests));
  if (isActive !== undefined) updateFields.isActive = Boolean(isActive === true || isActive === "true");
  if (isFeatured !== undefined && req.user.role === "admin") updateFields.isFeatured = Boolean(isFeatured);

  if (includedAmenities !== undefined) {
    const rawIncluded = safeParseArray(includedAmenities);
    updateFields.includedAmenities = rawIncluded.map((item) => {
      if (typeof item === "string") return { name: item.trim(), description: "" };
      return {
        name: (item.name || item.title || "").trim(),
        description: (item.description || "").trim(),
      };
    }).filter((i) => Boolean(i.name));
  }

  if (optionalAddOns !== undefined) {
    const rawOptional = safeParseArray(optionalAddOns);
    updateFields.optionalAddOns = rawOptional.map((item) => ({
      name: (item.name || item.title || "").trim(),
      price: Math.max(0, Number(item.price || 0)),
      description: (item.description || "").trim(),
    })).filter((i) => Boolean(i.name));
  }

  // Handle images
  const uploadedPaths = extractUploadedPaths(req);
  let keptImages = [];
  if (keepImages !== undefined) {
    keptImages = safeParseArray(keepImages);
  } else {
    keptImages = experience.images || [];
  }

  const finalImages = [...keptImages, ...uploadedPaths].filter(Boolean);
  if (finalImages.length > 0 || keepImages !== undefined || uploadedPaths.length > 0) {
    updateFields.images = finalImages;
    updateFields.image = finalImages.length > 0 ? finalImages[0] : "";
  }

  const updatedExperience = await Experience.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true, runValidators: true }
  )
    .populate("spot", "title location image images price")
    .populate("owner", "name email");

  res.json({
    success: true,
    data: updatedExperience,
    message: "Experience package updated successfully",
  });
});

// ==========================================
// DELETE EXPERIENCE (Host Builder)
// ==========================================
const deleteExperience = asyncHandler(async (req, res) => {
  const experience = await Experience.findById(req.params.id);
  if (!experience) {
    return res.status(404).json({
      success: false,
      message: "Experience package not found",
    });
  }

  if (experience.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to delete this experience",
    });
  }

  // Check if active or pending bookings exist
  const activeBookingsCount = await Booking.countDocuments({
    experience: experience._id,
    status: { $in: ["pending", "approved", "confirmed"] },
  });

  if (activeBookingsCount > 0) {
    // Soft delete to protect existing booking records
    experience.isActive = false;
    await experience.save();
    return res.json({
      success: true,
      message: "Experience has active reservations and was set to inactive instead of deleted.",
      data: experience,
    });
  }

  await Experience.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Experience package removed successfully",
  });
});

module.exports = {
  getAllExperiences,
  getExperienceById,
  getOwnerExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
};
