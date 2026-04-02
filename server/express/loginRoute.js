const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

const db = require("../../db");
const { promisify } = require("util");

// Promisify sqlite
const dbGet = promisify(db.get.bind(db));

router.post("/", async (req, res) => {
  try {
    const { name, password } = req.body;

    // Vérif inputs
    if (name === "" && password === "") {
      return res.json({ status: "Both inputs are required." });
    }

    // Récupérer utilisateur
    const userRaw = await dbGet(`SELECT * FROM users WHERE name = ?`, [name]);

    if (!userRaw) {
      return res.json({ status: "Incorrect Username or Password !" });
    }

    // Vérifier password
    const isValid = await bcrypt.compare(password, userRaw.password);
    if (!isValid) {
      return res.json({ status: "Incorrect Username or Password !" });
    }

    // Parse JSON profile
    const user = {
      ...userRaw,
      user_profile: JSON.parse(userRaw.user_profile || "{}"),
    };

    return res.json({
      status: "",
      online_games_won: user.online_games_won,
      created_at: user.created_at,
      profile: user.user_profile,
    });
  } catch (error) {
    console.error(error);
    return res.json({ status: "Login error" });
  }
});

module.exports = router;
