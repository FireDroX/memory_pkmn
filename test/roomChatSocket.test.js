const test = require("node:test");
const assert = require("node:assert/strict");
const registerRoomChat = require("../server/socket/roomChat");

const createChatHarness = ({ authenticatedUser, players }) => {
  let sendMessage;
  let emission;
  const storedMessages = [];
  const calls = [];
  const database = {
    execute: async (sql, parameters) => {
      if (sql.startsWith("SELECT players FROM rooms")) {
        calls.push("select");
        return [[{ players: JSON.stringify(players) }]];
      }
      if (sql.startsWith("INSERT INTO room_messages")) {
        assert.doesNotMatch(sql, /created_at/);
        calls.push("insert");
        storedMessages.push({
          id: parameters[0],
          room: parameters[1],
          authorId: parameters[2],
          author: parameters[3],
          text: parameters[4],
        });
        return [[]];
      }
      throw new Error(`Requete inattendue : ${sql}`);
    },
  };
  const socket = {
    data: { user: authenticatedUser },
    on(event, handler) {
      if (event === "send-room-message") sendMessage = handler;
    },
  };
  const io = {
    on(event, handler) {
      if (event === "connection") handler(socket);
    },
    to(room) {
      return {
        emit(event, payload) {
          calls.push("emit");
          emission = { room, event, payload };
        },
      };
    },
  };

  registerRoomChat(io, database);

  return {
    calls,
    getEmission: () => emission,
    getStoredMessages: () => structuredClone(storedMessages),
    sendMessage: (payload) => sendMessage(payload),
  };
};

test("un joueur envoie un message persiste aux participants de sa room", async () => {
  const authenticatedUser = { id: "USER-1", name: "ShinyDemo" };
  const harness = createChatHarness({
    authenticatedUser,
    players: [
      { id: "USER-1", name: "ShinyDemo" },
      { id: "USER-2", name: "RivalBot" },
    ],
  });

  await harness.sendMessage({
    room: "ROOM-DEMO-SHINY",
    text: "  Bien joue RivalBot !  ",
  });

  assert.deepEqual(harness.calls, [
    "select",
    "insert",
    "emit",
  ]);
  assert.equal(harness.getStoredMessages().length, 1);
  const emission = harness.getEmission();
  assert.equal(emission.room, "ROOM-DEMO-SHINY");
  assert.equal(emission.event, "room-message");
  assert.equal(emission.payload.id, harness.getStoredMessages()[0].id);
  assert.equal(emission.payload.author, "ShinyDemo");
  assert.equal(emission.payload.text, "Bien joue RivalBot !");
  assert.match(emission.payload.id, /^MESSAGE-/);
  assert.match(emission.payload.createdAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("un utilisateur exterieur ne peut pas ecrire dans le chat de la room", async () => {
  const harness = createChatHarness({
    authenticatedUser: { id: "USER-3", name: "Spectator" },
    players: [
      { id: "USER-1", name: "ShinyDemo" },
      { id: "USER-2", name: "RivalBot" },
    ],
  });

  await harness.sendMessage({
    room: "ROOM-DEMO-SHINY",
    text: "Je regarde votre partie.",
  });

  assert.deepEqual(harness.calls, ["select"]);
  assert.deepEqual(harness.getStoredMessages(), []);
  assert.equal(harness.getEmission(), undefined);
});

test("un message de plus de 280 caracteres est refuse", async () => {
  const harness = createChatHarness({
    authenticatedUser: { id: "USER-1", name: "ShinyDemo" },
    players: [{ id: "USER-1", name: "ShinyDemo" }],
  });

  await harness.sendMessage({
    room: "ROOM-DEMO-SHINY",
    text: "a".repeat(281),
  });

  assert.deepEqual(harness.calls, []);
  assert.deepEqual(harness.getStoredMessages(), []);
  assert.equal(harness.getEmission(), undefined);
});
