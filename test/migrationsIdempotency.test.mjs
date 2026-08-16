import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const migrationsDirectory = new URL("../database/migrations/", import.meta.url);

test("toutes les migrations de schema peuvent etre rejouees", async () => {
  const filenames = (await readdir(migrationsDirectory))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  for (const filename of filenames) {
    const sql = await readFile(new URL(filename, migrationsDirectory), "utf8");
    assert.doesNotMatch(
      sql,
      /CREATE TABLE(?!\s+IF NOT EXISTS)/i,
      `${filename} contient un CREATE TABLE non idempotent`,
    );
    assert.doesNotMatch(
      sql,
      /ADD COLUMN(?!\s+IF NOT EXISTS)/i,
      `${filename} contient un ADD COLUMN non idempotent`,
    );
    assert.doesNotMatch(
      sql,
      /ADD (?:KEY|INDEX)(?!\s+IF NOT EXISTS)/i,
      `${filename} contient un ajout d'index non idempotent`,
    );
  }
});

test("le backfill des parties online ne reecrit pas les statistiques existantes", async () => {
  const sql = await readFile(
    new URL("004_add_detailed_player_stats.sql", migrationsDirectory),
    "utf8",
  );

  assert.match(
    sql,
    /WHERE\s+`online_games_played`\s*=\s*0\s+AND\s+`online_games_won`\s*>\s*0/i,
  );
});
