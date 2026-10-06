const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    default: "",
  },
  isVeg: {
    type: Boolean,
    default: true,
  },
  category: {
    type: String,
    default: "Main Course",
  },
});

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      default: "Himachal Pradesh",
    },
    cuisine: {
      type: String,
      default: "Himachali & North Indian",
    },
    contact: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80",
    },
    rating: {
      type: Number,
      default: 4.6,
    },
    deliveryAvailable: {
      type: Boolean,
      default: true,
    },
    menu: [menuItemSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
