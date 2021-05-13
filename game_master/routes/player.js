const authorization = require("../middleware/authorization");
const pool = require("../db");

const router = require("express").Router();
router.get("/get-my-matches", authorization, async (req, res) => {
  try {
    const { user_id, user_email } = req.verifiedInfos;
    //1.request to the database
    const dbRes = await pool.query(
      `select ga.game_id,us1.user_email as player1_email,us2.user_email as player2_email,win.user_email as winner_email , ga.in_tournament
      from "games" ga
      inner join "users" us1 on us1.user_id=ga.player1
      inner join "users" us2 on us2.user_id=ga.player2
      left join "users" win on win.user_id=ga.winner_id
      where finished='1' AND ( ga.player1='${user_id}' OR  ga.player2='${user_id}') ;`
    );
    //TODO
    //add finished='1' AND
    const allIndividualMatches = dbRes.rows;
    //console.log(allIndividualMatches);
    res.json(allIndividualMatches);
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server Error");
  }
});

router.get("/get-tournaments-matches", authorization, async (req, res) => {
  try {
    const { user_id, user_email } = req.verifiedInfos;
    //1.request to the database
    const dbRes = await pool.query(
      `select  ga.game_id,us1.user_email as player1_email,us2.user_email as player2_email,win.user_email as winner_email , tourn.tournament_id,tourn.tournament_name,tga.phases,tga.phase,tga.phase_id,tourn.finished as tournament_finished,ga.in_tournament,tga.endgame
      from "tournament_games" tga 
      inner join "games" ga on tga.game_id=ga.game_id
      inner join "users" us1 on ga.player1=us1.user_id
      inner join "users" us2 on ga.player2=us2.user_id
      left join "users" win on ga.winner_id=win.user_id
      inner join "tournaments" tourn on tourn.tournament_id=tga.tournament_id
      where tga.finished='1' AND tga.tournament_id in (select distinct tournament_id 
                   from tournament_games 
                   where player1='${user_id}' OR player2='${user_id}');`
      //TODO
      //add finished='1' AND
    );
    const allIndividualMatches = dbRes.rows;
    //const loops = allIndividualMatches.length;
    //console.log(allIndividualMatches);
    res.json(allIndividualMatches);
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server Error");
  }
});

router.post("/get-players-scores", authorization, async (req, res) => {
  try {
    const { user_id } = req.verifiedInfos;
    const { game_type } = req.body;

    let column1stSynthetic;
    switch (game_type) {
      case "chess":
        column1stSynthetic = "chess";
        break;
      case "tic-tac-toe":
        column1stSynthetic = "ttt";
        break;
      default:
        throw "game isn't supported by our platform";
    }
    //1.request to the database
    const dbRes = await pool.query(
      `select user_id,user_name,user_email,
      (chess_w_count-chess_l_count)/2 as chess_score,
      (ttt_w_count-ttt_l_count)/2 as ttt_score
      from users
      where user_role_player='1'
      ORDER BY ${column1stSynthetic}_score DESC;`
    );
    //console.log(allIndividualMatches);
    res.json(dbRes.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server Error");
  }
});

module.exports = router;
