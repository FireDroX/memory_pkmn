const levels = require("../utils/Levels");

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("update-room", async ({ room, cards, player, pair }) => {
      try {
        const pool = await require("../../db");

        // Get users
        const usersResult = await pool.query(`SELECT * FROM users`);
        const users = usersResult.recordset;

        // Get room
        const roomResult = await pool
          .request()
          .input("id", room)
          .query(`SELECT * FROM rooms WHERE id = @id`);

        const roomDataRaw = roomResult.recordset[0];
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

              await pool
                .request()
                .input("online_games_won", winner.online_games_won + 1)
                .input("user_profile", JSON.stringify(updatedUser))
                .input("id", winner.id).query(`
                  UPDATE users SET 
                    online_games_won = @online_games_won,
                    user_profile = @user_profile
                  WHERE id = @id
                `);
            }
          }

          if (pair.shiny) {
            await pool
              .request()
              .input("shiny_pairs_found", newPlayer.shiny_pairs_found + 1)
              .input("id", newPlayer.id).query(`
                UPDATE users SET 
                  shiny_pairs_found = @shiny_pairs_found
                WHERE id = @id
              `);
          }
        } else {
          roomData.playerTurn =
            roomData.players[(playerIndex + 1) % roomData.players.length].name;
        }

        // Update room
        roomData.cards = cards;

        await pool
          .request()
          .input("players", JSON.stringify(roomData.players))
          .input("playerTurn", roomData.playerTurn)
          .input("cards", JSON.stringify(roomData.cards))
          .input("id", room).query(`
            UPDATE rooms SET 
              players = @players,
              playerTurn = @playerTurn,
              cards = @cards
            WHERE id = @id
          `);

        io.emit("refresh-room", roomData);
      } catch (error) {
        console.error("Error updating room:", error);
      }
    });
  });
};
