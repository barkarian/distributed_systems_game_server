//JUST UPDATE DATABASES
const e = require("express");
const pool = require("../db");
const { start_normal_game } = require("../utils/create_game");
const { Match } = require("../mongodb");
const { Chess } = require("chess.js");

const updateEndingMatch = async (
  game_status,
  user_id,
  game_id,
  match_id,
  in_tournament
) => {
  console.log("INSIDE utils/update_ending_match");
  console.log({
    game_status,
    user_id,
    game_id,
    match_id: `${match_id}`,
    in_tournament
  });
  console.log("INSIDE utils/update_ending_match");

  //->SQL UPDATE game from games
  let endgame = false;
  let winner_id;
  let updateGame;
  //(user_id=NULL and finished=true) means tie ,(user_id=user_id)means victory or win
  game_status == "win" ? (winner_id = `'${user_id}'`) : (winner_id = "NULL");
  console.log({ msg: "winner_id is", winner_id });
  //when not in tournament or win occure UPDATE games
  if (
    in_tournament == false ||
    (in_tournament == true && game_status == "win")
  ) {
    updateGame = await pool.query(
      `UPDATE games SET finished='1',winner_id=${winner_id} WHERE game_id='${game_id}' RETURNING *`
    );
    console.log(updateGame.rows[0]);
    //TODO -done
    //update Both Users Score
    let opponent_id =
      user_id == updateGame.rows[0].player1
        ? updateGame.rows[0].player2
        : updateGame.rows[0].player1;
    console.log(opponent_id);
    let game_type = updateGame.rows[0].game_type;
    await updateUsersScores(user_id, opponent_id, game_type, game_status);
  }

  //when in_tournament==true UPDATE tournament_games
  if (in_tournament == true && game_status == "tie") {
    //TODO -done -UNTESTED
    //update match and only match-> new chessboard ->rematch
    await resetMatch(match_id);
  } else if (in_tournament == true && game_status == "win") {
    const updateTournamentGame = await pool.query(
      `update tournament_games SET finished='1' ,running='0'
      where tournament_game_id = (select tournament_game_id 
                                  from tournament_games 
                                  where game_id='${game_id}')
                                  returning *;`
    );
    const finished_tourn_game = updateTournamentGame.rows[0];
    //find next tourn_game if exists
    if (finished_tourn_game.endgame === "1") {
      //TODO
      //UPDATE endgames -> tournament_winners tournaments
      //user_id wins the tournament
      const insertTournamentWinners = await pool.query(
        `INSERT INTO tournament_winners(tournament_id,winner_id) values ('${finished_tourn_game.tournament_id}','${user_id}')`
      );
      //if tournament has 4 users set as finished
      const tournamentTotalWinners = await pool.query(
        `SELECT COUNT(winner_id)
        FROM tournament_winners
        WHERE tournament_id='${finished_tourn_game.tournament_id}';`
      );
      console.log(tournamentTotalWinners.rows);
      let winners_count = tournamentTotalWinners.rows[0].count;
      if (winners_count == 4) {
        const updateTournamentStatus = await pool.query(
          `update tournaments SET finished='1' 
          where tournament_id = '${finished_tourn_game.tournament_id}'
                                      returning *;`
        );
      }
    } else {
      const getTournamentNewGame = await pool.query(
        `select tournament_game_id,wait_match1,wait_match2,player1,player2,running 
        from tournament_games 
        where wait_match1='${finished_tourn_game.tournament_game_id}' OR wait_match2='${finished_tourn_game.tournament_game_id}';`
      );
      const new_tourn_game = getTournamentNewGame.rows[0];
      //check if wait_match1 =finishedGame.tournament_game_id
      //or if wait_match2 =finishedGame.tournament_game_id
      let match_starting; //query element
      let player1_or_2; //query element
      if (
        new_tourn_game.wait_match1 == finished_tourn_game.tournament_game_id
      ) {
        player1_or_2 = "player1";
        new_tourn_game.player2 == null
          ? (match_starting = "0")
          : (match_starting = "1");
      } else if (
        new_tourn_game.wait_match2 == finished_tourn_game.tournament_game_id
      ) {
        player1_or_2 = "player2";
        new_tourn_game.player1 == null
          ? (match_starting = "0")
          : (match_starting = "1");
      }
      //create match(Mongodb) and game(SQL)
      let game_type = updateGame.rows[0].game_type;
      console.log({ msg: "old game games", old_game: game_type });
      if (match_starting == "1") {
        const matchInfos = {
          player1: new_tourn_game.player1 || user_id,
          player2: new_tourn_game.player2 || user_id,
          game_type: game_type,
          in_tournament: in_tournament
        };
        const { savedMatch, finalSQLQuery } = await start_normal_game(
          matchInfos
        );
        //finally update tournament_game
        const updateTournamentGameNew = await pool.query(
          `update tournament_games 
          SET running='1',scheduled='0',${player1_or_2}='${user_id}',game_id='${savedMatch.game_id}'
          where tournament_game_id = '${new_tourn_game.tournament_game_id}'
          returning *;`
        );

        const changeGamesTable = await pool.query(finalSQLQuery);
        console.log({ savedMatch, finalSQLQuery });
      } else {
        //Update tournament_game
        const updateTournamentGameNew = await pool.query(
          `update tournament_games 
          SET ${player1_or_2}='${user_id}'
          where tournament_game_id = '${new_tourn_game.tournament_game_id}'
          returning *;`
        );
        updated_new_tourn_game = updateTournamentGameNew.rows;
        //logs
        // console.log({ msg: "msg", finished_tourn_game });
        // console.log({ msg: "msg", new_tourn_game });
        // console.log({ msg: "msg", player1_or_2 });
        // console.log({ msg: "msg", match_starting });
        // console.log({ msg: "msg", updated_new_tourn_game });
      }
    }
    //console.log(updateTournamentGame.rows[0]);
  }
  //->SQL if game.in_tournament UPDATE tournament_game from tournament_games
  //->SQL if tournament_game.game_id == tournament_games[].wait_match1||wait_match2 UPDATE playerN =NULL
  //and if player1 AND player2 !=NULL UPDATE running='1' and createGame()
  return;
};

const updateUsersScores = async (
  user_id,
  opponent_id,
  game_type,
  game_status
) => {
  let updatingColumn_1stSynthetic;
  switch (game_type) {
    case "chess":
      //console.log({ game_type, data });
      updatingColumn_1stSynthetic = "chess";
      break;
    case "tic-tac-toe":
      updatingColumn_1stSynthetic = "ttt";
      break;
  }
  //UNTESTED if condition -else if is tested
  if (game_status == "tie") {
    let updatingColumn = updatingColumn_1stSynthetic + "_t_count";
    const updatedScores = await pool.query(
      `update users 
          SET ${updatingColumn}=${updatingColumn}+1
          where user_id = '${user_id}' OR user_id = '${opponent_id}'
          returning *;`
    );
  } else if (game_status == "win") {
    let updatingColumnWinner = updatingColumn_1stSynthetic + "_w_count";
    let updatingColumnLoser = updatingColumn_1stSynthetic + "_l_count";
    const updatedScores = await pool.query(
      `update users 
          SET ${updatingColumnWinner}=${updatingColumnWinner}+1
          where user_id = '${user_id}';` +
        `update users 
          SET ${updatingColumnLoser}=${updatingColumnLoser}+1
          where user_id = '${opponent_id}';`
    );
  }
};

const resetMatch = async (match_id) => {
  const chess = new Chess();
  chess.reset();
  let updatedMatch = await Match.findByIdAndUpdate(
    match_id,
    {
      fen: chess.fen()
    },
    { new: true }
  );
};

module.exports = { updateEndingMatch };
