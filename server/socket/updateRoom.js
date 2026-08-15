const pool = require("../../db");
const parseJson = require("../utils/parseJson");
const {
  prepareProfile,
  addXp,
  unlockAchievement,
  unlockStatAchievements,
  isWeekendInParis,
} = require("../utils/profileProgress");
const { recordDailyProgress } = require("../utils/dailyChallenges");

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("update-room", async ({ room, cards, player, pair = {} }) => {
      try {
        const [rooms] = await pool.execute(
          "SELECT * FROM rooms WHERE id = ? LIMIT 1",
          [room],
        );
        const roomRaw = rooms[0];
        if (!roomRaw) return;

        const roomData = {
          ...roomRaw,
          players: parseJson(roomRaw.players, []),
          cards: parseJson(roomRaw.cards, []),
        };

        if (roomData.playerTurn !== player || !Array.isArray(cards)) return;

        const [users] = await pool.query("SELECT * FROM users");
        const parsedUsers = users.map((user) => ({
          ...user,
          user_profile: prepareProfile(parseJson(user.user_profile, {})),
        }));
        const currentUser = parsedUsers.find((user) => user.name === player);
        const playerIndex = roomData.players.findIndex(
          (entry) => entry.name === player,
        );
        if (!currentUser || playerIndex === -1) return;

        if (pair.isPair) {
          roomData.players[playerIndex].score += 1;
          let currentProfile = currentUser.user_profile;
          const shinyIncrement = pair.shiny ? 1 : 0;

          if (pair.shiny) {
            currentProfile = unlockAchievement(currentProfile, 200);
          }
          if (Number(pair.pokemon) === 644) {
            currentProfile = unlockAchievement(currentProfile, 100);
          }

          if (pair.shiny || Number(pair.pokemon) === 644) {
            await pool.execute(
              `UPDATE users
               SET shiny_pairs_found = shiny_pairs_found + ?, user_profile = ?
               WHERE id = ?`,
              [
                shinyIncrement,
                JSON.stringify(currentProfile),
                currentUser.id,
              ],
            );
          }

          const cardsLeft = cards
            .flat()
            .filter((card) => ![2, 3, 4, 5].includes(card.state)).length;

          if (cardsLeft === 0 && !roomData.completed_at) {
            const winnerName = [...roomData.players].sort(
              (a, b) => b.score - a.score,
            )[0].name;
            const winner = parsedUsers.find((user) => user.name === winnerName);

            for (const roomPlayer of roomData.players) {
              const isWinner = roomPlayer.name === winnerName;
              await pool.execute(
                `UPDATE users
                 SET online_games_played = online_games_played + 1,
                     online_games_lost = online_games_lost + ?,
                     current_win_streak = CASE
                       WHEN ? = 1 THEN current_win_streak + 1 ELSE 0
                     END,
                     best_win_streak = CASE
                       WHEN ? = 1 THEN GREATEST(best_win_streak, current_win_streak + 1)
                       ELSE best_win_streak
                     END,
                     total_pairs_found = total_pairs_found + ?
                 WHERE id = ?`,
                [
                  isWinner ? 0 : 1,
                  isWinner ? 1 : 0,
                  isWinner ? 1 : 0,
                  Math.max(0, Number(roomPlayer.score) || 0),
                  roomPlayer.id,
                ],
              );
              await recordDailyProgress(pool, roomPlayer.id, {
                pairsFound: Math.max(0, Number(roomPlayer.score) || 0),
                onlineGames: 1,
                onlineWins: isWinner ? 1 : 0,
              });
            }

            if (winner) {
              const nextWins = winner.online_games_won + 1;
              const winnerShiny =
                winner.shiny_pairs_found +
                (winner.id === currentUser.id ? shinyIncrement : 0);
              let profile =
                winner.id === currentUser.id
                  ? currentProfile
                  : winner.user_profile;

              profile = addXp(profile, 15);
              profile = unlockStatAchievements(profile, {
                wins: nextWins,
                shiny: winnerShiny,
              });
              if (isWeekendInParis()) {
                profile = unlockAchievement(profile, 10);
              }
              if (profile.level >= 5) {
                profile = unlockAchievement(profile, 150);
              }

              await pool.execute(
                `UPDATE users
                 SET online_games_won = ?, user_profile = ?
                 WHERE id = ?`,
                [nextWins, JSON.stringify(profile), winner.id],
              );
            }
            roomData.completed_at = new Date();
          }
        } else {
          roomData.playerTurn =
            roomData.players[(playerIndex + 1) % roomData.players.length].name;
        }

        roomData.cards = cards;
        await pool.execute(
          `UPDATE rooms
           SET players = ?, playerTurn = ?, cards = ?, completed_at = ?
           WHERE id = ?`,
          [
            JSON.stringify(roomData.players),
            roomData.playerTurn,
            JSON.stringify(roomData.cards),
            roomData.completed_at,
            room,
          ],
        );

        io.to(room).emit("refresh-room", roomData);
      } catch (error) {
        console.error("Room update error:", error);
      }
    });
  });
};
