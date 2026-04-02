const express = require("express");
const router = express.Router();

const db = require("../../db");
const { promisify } = require("util");

// Promisify sqlite
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbRun = promisify(db.run.bind(db));

router.post("/get", async (req, res) => {
  try {
    const usersRaw = await dbAll(`SELECT * FROM users`);
    const roomRaw = await dbGet(`SELECT * FROM rooms WHERE id = ?`, [
      req.body.room,
    ]);

    if (!roomRaw) return res.sendStatus(204);

    // Parse JSON
    const room = {
      ...roomRaw,
      players: JSON.parse(roomRaw.players || "[]"),
      cards: JSON.parse(roomRaw.cards || "[]"),
    };

    const users = usersRaw.map((u) => ({
      ...u,
      user_profile: JSON.parse(u.user_profile || "{}"),
    }));

    const players = room.players.map((player) => {
      const newPlayer = users.find((p) => p.id === player.id);

      return {
        name: newPlayer?.name,
        skin: newPlayer?.user_profile?.inventory?.[0]?.colors?.[0] || null,
      };
    });

    res.json({
      users: players,
      room,
    });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

router.post("/delete", async (req, res) => {
  try {
    const roomRaw = await dbGet(`SELECT * FROM rooms WHERE id = ?`, [
      req.body.room,
    ]);

    if (!roomRaw) return res.sendStatus(204);

    const room = {
      ...roomRaw,
      players: JSON.parse(roomRaw.players || "[]"),
    };

    const isOwner = room.players[0]?.name === req.body.name;

    if (!isOwner) return res.sendStatus(204);

    await dbRun(`DELETE FROM rooms WHERE id = ?`, [req.body.room]);

    return res.json({
      status: `The room : ${req.body.room} has been deleted.`,
    });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

module.exports = router;
