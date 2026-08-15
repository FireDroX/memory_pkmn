const percentage = (value, total) =>
  total > 0 ? Math.round((Number(value || 0) / Number(total)) * 100) : 0;

const formatPlayerStats = (user = {}) => ({
  onlineGamesPlayed: Number(user.online_games_played) || 0,
  onlineGamesWon: Number(user.online_games_won) || 0,
  onlineGamesLost: Number(user.online_games_lost) || 0,
  onlineWinRate: percentage(user.online_games_won, user.online_games_played),
  currentWinStreak: Number(user.current_win_streak) || 0,
  bestWinStreak: Number(user.best_win_streak) || 0,
  totalPairsFound: Number(user.total_pairs_found) || 0,
  shinyPairsFound: Number(user.shiny_pairs_found) || 0,
  soloGamesPlayed: Number(user.solo_games_played) || 0,
  soloGamesWon: Number(user.solo_games_won) || 0,
  soloWinRate: percentage(user.solo_games_won, user.solo_games_played),
  soloBestRemainingTries: Number(user.solo_best_remaining_tries) || 0,
  createdAt: user.created_at || null,
});

module.exports = { formatPlayerStats, percentage };
