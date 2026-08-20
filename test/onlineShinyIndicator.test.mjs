import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("une carte shiny affiche une etoile uniquement sur sa face revelee", async () => {
  const [component, styles] = await Promise.all([
    readFile("client/src/pages/Memory/Online/Online.jsx", "utf8"),
    readFile("client/src/pages/Memory/Online/Online.css", "utf8"),
  ]);

  assert.match(component, /FaStar/);
  assert.match(
    component,
    /<div className="card-back">[\s\S]*?card\.shiny[\s\S]*?online-shiny-indicator/,
  );
  assert.match(component, /aria-hidden=\{[\s\S]*?!isCardRevealed/);
  assert.match(styles, /\.online-shiny-indicator\s*{[^}]*position:\s*absolute/s);
  assert.match(styles, /width:\s*min\(32%,\s*26px\)/);
});
