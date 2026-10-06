const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    spot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Spot",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      default: "09:00",
    },

    endTime: {
      type: String,
      default: "17:00",
    },

    durationHours: {
      type: Number,
      default: 1,
    },

    checkIn: {
      type: Date,
    },

    checkOut: {
      type: Date,
    },

    guests: {
      type: Number,
      default: 1,
    },

    selectedAmenities: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],

    // Feature 4: Experience Builder linkage
    experience: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experience",
      default: null,
      index: true,
    },

    experienceTitle: {
      type: String,
      default: "",
    },

    // Feature 9: Gift Bookings Linkage
    isGiftBooking: {
      type: Boolean,
      default: false,
    },
    giftVoucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GiftVoucher",
      default: null,
    },
    giftSenderName: {
      type: String,
      default: "",
    },
    giftMessage: {
      type: String,
      default: "",
    },

    // Feature 10: B2B Corporate Experience Booking & Custom Quotes
    isCorporate: {
      type: Boolean,
      default: false,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    corporateDetails: {
      companyName: { type: String, trim: true, default: "" },
      gstin: { type: String, trim: true, default: "" },
      contactPerson: { type: String, trim: true, default: "" },
      contactEmail: { type: String, trim: true, lowercase: true, default: "" },
      contactPhone: { type: String, trim: true, default: "" },
      eventType: {
        type: String,
        enum: [
          "team_outing",
          "corporate_meeting",
          "workshop",
          "small_retreat",
          "team_building",
          "offsite_event",
          "other",
        ],
        default: "team_outing",
      },
      attendeesCount: { type: Number, default: 10 },
      participants: [
        {
          name: { type: String, trim: true },
          email: { type: String, trim: true, lowercase: true },
          department: { type: String, trim: true },
        },
      ],
      eventObjectives: { type: String, trim: true, default: "" },
      requiredAmenities: [{ type: String }],
      cateringNeeded: { type: Boolean, default: false },
      cateringNotes: { type: String, trim: true, default: "" },
      avTechNeeded: { type: Boolean, default: false },
      estimatedBudget: { type: Number, default: null },
      purchaseOrderNumber: { type: String, trim: true, default: "" },
      quoteDetails: {
        quotedAmount: { type: Number, default: null },
        quotedPerHeadPrice: { type: Number, default: null },
        quoteNotes: { type: String, trim: true, default: "" },
        quoteProvidedAt: { type: Date, default: null },
        quoteExpiresAt: { type: Date, default: null },
        termsAndInclusions: [{ type: String }],
      },
    },

    selectedAddOns: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],

    totalPrice: {
      type: Number,
      required: true,
    },

    pricingBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Feature 6: Landowner Growth Tools — applied promotions
    promoCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },

    appliedPromotion: {
      promoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promotion",
        default: null,
      },
      code: { type: String, default: null },
      title: { type: String, default: null },
      promoType: { type: String, default: null },
      discountType: { type: String, default: null },
      discountValue: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
    },

    // Feature 8: Referral System — applied wallet credits
    appliedWalletCredits: {
      type: Number,
      default: 0,
      min: 0,
    },

    foodOrder: {
      type: new mongoose.Schema(
        {
          restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
          },
          restaurantName: {
            type: String,
            default: "",
          },
          items: [
            {
              name: { type: String, required: true },
              price: { type: Number, required: true },
              quantity: { type: Number, required: true, default: 1 },
            },
          ],
          subtotal: {
            type: Number,
            default: 0,
          },
        },
        { _id: false }
      ),
      default: undefined,
    },

    customRequests: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
        ownerResponse: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        ownerQuotedPrice: {
          type: Number,
          default: null,
        },
        customerAccepted: {
          type: Boolean,
          default: false,
        },
      },
    ],

    status: {
      type: String,
      enum: [
        "pending",
        "quote_requested",
        "quote_provided",
        "approved",
        "confirmed",
        "rejected",
        "cancelled",
        "expired",
      ],
      default: "pending",
    },

    // Razorpay payment integration fields
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed"],
      default: "unpaid",
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    paidAt: {
      type: Date,
      default: null,
    },

    // Commission & Owner Payout tracking fields
    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    platformCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
    ownerPayoutAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    payoutStatus: {
      type: String,
      enum: ["pending", "processing", "paid", "failed"],
      default: "pending",
      index: true,
    },
    payoutDate: {
      type: Date,
      default: null,
    },
    payoutNote: {
      type: String,
      default: "",
    },
    payoutTransactionId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);