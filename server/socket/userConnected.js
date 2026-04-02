const db = require("../../db");
const { promisify } = require("util");

// Promisify sqlite
const dbGet = promisify(db.get.bind(db));
const dbRun = promisify(db.run.bind(db));

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("user-connected", async ({ name, id }) => {
      try {
        // Récupérer la room
        const roomRaw = await dbGet(`SELECT * FROM rooms WHERE id = ?`, [id]);

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
        await dbRun(
          `UPDATE rooms SET 
            players = ?, 
            playerTurn = ?
           WHERE id = ?`,
          [JSON.stringify(roomData.players), roomData.playerTurn, id],
        );

        io.emit("refresh-room", roomData);
      } catch (error) {
        console.error("Error updating room:", error);
      }
    });
  });
};
