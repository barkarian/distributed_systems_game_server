const router = require("express").Router();
const authorization = require("../middleware/authorization");
const pool = require("../db");
const { start_normal_game } = require("../utils/create_game");

router.post("/", authorization, async (req, res) => {
  try {
    //1.check if player has already request a game
    const client = await pool.query(
      `SELECT player FROM waiting_for_matches WHERE game_type='${req.body.game_type}' AND player='${req.verifiedInfos.user_id}'  `
      //TODO maybe if you want add here players wose matches are already started
    );
    if (client.rows.length != 0) {
      res.json(
        "We already accepted your request ...We searching for your oponent..."
      );
    } else {
      //2.check database for other waiters
      const waitingPlayers = await pool.query(
        `SELECT player FROM waiting_for_matches WHERE game_type='${req.body.game_type}' AND player!='${req.verifiedInfos.user_id}'  `
      );
      //3.Check if other waiters exist
      const waiters = waitingPlayers.rows;
      if (waiters.length >= 1) {
        const deleteRequest = await pool.query(
          `DELETE FROM waiting_for_matches WHERE player='${waiters[0].player}' AND game_type='${req.body.game_type}' RETURNING *`
        );
        player1 = deleteRequest.rows[0];
        const matchInfos = {
          player1: player1.player,
          player2: req.verifiedInfos.user_id,
          game_type: req.body.game_type,
          in_tournament: false
        };
        const { savedMatch, finalSQLQuery } = await start_normal_game(
          matchInfos
        );
        console.log({ savedMatch, finalSQLQuery });
        const changeGamesTable = await pool.query(finalSQLQuery);
        res.json(`match starting,js `);
      } else {
        const insertRequest = await pool.query(
          `INSERT INTO waiting_for_matches(player,game_type) VALUES ('${req.verifiedInfos.user_id}','${req.body.game_type}') RETURNING *`
        );
        //console.log(insertRequest.rows[0]);
        res.json("wait in the play room we search for your oponent...");
      }
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

module.exports = router;
