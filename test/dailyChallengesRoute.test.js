const test = require("node:test");
const assert = require("node:assert/strict");
const { invokeRoute, loadRouterWithPool } = require("./routeTestUtils");
const { getDailyChallenges } = require("../server/utils/dailyChallenges");

test("POST /daily-challenges/claim attribue l'XP une seule fois", async () => {
  const challenge = getDailyChallenges()[0];
  const calls = { committed: false, released: false, updates: 0 };
  const connection = {
    beginTransaction: async () => {},
    rollback: async () => {},
    commit: async () => { calls.committed = true; },
    release: () => { calls.released = true; },
    execute: async (sql) => {
      if (sql.includes("SELECT id, user_profile")) {
        return [[{
          id: "USER-A",
          user_profile: JSON.stringify({
            level: 0,
            xp: 0,
            xpNeeded: 10,
            inventory: [{ colors: ["color-default"] }],
            achievements: [0],
          }),
        }]];
      }
      if (sql.includes("SELECT progress")) {
        return [[{
          progress: challenge.target,
          completed_at: new Date(),
          claimed_at: null,
        }]];
      }
      calls.updates += 1;
      return [{ affectedRows: 1 }];
    },
  };
  const router = loadRouterWithPool(
    "../server/express/dailyChallengesRoute",
    { getConnection: async () => connection },
  );
  const response = await invokeRoute(router, "POST", "/claim", {
    auth: { id: "USER-A", name: "Ash" },
    body: { challengeId: challenge.id },
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.body.status, new RegExp(`\\+${challenge.rewardXp} XP`));
  assert.equal(calls.updates, 2);
  assert.equal(calls.committed, true);
  assert.equal(calls.released, true);
});
