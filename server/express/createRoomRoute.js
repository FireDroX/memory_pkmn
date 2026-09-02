const express = require("express");
const { randomUUID } = require("node:crypto");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");
const { createCards } = require("../utils/roomCards");
const { createRateLimiter } = require("../utils/rateLimit");
const composeMiddleware = require("../utils/composeMiddleware");

const router = express.Router();

const inviteLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Trop de salons crees, reessaie dans une minute.",
});

router.post("/", composeMiddleware(inviteLimiter, async (req, res) => {
  try {
    const authenticatedName = req.auth.name;
    const invitedPlayers = [...new Set(req.body.players || [])]
      .map((name) => String(name || "").trim())
      .filter(
        (name) =>
          name && name.toLowerCase() !== authenticatedName.toLowerCase(),
      );
    const requestedPlayers = [authenticatedName, ...invitedPlayers];
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
      `SELECT id, name FROM users
       WHERE name IN (${placeholders}) AND is_active = TRUE`,
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
    const roomID = `ROOM-${randomUUID()}`;

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
}));

module.exports = router;
