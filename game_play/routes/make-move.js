const router = require("express").Router();
const authorization = require("../middleware/authorization");
const { Match } = require("../mongodb");

router.post("/", authorization, async (req, res) => {
  try {
    match = await Match.findById(req.running_match.match_id).exec();
    let updatedMatch;
    //check if valid move
    //TODO
    let validMove = true;
    //check if client can play that move (maybe is an opponent move request)
    if (match.cur_player == req.verifiedInfos.user_email && validMove) {
      //find opponent
      let opponent;
      req.verifiedInfos.user_email == match.player1_email
        ? (opponent = match.player2_email)
        : (opponent = match.player1_email);
      //TODO make the move and check if game is finished (Update SQL databases if needed etc)
      //change cur_player
      req.running_match.player1_email == match.cur_player;
      //console.log(match.cur_player);
      updatedMatch = await Match.findByIdAndUpdate(
        req.running_match.match_id,
        {
          cur_player: opponent
          //update finished etc
        },
        { new: true }
      );
      res.json(updatedMatch);
    } else if (match.cur_player == req.verifiedInfos.user_email && !validMove) {
      res.json({ success: false, msg: "not valid move" });
    } else if (match.cur_player != req.verifiedInfos.user_email) {
      res.json({ success: false, msg: "It's not your turn..." });
    } else {
      res.json({ success: false, msg: "Something went wrong" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

module.exports = router;
