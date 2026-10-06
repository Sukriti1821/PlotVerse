const jwt = require("jsonwebtoken");

const generateToken = (id, role = "customer") => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = generateToken;