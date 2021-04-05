const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    const jwtToken = req.header("token");
    //if user hasn't a token
    if (!jwtToken) {
      return res.status(403).json("Not Authorize");
    }
    //if user has a token (check if valid)
    const payload = jwt.verify(jwtToken, process.env.jwtSecret);
    if (payload.user_role_official != 1) {
      return res.status(403).json("Not Authorize");
    }
    req.verifiedInfos = payload;
    //console.log(req.verifiedInfos);
    next();
  } catch (err) {
    console.error(err.message);
    return res.status(403).json("Not Authorize");
  }
};
