const test = require("node:test");
const assert = require("node:assert/strict");
const { invokeRoute, loadRouterWithPool } = require("./routeTestUtils");

test("GET /friends classe les amis et demandes du joueur", async () => {
  const pool = {
    execute: async (sql) => {
      if (sql.includes("FROM users WHERE name")) {
        return [[{ id: "USER-A", name: "Ash" }]];
      }
      return [[
        { status: "accepted", requested_by: "USER-A", name: "Misty" },
        { status: "pending", requested_by: "USER-B", name: "Brock" },
        { status: "pending", requested_by: "USER-A", name: "Gary" },
      ]];
    },
  };
  const router = loadRouterWithPool("../server/express/friendsRoute", pool);
  const response = await invokeRoute(router, "GET", "/", {
    query: { name: "Ash" },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    friends: ["Misty"],
    incoming: ["Brock"],
    outgoing: ["Gary"],
  });
});

test("POST /friends/request cree une demande unique", async () => {
  const writes = [];
  const pool = {
    execute: async (sql, parameters) => {
      if (sql.includes("FROM users WHERE name")) {
        const name = parameters[0];
        return [[{ id: name === "Ash" ? "USER-A" : "USER-M", name }]];
      }
      if (sql.includes("SELECT status")) return [[]];
      writes.push({ sql, parameters });
      return [{ affectedRows: 1 }];
    },
  };
  const router = loadRouterWithPool("../server/express/friendsRoute", pool);
  const response = await invokeRoute(router, "POST", "/request", {
    body: { name: "Ash", friendName: "Misty" },
  });

  assert.equal(response.statusCode, 201);
  assert.match(response.body.status, /Misty/);
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].parameters, ["USER-A", "USER-M", "USER-A"]);
});

test("POST /friends/accept n'accepte que la demande recue", async () => {
  const pool = {
    execute: async (sql, parameters) => {
      if (sql.includes("FROM users WHERE name")) {
        const name = parameters[0];
        return [[{ id: name === "Ash" ? "USER-A" : "USER-B", name }]];
      }
      assert.deepEqual(parameters, ["USER-A", "USER-B", "USER-B"]);
      return [{ affectedRows: 1 }];
    },
  };
  const router = loadRouterWithPool("../server/express/friendsRoute", pool);
  const response = await invokeRoute(router, "POST", "/accept", {
    body: { name: "Ash", friendName: "Brock" },
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.body.status, /Brock/);
});
