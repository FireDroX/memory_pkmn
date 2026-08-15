const test = require("node:test");
const assert = require("node:assert/strict");
const {
  authenticateSocket,
  reloadSocketSession,
} = require("../server/socket/authentication");

const createSocket = (session) => ({
  data: {},
  disconnected: false,
  request: { session },
  disconnect() {
    this.disconnected = true;
  },
});

test("Socket.IO refuse une connexion sans utilisateur en session", () => {
  const socket = createSocket({ id: "SESSION-1" });

  authenticateSocket(socket, (error) => {
    assert.match(error.message, /Authentification requise/);
  });

  assert.equal(socket.data.user, undefined);
});

test("Socket.IO utilise uniquement l'identite de la session", () => {
  const user = { id: "USER-ADMIN", name: "Admin" };
  const socket = createSocket({ id: "SESSION-1", user });
  let nextCalled = false;

  authenticateSocket(socket, (error) => {
    assert.equal(error, undefined);
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(socket.data.user, user);
});

test("Socket.IO recharge la session avant chaque evenement", () => {
  const user = { id: "USER-ADMIN", name: "Admin" };
  const session = {
    user,
    reload(callback) {
      callback();
    },
  };
  const socket = createSocket(session);
  let nextCalled = false;

  reloadSocketSession(socket, [], () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(socket.data.user, user);
  assert.equal(socket.disconnected, false);
});

test("Socket.IO deconnecte une session expiree", () => {
  const session = {
    reload(callback) {
      callback(new Error("expired"));
    },
  };
  const socket = createSocket(session);
  let nextCalled = false;

  reloadSocketSession(socket, [], () => {
    nextCalled = true;
  });

  assert.equal(socket.disconnected, true);
  assert.equal(nextCalled, false);
});
