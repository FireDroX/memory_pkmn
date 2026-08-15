const express = require("express");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");

const router = express.Router();

router.post("/get", async (req, res) => {
  try {
    const [rooms] = await pool.execute(
      "SELECT * FROM rooms WHERE id = ? LIMIT 1",
      [req.body.room],
    );
    const roomRaw = rooms[0];

    if (!roomRaw) return res.sendStatus(204);

    const room = {
      ...roomRaw,
      players: parseJson(roomRaw.players, []),
      cards: parseJson(roomRaw.cards, []),
    };
    if (!room.players.some((player) => player.id === req.auth.id)) {
      return res.status(403).json({ status: "Acces au salon refuse." });
    }
    const playerIds = room.players.map((player) => player.id);

    if (playerIds.length === 0) return res.json({ users: [], room });

    const placeholders = playerIds.map(() => "?").join(", ");
    const [users] = await pool.execute(
      `SELECT id, name, user_profile FROM users WHERE id IN (${placeholders})`,
      playerIds,
    );
    const players = room.players.map((player) => {
      const user = users.find((entry) => entry.id === player.id);
      const profile = parseJson(user?.user_profile, {});
      return {
        name: user?.name || player.name,
        skin: profile?.inventory?.[0]?.colors?.[0] || "color-default",
      };
    });

    return res.json({ users: players, room });
  } catch (error) {
    console.error("Room fetch error:", error);
    return res.sendStatus(500);
  }
});

router.post("/delete", async (req, res) => {
  try {
    const [rooms] = await pool.execute(
      "SELECT players FROM rooms WHERE id = ? LIMIT 1",
      [req.body.room],
    );
    const room = rooms[0];

    if (!room) return res.sendStatus(204);

    const players = parseJson(room.players, []);
    if (players[0]?.id !== req.auth.id) {
      return res.status(403).json({ status: "Seul l'hote peut supprimer ce salon." });
    }

    await pool.execute("DELETE FROM rooms WHERE id = ?", [req.body.room]);
    return res.json({ status: `Salon ${req.body.room} supprime.` });
  } catch (error) {
    console.error("Room deletion error:", error);
    return res.sendStatus(500);
  }
});

module.exports = router;
