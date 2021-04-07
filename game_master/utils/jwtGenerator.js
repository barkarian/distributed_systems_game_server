const jwt = require("jsonwebtoken");
require("dotenv").config();

function jwtGenerator(payload) {
  return jwt.sign(payload, process.env.jwtSecret, { expiresIn: "1hr" });
}

module.exports = jwtGenerator;
