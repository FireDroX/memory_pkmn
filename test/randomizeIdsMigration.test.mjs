import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la migration de randomisation des ids remappe toutes les tables et colonnes JSON qui referencent users/rooms", async () => {
  const migration = await readFile(
    "database/migrations/010_randomize_ids.sql",
    "utf8",
  );

  assert.match(
    migration,
    /CREATE TEMPORARY TABLE `id_migration_users`[\s\S]*?COLLATE=utf8mb4_unicode_ci/,
  );
  assert.match(
    migration,
    /CREATE TEMPORARY TABLE `id_migration_rooms`[\s\S]*?COLLATE=utf8mb4_unicode_ci/,
  );

  assert.match(migration, /SET r\.players = JSON_REPLACE\(r\.players, '\$\[0\]\.id', m\.new_id\)/);
  assert.match(migration, /SET f\.user_id = m\.new_id/);
  assert.match(migration, /SET f\.friend_id = m\.new_id/);
  assert.match(migration, /SET f\.requested_by = m\.new_id/);
  assert.match(migration, /SET d\.user_id = m\.new_id/);
  assert.match(migration, /SET rm\.author_id = m\.new_id/);
  assert.match(migration, /SET rm\.room_id = m\.new_id/);

  const usersPkUpdate = migration.indexOf("SET u.id = m.new_id");
  const roomsPkUpdate = migration.indexOf("SET r.id = m.new_id");
  const friendshipsUpdate = migration.indexOf("SET f.user_id = m.new_id");
  assert.ok(usersPkUpdate > friendshipsUpdate);
  assert.ok(roomsPkUpdate > migration.indexOf("SET rm.room_id = m.new_id"));

  assert.match(migration, /SET FOREIGN_KEY_CHECKS = 0;/);
  assert.match(migration, /SET FOREIGN_KEY_CHECKS = 1;/);
  assert.match(migration, /DELETE FROM `sessions`;/);

  const transactionStart = migration.indexOf("START TRANSACTION;");
  const transactionCommit = migration.indexOf("COMMIT;");
  assert.ok(transactionStart > -1);
  assert.ok(transactionStart < friendshipsUpdate);
  assert.ok(transactionCommit > roomsPkUpdate);
});
