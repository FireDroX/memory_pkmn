const test = require("node:test");
const assert = require("node:assert/strict");
const { bootstrapAdmin } = require("../scripts/bootstrap-admin");

test("bootstrapAdmin promeut un compte quand aucun admin n'existe", async () => {
  const calls = { update: null, committed: false, released: false };
  const connection = {
    beginTransaction: async () => {},
    execute: async (sql, parameters) => {
      if (sql.includes("WHERE name = ?")) {
        return [[{ id: "USER-1", name: "Brock", role: "user" }]];
      }
      if (sql.includes("WHERE role = 'admin'")) return [[]];
      if (sql.includes("UPDATE users SET role")) calls.update = parameters;
      return [[]];
    },
    commit: async () => { calls.committed = true; },
    rollback: async () => {},
    release: () => { calls.released = true; },
  };

  const user = await bootstrapAdmin(
    { getConnection: async () => connection },
    "Brock",
  );

  assert.deepEqual(user, { id: "USER-1", name: "Brock", role: "admin" });
  assert.deepEqual(calls.update, ["USER-1"]);
  assert.equal(calls.committed, true);
  assert.equal(calls.released, true);
});

test("bootstrapAdmin refuse une promotion quand un admin existe deja", async () => {
  let rolledBack = false;
  const connection = {
    beginTransaction: async () => {},
    execute: async (sql) => {
      if (sql.includes("WHERE name = ?")) {
        return [[{ id: "USER-2", name: "Misty", role: "user" }]];
      }
      if (sql.includes("WHERE role = 'admin'")) {
        return [[{ id: "USER-ADMIN" }]];
      }
      return [[]];
    },
    commit: async () => {},
    rollback: async () => { rolledBack = true; },
    release: () => {},
  };

  await assert.rejects(
    bootstrapAdmin({ getConnection: async () => connection }, "Misty"),
    /utilise la page d'administration/,
  );
  assert.equal(rolledBack, true);
});
