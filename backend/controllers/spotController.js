const Spot = require("../models/Spot");


// CREATE SPOT
const createSpot = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      price,
      category,
      amenities,
    } = req.body;

    const spot = await Spot.create({
      title,
      description,
      location,
      price,
      category,
      amenities,
      owner: req.user._id,
    });

    res.status(201).json(spot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET ALL SPOTS
const getAllSpots = async (req, res) => {
  try {
    const spots = await Spot.find().populate("owner", "name email");

    res.json(spots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET SINGLE SPOT
const getSpotById = async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id);

    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

    res.json(spot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// UPDATE SPOT
const updateSpot = async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id);

    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

    if (spot.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to update this spot",
      });
    }

    const updatedSpot = await Spot.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedSpot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// DELETE SPOT
const deleteSpot = async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id);

    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

    if (spot.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to delete this spot",
      });
    }

    await spot.deleteOne();

    res.json({ message: "Spot deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createSpot,
  getAllSpots,
  getSpotById,
  updateSpot,
  deleteSpot,
};