const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.SQL_SERVER || "localhost",
  port: Number(process.env.SQL_PORT) || 3306,
  database: process.env.SQL_DBNAME || "pokeflip",
  user: process.env.SQL_USER || "root",
  password: process.env.SQL_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

module.exports = pool;
