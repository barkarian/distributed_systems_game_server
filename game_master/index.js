const express = require("express");
const app = express();
const cors = require("cors");
const { connectToMongo } = require("./mongodb");
//remove after
// const { createMatches } = require("./utils/createMatches");
// createMatches("7b677ff3-7c45-4489-bba9-7eaedf0c8a0e", "chess");
//middleware
app.use(express.json());
app.use(cors());
connectToMongo();

//routes
app.use("/official", require("./routes/official.js"));

app.listen(5001, () => {
  console.log("server is running on port 5001");
});
