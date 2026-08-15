const test = require("node:test");
const assert = require("node:assert/strict");
const { invokeRoute, loadRouterWithPool } = require("./routeTestUtils");

test("POST /profile/update enregistre une victoire solo avec l'identite de session", async (t) => {
  const errors = [];
  t.mock.method(console, "error", (...arguments_) => errors.push(arguments_));
  const calls = [];
  const pool = {
    execute: async (sql, parameters) => {
      calls.push({ sql, parameters });
      if (sql.includes("SELECT id, user_profile")) {
        return [[{
          id: "USER-ADMIN",
          user_profile: JSON.stringify({
            level: 0,
            xp: 0,
            xpNeeded: 10,
            inventory: [{ colors: ["color-default"] }],
            achievements: [0],
          }),
        }]];
      }
      return [{ affectedRows: 1 }];
    },
  };
  const router = loadRouterWithPool("../server/express/updateUser", pool);

  const response = await invokeRoute(router, "POST", "/", {
    auth: { id: "USER-ADMIN", name: "Admin" },
    body: {
      xp: 5,
      gameResult: { won: true, pairsFound: 6, remainingTries: 4 },
    },
  });

  assert.equal(
    errors.some(([, error]) => error?.message === "name is not defined"),
    false,
  );
  assert.equal(response.statusCode, 200);
  const soloUpdate = calls.find(({ sql }) =>
    sql.includes("solo_games_played = solo_games_played + 1"),
  );
  assert.equal(soloUpdate.parameters.at(-1), "USER-ADMIN");
});
