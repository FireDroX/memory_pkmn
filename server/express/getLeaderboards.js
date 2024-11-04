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
    game_wons: [],
    shiny_pairs_found: [],
  };

  users.data.map((user) => {
    leaderboard.game_wons.push({
      name: user.name,
      score: user.online_games_won,
    });
    leaderboard.shiny_pairs_found.push({
      name: user.name,
      score: user.shiny_pairs_found,
    });
  });

  res.json({
    game_wons: leaderboard.game_wons.sort((a, b) => b.score - a.score),
    shiny_pairs_found: leaderboard.shiny_pairs_found.sort(
      (a, b) => b.score - a.score
    ),
  });
});

module.exports = router;
