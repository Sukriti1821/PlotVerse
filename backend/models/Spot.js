const mongoose = require("mongoose");

const spotSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    amenities: [
      {
        type: mongoose.Schema.Types.Mixed,
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
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Admin moderation override (separate from owner's own soft-delete)
    isUnpublishedByAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    adminFlagReason: {
      type: String,
      default: "",
    },
    adminFlaggedAt: {
      type: Date,
      default: null,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Feature 6: Featured listing sponsorship configuration
    featuredConfig: {
      isFeatured: { type: Boolean, default: false },
      featuredUntil: { type: Date, default: null },
      tier: {
        type: String,
        enum: ["standard", "premium", "spotlight"],
        default: "standard",
      },
      paymentStatus: {
        type: String,
        enum: ["free_trial", "paid", "sponsored", "none"],
        default: "none",
      },
      sponsoredBadge: {
        type: String,
        default: "Featured Retreat",
      },
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5,
    },
    maxGuests: {
      type: Number,
      default: 6,
      min: 1,
    },
    // Feature 10: B2B / Corporate Friendly Settings
    corporateFriendly: {
      isCorporateFriendly: {
        type: Boolean,
        default: false,
        index: true,
      },
      maxCorporateCapacity: {
        type: Number,
        default: 50,
      },
      corporateAmenities: [
        {
          type: String,
        },
      ],
      corporateHourlyRate: {
        type: Number,
        default: null,
      },
      corporateDayPackagePrice: {
        type: Number,
        default: null,
      },
      allowInstantCorporateBooking: {
        type: Boolean,
        default: false,
      },
    },

    // Feature 5: Views and clicks tracking for host analytics
    views: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    availability: {
      openTime: {
        type: String,
        default: "06:00",
      },
      closeTime: {
        type: String,
        default: "22:00",
      },
      openDays: {
        type: [Number],
        default: [0, 1, 2, 3, 4, 5, 6], // 0=Sunday, 6=Saturday
      },
      bufferMinutes: {
        type: Number,
        default: 30,
        min: 0,
      },
      minDurationHours: {
        type: Number,
        default: 1,
        min: 1,
      },
      maxDurationHours: {
        type: Number,
        default: 12,
        max: 24,
      },
      leadTimeHours: {
        type: Number,
        default: 1,
        min: 0,
      },
      blockedDates: [
        {
          date: { type: Date, required: true },
          reason: { type: String, default: "Blocked by landowner" },
        },
      ],
      maintenancePeriods: [
        {
          startDate: { type: Date, required: true },
          endDate: { type: Date, required: true },
          startTime: { type: String, default: "00:00" },
          endTime: { type: String, default: "23:59" },
          reason: { type: String, default: "Routine maintenance" },
        },
      ],
      seasonalRange: {
        startMonth: { type: Number, default: 1 },
        endMonth: { type: Number, default: 12 },
        isSeasonal: { type: Boolean, default: false },
      },
    },
    pricingRules: {
      weekdayPrice: {
        type: Number,
        default: null,
      },
      weekendPrice: {
        type: Number,
        default: null,
      },
      peakSeasonPrice: {
        type: Number,
        default: null,
      },
      peakSeasonMonths: {
        type: [Number],
        default: [],
      },
      holidayPrice: {
        type: Number,
        default: null,
      },
      holidays: [
        {
          date: { type: Date, required: true },
          name: { type: String, default: "Holiday" },
          hourlyPrice: { type: Number, default: null },
        },
      ],
      specialDates: [
        {
          date: { type: Date, required: true },
          hourlyPrice: { type: Number, required: true },
          reason: { type: String, default: "Special Date" },
        },
      ],
      durationDiscounts: [
        {
          minHours: { type: Number, required: true },
          discountPercentage: { type: Number, required: true, min: 1, max: 99 },
          label: { type: String, default: "Extended Stay Discount" },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Spot", spotSchema);