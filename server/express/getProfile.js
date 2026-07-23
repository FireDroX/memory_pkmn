const express = require("express");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");
const { unlockStatAchievements } = require("../utils/profileProgress");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();
    const [users] = await pool.execute(
      `SELECT name, online_games_won, shiny_pairs_found, created_at, user_profile
       FROM users WHERE name = ? LIMIT 1`,
      [name],
    );
    const user = users[0];

    if (!user) {
      return res.status(404).json({ status: "Joueur introuvable." });
    }

    const profile = unlockStatAchievements(
      parseJson(user.user_profile, {}),
      {
        wins: user.online_games_won,
        shiny: user.shiny_pairs_found,
      },
    );

    await pool.execute("UPDATE users SET user_profile = ? WHERE name = ?", [
      JSON.stringify(profile),
      name,
    ]);

    return res.json({
      status: "",
      profile,
      stats: {
        onlineGamesWon: user.online_games_won,
        shinyPairsFound: user.shiny_pairs_found,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Profile summary error:", error);
    return res.status(500).json({ status: "Chargement du profil impossible." });
  }
});

module.exports = router;
