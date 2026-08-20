import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la migration du chat stocke les messages en base et les supprime avec la room", async () => {
  const migration = await readFile(
    "database/migrations/009_create_room_messages.sql",
    "utf8",
  );

  assert.match(migration, /CREATE TABLE IF NOT EXISTS `room_messages`/);
  assert.match(migration, /`message` VARCHAR\(280\) NOT NULL/);
  assert.match(
    migration,
    /KEY `room_messages_room_created_at_index` \(`room_id`, `created_at`\)/,
  );
  assert.match(
    migration,
    /FOREIGN KEY \(`room_id`\) REFERENCES `rooms` \(`id`\) ON DELETE CASCADE/,
  );
});
