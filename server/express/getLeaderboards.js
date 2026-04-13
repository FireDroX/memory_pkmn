const express = require("express");
const router = express.Router();

router.get("/", async (_, res) => {
  try {
    const pool = await require("../../db");

    const result = await pool.query(`SELECT * FROM users`);
    const usersRaw = result.recordset;

    // Parser user_profile JSON
    const users = usersRaw.map((user) => ({
      ...user,
      user_profile: JSON.parse(user.user_profile || "{}"),
    }));

    const leaderboard = {
      levels: [],
      game_wons: [],
      shiny_pairs_found: [],
    };

    users.forEach((user) => {
      const color = user.user_profile?.inventory?.[0]?.colors?.[0] || null;

      leaderboard.levels.push({
        name: user.name,
        score: user.user_profile.level,
        color,
      });

      leaderboard.game_wons.push({
        name: user.name,
        score: user.online_games_won,
        color,
      });

      leaderboard.shiny_pairs_found.push({
        name: user.name,
        score: user.shiny_pairs_found,
        color,
      });
    });

    res.json({
      levels: leaderboard.levels.sort((a, b) => b.score - a.score),
      game_wons: leaderboard.game_wons.sort((a, b) => b.score - a.score),
      shiny_pairs_found: leaderboard.shiny_pairs_found.sort(
        (a, b) => b.score - a.score,
      ),
    });
  } catch (error) {
    console.error(error);
    res.json({ error: "Failed to fetch leaderboard" });
  }
});

module.exports = router;
