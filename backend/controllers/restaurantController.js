const Restaurant = require("../models/Restaurant");
const asyncHandler = require("../utils/asyncHandler");

// GET ALL RESTAURANTS (with optional location/region query)
const getAllRestaurants = asyncHandler(async (req, res) => {
  const { location, region, search } = req.query;

  const query = {};

  if (location && location.trim()) {
    // Extract keywords from location (e.g., "Solang Valley, Manali, Himachal Pradesh" -> match "Manali" or "Himachal")
    const terms = location
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 2);

    if (terms.length > 0) {
      const regexPatterns = terms.map((t) => new RegExp(t, "i"));
      query.$or = [
        { location: { $in: regexPatterns } },
        { region: { $in: regexPatterns } },
        { name: { $in: regexPatterns } },
      ];
    }
  }

  if (region && region.trim()) {
    query.region = new RegExp(region.trim(), "i");
  }

  if (search && search.trim()) {
    query.$or = [
      { name: new RegExp(search.trim(), "i") },
      { cuisine: new RegExp(search.trim(), "i") },
      { location: new RegExp(search.trim(), "i") },
    ];
  }

  let restaurants = await Restaurant.find(query).sort({ rating: -1 });

  // If specific location query returned 0 matches, fallback to return all restaurants so customer always has dining options
  if (restaurants.length === 0 && location) {
    restaurants = await Restaurant.find().sort({ rating: -1 });
  }

  res.json({
    success: true,
    count: restaurants.length,
    data: restaurants,
  });
});

// GET SINGLE RESTAURANT BY ID
const getRestaurantById = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: "Restaurant not found",
    });
  }

  res.json({
    success: true,
    data: restaurant,
  });
});

// CREATE RESTAURANT (Admin / direct management)
const createRestaurant = asyncHandler(async (req, res) => {
  const { name, location, region, cuisine, contact, image, rating, menu, deliveryAvailable } = req.body;

  if (!name || !location) {
    return res.status(400).json({
      success: false,
      message: "Please provide restaurant name and location",
    });
  }

  const restaurant = await Restaurant.create({
    name,
    location,
    region: region || "Himachal Pradesh",
    cuisine: cuisine || "Multi-Cuisine",
    contact: contact || {},
    image: image || "",
    rating: rating || 4.5,
    deliveryAvailable: deliveryAvailable !== undefined ? deliveryAvailable : true,
    menu: menu || [],
  });

  res.status(201).json({
    success: true,
    data: restaurant,
  });
});

// UPDATE RESTAURANT
const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: "Restaurant not found",
    });
  }

  res.json({
    success: true,
    data: restaurant,
  });
});

// DELETE RESTAURANT
const deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: "Restaurant not found",
    });
  }

  await restaurant.deleteOne();

  res.json({
    success: true,
    message: "Restaurant deleted successfully",
  });
});

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
};
