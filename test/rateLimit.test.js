const test = require("node:test");
const assert = require("node:assert/strict");
const { createRateLimiter } = require("../server/utils/rateLimit");

const fakeRes = () => {
  const res = {
    statusCode: null,
    body: undefined,
    headers: {},
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(body) {
      res.body = body;
      return res;
    },
    setHeader(name, value) {
      res.headers[name] = value;
      return res;
    },
    getHeader(name) {
      return res.headers[name];
    },
  };
  return res;
};

test("bloque au-dela de la limite pour une meme cle, puis laisse passer une autre cle", async () => {
  const limiter = createRateLimiter({
    windowMs: 60_000,
    max: 2,
    message: "Trop de tentatives",
  });
  const req = { ip: "203.0.113.9" };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let nextCalled = false;
    await limiter(req, fakeRes(), () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true, `attempt ${attempt} should be allowed`);
  }

  const blockedRes = fakeRes();
  let nextCalled = false;
  await limiter(req, blockedRes, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(blockedRes.statusCode, 429);
  assert.deepEqual(blockedRes.body, { status: "Trop de tentatives" });

  const otherIpRes = fakeRes();
  let otherIpNextCalled = false;
  await limiter({ ip: "198.51.100.4" }, otherIpRes, () => {
    otherIpNextCalled = true;
  });
  assert.equal(otherIpNextCalled, true);
});
