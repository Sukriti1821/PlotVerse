const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bookingRoutes = require("./routes/bookingRoutes");
const connectDB = require("./config/db");
const spotRoutes = require("./routes/spotRoutes");
const authRoutes = require("./routes/authRoutes");
const listingRoutes = require("./routes/listingRoutes");
const path = require("path");
dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api/bookings", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/spots", spotRoutes);
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use("/api/listings", listingRoutes);
app.get("/", (req, res) => {
  res.send("SpotScape API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});