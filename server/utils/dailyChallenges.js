const challengePool = [
  {
    id: "pairs-10",
    metric: "pairsFound",
    title: "Collection express",
    description: "Trouve 10 paires, tous modes confondus.",
    target: 10,
    rewardXp: 8,
  },
  {
    id: "solo-games-2",
    metric: "soloGames",
    title: "Entrainement matinal",
    description: "Termine 2 parties en solo.",
    target: 2,
    rewardXp: 10,
  },
  {
    id: "solo-win-1",
    metric: "soloWins",
    title: "Memoire parfaite",
    description: "Remporte une partie en solo.",
    target: 1,
    rewardXp: 12,
  },
  {
    id: "online-game-1",
    metric: "onlineGames",
    title: "Face a face",
    description: "Termine une partie en ligne.",
    target: 1,
    rewardXp: 15,
  },
  {
    id: "online-win-1",
    metric: "onlineWins",
    title: "Maitre de l'arene",
    description: "Remporte une partie en ligne.",
    target: 1,
    rewardXp: 20,
  },
];

const getParisDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const getDailyChallenges = (dateKey = getParisDateKey()) => {
  const seed = Number(dateKey.replaceAll("-", ""));
  const start = seed % challengePool.length;
  return Array.from({ length: 3 }, (_, index) =>
    challengePool[(start + index) % challengePool.length],
  );
};

const recordDailyProgress = async (
  database,
  userId,
  metrics,
  dateKey = getParisDateKey(),
) => {
  const updates = [];
  for (const challenge of getDailyChallenges(dateKey)) {
    const amount = Math.max(0, Number(metrics[challenge.metric]) || 0);
    if (amount === 0) continue;
    const increment = Math.min(amount, challenge.target);
    const completedAt = increment >= challenge.target ? new Date() : null;
    updates.push(
      database.execute(
        `INSERT INTO daily_challenge_progress
          (user_id, challenge_date, challenge_id, progress, completed_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           completed_at = IF(
             progress + VALUES(progress) >= ?,
             COALESCE(completed_at, CURRENT_TIMESTAMP),
             completed_at
           ),
           progress = LEAST(?, progress + VALUES(progress))`,
        [
          userId,
          dateKey,
          challenge.id,
          increment,
          completedAt,
          challenge.target,
          challenge.target,
        ],
      ),
    );
  }
  await Promise.all(updates);
};

module.exports = {
  challengePool,
  getDailyChallenges,
  getParisDateKey,
  recordDailyProgress,
};
