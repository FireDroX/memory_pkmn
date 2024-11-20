const express = require("express");

const router = express.Router();

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.get("/", async (_, res) => {
  const users = await supabase.from("users").select();

  const leaderboard = {
    levels: [],
    game_wons: [],
    shiny_pairs_found: [],
  };

  users.data.map((user) => {
    leaderboard.levels.push({
      name: user.name,
      score: user.user_profile.level,
      color: user.user_profile.inventory[0].colors[0],
    });
    leaderboard.game_wons.push({
      name: user.name,
      score: user.online_games_won,
      color: user.user_profile.inventory[0].colors[0],
    });
    leaderboard.shiny_pairs_found.push({
      name: user.name,
      score: user.shiny_pairs_found,
      color: user.user_profile.inventory[0].colors[0],
    });
  });

  res.json({
    levels: leaderboard.levels.sort((a, b) => b.score - a.score),
    game_wons: leaderboard.game_wons.sort((a, b) => b.score - a.score),
    shiny_pairs_found: leaderboard.shiny_pairs_found.sort(
      (a, b) => b.score - a.score
    ),
  });
});

module.exports = router;
