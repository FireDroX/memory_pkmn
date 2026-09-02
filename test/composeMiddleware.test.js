const test = require("node:test");
const assert = require("node:assert/strict");
const composeMiddleware = require("../server/utils/composeMiddleware");

const fakeRes = () => ({ statusCode: null, body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("attend que le handler terminal (async) termine avant de resoudre", async () => {
  const order = [];
  const limiter = (req, res, next) => {
    order.push("limiter");
    next();
  };
  const handler = async (req, res) => {
    order.push("handler:start");
    await new Promise((resolve) => setTimeout(resolve, 10));
    order.push("handler:end");
    res.status(200).json({ ok: true });
  };

  const res = fakeRes();
  await composeMiddleware(limiter, handler)({}, res);

  assert.deepEqual(order, ["limiter", "handler:start", "handler:end"]);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
});

test("resoud des qu'un middleware court-circuite sans appeler next()", async () => {
  const handlerCalls = [];
  const limiter = (req, res, next) => {
    res.status(429).json({ status: "Trop de tentatives" });
  };
  const handler = async (req, res) => {
    handlerCalls.push(true);
    res.status(200).json({ ok: true });
  };

  const res = fakeRes();
  await composeMiddleware(limiter, handler)({}, res);

  assert.equal(res.statusCode, 429);
  assert.deepEqual(res.body, { status: "Trop de tentatives" });
  assert.equal(handlerCalls.length, 0);
});

test("propage une erreur rejetee par un middleware", async () => {
  const failing = (req, res, next) => next(new Error("boom"));
  const handler = async (req, res) => res.status(200).json({ ok: true });

  await assert.rejects(
    composeMiddleware(failing, handler)({}, fakeRes()),
    /boom/,
  );
});
