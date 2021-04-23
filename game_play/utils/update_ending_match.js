//JUST UPDATE DATABASES
const updateEndingMatch = (
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
  //TODO update databases
  //->SQL UPDATE game from games
  //->SQL if game.in_tournament UPDATE tournament_game from tournament_games
  //->SQL if tournament_game.game_id == tournament_games[].wait_match1||wait_match2 UPDATE playerN =NULL
  //and if player1 AND player2 !=NULL UPDATE running='1' and createGame()
  return;
};
module.exports = { updateEndingMatch };
