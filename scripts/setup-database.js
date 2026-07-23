const mysql = require("mysql2/promise");
require("dotenv").config();

const database = process.env.SQL_DBNAME || "pokeflip";

if (!/^[a-zA-Z0-9_]+$/.test(database)) {
  throw new Error("SQL_DBNAME contient des caracteres non autorises.");
}

const connectionConfig = {
  host: process.env.SQL_SERVER || "localhost",
  port: Number(process.env.SQL_PORT) || 3306,
  user: process.env.SQL_USER || "root",
  password: process.env.SQL_PASSWORD || "",
  charset: "utf8mb4",
};

const createDatabase = async () => {
  const connection = await mysql.createConnection(connectionConfig);

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.query(`USE \`${database}\``);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) NOT NULL,
        name VARCHAR(25) NOT NULL,
        password VARCHAR(255) NOT NULL,
        online_games_won INT UNSIGNED NOT NULL DEFAULT 0,
        shiny_pairs_found INT UNSIGNED NOT NULL DEFAULT 0,
        user_profile JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY users_name_unique (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(64) NOT NULL,
        players JSON NOT NULL,
        playerTurn VARCHAR(25) NULL,
        cards JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY rooms_created_at_index (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log(`Base "${database}" et tables MySQL pretes.`);
  } finally {
    await connection.end();
  }
};

createDatabase().catch((error) => {
  console.error("Impossible de preparer MySQL :", error.message);
  process.exitCode = 1;
});
