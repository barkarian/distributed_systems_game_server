const pool = require("../db");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const { Match } = require("../mongodb");
const { initialize_games } = require("./createTuples");

const createMatches = async (tournament_id, typeOfMatch) => {
  try {
    //1.get running atches
    const getRunningMatches = await pool.query(
      `SELECT game_id,player1,player2 FROM tournament_games where tournament_id='${tournament_id}' and running='1'`
    );
    if (getRunningMatches.rows.length == 0) {
      throw "something went wrong when we try to get running matches";
    }
    const runningMatches = getRunningMatches.rows;
    //create matches mongoDB
    for (let i = 0; i < runningMatches.length; i++) {
      runningMatches[i].game_type = typeOfMatch;
      runningMatches[i].in_tournament = true;
    }
    // console.log({
    //   msg: "getImportedMatches",
    //   runningMatches: runningMatches
    // });
    const mongoReq = await Match.insertMany(runningMatches);
    // console.log({
    //   msg: "mongoReq",
    //   runningMatches: mongoReq
    // });
    //CREATE games SQL
    const finalSQLQuery = await initialize_games(mongoReq);
    const dbRequest = await pool.query(finalSQLQuery);
    console.log("Tournament created and 1st phase matches are available");
    //RELATE GAMES WITH MATCHES
    //awaiting for match
  } catch (err) {
    console.error(err.message);
    //res.status(500).json("Server Error");
  }
};

//createMatches("35ca6e7c-3c92-4b7c-8b47-d2c03764e4ad", 5);

module.exports = { createMatches };
