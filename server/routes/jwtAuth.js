const bcrypt = require("bcrypt");
const router = require("express").Router();
const pool = require("../db.js");
const jwtGenerator = require("../utils/jwtGenerator.js");
const validInfo = require("../middleware/validInfo.js");
const authorization = require("../middleware/authorization.js");

//registering
router.post("/register", validInfo, async (req, res) => {
  try {
    //1.destructure the req.body (name,mail,password)

    const { name, email, password } = req.body;
    console.log("request.body is:");
    console.log(req.body);

    //2.check if user exist (if user exist then throw error)
    const user = await pool.query("SELECT * FROM users WHERE user_email=$1", [
      email
    ]);

    if (user.rows.length != 0) {
      return res.status(401).json("User already exist");
    }

    //3.Bcrypt the user pass
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    //4.enter user in database
    const newUser = await pool.query(
      "INSERT INTO users(user_name,user_email,user_password) VALUES ($1,$2,$3) RETURNING *",
      [name, email, bcryptPassword]
    );

    //5.generate the jwt token
    //console.log(newUser.rows[0]);
    const { user_password, ...user_data } = newUser.rows[0]; //excludes user_password from newUser.rows[0]
    const token = jwtGenerator(user_data);
    //6.send the response
    console.log("response.body is:");
    console.log({ token, user_data });
    res.json({ token, user_data }); //user_data is gonna send as it is because contains valuable infos for client as well
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//login

router.post("/login", validInfo, async (req, res) => {
  try {
    //1.destructure the req.body (name,mail,password)
    const { email, password } = req.body;
    console.log("request.body is:");
    console.log(req.body);
    //2.check if user doesn't exist (if not then throw error)
    const user = await pool.query("SELECT * FROM users WHERE user_email=$1", [
      email
    ]);
    if (user.rows.length === 0) {
      return res.status(401).json("The email isn't correct");
    }
    //3.check if password is the same as the database password
    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].user_password
    );
    console.log(validPassword);
    //console.log(validPassword);
    if (!validPassword) {
      return res.status(401).json("Password was incorrect");
    }
    //4.generate the jwt token
    const { user_password, ...user_data } = user.rows[0]; //excludes user_password from newUser.rows[0]
    const token = jwtGenerator(user_data);
    //5.send the response
    console.log("response.body is:");
    console.log({ token, user_data });
    res.json({ token, user_data });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//is-verify?
router.get("/is-verify", authorization, async (req, res) => {
  try {
    //console.log(req.verifiedInfos);
    res.json(true);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//is-verify?
router.get("/admin/get-all-users", authorization, async (req, res) => {
  try {
    if (req.verifiedInfos.user_role_admin == 0) {
      return res.status(403).json("You are not authorized for this");
      //console.log(allUsers);
    }
    //all users except admin
    const allUsers = await pool.query(
      "SELECT user_id,user_email,user_name,user_role_admin,user_role_official FROM users WHERE user_role_admin!='1' OR user_role_official!='1' order by user_email"
    );

    if (allUsers.rows.length === 0) {
      return res.json("There's no users (all users except admins)");
    }
    console.log(allUsers.rows);
    res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/admin/set-role", authorization, async (req, res) => {
  try {
    if (req.verifiedInfos.user_role_admin == 0) {
      return res.status(403).json("You are not authorized for this");
    }

    const { correlated_role, user_id } = req.body;
    const setUserRole = await pool.query(
      `UPDATE users SET ${correlated_role}='1' WHERE user_id='${user_id}'`
    );
    //console.log(setUserRole.rowCount);
    if (setUserRole.rowCount == 1) {
      res.json({
        success: true,
        message: "User role added succesfully"
      });
    } else {
      res.json("the user_id you request doesn't exists");
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error or wrong request's format");
  }
});

module.exports = router;
