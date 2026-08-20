import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la grille online adapte les cartes aux 11 emplacements du mode 22 paires", async () => {
  const [component, styles] = await Promise.all([
    readFile("client/src/pages/Memory/Online/Online.jsx", "utf8"),
    readFile("client/src/pages/Memory/Online/Online.css", "utf8"),
  ]);

  assert.match(component, /--online-cards-per-row/);
  assert.match(
    styles,
    /grid-template-columns:\s*repeat\(\s*var\(--online-cards-per-row\),\s*minmax\(0,\s*82px\)\s*\)/,
  );
  assert.match(styles, /\.online-container \.card\s*{[^}]*width:\s*100%/s);
});
