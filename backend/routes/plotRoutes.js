const express = require("express");
const router = express.Router();

const { getPlots, createPlot, updatePlot, deletePlot } = require("../controllers/plotController");

router.get("/", getPlots);
router.post("/", createPlot);
router.put("/:id", updatePlot);
router.delete("/:id", deletePlot);

module.exports = router;