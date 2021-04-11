const router = require("express").Router();
const authorization = require("../middleware/authorization");
const { Match, connectToMongo } = require("../mongodb");

router.post("/", authorization, async (req, res) => {
  try {
    let updatedMatch;
    let match = await Match.findById(req.running_match.match_id).exec();
    //console.log(req.running_match);
    if (match.cur_player != "") {
      //1.If match is initialized just response
      res.json(match);
    } else {
      //2.Else ->Initialize match And Update database
      //TODO    Maybe someother initializations required here
      //EXAMPLE Maybe chess and tic-tac-toc need different initializations
      //Remember to change mongoose schema as well ("../mongodb")
      updatedMatch = await Match.findByIdAndUpdate(
        req.running_match.match_id,
        {
          cur_player: req.running_match.player1_email,
          player1_email: req.running_match.player1_email,
          player2_email: req.running_match.player2_email
        },
        { new: true }
      );
      res.json(updatedMatch);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

module.exports = router;
