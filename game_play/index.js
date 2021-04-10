const express = require("express");
const app = express();
const cors = require("cors");
const { connectToMongo } = require("./mongodb");

app.use(express.json());
app.use(cors());
connectToMongo();
//Routes
app.use("/game/make-move", require("./routes/make-move.js"));
app.use("/game/make-move", require("./routes/get-match-data.js"));

app.listen(5002, () => {
  console.log("server is running on port 5002");
});
