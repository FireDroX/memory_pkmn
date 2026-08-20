const test = require("node:test");
const assert = require("node:assert/strict");
const { invokeRoute, loadRouterWithPool } = require("./routeTestUtils");

const roomPlayers = [
  { id: "USER-1", name: "ShinyDemo", score: 0, ready: true },
  { id: "USER-2", name: "RivalBot", score: 0, ready: true },
];
const roomMessages = [
  {
    id: "MESSAGE-1",
    author: "ShinyDemo",
    text: "Bonne chance !",
    createdAt: "2026-08-20T12:00:00.000Z",
  },
];

const createPool = ({ onHistoryRead } = {}) => ({
  execute: async (sql) => {
    if (sql.startsWith("SELECT * FROM rooms")) {
      return [[{
        id: "ROOM-1",
        players: JSON.stringify(roomPlayers),
        cards: "[]",
      }]];
    }
    if (sql.includes("FROM room_messages")) {
      onHistoryRead?.();
      return [[...roomMessages]];
    }
    if (sql.includes("FROM users WHERE id IN")) {
      return [[
        { id: "USER-1", name: "ShinyDemo", user_profile: "{}" },
        { id: "USER-2", name: "RivalBot", user_profile: "{}" },
      ]];
    }
    throw new Error(`Requete inattendue : ${sql}`);
  },
});

test("POST /rooms/get fournit l'historique du chat a un joueur de la room", async () => {
  const router = loadRouterWithPool(
    "../server/express/roomsRoute",
    createPool(),
  );

  const response = await invokeRoute(router, "POST", "/get", {
    auth: { id: "USER-1", name: "ShinyDemo" },
    body: { room: "ROOM-1" },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.room.messages, roomMessages);
});

test("POST /rooms/get refuse l'historique du chat a un spectateur", async () => {
  let historyReads = 0;
  const router = loadRouterWithPool(
    "../server/express/roomsRoute",
    createPool({ onHistoryRead: () => { historyReads += 1; } }),
  );

  const response = await invokeRoute(router, "POST", "/get", {
    auth: { id: "USER-3", name: "Spectator" },
    body: { room: "ROOM-1" },
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { status: "Acces au salon refuse." });
  assert.equal(historyReads, 0);
});

test("supprimer la room rend aussi son historique de chat inaccessible", async () => {
  let roomExists = true;
  const pool = {
    execute: async (sql) => {
      if (sql.startsWith("SELECT players FROM rooms")) {
        return [roomExists ? [{ players: JSON.stringify(roomPlayers) }] : []];
      }
      if (sql.startsWith("DELETE FROM rooms")) {
        roomExists = false;
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith("SELECT * FROM rooms")) {
        return [roomExists
          ? [{
              id: "ROOM-1",
              players: JSON.stringify(roomPlayers),
              cards: "[]",
            }]
          : []];
      }
      if (sql.includes("FROM users WHERE id IN")) return [[]];
      throw new Error(`Requete inattendue : ${sql}`);
    },
  };
  const router = loadRouterWithPool("../server/express/roomsRoute", pool);

  const deletion = await invokeRoute(router, "POST", "/delete", {
    app: { get: () => undefined },
    auth: { id: "USER-1", name: "ShinyDemo" },
    body: { room: "ROOM-1" },
  });
  const history = await invokeRoute(router, "POST", "/get", {
    auth: { id: "USER-1", name: "ShinyDemo" },
    body: { room: "ROOM-1" },
  });

  assert.equal(deletion.statusCode, 200);
  assert.equal(history.statusCode, 204);
  assert.equal(history.body, undefined);
});
