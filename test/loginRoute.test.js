const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { invokeRoute, loadRouterWithPool } = require("./routeTestUtils");

const user = (password = "") => ({
  id: "USER-ADMIN",
  name: "Admin",
  role: "admin",
  is_active: 1,
  password,
  online_games_won: 0,
  online_games_played: 0,
  online_games_lost: 0,
  current_win_streak: 0,
  best_win_streak: 0,
  shiny_pairs_found: 0,
  total_pairs_found: 0,
  solo_games_played: 0,
  solo_games_won: 0,
  solo_best_remaining_tries: 0,
  user_profile: JSON.stringify({
    level: 0,
    xp: 0,
    xpNeeded: 10,
    inventory: [{ colors: ["color-default"] }],
    achievements: [0],
  }),
  created_at: new Date("2026-08-15T00:00:00Z"),
});

const createSession = () => ({
  regenerate(callback) {
    this.regenerated = true;
    callback();
  },
  save(callback) {
    this.saved = true;
    callback();
  },
  destroy(callback) {
    this.destroyed = true;
    callback();
  },
});

test("POST /login renvoie le pseudo canonique stocke en base", async () => {
  const password = await bcrypt.hash("secret", 4);
  const pool = {
    execute: async () => [[user(password)]],
  };
  const router = loadRouterWithPool("../server/express/loginRoute", pool);
  const session = createSession();
  const response = await invokeRoute(router, "POST", "/", {
    session,
    body: { name: "admin", password: "secret" },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.name, "Admin");
  assert.equal(response.body.role, "admin");
  assert.deepEqual(session.user, { id: "USER-ADMIN", name: "Admin" });
  assert.equal(session.regenerated, true);
  assert.equal(session.saved, true);
});

test("POST /login refuse un compte desactive", async () => {
  const password = await bcrypt.hash("secret", 4);
  const pool = {
    execute: async () => [[{ ...user(password), is_active: 0 }]],
  };
  const router = loadRouterWithPool("../server/express/loginRoute", pool);
  const session = createSession();
  const response = await invokeRoute(router, "POST", "/", {
    session,
    body: { name: "admin", password: "secret" },
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { status: "Compte desactive." });
  assert.equal(session.regenerated, undefined);
});

test("GET /login/session restaure l'utilisateur depuis la session", async () => {
  const pool = { execute: async () => [[user()]] };
  const router = loadRouterWithPool("../server/express/loginRoute", pool);
  const response = await invokeRoute(router, "GET", "/session", {
    session: { user: { id: "USER-ADMIN", name: "admin" } },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.name, "Admin");
  assert.equal(response.body.role, "admin");
});

test("GET /login/session detruit la session d'un compte desactive", async () => {
  const pool = { execute: async () => [[{ ...user(), is_active: 0 }]] };
  const router = loadRouterWithPool("../server/express/loginRoute", pool);
  const session = createSession();
  session.user = { id: "USER-ADMIN", name: "Admin" };
  const response = await invokeRoute(router, "GET", "/session", { session });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { authenticated: false });
  assert.equal(session.destroyed, true);
  assert.equal(response.clearedCookie.name, "pokeflip.sid");
});

test("DELETE /login/session detruit la session et son cookie", async () => {
  const router = loadRouterWithPool("../server/express/loginRoute", {});
  const session = createSession();
  const response = await invokeRoute(router, "DELETE", "/session", { session });

  assert.equal(response.statusCode, 204);
  assert.equal(session.destroyed, true);
  assert.equal(response.clearedCookie.name, "pokeflip.sid");
});
