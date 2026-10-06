const Testimonial = require("../models/Testimonial");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Get all approved testimonials
// @route   GET /api/testimonials
// @access  Public
const getTestimonials = asyncHandler(async (req, res) => {
  const { tag } = req.query;
  const query = { isApproved: true };

  if (tag && tag !== "All") {
    query.tag = tag;
  }

  const testimonials = await Testimonial.find(query).sort({ createdAt: -1 }).limit(20);

  res.status(200).json({
    success: true,
    count: testimonials.length,
    data: testimonials,
  });
});

// @desc    Submit a new testimonial / review
// @route   POST /api/testimonials
// @access  Public (or Authenticated)
const createTestimonial = asyncHandler(async (req, res) => {
  const { name, role, spotName, location, review, rating, tag, avatar } = req.body;

  if (!name || !review) {
    return res.status(400).json({
      success: false,
      message: "Please provide both your name and review experience.",
    });
  }

  const defaultAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  ];
  const chosenAvatar = avatar || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

  const testimonial = await Testimonial.create({
    name: name.trim(),
    role: (role || "Traveler").trim(),
    spotName: (spotName || "Scenic Mountain Stay").trim(),
    location: (location || "Himalayas, India").trim(),
    review: review.trim(),
    rating: Number(rating) || 5,
    tag: tag || "Camping & Bonfire",
    avatar: chosenAvatar,
    stayDate: "Just now",
    isVerifiedStay: true,
    isApproved: true, // auto-approve in demo/dev mode
  });

  res.status(201).json({
    success: true,
    message: "Thank you! Your experience story has been published.",
    data: testimonial,
  });
});

module.exports = {
  getTestimonials,
  createTestimonial,
};
