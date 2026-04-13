const express = require("express");
const router = express.Router();

router.get("/", async (_, res) => {
  try {
    const pool = await require("../../db");

    const usersResult = await pool.query(`SELECT * FROM users`);
    const roomsResult = await pool.query(`SELECT * FROM rooms`);

    const usersRaw = usersResult.recordset;
    const roomsRaw = roomsResult.recordset;

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
