const pool = require("./db");
const bcrypt = require("bcrypt");

const initializeRootUser = async () => {
  //   const admin_email = "thodorisbarkas@gmail.com";
  //   const name = "barkarian";
  //   const password = "123456789";
  const admin_email = process.env.ADMIN_EMAIL;
  const name = process.env.ADMIN_NAME;
  const password = process.env.ADMIN_PASSWORD;
  console.log(admin_email, name, password);
  const existingUserQuery = await pool.query(
    "select * from users where user_email=$1",
    [admin_email]
  );
  if (existingUserQuery.rows.length != 0) {
    return;
  }
  //Bcrypt the user pass
  const saltRound = 10;
  const salt = await bcrypt.genSalt(saltRound);
  const bcryptPassword = await bcrypt.hash(password, salt);

  //enter user in database
  const newAdminQuery = await pool.query(
    "INSERT INTO users(user_name,user_email,user_password,user_role_admin) VALUES ($1,$2,$3,$4) RETURNING *",
    [name, admin_email, bcryptPassword, 1]
  );
  await addTestUsers();
  console.log(`New users have been created
  ADMIN USER IS: name:${name},email:${admin_email},password:${password}
  AND 10 TEST USER WITH FORM OF: name:test-user<i> ,email:test-user<i>@gmail.com,password:password`);
};

const addTestUsers = async () => {
  const number_of_test_users = 10;
  const password = "password";
  const name = "test-user";
  for (let i = 0; i < number_of_test_users; i++) {
    //Bcrypt the user pass
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      "INSERT INTO users(user_name,user_email,user_password) VALUES ($1,$2,$3) RETURNING *",
      [`${name}${i}`, `${name}${i}@gmail.com`, bcryptPassword]
    );
  }
  return;
};
module.exports = initializeRootUser;
