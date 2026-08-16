const test = require("node:test");
const assert = require("node:assert/strict");
const { invokeRoute, loadRouterWithPool } = require("./routeTestUtils");

test("GET /profile/leaderboard exclut les joueurs desactives", async () => {
  let executedSql = "";
  const activeUsers = [
    {
      name: "Misty",
      user_profile: JSON.stringify({
        level: 4,
        inventory: [{ colors: ["color-4"] }],
      }),
      online_games_won: 8,
      shiny_pairs_found: 3,
    },
    {
      name: "Ash",
      user_profile: JSON.stringify({ level: 5 }),
      online_games_won: 12,
      shiny_pairs_found: 1,
    },
  ];
  const disabledUser = {
    name: "Giovanni",
    user_profile: JSON.stringify({ level: 99 }),
    online_games_won: 999,
    shiny_pairs_found: 999,
  };
  const pool = {
    query: async (sql) => {
      executedSql = sql;
      return [
        sql.includes("is_active = TRUE")
          ? activeUsers
          : [...activeUsers, disabledUser],
      ];
    },
  };

  const router = loadRouterWithPool(
    "../server/express/getLeaderboards",
    pool,
  );
  const response = await invokeRoute(router, "GET", "/");

  assert.match(executedSql, /WHERE is_active = TRUE/i);
  assert.deepEqual(
    response.body.levels.map((entry) => entry.name),
    ["Ash", "Misty"],
  );
  assert.deepEqual(
    response.body.game_wons.map((entry) => entry.name),
    ["Ash", "Misty"],
  );
  assert.deepEqual(
    response.body.shiny_pairs_found.map((entry) => entry.name),
    ["Misty", "Ash"],
  );
});
