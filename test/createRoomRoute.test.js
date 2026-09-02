const test = require("node:test");
const assert = require("node:assert/strict");
const { invokeRoute, loadRouterWithPool } = require("./routeTestUtils");

const basePool = () => ({
  execute: async (sql) => {
    if (sql.includes("SELECT id, name FROM users")) {
      return [[
        { id: "USER-A", name: "Ash" },
        { id: "USER-B", name: "Brock" },
      ]];
    }
    return [{ affectedRows: 1 }];
  },
  query: async () => [[]],
});

test("POST /invite genere un id ROOM-<uuid> non predictible", async () => {
  const router = loadRouterWithPool("../server/express/createRoomRoute", basePool());
  const response = await invokeRoute(router, "POST", "/", {
    auth: { id: "USER-A", name: "Ash" },
    body: { players: ["Brock"], pairs: { c: 4, r: 7 } },
  });

  assert.equal(response.statusCode, 201);
  assert.match(
    response.body.roomID,
    /^ROOM-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  assert.doesNotMatch(response.body.roomID, /^ROOM-\d+$/);
});
