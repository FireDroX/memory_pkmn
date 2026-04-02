const db = require("../../db");
const levels = require("../utils/Levels");
const { promisify } = require("util");

// Promisify sqlite methods
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbRun = promisify(db.run.bind(db));

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("update-room", async ({ room, cards, player, pair }) => {
      try {
        // Get users
        const users = await dbAll(`SELECT * FROM users`);

        // Get room
        const roomDataRaw = await dbGet(`SELECT * FROM rooms WHERE id = ?`, [
          room,
        ]);

        if (!roomDataRaw) return;

        // Parse JSON fields
        const roomData = {
          ...roomDataRaw,
          players: JSON.parse(roomDataRaw.players || "[]"),
          cards: JSON.parse(roomDataRaw.cards || "[]"),
        };

        const parsedUsers = users.map((u) => ({
          ...u,
          user_profile: JSON.parse(u.user_profile || "{}"),
        }));

        const newPlayer = parsedUsers.find((p) => p.name === player);
        if (!newPlayer) return;

        if (
          roomData.players.filter((p) => p.name === newPlayer.name).length === 0
        )
          return;

        const playerIndex = roomData.players.findIndex(
          (p) => p.name === newPlayer.name,
        );

        if (pair.isPair) {
          roomData.players[playerIndex].score += 1;

          let cardsLeft = cards.flat(1).length || 0;

          cards.forEach((coll) => {
            coll.forEach((card) => {
              if ([2, 3, 4, 5].includes(card.state)) {
                cardsLeft -= 1;
              }
            });
          });

          if (cardsLeft === 0) {
            const winnerName = [...roomData.players].sort(
              (a, b) => b.score - a.score,
            )[0].name;

            const winner = parsedUsers.find((p) => p.name === winnerName);

            if (winner) {
              const XP = 15;
              const { level, xp: xpOld, xpNeeded } = winner.user_profile;
              const updatedUser = { ...winner.user_profile };

              if (xpOld + XP >= xpNeeded && levels.length > level + 1) {
                const newInfos = levels[level + 1];
                updatedUser.level = newInfos.level;
                updatedUser.xp = xpOld + XP - xpNeeded;
                updatedUser.xpNeeded = newInfos.xpNeeded;

                newInfos.rewards.colors.forEach((color) => {
                  if (!updatedUser.inventory[0].colors.includes(color)) {
                    updatedUser.inventory[0].colors.push(color);
                  }
                });
              } else {
                updatedUser.xp = xpOld + XP;
              }

              await dbRun(
                `UPDATE users SET 
                  online_games_won = ?, 
                  user_profile = ? 
                 WHERE id = ?`,
                [
                  winner.online_games_won + 1,
                  JSON.stringify(updatedUser),
                  winner.id,
                ],
              );
            }
          }

          if (pair.shiny) {
            await dbRun(
              `UPDATE users SET 
                shiny_pairs_found = ? 
               WHERE id = ?`,
              [newPlayer.shiny_pairs_found + 1, newPlayer.id],
            );
          }
        } else {
          roomData.playerTurn =
            roomData.players[(playerIndex + 1) % roomData.players.length].name;
        }

        // Update room
        roomData.cards = cards;

        await dbRun(
          `UPDATE rooms SET 
            players = ?, 
            playerTurn = ?, 
            cards = ?
           WHERE id = ?`,
          [
            JSON.stringify(roomData.players),
            roomData.playerTurn,
            JSON.stringify(roomData.cards),
            room,
          ],
        );

        io.emit("refresh-room", roomData);
      } catch (error) {
        console.error("Error updating room:", error);
      }
    });
  });
};
