const express = require("express");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");

const router = express.Router();

router.get("/", async (_, res) => {
  try {
    const [users] = await pool.query("SELECT id, name, user_profile FROM users");
    const [rooms] = await pool.query(
      "SELECT id, players, created_at FROM rooms ORDER BY created_at DESC",
    );

    const returnedRooms = rooms.map((room) => ({
      id: room.id,
      created_at: room.created_at,
      players: parseJson(room.players, []).map((player) => {
        const user = users.find((entry) => entry.id === player.id);
        const profile = parseJson(user?.user_profile, {});
        return {
          name: user?.name || player.name,
          skin: profile?.inventory?.[0]?.colors?.[0] || "color-default",
        };
      }),
    }));

    return res.json(returnedRooms);
  } catch (error) {
    console.error("Invites error:", error);
    return res.status(500).json({ error: "Impossible de charger les salons." });
  }
});

module.exports = router;
