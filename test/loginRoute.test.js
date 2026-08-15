const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { invokeRoute, loadRouterWithPool } = require("./routeTestUtils");

test("POST /login renvoie le pseudo canonique stocke en base", async () => {
  const password = await bcrypt.hash("secret", 4);
  const pool = {
    execute: async () => [[{
      id: "USER-ADMIN",
      name: "Admin",
      password,
      online_games_won: 0,
      online_games_played: 0,
      online_games_lost: 0,
      current_win_streak: 0,
      best_win_streak: 0,
      shiny_pairs_found: 0,
      total_pairs_found: 0,
      solo_games_played: 0,
      solo_games_won: 0,
      solo_best_remaining_tries: 0,
      user_profile: JSON.stringify({
        level: 0,
        xp: 0,
        xpNeeded: 10,
        inventory: [{ colors: ["color-default"] }],
        achievements: [0],
      }),
      created_at: new Date("2026-08-15T00:00:00Z"),
    }]],
  };
  const router = loadRouterWithPool("../server/express/loginRoute", pool);
  const response = await invokeRoute(router, "POST", "/", {
    body: { name: "admin", password: "secret" },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.name, "Admin");
});
