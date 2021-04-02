const tournamentStarting_MatchesRelation = /*async*/ (
  phase_id,
  phase,
  tournament_id,
  phases,
  x1,
  x2
) => {
  const game_id,
    running,
    scheduled,
    endgame,
    finished,
    wait_match1,
    wait_match2,
    player1,
    player2;
  //create games
  if (phase == 1) {
    game_id = "create game and wait for the id "; //add await here
  } else {
    game_id = NULL;
  }
  phase == 1 ? (running = true) : (running = false);
  phase >= 2 ? (scheduled = true) : (scheduled = false);
  phase == phases ? (endgame = true) : (endgame = false);
  finished = false;
  x1.type == "user"
    ? (wait_match1 = NULL)
    : (wait_match1 = {
        phase_id: x1.phase_id,
        phase: x1.phase,
        tourn_id: x1.tourn_id
      });
  x2.type == "user"
    ? (wait_match2 = NULL)
    : (wait_match2 = {
        phase_id: x2.phase_id,
        phase: x2.phase,
        tourn_id: x2.tourn_id
      });
  x1.type == "user" ? (player1 = x1.user_id) : (player1 = NULL);
  player2 = NULL;
};

module.exports = { tournamentStarting_MatchesRelation };
