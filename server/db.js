const Pool = require("pg").Pool; //this is a class

const pool = new Pool({
  database: "authdb",
  user: "postgres",
  password: "password",
  host: "postgres", //localhost-> postgres
  port: 5432
});

module.exports = pool;
