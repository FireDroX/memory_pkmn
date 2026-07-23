export const achievements = [
  {
    id: 0,
    name: "Bienvenue, Dresseur",
    description: "Creer ton compte PokeFlip.",
    icon: "👋",
  },
  {
    id: 1,
    name: "Premiere victoire",
    description: "Gagner une partie en ligne.",
    icon: "🎯",
  },
  {
    id: 2,
    name: "Sur la lancee",
    description: "Atteindre 5 victoires en ligne.",
    icon: "💪",
  },
  {
    id: 3,
    name: "Inarretable",
    description: "Atteindre 10 victoires en ligne.",
    icon: "🔥",
  },
  {
    id: 10,
    name: "Double XP",
    description: "Terminer une partie pendant le week-end.",
    icon: "💰",
  },
  {
    id: 100,
    name: "Zekrom",
    description: "Trouver une paire de Zekrom.",
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/644.png",
  },
  {
    id: 150,
    name: "Niveau maximum",
    description: "Atteindre le niveau 5.",
    icon: "💯",
  },
  {
    id: 200,
    name: "Une chance sur 8192",
    description: "Trouver une paire shiny.",
    icon: "🌟",
  },
];

export const getUnlockedAchievementIds = (profile, stats) => {
  const unlocked = new Set(profile?.achievements || [0]);
  if ((stats?.onlineGamesWon || 0) >= 1) unlocked.add(1);
  if ((stats?.onlineGamesWon || 0) >= 5) unlocked.add(2);
  if ((stats?.onlineGamesWon || 0) >= 10) unlocked.add(3);
  if ((profile?.level || 0) >= 5) unlocked.add(150);
  if ((stats?.shinyPairsFound || 0) >= 1) unlocked.add(200);
  return unlocked;
};
