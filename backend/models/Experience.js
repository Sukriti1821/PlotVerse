const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Experience title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    description: {
      type: String,
      required: [true, "Experience description is required"],
      trim: true,
      maxlength: [4000, "Description cannot exceed 4000 characters"],
    },

    spot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Spot",
      required: [true, "Associated plot is required"],
      index: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Landowner/Host is required"],
      index: true,
    },

    category: {
      type: String,
      default: "Romantic Date",
      trim: true,
      index: true,
    },

    durationHours: {
      type: Number,
      required: [true, "Duration in hours is required"],
      min: [1, "Duration must be at least 1 hour"],
      max: [48, "Duration cannot exceed 48 hours"],
    },

    price: {
      type: Number,
      required: [true, "Package price is required"],
      min: [0, "Package price cannot be negative"],
    },

    // Included Amenities (Bundled at zero extra charge with the package)
    includedAmenities: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          default: "",
          trim: true,
        },
      },
    ],

    // Optional Paid Add-ons (Upgrades travelers can customize into their booking)
    optionalAddOns: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: [0, "Add-on price cannot be negative"],
        },
        description: {
          type: String,
          default: "",
          trim: true,
        },
      },
    ],

    image: {
      type: String,
      default: "",
    },

    images: [
      {
        type: String,
      },
    ],

    maxGuests: {
      type: Number,
      default: 6,
      min: [1, "Max guests must be at least 1"],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    rating: {
      type: Number,
      default: 4.9,
      min: 0,
      max: 5,
    },

    reviewsCount: {
      type: Number,
      default: 0,
    },

    // Feature 10: B2B Corporate Experience Fields
    isCorporate: {
      type: Boolean,
      default: false,
      index: true,
    },
    corporateType: {
      type: String,
      enum: [
        "team_outing",
        "corporate_meeting",
        "workshop",
        "small_retreat",
        "team_building",
        "offsite_event",
        "none",
      ],
      default: "none",
    },
    maxAttendees: {
      type: Number,
      default: 30,
    },
    requiresCustomQuote: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful compound index for fast customer discovery and host listings
experienceSchema.index({ isActive: 1, category: 1, price: 1 });
experienceSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model("Experience", experienceSchema);
