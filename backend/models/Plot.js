const mongoose = require("mongoose");

const plotSchema = new mongoose.Schema({
  plotNumber: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["available", "booked"],
    default: "available"
  }
}, { timestamps: true });

module.exports = mongoose.model("Plot", plotSchema);