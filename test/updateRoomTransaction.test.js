const test = require("node:test");
const assert = require("node:assert/strict");
const registerUpdateRoom = require("../server/socket/updateRoom");

const registerHandler = (connection) => {
  let socketHandler;
  let emitted;
  const socket = {
    data: { user: { id: "USER-1", name: "Admin" } },
    on(event, handler) {
      if (event === "update-room") socketHandler = handler;
    },
  };
  const io = {
    on(event, handler) {
      if (event === "connection") handler(socket);
    },
    to(room) {
      return {
        emit(event, payload) {
          emitted = { room, event, payload };
        },
      };
    },
  };
  const databasePool = { getConnection: async () => connection };
  registerUpdateRoom(io, databasePool);
  return { emitUpdate: socketHandler, getEmission: () => emitted };
};

test("une mise a jour invalide est verrouillee puis annulee", async () => {
  const calls = [];
  const connection = {
    beginTransaction: async () => calls.push("begin"),
    execute: async (sql) => {
      calls.push(sql);
      return [[]];
    },
    rollback: async () => calls.push("rollback"),
    commit: async () => calls.push("commit"),
    release: () => calls.push("release"),
  };
  const handler = registerHandler(connection);

  await handler.emitUpdate({ room: "ROOM-1", cards: [] });

  assert.equal(calls[0], "begin");
  assert.match(calls[1], /FOR UPDATE/);
  assert.deepEqual(calls.slice(-2), ["rollback", "release"]);
  assert.equal(calls.includes("commit"), false);
  assert.equal(handler.getEmission(), undefined);
});

test("une mise a jour valide est commitee avant sa diffusion", async () => {
  const previousCards = [[
    { id: 25, shiny: false, state: 0 },
    { id: 7, shiny: false, state: 0 },
  ]];
  const nextCards = [[
    { id: 25, shiny: false, state: 1 },
    { id: 7, shiny: false, state: 1 },
  ]];
  const calls = [];
  const connection = {
    beginTransaction: async () => calls.push("begin"),
    execute: async (sql) => {
      calls.push(sql);
      if (sql.startsWith("SELECT * FROM rooms")) {
        return [[{
          id: "ROOM-1",
          playerTurn: "Admin",
          players: JSON.stringify([
            { id: "USER-1", name: "Admin", score: 0 },
            { id: "USER-2", name: "Other", score: 0 },
          ]),
          cards: JSON.stringify(previousCards),
          completed_at: null,
        }]];
      }
      return [[]];
    },
    query: async () => [[{
      id: "USER-1",
      name: "Admin",
      user_profile: "{}",
    }]],
    rollback: async () => calls.push("rollback"),
    commit: async () => calls.push("commit"),
    release: () => calls.push("release"),
  };
  const handler = registerHandler(connection);

  await handler.emitUpdate({ room: "ROOM-1", cards: nextCards });

  assert.equal(calls.includes("rollback"), false);
  assert.deepEqual(calls.slice(-2), ["commit", "release"]);
  assert.equal(handler.getEmission().room, "ROOM-1");
  assert.equal(handler.getEmission().event, "refresh-room");
  assert.equal(handler.getEmission().payload.playerTurn, "Other");
});
