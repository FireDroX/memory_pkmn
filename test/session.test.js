const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
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
