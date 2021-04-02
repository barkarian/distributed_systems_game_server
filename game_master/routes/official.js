const router = require("express").Router();
const authorizationOfficial = require("../middleware/authorizationOfficial");
const pool = require("../db");
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
    const gameBacket = req.body;
    //tournamentMatchesRelation();
    res.json(gameBacket);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

module.exports = router;
