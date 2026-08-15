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
const validateCardUpdate = require("./validateCardUpdate");

const processRoomUpdate = async (
  database,
  authenticatedUser,
  { room, cards },
) => {
  const [rooms] = await database.execute(
    "SELECT * FROM rooms WHERE id = ? LIMIT 1 FOR UPDATE",
    [room],
  );
  const roomRaw = rooms[0];
  if (!roomRaw) return null;

  const roomData = {
    ...roomRaw,
    players: parseJson(roomRaw.players, []),
    cards: parseJson(roomRaw.cards, []),
  };

  if (
    roomData.playerTurn !== authenticatedUser.name ||
    !Array.isArray(cards)
  ) return null;

  const [users] = await database.query("SELECT * FROM users");
  const parsedUsers = users.map((user) => ({
    ...user,
    user_profile: prepareProfile(parseJson(user.user_profile, {})),
  }));
  const currentUser = parsedUsers.find(
    (user) => user.id === authenticatedUser.id,
  );
  const playerIndex = roomData.players.findIndex(
    (entry) => entry.id === authenticatedUser.id,
  );
  if (!currentUser || playerIndex === -1) return null;

  const pair = validateCardUpdate(
    roomData.cards,
    cards,
    playerIndex + 2,
  );
  if (!pair) return null;

  if (pair.isPair) {
    roomData.players[playerIndex].score += 1;
    let currentProfile = currentUser.user_profile;
    const shinyIncrement = pair.shiny ? 1 : 0;

    if (pair.shiny) {
      currentProfile = unlockAchievement(currentProfile, 200);
    }
    if (pair.pokemon === 644) {
      currentProfile = unlockAchievement(currentProfile, 100);
    }

    if (pair.shiny || pair.pokemon === 644) {
      await database.execute(
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
        await database.execute(
          `UPDATE users
           SET online_games_played = online_games_played + 1,
               online_games_lost = online_games_lost + ?,
               best_win_streak = CASE
                 WHEN ? = 1 THEN GREATEST(best_win_streak, current_win_streak + 1)
                 ELSE best_win_streak
               END,
               current_win_streak = CASE
                 WHEN ? = 1 THEN current_win_streak + 1 ELSE 0
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
        await recordDailyProgress(database, roomPlayer.id, {
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

        await database.execute(
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
  await database.execute(
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

  return roomData;
};

const registerUpdateRoom = (io, databasePool = pool) => {
  io.on("connection", (socket) => {
    socket.on("update-room", async (payload) => {
      let connection;
      try {
        connection = await databasePool.getConnection();
        await connection.beginTransaction();
        const roomData = await processRoomUpdate(
          connection,
          socket.data.user,
          payload,
        );

        if (!roomData) {
          await connection.rollback();
          return;
        }

        await connection.commit();
        io.to(payload.room).emit("refresh-room", roomData);
      } catch (error) {
        if (connection) {
          try {
            await connection.rollback();
          } catch (rollbackError) {
            console.error("Room rollback error:", rollbackError);
          }
        }
        console.error("Room update error:", error);
      } finally {
        connection?.release();
      }
    });
  });
};

module.exports = registerUpdateRoom;
module.exports.processRoomUpdate = processRoomUpdate;
