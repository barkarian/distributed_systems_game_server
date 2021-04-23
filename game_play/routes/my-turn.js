const router = require("express").Router();
const authorization = require("../middleware/authorization");
const { Match } = require("../mongodb");

router.post("/", authorization, async (req, res) => {
  try {
    match = await Match.findById(req.running_match.match_id).exec();
    if (match.cur_player == req.verifiedInfos.user_email) {
      //console.log(match.fen);
      res.json({ success: true, match: match });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

module.exports = router;
