const express = require("express");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");
const { unlockStatAchievements } = require("../utils/profileProgress");
const { formatPlayerStats } = require("../utils/playerStats");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT u.name, u.online_games_won, u.online_games_played,
              u.online_games_lost, u.current_win_streak, u.best_win_streak,
              u.shiny_pairs_found, u.total_pairs_found, u.solo_games_played,
              u.solo_games_won, u.solo_best_remaining_tries, u.created_at,
              u.user_profile,
              (SELECT COUNT(*) FROM friendships f
               WHERE f.status = 'accepted'
                 AND (f.user_id = u.id OR f.friend_id = u.id)) AS friend_count
       FROM users u WHERE u.id = ? LIMIT 1`,
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
        winStreak: user.best_win_streak,
        pairs: user.total_pairs_found,
        friends: user.friend_count,
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
