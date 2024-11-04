const { createClient } = require("@supabase/supabase-js");

const path = require("path");
const bcrypt = require("bcrypt");
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? undefined
        : "http://192.168.1.105:3000",
  },
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(express.json());

app.use(express.static("client/build"));

app.post("/login", async (req, res) => {
  const users = await supabase.from("users").select();
  const { name, password } = req.body;
  // If the values are empty
  if (name === "" && password === "")
    return res.json({ status: "Both inputs are required." });

  // User verification, if does not exist or password is incorrect
  const user = users.data.find((user) => user.name === name);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.json({ status: "Incorrect Username or Password !" });

  return res.json({
    status: "",
    online_games_won: user.online_games_won,
    created_at: user.created_at,
  });
});

app.post("/register", async (req, res) => {
  const users = await supabase.from("users").select();
  const { name, password } = req.body;
  // If the values are empty
  if (name === "" && password === "")
    return res.json({ status: "Both inputs are required." });

  // If the username is already used
  if (users.data.some((user) => user.name === name))
    return res.json({ status: "That username is already used." });

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase.from("users").insert({
    id: "USER-" + Date.now().toString(),
    name: name,
    password: hashedPassword,
    online_games_won: 0,
  });

  return res.json({
    status: `${error ? error : "Accout created, please Login."}`,
  });
});

app.post("/invite", async (req, res) => {
  const users = await supabase.from("users").select();
  const rooms = await supabase.from("rooms").select();
  const { createdBy, invitedPlayer, pairs, isShiny } = req.body;
  const player1 = users.data.filter((user) => user.name === createdBy)[0];
  const player2 = users.data.filter((user) => user.name === invitedPlayer)[0];

  if (!player1 || !player2)
    return res.json({ status: "The player does not exists !" });
  if (rooms.data.some((room) => room.player1 === player1.id))
    return res.json({ status: "You already created a room." });
  if (
    (rooms.data.some((room) => room.player1 === player1.id) &&
      rooms.data.some((room) => room.player2 === player2.id)) ||
    (rooms.data.some((room) => room.player1 === player2.id) &&
      rooms.data.some((room) => room.player2 === player1.id))
  )
    return res.json({ status: "You already have a room with that person." });

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

    // Generate unique pairs of random numbers between 1 and 1025
    const randomPairs = [];
    while (randomPairs.length < nbOfPairs * 2) {
      let randomNum = Math.floor(Math.random() * 1025) + 1;

      // If the number is already used, generate another one
      if (!usedNumbers.has(randomNum)) {
        usedNumbers.add(randomNum);
        randomPairs.push(randomNum, randomNum); // Add the number twice for pairing
      }
    }

    // Shuffle the pairs randomly
    const shuffledCards = shuffleArray(randomPairs);

    // Return a 2D array (grid) with the shuffled cards
    return Array.from({ length: columns }, (_, columnIndex) =>
      Array.from({ length: rows }, (_, rowIndex) => {
        const flatIndex = columnIndex * rows + rowIndex;
        return { id: shuffledCards[flatIndex], state: 0 };
      })
    );
  };

  const { error } = await supabase.from("rooms").insert({
    id: roomID,
    player1: {
      name: player1.name,
      id: player1.id,
      score: 0,
      ready: false,
    },
    player2: {
      name: player2.name,
      id: player2.id,
      score: 0,
      ready: false,
    },
    playerTurn: player1.name,
    cards: setDefaultCards(pairs.c, pairs.r),
    isShiny: isShiny,
  });

  return res.json({
    status: `${error ? error : `The room : ${roomID} has been created.`}`,
  });
});

app.post("/rooms/get", async (req, res) => {
  const users = await supabase.from("users").select();
  const rooms = await supabase.from("rooms").select();
  const room = rooms.data.filter((room) => room.id === req.body.room)[0];
  if (!room) return res.sendStatus(204);
  const player1 = users.data.filter(
    (player) => player.id === room.player1.id
  )[0].name;
  const player2 = users.data.filter(
    (player) => player.id === room.player2.id
  )[0].name;
  res.json({
    users: [player1, player2],
    room: room,
  });
});

app.post("/rooms/delete", async (req, res) => {
  const rooms = await supabase.from("rooms").select();
  const room = rooms.data.filter((room) => room.id === req.body.room)[0];
  if (!room) return res.sendStatus(204);
  const player = room.player1.name === req.body.name;
  if (!player) return res.sendStatus(204);

  await supabase.from("rooms").delete().eq("id", req.body.room);

  return res.json({ status: `The room : ${req.body.room} has been deleted.` });
});

app.get("/invites", async (_, res) => {
  const users = await supabase.from("users").select();
  const rooms = await supabase.from("rooms").select();
  const returnedRooms = [];
  for (const room of rooms.data) {
    const player1 = users.data.filter(
      (player) => player.id === room.player1.id
    )[0].name;
    const player2 = users.data.filter(
      (player) => player.id === room.player2.id
    )[0].name;

    returnedRooms.push({
      id: room.id,
      player1,
      player2,
      created_at: room.created_at,
      isShiny: room.isShiny,
    });
  }
  res.json(returnedRooms);
});

app.get("/*", (_, res) => {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

process.on("uncaughtException", function (err) {
  console.log(err);
});

io.on("connection", (socket) => {
  // Listen for the "user-connected" event
  socket.on("user-connected", async ({ name, id }) => {
    const { data: roomData, error: fetchError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (name === roomData.player1.name) {
      roomData.player1.ready = true;
    } else if (name === roomData.player2.name) {
      roomData.player2.ready = true;
    }

    try {
      // Send the updated data back to Supabase
      const { error: updateError } = await supabase
        .from("rooms")
        .update({
          player1: roomData.player1,
          player2: roomData.player2,
        })
        .eq("id", id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error updating room:", error);
    }

    io.emit("refresh-room", roomData);
  });

  socket.on("update-room", async ({ room, cards, player, isPair }) => {
    const users = await supabase.from("users").select();
    const { data: roomData, error: fetchError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", room)
      .single();

    if (!roomData) return;
    const newPlayer = users.data.filter((p) => p.name === player)[0];
    if (
      ![roomData.player1.name, roomData.player2.name].includes(newPlayer.name)
    )
      return;

    try {
      if (fetchError) throw fetchError;

      // Check current players and update scores if `isPair`
      if (isPair) {
        if (roomData.player1.name === newPlayer.name) {
          roomData.player1.score += 1;
        }
        if (roomData.player2.name === newPlayer.name) {
          roomData.player2.score += 1;
        }

        let cardsLeft = cards.flat(1).length || undefined;

        cards.forEach((coll, collIndex) => {
          coll.forEach((card, index) => {
            if (card.state === 1) {
              flipCards(index + collIndex * coll.length);
            } else if ([2, 3].includes(card.state)) {
              cardsLeft -= 1;
            }
          });
        });

        if (cardsLeft === 0) {
          // Send the updated data back to Supabase
          const { error: updateUserError } = await supabase
            .from("users")
            .update({
              online_games_won: newPlayer.online_games_won + 1,
            })
            .eq("id", newPlayer.id);

          if (updateUserError) throw updateUserError;
        }
      } else {
        // Update playerTurn if not a pair
        roomData.playerTurn =
          roomData.player1.name === roomData.playerTurn
            ? roomData.player2.name
            : roomData.player1.name;
      }

      // Update cards in the room data
      roomData.cards = cards;

      // Send the updated data back to Supabase
      const { error: updateError } = await supabase
        .from("rooms")
        .update({
          player1: roomData.player1,
          player2: roomData.player2,
          playerTurn: roomData.playerTurn,
          cards: roomData.cards,
        })
        .eq("id", room);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error updating room:", error);
    }

    io.emit("refresh-room", roomData);
  });
});

server.listen(5000, () => {
  console.log(`Listening on port : ${PORT}`);
});
