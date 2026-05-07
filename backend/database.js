require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function getUsers() {
  const result = await pool.query("SELECT * FROM Drivers");
  return result.rows;
}

pool
  .query("SELECT NOW()")
  .then((res) => console.log("DB Connected:", res.rows[0].now))
  .catch((err) => console.error("DB Error:", err.message));

module.exports = pool;
