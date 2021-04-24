const { initialize_games } = require("./createTuples");
const { Match, connectToMongo } = require("../mongodb");
const { v4: uuidv4 } = require("uuid");

//creates new match with game_infos and initialize the games
const start_normal_game = async (gameInfos) => {
  try {
    const { player1, player2, game_type, in_tournament } = gameInfos;
    const game_id = uuidv4();
    // const match = {
    //   game_id,
    //   player1,
    //   player2,
    //   game_type,
    //   in_tournament
    // };
    const match = new Match({
      game_id,
      player1,
      player2,
      game_type,
      in_tournament
    });
    const savedMatch = await match.save();
    const finalSQLQuery = await initialize_games([savedMatch]);
    const obj = { savedMatch, finalSQLQuery };
    return obj;
  } catch (err) {
    console.error(err.message);
  }
  //console.log("workkk");
};
// connectToMongo();
// const obj = start_normal_game({
//   player1: "231c0d99-53a2-4000-b52a-9c9fcbb5ad95",
//   player2: "abd15ab3-ff91-40e6-a64d-2b9ca58eb2ec",
//   game_type: "chess",
//   in_tournament: false
// }).then((obj) => {
//   console.log(obj);
//   return obj;
// });
//console.log(obj);
//console.log(finalSQLQuery);

module.exports = { start_normal_game };
