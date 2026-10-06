const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { cloudinary, isCloudinaryConfigured } = require("../services/cloudinaryService");

let storage;

// 1. Configure Cloudinary storage if valid credentials exist
if (isCloudinaryConfigured()) {
  try {
    const { CloudinaryStorage } = require("multer-storage-cloudinary");

    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: "plotverse/spots",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 1600, height: 1200, crop: "limit", quality: "auto" }],
      },
    });

    console.log("☁️ [UploadMiddleware] Cloudinary storage configured successfully.");
  } catch (err) {
    console.warn("⚠️ [UploadMiddleware] CloudinaryStorage init failed, falling back to local disk:", err.message);
  }
}

// 2. Fallback to local disk storage for offline development
if (!storage) {
  const uploadDir = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },

    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `spot-${uniqueSuffix}${ext}`);
    },
  });
}

// FILE TYPE FILTER (jpg, jpeg, png, webp)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const allowedMimeTypes = /image\/(jpeg|jpg|png|webp)/;

  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const mime = file.mimetype;

  const isValidExt = allowedExtensions.test(ext);
  const isValidMime = allowedMimeTypes.test(mime);

  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    const error = new Error("Invalid file type. Only JPEG, JPG, PNG, and WEBP image formats are permitted.");
    error.statusCode = 400;
    cb(error, false);
  }
};

// 5MB max file size limit
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes
    files: 5, // Maximum 5 files per upload
  },
  fileFilter,
});

module.exports = upload;