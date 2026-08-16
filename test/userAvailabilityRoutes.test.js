const test = require("node:test");
const assert = require("node:assert/strict");
const { invokeRoute, loadRouterWithPool } = require("./routeTestUtils");

test("GET /profile/users ne renvoie que les joueurs actifs", async () => {
  const pool = {
    query: async (sql) => [
      sql.includes("is_active = TRUE")
        ? [{ name: "Ash" }, { name: "Misty" }]
        : [{ name: "Ash" }, { name: "Brock" }, { name: "Misty" }],
    ],
  };
  const router = loadRouterWithPool("../server/express/getUsers", pool);
  const response = await invokeRoute(router, "GET", "/");

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { users: ["Ash", "Misty"] });
});

test("POST /invite refuse un joueur desactive meme si son nom est envoye directement", async () => {
  let roomCreated = false;
  const pool = {
    execute: async (sql) => {
      if (sql.includes("SELECT id, name FROM users")) {
        return [[
          { id: "USER-A", name: "Ash" },
          ...(sql.includes("is_active = TRUE")
            ? []
            : [{ id: "USER-B", name: "Brock" }]),
        ]];
      }
      roomCreated = true;
      return [{ affectedRows: 1 }];
    },
    query: async () => [[]],
  };
  const router = loadRouterWithPool("../server/express/createRoomRoute", pool);
  const response = await invokeRoute(router, "POST", "/", {
    auth: { id: "USER-A", name: "Ash" },
    body: { players: ["Brock"], pairs: { c: 4, r: 7 } },
  });

  assert.equal(response.statusCode, 404);
  assert.equal(roomCreated, false);
});
