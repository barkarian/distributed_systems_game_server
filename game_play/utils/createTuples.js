const { v4: uuidv4 } = require("uuid");
const pool = require("../db");

const create_tuple = /*async*/ (passingObj) => {
  const { phase_id, phase, tournament_id, phases, x1, x2 } = passingObj;
  var game_id;
  var running;
  var scheduled;
  var endgame;
  var finished;
  var wait_match1;
  var wait_match2;
  var player1;
  var player2;
  const tournament_game_id = uuidv4();
  //create games
  if (phase == 1) {
    game_id = uuidv4();
    //game_id = null; //maybe add await later
  } else {
    game_id = null;
  }
  phase == 1 ? (running = true) : (running = false);
  phase >= 2 ? (scheduled = true) : (scheduled = false);
  phase == phases ? (endgame = true) : (endgame = false);
  finished = false;
  x1.type == "user"
    ? (wait_match1 = null)
    : (wait_match1 = x1.tournament_game_id);
  x2.type == "user"
    ? (wait_match2 = null)
    : (wait_match2 = x2.tournament_game_id);
  x1.type == "user" ? (player1 = x1.user_id) : (player1 = null);
  x2.type == "user" ? (player2 = x2.user_id) : (player2 = null);

  //passing down the data
  const createdObject = {
    game_id,
    running,
    scheduled,
    endgame,
    finished,
    wait_match1,
    wait_match2,
    player1,
    player2,
    phases,
    phase,
    phase_id,
    tournament_id,
    tournament_game_id
  };
  //console.log(createdObject);
  // wait_match1 = "waitmatchhhhh11";
  // wait_match2 = "waitmatchhhhh22";
  // player1 = "player1111";
  // player2 = "player2222";
  //valuesSubQuery
  const valueSQL = `(${game_id == null ? "NULL" : `'${game_id}'`},'${
    running == true ? 1 : 0
  }','${scheduled == true ? 1 : 0}','${endgame == true ? 1 : 0}','${
    finished == true ? 1 : 0
  }',${wait_match1 == null ? "NULL" : `'${wait_match1}'`},${
    wait_match2 == null ? "NULL" : `'${wait_match2}'`
  },${player1 == null ? "NULL" : `'${player1}'`},${
    player2 == null ? "NULL" : `'${player2}'`
  },${phases},${phase},${phase_id},'${tournament_id}','${tournament_game_id}')`;
  return { valueSQL, createdObject };
};

const startTournament = async (gameBacket, phases, tournament_id) => {
  try {
    var waitingForBacket = [];
    var endgames = [];
    var finalSQLquery =
      "INSERT INTO tournament_games(game_id,running,scheduled,endgame,finished,wait_match1,wait_match2,player1,player2,phases,phase,phase_id,tournament_id,tournament_game_id) VALUES";
    for (var phase = 1; phase <= phases; phase++) {
      //Balancing algorithm to have 4 endgames
      if (phase == phases && gameBacket.length >= 5 && gameBacket.length <= 7) {
        const loops = 8 - gameBacket.length;
        var endgame;
        for (let i = 1; i <= loops; i++) {
          endgame = gameBacket.pop();
          //waitingForBacket.push(endgame);
          endgames.push(endgame);
          //console.log(endgame);
        }
      }
      //this loops run for each individual phase of the tournament
      var phase_id = 1;
      var x1, x2;
      var passing_object;
      var valueSQL;
      var createdObject;
      var tupleData;
      while (gameBacket.length >= 2) {
        x1 = gameBacket.pop();
        x2 = gameBacket.pop();
        passing_object = {
          phase_id: phase_id,
          phase: phase,
          tournament_id: tournament_id,
          phases: phases,
          x1: x1,
          x2: x2
        };
        //create tuple subQuery for values
        tupleData = create_tuple(passing_object);
        valueSQL = tupleData.valueSQL;
        createdObject = tupleData.createdObject;
        createdObject.type = "tournament_game"; //created tuple has a type of tournament_game (not user)
        waitingForBacket.push(createdObject);
        //add subquery to the final query
        if (phase == 1 && phase_id == 1) {
          finalSQLquery = finalSQLquery + " " + valueSQL;
        } else {
          finalSQLquery = finalSQLquery + "," + valueSQL;
        }
        phase_id++;
      }
      gameBacket.push.apply(gameBacket, waitingForBacket);
      waitingForBacket = [];
    }
    //console.log(finalSQLquery);
    //i submit the import query to our dbs
    const dbRequest = await pool.query(finalSQLquery);

    //marking endgames
    var x;
    const loops = endgames.length;
    //console.log(endgames);
    for (let i = 1; i <= loops; i++) {
      x = endgames.pop();
      if (x.type == "user") {
        //TODO
        const winners = await pool.query(
          `INSERT INTO tournament_winners(tournament_id,winner_id) VALUES ('${tournament_id}','${x.user_id}') RETURNING *`
        );
        //console.log({ msg: "winner found uuid:" }, x.user_id);
        //update winner directly on TABLE:tournaments
      } else {
        const setEndgame = await pool.query(
          `UPDATE tournament_games SET endgame='1' WHERE tournament_game_id='${x.tournament_game_id}'`
        );
      }
    }
    return true;
    //console.log({ msg: "endgames are also:", endgames });
  } catch (error) {
    console.log(error.message);
  }
};

const initialize_games = async (games) => {
  try {
    var waitingForBacket = [];
    var endgames = [];
    var finalSQLquery =
      "INSERT INTO games(match_id,player1,player2,game_type,in_tournament,game_id) VALUES";
    while (games.length > 0) {
      let x = games.pop();
      //console.log({ msg: "x is:", x });
      let subQuery = `('${x._id}','${x.player1}','${x.player2}','${
        x.game_type
      }','${x.in_tournament == true ? 1 : 0}','${x.game_id}')`;
      if (games.length == 0) {
        subQuery = subQuery + ";";
      } else {
        subQuery = subQuery + ",";
      }
      finalSQLquery = finalSQLquery + subQuery;
    }
    return finalSQLquery;
  } catch (error) {
    //console.log({ msg: "endgames are also:", endgames });
    console.log(error.message);
  }
};

module.exports = { startTournament, initialize_games };
