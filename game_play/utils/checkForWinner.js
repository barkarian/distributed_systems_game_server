const { Chess } = require("chess.js");
const { updateEndingMatch } = require("./update_ending_match");

const checkForWinner = async (
  game_type,
  data,
  user_id,
  game_id,
  match_id,
  in_tournament
) => {
  let game_status;
  switch (game_type) {
    case "chess":
      //console.log({ game_type, data });
      game_status = checkChess(data);
      break;
    case "tic-tac-toe":
      //TODO
      // code block
      break;
  }
  //updateEndingMatch(game_status, user_id, game_id, match_id, in_tournament);

  if (game_status == "win" || game_status == "tie") {
    await updateEndingMatch(
      game_status,
      user_id,
      game_id,
      match_id,
      in_tournament
    );
  }
  return game_status;
};

const checkChess = (fen) => {
  const chess = new Chess(fen);
  if (chess.in_checkmate()) {
    return "win";
  } else if (chess.in_stalemate()) {
    return "tie";
  } else {
    return "in-progress";
  }
};

module.exports = { checkForWinner };
