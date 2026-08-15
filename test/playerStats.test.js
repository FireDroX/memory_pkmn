const test = require("node:test");
const assert = require("node:assert/strict");
const { formatPlayerStats, percentage } = require("../server/utils/playerStats");
const { addXp } = require("../server/utils/profileProgress");

test("percentage gere les totaux nuls et arrondit le ratio", () => {
  assert.equal(percentage(0, 0), 0);
  assert.equal(percentage(2, 3), 67);
});

test("addXp applique les gains de defi et les passages de niveau", () => {
  const profile = addXp(
    {
      level: 0,
      xp: 8,
      xpNeeded: 10,
      inventory: [{ colors: ["color-default"] }],
      achievements: [0],
    },
    8,
  );

  assert.equal(profile.level, 1);
  assert.equal(profile.xp, 6);
  assert.ok(profile.xpNeeded > 10);
});

test("formatPlayerStats expose un bilan complet et numerique", () => {
  const stats = formatPlayerStats({
    online_games_played: 5,
    online_games_won: 3,
    online_games_lost: 2,
    current_win_streak: 1,
    best_win_streak: 3,
    total_pairs_found: 42,
    shiny_pairs_found: 2,
    solo_games_played: 4,
    solo_games_won: 3,
    solo_best_remaining_tries: 8,
    created_at: "2026-08-15T00:00:00.000Z",
  });

  assert.equal(stats.onlineWinRate, 60);
  assert.equal(stats.soloWinRate, 75);
  assert.equal(stats.bestWinStreak, 3);
  assert.equal(stats.totalPairsFound, 42);
});
