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
    req.verifiedInfos = payload;
    req.user_id = payload;
    // console.log({ msg: "valid token is", matches: payload.matches });
    //console.log({ msg: "body is", body: req.body });
    const matches = payload.matches;
    let running_match;
    for (let i = 0; i < matches.length; i++) {
      //console.log(i);
      if (matches[i].match_id == req.body.match_id) {
        running_match = matches[i];
        break;
      }
    }
    //if running_match is falsy user cannot access
    if (running_match) {
      req.running_match = running_match;
      next();
    } else {
      return res.status(403).json("Not Authorize");
    }
  } catch (err) {
    console.error(err.message);
    return res.status(403).json("Not Authorize");
  }
};
