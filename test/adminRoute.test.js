const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const requireAuthentication = require("../server/express/requireAuthentication");
const { createAdminRouter } = require("../server/express/adminRoute");

const requestAdmin = async (
  t,
  { database, sessionUser, path = "/admin", method = "GET", body },
) => {
  const app = express();
  app.use(express.json());
  app.use((request, _response, next) => {
    request.session = sessionUser ? { user: sessionUser } : {};
    next();
  });
  app.use(requireAuthentication);
  app.use("/admin", createAdminRouter(database));

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const response = await fetch(
    `http://127.0.0.1:${server.address().port}${path}`,
    {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  return {
    status: response.status,
    body: await response.json(),
  };
};

const profile = (level) =>
  JSON.stringify({
    level,
    xp: 0,
    xpNeeded: 10,
    inventory: [{ colors: ["color-default"] }],
    achievements: [0],
  });

test("l'administration refuse une requete sans session", async (t) => {
  const response = await requestAdmin(t, { database: {}, sessionUser: null });

  assert.equal(response.status, 401);
});

test("l'administration refuse un utilisateur non admin", async (t) => {
  const database = {
    execute: async () => [[{ role: "user" }]],
  };
  const response = await requestAdmin(t, {
    database,
    sessionUser: { id: "USER-1", name: "Misty" },
  });

  assert.equal(response.status, 403);
});

test("un utilisateur non admin ne peut pas attribuer un role", async (t) => {
  const database = {
    execute: async () => [[{ role: "user" }]],
  };
  const response = await requestAdmin(t, {
    database,
    sessionUser: { id: "USER-1", name: "Misty" },
    path: "/admin/users/USER-1/role",
    method: "PATCH",
    body: { role: "admin" },
  });

  assert.equal(response.status, 403);
});

test("GET /admin renvoie les utilisateurs et les statistiques globales", async (t) => {
  const users = [
    {
      id: "USER-ADMIN",
      name: "Admin",
      role: "admin",
      online_games_played: 5,
      online_games_won: 3,
      online_games_lost: 2,
      shiny_pairs_found: 1,
      total_pairs_found: 18,
      solo_games_played: 4,
      solo_games_won: 2,
      user_profile: profile(3),
      created_at: new Date("2026-08-01T00:00:00Z"),
    },
    {
      id: "USER-2",
      name: "Misty",
      role: "user",
      online_games_played: 2,
      online_games_won: 1,
      online_games_lost: 1,
      shiny_pairs_found: 0,
      total_pairs_found: 7,
      solo_games_played: 3,
      solo_games_won: 1,
      user_profile: profile(2),
      created_at: new Date("2026-08-02T00:00:00Z"),
    },
  ];
  const database = {
    execute: async (sql) =>
      sql.includes("SELECT role FROM users") ? [[{ role: "admin" }]] : [users],
  };
  const response = await requestAdmin(t, {
    database,
    sessionUser: { id: "USER-ADMIN", name: "Admin" },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.stats, {
    totalUsers: 2,
    totalAdmins: 1,
    onlineGamesPlayed: 7,
    onlineGamesWon: 4,
    soloGamesPlayed: 7,
    soloGamesWon: 3,
    totalPairsFound: 25,
    shinyPairsFound: 1,
  });
  assert.equal(response.body.users[0].level, 3);
  assert.equal(JSON.stringify(response.body).includes("password"), false);
});

test("PATCH /admin/users/:id/role permet a un admin de promouvoir un joueur", async (t) => {
  const calls = { committed: false, released: false, update: null };
  const connection = {
    beginTransaction: async () => {},
    execute: async (sql, parameters) => {
      if (sql.includes("SELECT id, name, role") && sql.includes("FOR UPDATE")) {
        return [[
          { id: "USER-ADMIN", name: "Admin", role: "admin" },
          { id: "USER-2", name: "Misty", role: "user" },
        ]];
      }
      if (sql.includes("UPDATE users SET role")) {
        calls.update = parameters;
      }
      return [[]];
    },
    commit: async () => { calls.committed = true; },
    rollback: async () => {},
    release: () => { calls.released = true; },
  };
  const database = {
    execute: async () => [[{ role: "admin" }]],
    getConnection: async () => connection,
  };
  const response = await requestAdmin(t, {
    database,
    sessionUser: { id: "USER-ADMIN", name: "Admin" },
    path: "/admin/users/USER-2/role",
    method: "PATCH",
    body: { role: "admin" },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls.update, ["admin", "USER-2"]);
  assert.equal(calls.committed, true);
  assert.equal(calls.released, true);
});

test("le dernier administrateur ne peut pas retirer son propre role", async (t) => {
  const calls = { rolledBack: false };
  const connection = {
    beginTransaction: async () => {},
    execute: async (sql) => {
      if (sql.includes("SELECT id, name, role")) {
        return [[{ id: "USER-ADMIN", name: "Admin", role: "admin" }]];
      }
      if (sql.includes("WHERE role = 'admin'")) {
        return [[{ id: "USER-ADMIN" }]];
      }
      return [[]];
    },
    commit: async () => {},
    rollback: async () => { calls.rolledBack = true; },
    release: () => {},
  };
  const database = {
    execute: async () => [[{ role: "admin" }]],
    getConnection: async () => connection,
  };
  const response = await requestAdmin(t, {
    database,
    sessionUser: { id: "USER-ADMIN", name: "Admin" },
    path: "/admin/users/USER-ADMIN/role",
    method: "PATCH",
    body: { role: "user" },
  });

  assert.equal(response.status, 409);
  assert.equal(calls.rolledBack, true);
});
