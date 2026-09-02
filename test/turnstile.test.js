const test = require("node:test");
const assert = require("node:assert/strict");
const { createTurnstileMiddleware } = require("../server/utils/turnstile");

const fakeRes = () => ({
  statusCode: null,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("sans TURNSTILE_SECRET_KEY configuree, le middleware ne fait rien (dev/tests)", async () => {
  const middleware = createTurnstileMiddleware({ secretKey: "" });
  let nextCalled = false;
  await middleware({ body: {} }, fakeRes(), () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

test("refuse une requete sans jeton quand la cle secrete est configuree", async () => {
  const middleware = createTurnstileMiddleware({ secretKey: "secret" });
  const res = fakeRes();
  let nextCalled = false;
  await middleware({ body: {} }, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
});

test("laisse passer un jeton valide selon Cloudflare", async () => {
  const middleware = createTurnstileMiddleware({
    secretKey: "secret",
    fetchImpl: async () => ({ json: async () => ({ success: true }) }),
  });
  let nextCalled = false;
  await middleware({ body: { turnstileToken: "tok" } }, fakeRes(), () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

test("refuse un jeton invalide selon Cloudflare", async () => {
  const middleware = createTurnstileMiddleware({
    secretKey: "secret",
    fetchImpl: async () => ({ json: async () => ({ success: false }) }),
  });
  const res = fakeRes();
  let nextCalled = false;
  await middleware({ body: { turnstileToken: "tok" } }, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
});

test("repond 503 si l'appel a Cloudflare echoue", async () => {
  const middleware = createTurnstileMiddleware({
    secretKey: "secret",
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });
  const res = fakeRes();
  let nextCalled = false;
  await middleware({ body: { turnstileToken: "tok" } }, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 503);
});
