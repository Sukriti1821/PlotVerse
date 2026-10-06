// Async Handler utility to catch rejected promises in express controllers
const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
