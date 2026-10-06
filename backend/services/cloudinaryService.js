const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  return (
    name &&
    key &&
    secret &&
    !name.includes("your_") &&
    !key.includes("your_") &&
    !secret.includes("your_")
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log("☁️ [CloudinaryService] Initialized with cloud:", process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.warn("⚠️ [CloudinaryService] Credentials not provided or are placeholders. Falling back to local storage/external URLs.");
}

/**
 * Upload a local disk file to Cloudinary
 * @param {string} localFilePath - Path to local file
 * @param {string} folder - Target folder in Cloudinary
 * @returns {Promise<string>} - Returns secure_url
 */
const uploadLocalFileToCloudinary = async (localFilePath, folder = "plotverse/spots") => {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary credentials are not configured in environment variables.");
  }

  const result = await cloudinary.uploader.upload(localFilePath, {
    folder,
    resource_type: "image",
    transformation: [{ width: 1600, height: 1200, crop: "limit", quality: "auto" }],
  });

  return result.secure_url;
};

/**
 * Delete an asset from Cloudinary by URL or Public ID
 * @param {string} urlOrPublicId
 */
const deleteFromCloudinary = async (urlOrPublicId) => {
  if (!isCloudinaryConfigured() || !urlOrPublicId) return;

  try {
    // If it's a Cloudinary URL, extract public ID
    let publicId = urlOrPublicId;
    if (urlOrPublicId.includes("cloudinary.com")) {
      const parts = urlOrPublicId.split("/upload/");
      if (parts[1]) {
        // Strip version prefix v12345678/ if present
        const withoutVersion = parts[1].replace(/^v\d+\//, "");
        // Strip file extension
        publicId = withoutVersion.replace(/\.[^/.]+$/, "");
      }
    }

    await cloudinary.uploader.destroy(publicId);
    console.log(`[CloudinaryService] Deleted asset: ${publicId}`);
  } catch (err) {
    console.warn(`[CloudinaryService] Failed to delete asset ${urlOrPublicId}:`, err.message);
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadLocalFileToCloudinary,
  deleteFromCloudinary,
};
