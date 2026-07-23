const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");
const { unlockStatAchievements } = require("../utils/profileProgress");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const password = String(req.body.password || "");

    if (!name || !password) {
      return res.status(400).json({ status: "Tous les champs sont requis." });
    }

    const [users] = await pool.execute(
      "SELECT * FROM users WHERE name = ? LIMIT 1",
      [name],
    );
    const user = users[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ status: "Identifiant ou mot de passe incorrect." });
    }

    const profile = unlockStatAchievements(
      parseJson(user.user_profile, {}),
      {
        wins: user.online_games_won,
        shiny: user.shiny_pairs_found,
      },
    );

    return res.json({
      status: "",
      online_games_won: user.online_games_won,
      shiny_pairs_found: user.shiny_pairs_found,
      created_at: user.created_at,
      profile,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ status: "Connexion impossible." });
  }
});

module.exports = router;
