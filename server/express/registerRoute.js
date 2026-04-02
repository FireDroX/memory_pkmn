const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

const db = require("../../db");
const { promisify } = require("util");

// Promisify sqlite
const dbGet = promisify(db.get.bind(db));
const dbRun = promisify(db.run.bind(db));

router.post("/", async (req, res) => {
  try {
    const { name, password } = req.body;

    // Vérif inputs
    if (!name || !password) {
      return res.json({ status: "Both inputs are required." });
    }

    // Vérifier si username existe déjà
    const existingUser = await dbGet(`SELECT * FROM users WHERE name = ?`, [
      name,
    ]);

    if (existingUser) {
      return res.json({ status: "That username is already used." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      level: 0,
      xp: 0,
      xpNeeded: 10,
      inventory: [
        {
          colors: ["color-default"],
        },
      ],
    };

    // Insert user
    await dbRun(
      `INSERT INTO users (
        id,
        name,
        password,
        online_games_won,
        shiny_pairs_found,
        user_profile
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "USER-" + Date.now().toString(),
        name,
        hashedPassword,
        0,
        0,
        JSON.stringify(newUser),
      ],
    );

    return res.json({
      status: "Account created, please Login.",
    });
  } catch (error) {
    console.error(error);
    return res.json({ status: "Error creating account" });
  }
});

module.exports = router;
