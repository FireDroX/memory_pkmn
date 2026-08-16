const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../../db");
const {
  isValidUsername,
  normalizeUsername,
} = require("../utils/username");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const name = normalizeUsername(req.body.name);
    const password = String(req.body.password || "");

    if (!isValidUsername(name) || !password) {
      return res.status(400).json({
        status: "Choisis un pseudo alphanumerique et un mot de passe.",
      });
    }

    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE name = ? LIMIT 1",
      [name],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ status: "Ce pseudo est deja utilise." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userProfile = {
      level: 0,
      xp: 0,
      xpNeeded: 10,
      inventory: [{ colors: ["color-default"] }],
      achievements: [0],
    };

    await pool.execute(
      `INSERT INTO users
        (id, name, password, online_games_won, shiny_pairs_found, user_profile)
       VALUES (?, ?, ?, 0, 0, ?)`,
      [
        `USER-${Date.now()}`,
        name,
        hashedPassword,
        JSON.stringify(userProfile),
      ],
    );

    return res
      .status(201)
      .json({ status: "Compte cree. Tu peux maintenant te connecter." });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ status: "Creation du compte impossible." });
  }
});

module.exports = router;
