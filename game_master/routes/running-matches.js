const authorization = require("../middleware/authorization");
const pool = require("../db");
const jwtGenerator = require("../utils/jwtGenerator.js");
const router = require("express").Router();

router.get("/", authorization, async (req, res) => {
  try {
    const {
      user_id,
      user_name,
      user_email,
      user_role_player,
      user_role_official,
      user_role_admin
    } = req.verifiedInfos;
    //console.log(...req.verifiedInfos);
    //1.Get all running Matches for this user
    const dbRes = await pool.query(
      `select ga.match_id,ga.game_id,us1.user_email as player1_email,us2.user_email as player2_email,
        win.user_email as winner_email , ga.in_tournament ,tga.tournament_id,tourn.tournament_name,
        tga.phases,tga.phase,tga.phase_id,tga.endgame
        from "games" ga
        inner join "users" us1 on us1.user_id=ga.player1
        inner join "users" us2 on us2.user_id=ga.player2
        left join "users" win on win.user_id=ga.winner_id
        left join "tournament_games" tga on tga.game_id=ga.game_id
        left join "tournaments" tourn on tourn.tournament_id=tga.tournament_id
        where (ga.player1='${user_id}' OR  ga.player2='${user_id}')AND ga.finished='0';`
    );
    const allIndividualMatches = dbRes.rows;
    //2.Sign another JWT token so that every other service would know what matches he can play
    const obj = { user_data: req.verifiedInfos, allIndividualMatches };
    //req.verifiedInfos.matches = allIndividualMatches;
    //console.log(req.verifiedInfos);

    const token = jwtGenerator({
      user_id,
      user_name,
      user_email,
      user_role_player,
      user_role_official,
      user_role_admin,
      matches: allIndividualMatches
    });
    res.json({ token, allIndividualMatches });
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server Error");
  }
});

module.exports = router;
