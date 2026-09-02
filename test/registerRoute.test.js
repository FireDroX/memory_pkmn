const test = require("node:test");
const assert = require("node:assert/strict");
const { invokeRoute, loadRouterWithPool } = require("./routeTestUtils");

const genericError = {
  status: "Inscription impossible. Verifie ton pseudo et ton mot de passe.",
};
const strongPassword = "Correct-Horse-9";

test("un pseudo invalide et un pseudo deja pris renvoient exactement la meme reponse", async () => {
  const dupError = Object.assign(new Error("Duplicate entry"), {
    code: "ER_DUP_ENTRY",
  });
  const pool = { execute: async () => { throw dupError; } };
  const router = loadRouterWithPool("../server/express/registerRoute", pool);

  const invalidResponse = await invokeRoute(router, "POST", "/", {
    body: { name: "not valid!", password: strongPassword },
  });
  const takenResponse = await invokeRoute(router, "POST", "/", {
    body: { name: "Ash", password: strongPassword },
  });

  assert.equal(invalidResponse.statusCode, 400);
  assert.deepEqual(invalidResponse.body, genericError);
  assert.equal(takenResponse.statusCode, 400);
  assert.deepEqual(takenResponse.body, genericError);
});

test("un pseudo reserve (admin, staff...) est refuse comme un pseudo invalide", async () => {
  const pool = { execute: async () => { throw new Error("should not be called"); } };
  const router = loadRouterWithPool("../server/express/registerRoute", pool);

  const response = await invokeRoute(router, "POST", "/", {
    body: { name: "Admin", password: strongPassword },
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, genericError);
});

test("un mot de passe trop court ou trop faible est refuse", async () => {
  const pool = { execute: async () => { throw new Error("should not be called"); } };
  const router = loadRouterWithPool("../server/express/registerRoute", pool);

  const tooShort = await invokeRoute(router, "POST", "/", {
    body: { name: "Ash", password: "abc123" },
  });
  const tooWeak = await invokeRoute(router, "POST", "/", {
    body: { name: "Ash", password: "aaaaaaaa" },
  });

  assert.equal(tooShort.statusCode, 400);
  assert.deepEqual(tooShort.body, genericError);
  assert.equal(tooWeak.statusCode, 400);
  assert.deepEqual(tooWeak.body, genericError);
});

test("un compte valide est cree avec un id USER-<uuid> non predictible", async () => {
  let insertedParameters;
  const pool = {
    execute: async (_sql, parameters) => {
      insertedParameters = parameters;
      return [{ affectedRows: 1 }];
    },
  };
  const router = loadRouterWithPool("../server/express/registerRoute", pool);

  const response = await invokeRoute(router, "POST", "/", {
    body: { name: "Ash", password: strongPassword },
  });

  assert.equal(response.statusCode, 201);
  const insertedId = insertedParameters[0];
  assert.match(
    insertedId,
    /^USER-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  assert.doesNotMatch(insertedId, /^USER-\d+$/);
});
