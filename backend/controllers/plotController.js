const Plot = require("../models/Plot");

// GET
const getPlots = async (req, res) => {
  try {
    const plots = await Plot.find();
    res.json(plots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE
const createPlot = async (req, res) => {
  try {
    const plot = new Plot(req.body);
    const savedPlot = await plot.save();
    res.status(201).json(savedPlot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// UPDATE ✅
const updatePlot = async (req, res) => {
  try {
    const updatedPlot = await Plot.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedPlot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE ✅
const deletePlot = async (req, res) => {
  try {
    await Plot.findByIdAndDelete(req.params.id);
    res.json({ message: "Plot deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPlots,
  createPlot,
  updatePlot,
  deletePlot,
};