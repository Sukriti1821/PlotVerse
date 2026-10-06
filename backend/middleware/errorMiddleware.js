// 404 Route Not Found Middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Centralized Express Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found (invalid ID format)";
  }

  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Prevent internal driver errors or secrets from leaking in production responses
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "An unexpected server error occurred. Please try again later.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
