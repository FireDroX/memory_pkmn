const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const express = require("express");
const session = require("express-session");
const {
  assertSessionStoreReady,
  createSessionMiddleware,
  getSessionSecret,
  sessionCookieName,
  sessionLifetime,
} = require("../server/session");
const requireAuthentication = require("../server/express/requireAuthentication");

test("la configuration de session exige un secret robuste", () => {
  assert.throws(() => getSessionSecret({}), /32 caracteres/);
  assert.equal(getSessionSecret({ SESSION_SECRET: "a".repeat(32) }).length, 32);
});

test("le middleware de session accepte le store MySQL configure", () => {
  const middleware = createSessionMiddleware({
    store: new EventEmitter(),
    secret: "a".repeat(32),
    production: false,
  });
  assert.equal(typeof middleware, "function");
  assert.equal(sessionCookieName, "pokeflip.sid");
  assert.equal(sessionLifetime, 86_400_000);
});

test("la production HTTP directe emet un cookie de session rechargeable", async (t) => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(
    createSessionMiddleware({
      store: new session.MemoryStore(),
      secret: "a".repeat(32),
      production: true,
    }),
  );
  app.get("/login", (request, response) => {
    request.session.user = { id: "USER-ADMIN", name: "Admin" };
    response.sendStatus(204);
  });

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/login`);
  const cookie = response.headers.get("set-cookie");

  assert.match(cookie, /^pokeflip\.sid=/);
  assert.doesNotMatch(cookie, /;\s*Secure/i);

  const httpsResponse = await fetch(`http://127.0.0.1:${port}/login`, {
    headers: { "X-Forwarded-Proto": "https" },
  });
  const secureCookie = httpsResponse.headers.get("set-cookie");
  assert.match(secureCookie, /^pokeflip\.sid=/);
  assert.match(secureCookie, /;\s*Secure/i);
});

test("le demarrage verifie que la table de sessions existe", async () => {
  const queries = [];
  const connection = {
    async execute(sql, parameters) {
      queries.push({ sql, parameters });
      if (sql === "SELECT 1") return [[]];
      return [[{ total: 1 }]];
    },
  };

  await assertSessionStoreReady(connection);

  assert.equal(queries.length, 2);
  assert.deepEqual(queries[1].parameters, ["sessions"]);
});

test("le demarrage echoue clairement sans table de sessions", async () => {
  const connection = {
    async execute(sql) {
      if (sql === "SELECT 1") return [[]];
      return [[{ total: 0 }]];
    },
  };

  await assert.rejects(
    assertSessionStoreReady(connection),
    /npm run db:migrate/,
  );
});

test("les routes privees refusent une requete sans session", () => {
  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;
  requireAuthentication({}, response, () => { nextCalled = true; });

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});
