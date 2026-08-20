import test from "node:test";
import assert from "node:assert/strict";
import {
  achievements,
  getUnlockedAchievementIds,
} from "../client/src/utils/achievements.js";

test("le catalogue client contient les quatre nouveaux succes", () => {
  const ids = achievements.map((achievement) => achievement.id);
  assert.equal(ids.includes(4), true);
  assert.equal(ids.includes(5), true);
  assert.equal(ids.includes(300), true);
  assert.equal(ids.includes(400), true);
});

test("le niveau maximum utilise une couronne", () => {
  const maximumLevel = achievements.find(
    (achievement) => achievement.id === 150,
  );
  assert.equal(maximumLevel.icon, "👑");
});

test("les statistiques visibles debloquent les nouveaux succes", () => {
  const unlocked = getUnlockedAchievementIds(
    { achievements: [0] },
    { bestWinStreak: 5, totalPairsFound: 100 },
    2,
  );

  assert.equal(unlocked.has(4), true);
  assert.equal(unlocked.has(5), true);
  assert.equal(unlocked.has(300), true);
  assert.equal(unlocked.has(400), true);
});
