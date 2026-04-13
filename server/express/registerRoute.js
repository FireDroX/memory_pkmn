const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const pool = await require("../../db");

    const { name, password } = req.body;

    // Vérif inputs
    if (!name || !password) {
      return res.json({ status: "Both inputs are required." });
    }

    // Vérifier si username existe déjà
    const checkRequest = `
      SELECT * FROM users WHERE name = @name
    `;

    const existingResult = await pool
      .request()
      .input("name", name)
      .query(checkRequest);

    const existingUser = existingResult.recordset[0];

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

    const userId = "USER-" + Date.now().toString();

    // Insert user
    const insertRequest = `
      INSERT INTO users (
        id,
        name,
        password,
        online_games_won,
        shiny_pairs_found,
        user_profile
      ) VALUES (
        @id,
        @name,
        @password,
        @online_games_won,
        @shiny_pairs_found,
        @user_profile
      )
    `;

    await pool
      .request()
      .input("id", userId)
      .input("name", name)
      .input("password", hashedPassword)
      .input("online_games_won", 0)
      .input("shiny_pairs_found", 0)
      .input("user_profile", JSON.stringify(newUser))
      .query(insertRequest);

    return res.json({
      status: "Account created, please Login.",
    });
  } catch (error) {
    console.error(error);
    return res.json({ status: "Error creating account" });
  }
});

module.exports = router;
