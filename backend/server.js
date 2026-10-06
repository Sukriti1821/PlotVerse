const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config({ path: path.join(__dirname, ".env") });
// Also fallback to root .env if running in container or monorepo
dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const spotRoutes = require("./routes/spotRoutes");
const experienceRoutes = require("./routes/experienceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const referralRoutes = require("./routes/referralRoutes");
const giftRoutes = require("./routes/giftRoutes");
const corporateRoutes = require("./routes/corporateRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

connectDB();

const app = express();

// 1. Security Headers via Helmet (with cross-origin resource policy disabled for static assets)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Trust reverse proxy for secure cookies and IP rate limiting on Render/Railway
app.set("trust proxy", 1);

// 3. Rate Limiting for Auth Endpoints (Brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  },
});

// 3b. Global Rate Limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests to Thikana API. Please try again shortly.",
  },
});

// Production-ready, secure CORS configuration
const rawClientUrls = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim().replace(/\/$/, ""))
  : [];

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];

const allowedOrigins = Array.from(new Set([...rawClientUrls, ...defaultOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check direct match against verified allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow any localhost or 127.0.0.1 port during local development
      if (
        process.env.NODE_ENV !== "production" &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
      ) {
        return callback(null, true);
      }

      // Allow verified Thikana & preview deployments explicitly matching thikana or plotverse domain prefix
      if (
        /^https:\/\/((thikana|plotverse)[a-z0-9-]*\.(vercel\.app|netlify\.app))$/i.test(origin)
      ) {
        return callback(null, true);
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// Health check root
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Thikana API is running smoothly",
  });
});

// Global API Limiter
app.use("/api", apiLimiter);

// API Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/spots", spotRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/gifts", giftRoutes);
app.use("/api/corporate", corporateRoutes);
app.use("/api/admin", adminRoutes);

// Centralized Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});