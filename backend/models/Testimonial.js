const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    role: {
      type: String,
      default: "Mountain Traveler",
      trim: true,
    },
    spotName: {
      type: String,
      default: "Scenic Himalayan Retreat",
      trim: true,
    },
    location: {
      type: String,
      default: "Himachal Pradesh",
      trim: true,
    },
    review: {
      type: String,
      required: [true, "Review text is required"],
      trim: true,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    avatar: {
      type: String,
      default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    tag: {
      type: String,
      default: "Camping & Bonfire",
      enum: ["Camping & Bonfire", "Romantic Escapes", "Solo & Nature", "Stargazing", "Group Getaways"],
    },
    stayDate: {
      type: String,
      default: "Recent Stay",
    },
    isVerifiedStay: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
