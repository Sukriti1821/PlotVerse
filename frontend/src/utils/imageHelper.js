// Helper to format spot image URLs whether they are external or uploaded to backend static path
const API_ORIGIN = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ""
).replace(/\/api\/?$/, "");

export const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80", // Alpine peak
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80", // Sunset ridge
  "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80", // Deodar campfire
  "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80", // Riverside meadow
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80", // Orchard hillside hut
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80", // Terraced pine glade
];

// AUDIT NOTE: Whenever adding or modifying category placeholders, ensure the visual content
// precisely reflects the category label:
// - "Empty Plot": Must show open, unbuilt, raw land/pasture — NOT houses, villas, or night-decorated setups.
// - "Grassland Plot": Must show lush green meadows/grasslands — NOT rocky snow-capped crags or barren peaks.
export const CATEGORY_PLACEHOLDERS = {
  "Grassland Plot": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80", // Verdant open rolling highland pasture
  "Date Night Setup": "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
  "Get Together Setup": "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
  "Riverside Meadow": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80",
  "Hillside Hut": "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
  "Empty Plot": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80", // Natural unbuilt open glade
  "Campfire Stays": "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
  "Mountain Cafe": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
};

export const PLACEHOLDER_IMAGE = PLACEHOLDER_IMAGES[0];

export const getFallbackImage = (categoryOrKey) => {
  if (categoryOrKey && CATEGORY_PLACEHOLDERS[categoryOrKey]) {
    return CATEGORY_PLACEHOLDERS[categoryOrKey];
  }
  if (categoryOrKey && typeof categoryOrKey === "string") {
    let hash = 0;
    for (let i = 0; i < categoryOrKey.length; i++) {
      hash = (hash + categoryOrKey.charCodeAt(i)) % PLACEHOLDER_IMAGES.length;
    }
    return PLACEHOLDER_IMAGES[hash];
  }
  return PLACEHOLDER_IMAGE;
};

export const getImageUrl = (imageInput, fallbackKey) => {
  const fallback = getFallbackImage(fallbackKey);
  if (!imageInput) return fallback;

  // If passed an array of images, extract the first item
  let imagePath = imageInput;
  if (Array.isArray(imageInput)) {
    if (imageInput.length === 0) return fallback;
    imagePath = imageInput[0];
  }

  if (typeof imagePath !== "string" || !imagePath.trim()) return fallback;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Normalize backslashes from Windows paths
  const cleanPath = imagePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_ORIGIN}/${cleanPath}`;
};

// Optimizes image URLs for mobile viewports by sizing parameters
export const getOptimizedImageUrl = (imageInput, fallbackKey, width = 640) => {
  const url = getImageUrl(imageInput, fallbackKey);
  if (!url) return url;

  // Optimize Unsplash images for mobile
  if (url.includes("images.unsplash.com") && url.includes("w=")) {
    return url.replace(/w=\d+/, `w=${width}`).replace(/q=\d+/, "q=75");
  }

  return url;
};

export const getAllImageUrls = (spot) => {
  const fallback = getFallbackImage(spot?.category || spot?.title || spot?._id);
  if (!spot) return [fallback];

  let rawList = [];
  if (Array.isArray(spot.images) && spot.images.length > 0) {
    rawList = spot.images;
  } else if (spot.image) {
    rawList = Array.isArray(spot.image) ? spot.image : [spot.image];
  }

  const urls = rawList.map((img) => getImageUrl(img, spot.category || spot.title)).filter(Boolean);
  return urls.length > 0 ? urls : [fallback];
};

export default getImageUrl;
