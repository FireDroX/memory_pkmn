const test = require("node:test");
const assert = require("node:assert/strict");
const { invokeRoute, loadRouterWithPool } = require("./routeTestUtils");
const levels = require("../server/utils/Levels");

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
          online_games_won: 0,
          best_win_streak: 0,
          shiny_pairs_found: 0,
          total_pairs_found: 99,
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
  assert.equal(response.body.profile.achievements.includes(300), true);
});

test("POST /profile/update conserve l'XP excedentaire pour les futurs niveaux", async (t) => {
  const levelCount = levels.length;
  t.after(() => levels.splice(levelCount));

  const profile = {
    level: 5,
    xp: 600,
    xpNeeded: 250,
    inventory: [{ colors: ["color-default"] }],
    achievements: [0],
  };
  const pool = {
    execute: async (sql) =>
      sql.includes("SELECT id, user_profile")
        ? [[{ id: "USER-1", user_profile: JSON.stringify(profile) }]]
        : [{ affectedRows: 1 }],
  };
  const router = loadRouterWithPool("../server/express/updateUser", pool);

  const currentMaximum = await invokeRoute(router, "POST", "/", {
    auth: { id: "USER-1" },
    body: { xp: 15 },
  });
  assert.equal(currentMaximum.body.profile.level, 5);
  assert.equal(currentMaximum.body.profile.xp, 615);

  levels.push({
    level: 6,
    xpNeeded: 300,
    rewards: { colors: ["color-6"] },
  });

  const afterNewLevel = await invokeRoute(router, "POST", "/", {
    auth: { id: "USER-1" },
    body: {
      xp: 15,
      userProfile: {
        inventory: [{ colors: ["color-default"] }],
      },
    },
  });
  assert.equal(afterNewLevel.body.profile.level, 6);
  assert.equal(afterNewLevel.body.profile.xp, 365);
  assert.deepEqual(afterNewLevel.body.profile.inventory[0].colors, [
    "color-default",
    "color-6",
  ]);
});
