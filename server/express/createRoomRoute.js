const express = require("express");

const router = express.Router();

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.post("/", async (req, res) => {
  const users = await supabase.from("users").select();
  const rooms = await supabase.from("rooms").select();
  const { createdBy, invitedPlayer, players, pairs } = req.body;

  const playersList = players.map((player) => {
    const dbPlayer = users.data.filter((user) => user.name === player)[0];
    if (!dbPlayer)
      return {
        name: undefined,
      };
    else {
      return {
        name: dbPlayer.name,
        id: dbPlayer.id,
        score: 0,
        ready: false,
      };
    }
  });

  if (playersList.filter((player) => player.name === undefined).length > 0)
    return res.json({ status: "One of the player does not exists !" });

  if (rooms.data.some((room) => room.players[0].id === playersList[0].id))
    return res.json({ status: "You already created a room." });

  const roomID = "ROOM-" + Date.now().toString();

  const shuffleArray = (array) => {
    // Fisher-Yates shuffle algorithm to shuffle an array
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const setDefaultCards = (columns, rows) => {
    const nbOfPairs = (columns * rows) / 2;

    // Create a Set to keep track of the numbers that have already been used
    const usedNumbers = new Set();

    // Generate unique pairs of random pokemons between 1 and 1025
    const randomPairs = [];
    while (randomPairs.length < nbOfPairs * 2) {
      let randomNum = Math.floor(Math.random() * 1025) + 1;

      // If the number is already used, generate another one
      if (!usedNumbers.has(randomNum)) {
        const isShiny = Math.floor(Math.random() * 8192) === 0 ? true : false;

        usedNumbers.add(randomNum);
        randomPairs.push(
          { id: randomNum, shiny: isShiny },
          { id: randomNum, shiny: isShiny }
        ); // Add the number twice for pairing
      }
    }

    // Shuffle the pairs randomly
    const shuffledCards = shuffleArray(randomPairs);

    // Return a 2D array (grid) with the shuffled cards
    return Array.from({ length: columns }, (_, columnIndex) =>
      Array.from({ length: rows }, (_, rowIndex) => {
        const flatIndex = columnIndex * rows + rowIndex;

        return {
          id: shuffledCards[flatIndex].id,
          state: 0,
          shiny: shuffledCards[flatIndex].shiny,
        };
      })
    );
  };

  const { error } = await supabase.from("rooms").insert({
    id: roomID,
    players: playersList,
    playerTurn: "null",
    cards: setDefaultCards(pairs.c, pairs.r),
  }); 

  return res.json({
    status: `${error ? error : `The room : ${roomID} has been created.`}`,
    roomID,
  });
});

module.exports = router;
