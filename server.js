const { writeFileSync, readFileSync } = require("fs");
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
require("dotenv").config();
const app = express();
const { Server } = require("socket.io");
const io = new Server({
  cors: { origin: "https://memory-pkmn.onrender.com:3000" },
});

const PORT = process.env.PORT || 5000;
app.use(express.json());

app.use(express.static("client/build"));

app.post("/login", async (req, res) => {
  const users = JSON.parse(readFileSync("users.json", "utf8"));
  const { name, password } = req.body;
  // If the values are empty
  if (name === "" && password === "")
    return res.json({ status: "Both inputs are required." });

  // User verification, if does not exist or password is incorrect
  const user = users.find((user) => user.name === name);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.json({ status: "Incorrect Username or Password !" });

  return res.json({ status: "" });
});

app.post("/register", async (req, res) => {
  const users = JSON.parse(readFileSync("users.json", "utf8"));
  const { name, password } = req.body;
  // If the values are empty
  if (name === "" && password === "")
    return res.json({ status: "Both inputs are required." });

  // If the username is already used
  if (users.some((user) => user.name === name))
    return res.json({ status: "That username is already used." });

  const hashedPassword = await bcrypt.hash(password, 10);

  writeFileSync(
    "./users.json",
    JSON.stringify(
      [
        ...users,
        {
          id: "USER-" + Date.now().toString(),
          name: name,
          password: hashedPassword,
        },
      ],
      null,
      2
    )
  );

  return res.json({ status: "Accout created, please Login." });
});

app.post("/invite", (req, res) => {
  const users = JSON.parse(readFileSync("users.json", "utf8"));
  const rooms = JSON.parse(readFileSync("rooms.json", "utf8"));
  const { createdBy, invitedPlayer, pairs } = req.body;
  const player1 = users.filter((user) => user.name === createdBy)[0];
  const player2 = users.filter((user) => user.name === invitedPlayer)[0];

  if (!player1 || !player2)
    return res.json({ status: "The player does not exists !" });
  if (rooms.some((room) => room.player1 === player1.id))
    return res.json({ status: "You already created a room." });
  if (
    (rooms.some((room) => room.player1 === player1.id) &&
      rooms.some((room) => room.player2 === player2.id)) ||
    (rooms.some((room) => room.player1 === player2.id) &&
      rooms.some((room) => room.player2 === player1.id))
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

  writeFileSync(
    "./rooms.json",
    JSON.stringify(
      [
        ...rooms,
        {
          id: roomID,
          player1: {
            name: player1.name,
            id: player1.id,
            score: 0,
          },
          player2: {
            name: player2.name,
            id: player2.id,
            score: 0,
          },
          playerTurn: player1.name,
          cards: setDefaultCards(pairs.c, pairs.r),
        },
      ],
      null,
      2
    )
  );

  return res.json({ status: `The room : ${roomID} has been created.` });
});

app.post("/rooms/get", (req, res) => {
  const users = JSON.parse(readFileSync("users.json", "utf8"));
  const rooms = JSON.parse(readFileSync("rooms.json", "utf8"));
  const room = rooms.filter((room) => room.id === req.body.room)[0];
  if (!room) return res.sendStatus(204);
  const player1 = users.filter((player) => player.id === room.player1.id)[0]
    .name;
  const player2 = users.filter((player) => player.id === room.player2.id)[0]
    .name;
  res.json({
    users: [player1, player2],
    room: room,
  });
});

app.post("/rooms/delete", (req, res) => {
  let rooms = JSON.parse(readFileSync("rooms.json", "utf8"));
  const room = rooms.filter((room) => room.id === req.body.room)[0];
  if (!room) return res.sendStatus(204);
  const player = room.player1.name === req.body.name;
  if (!player) return res.sendStatus(204);

  rooms = rooms.filter((r) => r.id !== req.body.room);
  writeFileSync("./rooms.json", JSON.stringify(rooms, null, 2));

  return res.json({ status: `The room : ${req.body.room} has been deleted.` });
});

app.get("/invites", (_, res) => {
  const users = JSON.parse(readFileSync("users.json", "utf8"));
  const rooms = JSON.parse(readFileSync("rooms.json", "utf8"));
  const returnedRooms = [];
  for (const room of rooms) {
    const player1 = users.filter((player) => player.id === room.player1.id)[0]
      .name;
    const player2 = users.filter((player) => player.id === room.player2.id)[0]
      .name;

    returnedRooms.push({ id: room.id, player1, player2 });
  }
  res.json(returnedRooms);
});

app.get("/*", (_, res) => {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

app.listen(5000, () => {
  console.log(`Listening on port : ${PORT}`);
});

process.on("uncaughtException", function (err) {
  console.log(err);
});

io.listen(4000);

io.on("connection", (socket) => {
  socket.on("update-room", ({ room, cards, player, isPair }) => {
    const users = JSON.parse(readFileSync("users.json", "utf8"));
    const rooms = JSON.parse(readFileSync("rooms.json", "utf8"));
    const newRoom = rooms.filter((r) => r.id === room)[0];
    if (!newRoom) return;
    const newPlayer = users.filter((p) => p.name === player)[0].name;
    if (![newRoom.player1.name, newRoom.player2.name].includes(newPlayer))
      return;

    const roomIndex = rooms.indexOf(newRoom);

    if (isPair) {
      if (newRoom.player1.name === newPlayer)
        rooms[roomIndex].player1.score += 1;
      if (newRoom.player2.name === newPlayer)
        rooms[roomIndex].player2.score += 1;
    } else {
      if (newRoom.player1.name === newRoom.playerTurn) {
        rooms[roomIndex].playerTurn = newRoom.player2.name;
      } else {
        rooms[roomIndex].playerTurn = newRoom.player1.name;
      }
    }

    rooms[roomIndex].cards = cards;

    writeFileSync("./rooms.json", JSON.stringify(rooms, null, 2));

    io.emit("refresh-room", rooms[roomIndex]);
  });
});
