import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("chaque entree textuelle de la navbar possede une icone", async () => {
  const source = await readFile(
    new URL("../client/src/components/Navbar/Navbar.jsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /<FaGamepad[^>]*\/>\s*<span>{t\("nav\.solo"\)}<\/span>/);
  assert.match(source, /<FaDoorOpen[^>]*\/>\s*<span>{t\("nav\.rooms"\)}<\/span>/);
  assert.match(source, /<FaSignInAlt[^>]*\/>\s*<span>{t\("nav\.login"\)}<\/span>/);
  assert.match(source, /aria-label={t\("nav\.solo"\)}/);
  assert.match(source, /aria-label={t\("nav\.rooms"\)}/);
});

test("les titres et actions principales de Rooms possedent une icone", async () => {
  const source = await readFile(
    new URL("../client/src/pages/Profile/Profile.jsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /<FaGamepad[^>]*\/>\s*{t\("profile\.createArena"\)}/);
  assert.match(source, /<FaPlus[^>]*\/>\s*{t\("profile\.createRoom"\)}/);
  assert.match(source, /<FaPlay[^>]*\/>\s*{t\("profile\.playSolo"\)}/);
  assert.match(source, /<FaDoorOpen[^>]*\/>\s*{t\("profile\.joinArena"\)}/);
  assert.match(source, /<FaTrophy[^>]*\/>\s*{t\("achievements\.title"\)}/);
  assert.match(source, /className="profile-room-join"/);
  assert.match(source, /className="profile-room-delete"/);
  assert.doesNotMatch(source, /<span onClick={\(\) => navigate\(`\/online/);
});
