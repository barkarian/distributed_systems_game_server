const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { Chess } = require("chess.js");
const chess = new Chess();
chess.reset();
const matchSchema = new Schema(
  {
    game_id: {
      type: String,
      required: true
    },
    player1: {
      type: String,
      required: true
    },
    player2: {
      type: String,
      required: true
    },
    player1_email: {
      type: String,
      default: ""
    },
    player2_email: {
      type: String,
      default: ""
    },
    game_type: {
      type: String,
      required: true
    },
    in_tournament: {
      type: Boolean,
      required: true
    },
    cur_player: {
      type: String,
      required: false,
      default: ""
    },
    fen: {
      type: String,
      required: false,
      default: chess.fen()
    },
    moves: [
      {
        player: String,
        from: String,
        to: String,
        promotion: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

const Match = mongoose.model("Match", matchSchema);

const connectToMongo = async () => {
  try {
    const mongoResponse = await mongoose.connect("mongodb://localhost/NewDb", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true
    });
    // console.log({
    //   msg: "We connect to Mongo (via Mongoose module)",
    //   mongoResponse
    // });
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Error when trying to create to database");
  }
};

module.exports = { connectToMongo, Match };
