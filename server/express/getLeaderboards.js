const express = require("express");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");

const router = express.Router();

router.get("/", async (_, res) => {
  try {
    const [users] = await pool.query(
      `SELECT name, user_profile, online_games_won, shiny_pairs_found
       FROM users
       WHERE is_active = TRUE`,
    );
    const leaderboard = {
      levels: [],
      game_wons: [],
      shiny_pairs_found: [],
    };

    users.forEach((user) => {
      const profile = parseJson(user.user_profile, {});
      const color = profile?.inventory?.[0]?.colors?.[0] || "color-default";

      leaderboard.levels.push({
        name: user.name,
        score: profile.level || 0,
        color,
      });
      leaderboard.game_wons.push({
        name: user.name,
        score: Number(user.online_games_won) || 0,
        color,
      });
      leaderboard.shiny_pairs_found.push({
        name: user.name,
        score: Number(user.shiny_pairs_found) || 0,
        color,
      });
    });

    return res.json({
      levels: leaderboard.levels.sort((a, b) => b.score - a.score),
      game_wons: leaderboard.game_wons.sort((a, b) => b.score - a.score),
      shiny_pairs_found: leaderboard.shiny_pairs_found.sort(
        (a, b) => b.score - a.score,
      ),
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res.status(500).json({
      levels: [],
      game_wons: [],
      shiny_pairs_found: [],
    });
  }
});

module.exports = router;
