const pool = require("../../db");
const parseJson = require("../utils/parseJson");

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("user-connected", async ({ id }) => {
      try {
        const authenticatedUser = socket.data.user;
        const [rooms] = await pool.execute(
          "SELECT * FROM rooms WHERE id = ? LIMIT 1",
          [id],
        );
        const roomRaw = rooms[0];
        if (!roomRaw) return;

        const roomData = {
          ...roomRaw,
          players: parseJson(roomRaw.players, []),
          cards: parseJson(roomRaw.cards, []),
        };
        const userIndex = roomData.players.findIndex(
          (player) => player.id === authenticatedUser.id,
        );
        if (userIndex === -1) return;

        roomData.players[userIndex].ready = true;
        const everyoneIsReady = roomData.players.every((player) => player.ready);

        if (everyoneIsReady && !roomData.playerTurn) {
          roomData.playerTurn =
            roomData.players[
              Math.floor(Math.random() * roomData.players.length)
            ].name;
        }

        await pool.execute(
          "UPDATE rooms SET players = ?, playerTurn = ? WHERE id = ?",
          [JSON.stringify(roomData.players), roomData.playerTurn, id],
        );

        io.to(id).emit("refresh-room", roomData);
      } catch (error) {
        console.error("Room readiness error:", error);
      }
    });

    socket.on("join-room", async (id) => {
      try {
        if (typeof id !== "string" || !id.startsWith("ROOM-")) return;

        const [rooms] = await pool.execute(
          "SELECT players FROM rooms WHERE id = ? LIMIT 1",
          [id],
        );
        const players = parseJson(rooms[0]?.players, []);
        if (players.some((player) => player.id === socket.data.user.id)) {
          socket.join(id);
        }
      } catch (error) {
        console.error(error);
      }
    });
  });
};
