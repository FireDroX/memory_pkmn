module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("user-connected", async ({ name, id }) => {
      try {
        const pool = await require("../../db");

        // Récupérer la room
        const roomResult = await pool
          .request()
          .input("id", id)
          .query(`SELECT * FROM rooms WHERE id = @id`);

        const roomRaw = roomResult.recordset[0];

        if (!roomRaw) return;

        // Parser JSON
        const roomData = {
          ...roomRaw,
          players: JSON.parse(roomRaw.players || "[]"),
          cards: JSON.parse(roomRaw.cards || "[]"),
        };

        const userIndex = roomData.players.findIndex(
          (player) => player.name === name,
        );

        if (userIndex === -1) return;

        // Set ready
        roomData.players[userIndex].ready = true;

        // Si tous prêts → choisir joueur aléatoire
        if (
          roomData.players.filter((p) => p.ready === true).length ===
          roomData.players.length
        ) {
          const randomName =
            roomData.players[
              Math.floor(Math.random() * roomData.players.length)
            ].name;

          roomData.playerTurn = randomName;
        }

        // Update DB
        await pool
          .request()
          .input("players", JSON.stringify(roomData.players))
          .input("playerTurn", roomData.playerTurn)
          .input("id", id).query(`
            UPDATE rooms SET 
              players = @players,
              playerTurn = @playerTurn
            WHERE id = @id
          `);

        io.emit("refresh-room", roomData);
      } catch (error) {
        console.error("Error updating room:", error);
      }
    });
  });
};
