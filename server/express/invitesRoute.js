const express = require("express");
const router = express.Router();

const db = require("../../db");
const { promisify } = require("util");

// Promisify sqlite
const dbAll = promisify(db.all.bind(db));

router.get("/", async (_, res) => {
  try {
    const usersRaw = await dbAll(`SELECT * FROM users`);
    const roomsRaw = await dbAll(`SELECT * FROM rooms`);

    // Parse users
    const users = usersRaw.map((user) => ({
      ...user,
      user_profile: JSON.parse(user.user_profile || "{}"),
    }));

    const returnedRooms = [];

    for (const room of roomsRaw) {
      const parsedPlayers = JSON.parse(room.players || "[]");

      const players = parsedPlayers.map((player) => {
        const newPlayer = users.find((p) => p.id === player.id);

        return {
          name: newPlayer?.name,
          skin: newPlayer?.user_profile?.inventory?.[0]?.colors?.[0] || null,
        };
      });

      returnedRooms.push({
        id: room.id,
        players,
        created_at: room.created_at,
      });
    }

    res.json(returnedRooms);
  } catch (error) {
    console.error(error);
    res.json({ error: "Failed to fetch rooms" });
  }
});

module.exports = router;
