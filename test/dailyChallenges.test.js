const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getDailyChallenges,
  getParisDateKey,
  recordDailyProgress,
} = require("../server/utils/dailyChallenges");

test("getDailyChallenges fournit trois defis uniques et stables par jour", () => {
  const first = getDailyChallenges("2026-08-15");
  const second = getDailyChallenges("2026-08-15");
  const tomorrow = getDailyChallenges("2026-08-16");

  assert.equal(first.length, 3);
  assert.equal(new Set(first.map((challenge) => challenge.id)).size, 3);
  assert.deepEqual(first, second);
  assert.notDeepEqual(first, tomorrow);
});

test("getParisDateKey renvoie une date exploitable par MySQL", () => {
  assert.match(getParisDateKey(new Date("2026-08-15T12:00:00Z")), /^2026-08-15$/);
});

test("recordDailyProgress enregistre uniquement les metriques du jour", async () => {
  const writes = [];
  const database = {
    execute: async (sql, parameters) => {
      writes.push({ sql, parameters });
      return [{ affectedRows: 1 }];
    },
  };

  await recordDailyProgress(
    database,
    "USER-A",
    { pairsFound: 4, soloGames: 1, soloWins: 1 },
    "2026-08-15",
  );

  const today = getDailyChallenges("2026-08-15");
  const expectedWrites = today.filter((challenge) =>
    ["pairsFound", "soloGames", "soloWins"].includes(challenge.metric),
  );
  assert.equal(writes.length, expectedWrites.length);
  assert.ok(writes.every((entry) => entry.parameters[0] === "USER-A"));
  assert.ok(writes.every((entry) => entry.parameters[1] === "2026-08-15"));
});
