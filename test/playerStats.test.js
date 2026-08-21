const test = require("node:test");
const assert = require("node:assert/strict");
const { formatPlayerStats, percentage } = require("../server/utils/playerStats");
const {
  addXp,
  unlockAchievement,
  unlockStatAchievements,
} = require("../server/utils/profileProgress");
const levels = require("../server/utils/Levels");

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

test("addXp conserve l'XP excedentaire au niveau maximum pour les futurs niveaux", (t) => {
  const levelCount = levels.length;
  t.after(() => levels.splice(levelCount));

  const profile = {
    level: 5,
    xp: 600,
    xpNeeded: 250,
    inventory: [{ colors: ["color-default"] }],
    achievements: [0],
  };

  const atCurrentMaximum = addXp(profile, 15);
  assert.equal(atCurrentMaximum.level, 5);
  assert.equal(atCurrentMaximum.xp, 615);

  levels.push({
    level: 6,
    xpNeeded: 300,
    rewards: { colors: [] },
  });

  const afterNewLevel = addXp(profile, 15);
  assert.equal(afterNewLevel.level, 6);
  assert.equal(afterNewLevel.xp, 365);
});

test("unlockAchievement attribue et memorise la recompense XP une seule fois", () => {
  const legacyProfile = {
    level: 0,
    xp: 0,
    xpNeeded: 10,
    inventory: [{ colors: ["color-default"] }],
    achievements: [0, 300],
  };

  const rewarded = unlockAchievement(legacyProfile, 300);
  assert.equal(rewarded.level, 1);
  assert.equal(rewarded.xp, 40);
  assert.equal(rewarded.achievementRewardsClaimed.includes(300), true);

  const rewardedAgain = unlockAchievement(rewarded, 300);
  assert.equal(rewardedAgain.level, 1);
  assert.equal(rewardedAgain.xp, 40);
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

test("unlockStatAchievements debloque les series, les paires et le trio", () => {
  const profile = {
    level: 0,
    xp: 0,
    xpNeeded: 10,
    inventory: [{ colors: ["color-default"] }],
    achievements: [0],
  };

  const beforeThresholds = unlockStatAchievements(profile, {
    winStreak: 2,
    pairs: 99,
    friends: 1,
  });
  assert.deepEqual(beforeThresholds.achievements, [0]);

  const threeWins = unlockStatAchievements(profile, {
    winStreak: 3,
    pairs: 100,
    friends: 2,
  });
  assert.equal(threeWins.achievements.includes(4), true);
  assert.equal(threeWins.achievements.includes(5), false);
  assert.equal(threeWins.achievements.includes(300), true);
  assert.equal(threeWins.achievements.includes(400), true);

  const fiveWins = unlockStatAchievements(threeWins, { winStreak: 5 });
  assert.equal(fiveWins.achievements.includes(5), true);
});
