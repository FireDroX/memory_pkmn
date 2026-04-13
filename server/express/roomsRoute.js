const express = require("express");
const router = express.Router();

router.post("/get", async (req, res) => {
  try {
    const pool = await require("../../db");

    const usersResult = await pool.query(`SELECT * FROM users`);

    const roomRequest = `
      SELECT * FROM rooms WHERE id = @id
    `;

    const roomResult = await pool
      .request()
      .input("id", req.body.room)
      .query(roomRequest);

    const roomRaw = roomResult.recordset[0];

    if (!roomRaw) return res.sendStatus(204);

    // Parse JSON
    const room = {
      ...roomRaw,
      players: JSON.parse(roomRaw.players || "[]"),
      cards: JSON.parse(roomRaw.cards || "[]"),
    };

    const users = usersResult.recordset.map((u) => ({
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
    const pool = await require("../../db");

    const roomRequest = `
      SELECT * FROM rooms WHERE id = @id
    `;

    const roomResult = await pool
      .request()
      .input("id", req.body.room)
      .query(roomRequest);

    const roomRaw = roomResult.recordset[0];

    if (!roomRaw) return res.sendStatus(204);

    const room = {
      ...roomRaw,
      players: JSON.parse(roomRaw.players || "[]"),
    };

    const isOwner = room.players[0]?.name === req.body.name;

    if (!isOwner) return res.sendStatus(204);

    const deleteRequest = `
      DELETE FROM rooms WHERE id = @id
    `;

    await pool.request().input("id", req.body.room).query(deleteRequest);

    return res.json({
      status: `The room : ${req.body.room} has been deleted.`,
    });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

module.exports = router;
