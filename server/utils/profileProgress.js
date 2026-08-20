const achievements = require("./Achievements");
const levels = require("./Levels");

const prepareProfile = (profile) => {
  const prepared = structuredClone(profile || {});
  prepared.level = Number(prepared.level) || 0;
  prepared.xp = Number(prepared.xp) || 0;
  prepared.xpNeeded = Number(prepared.xpNeeded) || 10;
  prepared.inventory ||= [{ colors: ["color-default"] }];
  prepared.inventory[0] ||= { colors: ["color-default"] };
  prepared.inventory[0].colors ||= ["color-default"];
  prepared.achievements ||= [0];
  if (!prepared.achievements.includes(0)) prepared.achievements.unshift(0);
  return prepared;
};

const unlockAchievement = (profile, id) => {
  const prepared = prepareProfile(profile);
  if (prepared.achievements.includes(id)) return prepared;

  prepared.achievements.push(id);
  const achievement = achievements.find((entry) => entry.id === id);
  for (const color of achievement?.rewards?.colors || []) {
    if (!prepared.inventory[0].colors.includes(color)) {
      prepared.inventory[0].colors.push(color);
    }
  }
  return prepared;
};

const unlockStatAchievements = (
  profile,
  {
    wins = 0,
    shiny = 0,
    winStreak = 0,
    pairs = 0,
    friends = 0,
  } = {},
) => {
  let prepared = prepareProfile(profile);
  if (wins >= 1) prepared = unlockAchievement(prepared, 1);
  if (wins >= 5) prepared = unlockAchievement(prepared, 2);
  if (wins >= 10) prepared = unlockAchievement(prepared, 3);
  if (winStreak >= 3) prepared = unlockAchievement(prepared, 4);
  if (winStreak >= 5) prepared = unlockAchievement(prepared, 5);
  if (prepared.level >= 5) prepared = unlockAchievement(prepared, 150);
  if (shiny >= 1) prepared = unlockAchievement(prepared, 200);
  if (pairs >= 100) prepared = unlockAchievement(prepared, 300);
  if (friends >= 2) prepared = unlockAchievement(prepared, 400);
  return prepared;
};

const addXp = (profile, amount) => {
  const prepared = prepareProfile(profile);
  prepared.xp += Math.max(0, Number(amount) || 0);

  while (true) {
    const xpNeeded = Math.max(1, Number(prepared.xpNeeded) || 10);
    const nextLevel = levels[prepared.level + 1];

    if (!nextLevel || prepared.xp < xpNeeded) break;

    prepared.xp -= xpNeeded;
    prepared.level = nextLevel.level;
    prepared.xpNeeded = nextLevel.xpNeeded;
    for (const color of nextLevel.rewards.colors) {
      if (!prepared.inventory[0].colors.includes(color)) {
        prepared.inventory[0].colors.push(color);
      }
    }
  }

  return prepared;
};

const isWeekendInParis = () => {
  const parisDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }),
  );
  return parisDate.getDay() === 0 || parisDate.getDay() === 6;
};

module.exports = {
  addXp,
  prepareProfile,
  unlockAchievement,
  unlockStatAchievements,
  isWeekendInParis,
};
