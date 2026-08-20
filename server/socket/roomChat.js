const { randomUUID } = require("node:crypto");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");

const MAX_MESSAGE_LENGTH = 280;

const processRoomMessage = async (
  database,
  authenticatedUser,
  { room, text } = {},
) => {
  const normalizedText = typeof text === "string" ? text.trim() : "";
  if (
    typeof room !== "string" ||
    !room.startsWith("ROOM-") ||
    !normalizedText ||
    normalizedText.length > MAX_MESSAGE_LENGTH
  ) {
    return null;
  }

  const [rooms] = await database.execute(
    "SELECT players FROM rooms WHERE id = ? LIMIT 1",
    [room],
  );
  const roomData = rooms[0];
  if (!roomData) return null;

  const players = parseJson(roomData.players, []);
  const player = players.find((entry) => entry.id === authenticatedUser.id);
  if (!player) return null;

  const messageId = `MESSAGE-${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const message = {
    id: messageId,
    author: player.name,
    text: normalizedText,
    createdAt,
  };

  await database.execute(
    `INSERT INTO room_messages
      (id, room_id, author_id, author_name, message)
     VALUES (?, ?, ?, ?, ?)`,
    [
      messageId,
      room,
      authenticatedUser.id,
      player.name,
      normalizedText,
    ],
  );

  return { room, message };
};

const registerRoomChat = (io, databasePool = pool) => {
  io.on("connection", (socket) => {
    socket.on("send-room-message", async (payload) => {
      try {
        const result = await processRoomMessage(
          databasePool,
          socket.data.user,
          payload,
        );
        if (!result) return;
        io.to(result.room).emit("room-message", result.message);
      } catch (error) {
        console.error("Room chat error:", error);
      }
    });
  });
};

module.exports = registerRoomChat;
module.exports.processRoomMessage = processRoomMessage;
