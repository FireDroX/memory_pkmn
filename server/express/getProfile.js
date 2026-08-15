const express = require("express");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");
const { unlockStatAchievements } = require("../utils/profileProgress");
const { formatPlayerStats } = require("../utils/playerStats");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT name, online_games_won, online_games_played, online_games_lost,
              current_win_streak, best_win_streak, shiny_pairs_found,
              total_pairs_found, solo_games_played, solo_games_won,
              solo_best_remaining_tries, created_at, user_profile
       FROM users WHERE id = ? LIMIT 1`,
      [req.auth.id],
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

    await pool.execute("UPDATE users SET user_profile = ? WHERE id = ?", [
      JSON.stringify(profile),
      req.auth.id,
    ]);

    return res.json({
      status: "",
      profile,
      stats: formatPlayerStats(user),
    });
  } catch (error) {
    console.error("Profile summary error:", error);
    return res.status(500).json({ status: "Chargement du profil impossible." });
  }
});

module.exports = router;
