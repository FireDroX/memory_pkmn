const express = require("express");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");
const { createCards } = require("../utils/roomCards");

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
    const [messages] = await pool.execute(
      `SELECT id, author_name AS author, message AS text,
              created_at AS createdAt
       FROM room_messages
       WHERE room_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 100`,
      [req.body.room],
    );
    room.messages = messages.reverse();
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
    req.app.get("io")?.to(req.body.room).emit("room-deleted");
    return res.json({ status: `Salon ${req.body.room} supprime.` });
  } catch (error) {
    console.error("Room deletion error:", error);
    return res.sendStatus(500);
  }
});

router.post("/revenge", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [rooms] = await connection.execute(
      "SELECT players, cards, completed_at FROM rooms WHERE id = ? LIMIT 1 FOR UPDATE",
      [req.body.room],
    );
    const room = rooms[0];
    if (!room) {
      await connection.rollback();
      return res.sendStatus(204);
    }

    const players = parseJson(room.players, []);
    if (!room.completed_at) {
      await connection.rollback();
      return res.status(409).json({ status: "La partie est encore en cours." });
    }
    if (!players.some((player) => player.id === req.auth.id)) {
      await connection.rollback();
      return res.status(403).json({ status: "Acces au salon refuse." });
    }

    const cards = parseJson(room.cards, []);
    const columns = cards.length;
    const rows = cards[0]?.length;
    if (!columns || !rows) {
      await connection.rollback();
      return res.status(400).json({ status: "Configuration du salon invalide." });
    }

    const resetPlayers = players.map((player) => ({
      ...player,
      score: 0,
      ready: false,
    }));
    const resetCards = createCards(columns, rows);
    await connection.execute(
      `UPDATE rooms
       SET players = ?, playerTurn = NULL, cards = ?, completed_at = NULL
       WHERE id = ?`,
      [JSON.stringify(resetPlayers), JSON.stringify(resetCards), req.body.room],
    );
    await connection.commit();

    const roomData = {
      players: resetPlayers,
      playerTurn: null,
      cards: resetCards,
      completed_at: null,
    };
    req.app.get("io")?.to(req.body.room).emit("refresh-room", roomData);
    return res.json({ status: "Nouvelle revanche lancee !", room: roomData });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Room revenge error:", error);
    return res.sendStatus(500);
  } finally {
    connection?.release();
  }
});

module.exports = router;
