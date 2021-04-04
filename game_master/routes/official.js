const router = require("express").Router();
const authorizationOfficial = require("../middleware/authorizationOfficial");
const pool = require("../db");
const { startTournament } = require("../utils/createTuples");
const e = require("express");
//const { tournamentMatchesRelation } = require("../utils/createTuples");

router.get("/get-all-players", authorizationOfficial, async (req, res) => {
  try {
    const allPlayers = await pool.query(
      "SELECT user_id,user_email,user_name FROM users WHERE user_role_player='1'"
    );
    if (allPlayers.rows.length === 0) {
      return res.json("There's no users (all users except admins)");
    }
    res.json(allPlayers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

router.post("/create-tournament", authorizationOfficial, async (req, res) => {
  try {
    //1.check if players are enough
    const { tourn_users, tournament_name } = req.body;
    if (tourn_users.length <= 4) {
      res.status(500).json("You need more users for creating a tournament");
    }
    //2.creating the gameBacket
    var gameBacket = tourn_users;
    //3.calculate tournament phases
    var phases = Math.log2(gameBacket.length);
    phases = Math.floor(phases) - 1;
    //4.create tournament tuple
    const tournament = await pool.query(
      `INSERT INTO tournaments(tournament_name,total_players) VALUES ('${tournament_name}',${gameBacket.length}) RETURNING *`
    );
    if (tournament.rows.length == 0) {
      throw "Something went wrong tournament hasn't created";
    }
    //fetch the data to database tournament_games table
    const success = await startTournament(
      gameBacket,
      phases,
      tournament.rows[0].tournament_id
    );
    if (success) {
      res.json(tournament.rows[0].tournament_id);
    } else {
      res.status(500).json("Couldn't start tournament");
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

module.exports = router;
