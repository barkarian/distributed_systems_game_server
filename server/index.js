const express = require("express");
const app = express();
const cors = require("cors");
const initializeRootUser = require("./configDbAfterRestart");
require("dotenv").config();

//middleware

app.use(express.json());
app.use(cors());
initializeRootUser();
//goodmorning

//ROUTES
app.use("/auth", require("./routes/jwtAuth.js"));
app.use("/dashboard", require("./routes/dashboard.js"));

app.listen(5000, () => {
  console.log("server is running on port 5000");
});
