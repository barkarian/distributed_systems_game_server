const express = require("express");
const app = express();
const cors = require("cors");

//middleware

app.use(express.json());
app.use(cors());
//HELLO BRO new comment here
//goodmorning

//ROUTES
app.use("/auth", require("./routes/jwtAuth.js"));
app.use("/dashboard", require("./routes/dashboard.js"));

app.listen(5000, () => {
  console.log("server is running on port 5000");
});
