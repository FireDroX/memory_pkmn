const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./db.sqlite");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      playerTurn TEXT NOT NULL,
      cards TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
      players TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT '',
      name TEXT DEFAULT '' NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
      password TEXT DEFAULT '' NOT NULL,
      online_games_won INTEGER DEFAULT 0 NOT NULL,
      shiny_pairs_found INTEGER DEFAULT 0 NOT NULL,
      user_profile TEXT DEFAULT '{
        "level": 0,
        "xp": 0,
        "xpNeeded": 10,
        "inventory": [
          {
            "colors": ["levels-color-default"]
          }
        ]
      }' NOT NULL
    )
  `);
});

module.exports = db;
