const express = require("express");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");

const router = express.Router();

const shuffle = (items) => {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [items[index], items[target]] = [items[target], items[index]];
  }
  return items;
};

const createCards = (columns, rows) => {
  const pairCount = (columns * rows) / 2;
  const usedNumbers = new Set();
  const pairs = [];

  while (pairs.length < pairCount * 2) {
    const id = Math.floor(Math.random() * 1025) + 1;
    if (usedNumbers.has(id)) continue;

    usedNumbers.add(id);
    const shiny = Math.floor(Math.random() * 8192) === 0;
    pairs.push({ id, shiny }, { id, shiny });
  }

  const cards = shuffle(pairs);
  return Array.from({ length: columns }, (_, columnIndex) =>
    Array.from({ length: rows }, (_, rowIndex) => ({
      ...cards[columnIndex * rows + rowIndex],
      state: 0,
    })),
  );
};

router.post("/", async (req, res) => {
  try {
    const requestedPlayers = [...new Set(req.body.players || [])];
    const columns = Number(req.body.pairs?.c);
    const rows = Number(req.body.pairs?.r);

    if (
      requestedPlayers.length < 2 ||
      requestedPlayers.length > 4 ||
      columns !== 4 ||
      ![7, 9, 11].includes(rows)
    ) {
      return res.status(400).json({ status: "Configuration de partie invalide." });
    }

    const placeholders = requestedPlayers.map(() => "?").join(", ");
    const [users] = await pool.execute(
      `SELECT id, name FROM users WHERE name IN (${placeholders})`,
      requestedPlayers,
    );

    if (users.length !== requestedPlayers.length) {
      return res
        .status(404)
        .json({ status: "Un des joueurs selectionnes est introuvable." });
    }

    const [rooms] = await pool.query("SELECT players FROM rooms");
    const owner = users.find((user) => user.name === requestedPlayers[0]);
    const alreadyOwnsRoom = rooms.some((room) => {
      const players = parseJson(room.players, []);
      return players[0]?.id === owner?.id;
    });

    if (alreadyOwnsRoom) {
      return res.status(409).json({ status: "Tu as deja cree une partie." });
    }

    const players = requestedPlayers.map((name) => {
      const user = users.find((entry) => entry.name === name);
      return { name: user.name, id: user.id, score: 0, ready: false };
    });
    const roomID = `ROOM-${Date.now()}`;

    await pool.execute(
      "INSERT INTO rooms (id, players, playerTurn, cards) VALUES (?, ?, ?, ?)",
      [
        roomID,
        JSON.stringify(players),
        null,
        JSON.stringify(createCards(columns, rows)),
      ],
    );

    return res.status(201).json({
      status: `Salon ${roomID} cree. Les invitations sont pretes !`,
      roomID,
    });
  } catch (error) {
    console.error("Room creation error:", error);
    return res.status(500).json({ status: "Creation du salon impossible." });
  }
});

module.exports = router;
