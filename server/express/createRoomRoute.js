const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const pool = await require("../../db");

    const usersResult = await pool.query(`SELECT * FROM users`);
    const roomsResult = await pool.query(`SELECT * FROM rooms`);

    const users = usersResult.recordset;
    const rooms = roomsResult.recordset;

    const { createdBy, invitedPlayer, players, pairs } = req.body;

    const parsedRooms = rooms.map((room) => ({
      ...room,
      players: JSON.parse(room.players || "[]"),
    }));

    const playersList = players.map((player) => {
      const dbPlayer = users.find((user) => user.name === player);

      if (!dbPlayer) {
        return { name: undefined };
      }

      return {
        name: dbPlayer.name,
        id: dbPlayer.id,
        score: 0,
        ready: false,
      };
    });

    if (playersList.some((p) => p.name === undefined)) {
      return res.json({ status: "One of the player does not exists !" });
    }

    if (
      parsedRooms.some(
        (room) => room.players[0] && room.players[0].id === playersList[0].id,
      )
    ) {
      return res.json({ status: "You already created a room." });
    }

    const roomID = "ROOM-" + Date.now().toString();

    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const setDefaultCards = (columns, rows) => {
      const nbOfPairs = (columns * rows) / 2;
      const usedNumbers = new Set();
      const randomPairs = [];

      while (randomPairs.length < nbOfPairs * 2) {
        let randomNum = Math.floor(Math.random() * 1025) + 1;

        if (!usedNumbers.has(randomNum)) {
          const isShiny = Math.floor(Math.random() * 8192) === 0;

          usedNumbers.add(randomNum);
          randomPairs.push(
            { id: randomNum, shiny: isShiny },
            { id: randomNum, shiny: isShiny },
          );
        }
      }

      const shuffledCards = shuffleArray(randomPairs);

      return Array.from({ length: columns }, (_, columnIndex) =>
        Array.from({ length: rows }, (_, rowIndex) => {
          const flatIndex = columnIndex * rows + rowIndex;

          return {
            id: shuffledCards[flatIndex].id,
            state: 0,
            shiny: shuffledCards[flatIndex].shiny,
          };
        }),
      );
    };

    // Insert room (MSSQL)
    const request = `
      INSERT INTO rooms (id, players, playerTurn, cards)
      VALUES (@id, @players, @playerTurn, @cards)
    `;

    await pool
      .request()
      .input("id", roomID)
      .input("players", JSON.stringify(playersList))
      .input("playerTurn", "null")
      .input("cards", JSON.stringify(setDefaultCards(pairs.c, pairs.r)))
      .query(request);

    return res.json({
      status: `The room : ${roomID} has been created.`,
      roomID,
    });
  } catch (error) {
    console.error(error);
    return res.json({ status: "Error creating room" });
  }
});

module.exports = router;
