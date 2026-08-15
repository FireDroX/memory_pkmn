const getProjectedScore = (player, pendingPairPlayer) =>
  (Number(player.score) || 0) + (player.name === pendingPairPlayer ? 1 : 0);

export const findOnlineWinner = (players = [], pendingPairPlayer = null) =>
  players.reduce((leadingPlayer, player) => {
    if (!leadingPlayer) return player;

    return getProjectedScore(player, pendingPairPlayer) >
      getProjectedScore(leadingPlayer, pendingPairPlayer)
      ? player
      : leadingPlayer;
  }, undefined);
