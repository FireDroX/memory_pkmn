const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isCompatibleMigrationChecksum,
  migrationChecksum,
} = require("../scripts/migrate-database");

test("les empreintes de migration ignorent la difference LF CRLF", () => {
  assert.equal(
    migrationChecksum("SELECT 1;\n"),
    migrationChecksum("SELECT 1;\r\n"),
  );
});

test("les anciennes empreintes des migrations idempotentes sont compatibles", () => {
  assert.equal(
    isCompatibleMigrationChecksum(
      "004_add_detailed_player_stats.sql",
      "f7e94866da9ab3d7b275603877913e02940f8db75d6018c4eae5b3a6f04c9d95",
      "686360daa86933f99dfaaea52c2aa315d444b46848aec7623cfcaa2681ffb61d",
    ),
    true,
  );
  assert.equal(
    isCompatibleMigrationChecksum(
      "007_add_user_roles.sql",
      "850424495e7e3d265a5a439adcc9b81244ee61e19bd55f8f78d29b1b773530ab",
      "112565fd0b3834b69f181037b4a5d17ffd825cb2fe1967bd0ab4785e01fca5e3",
    ),
    true,
  );
  assert.equal(
    isCompatibleMigrationChecksum(
      "007_add_user_roles.sql",
      "c4b59cad5430c7cfaf2dfeacb8a8dd8377e8376a795e1a7610d0c1b4b7b9e0c9",
      "112565fd0b3834b69f181037b4a5d17ffd825cb2fe1967bd0ab4785e01fca5e3",
    ),
    true,
  );
});

test("une ancienne empreinte CRLF du meme fichier est compatible", () => {
  assert.equal(
    isCompatibleMigrationChecksum(
      "003_create_friendships.sql",
      "074cca9b61a1dd666226dde2ef8f45e395c4ea6eb6669c63c612fb55d28dbd89",
      "2a99df28775fe87a09da85e5dcd23aa4b3ee6bfe053dda3a78536f429c995ab4",
      "074cca9b61a1dd666226dde2ef8f45e395c4ea6eb6669c63c612fb55d28dbd89",
    ),
    true,
  );
});

test("une modification de migration inconnue reste refusee", () => {
  assert.equal(
    isCompatibleMigrationChecksum(
      "004_add_detailed_player_stats.sql",
      "x",
      "y",
    ),
    false,
  );
  assert.equal(
    isCompatibleMigrationChecksum("unknown.sql", "x", "y"),
    false,
  );
});
