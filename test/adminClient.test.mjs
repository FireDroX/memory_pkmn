import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la page admin est reservee au role admin cote client", async () => {
  const appSource = await readFile(
    new URL("../client/src/App.jsx", import.meta.url),
    "utf8",
  );
  const navbarSource = await readFile(
    new URL("../client/src/components/Navbar/Navbar.jsx", import.meta.url),
    "utf8",
  );

  assert.match(appSource, /path="\/admin"/);
  assert.match(appSource, /role === "admin"/);
  assert.match(navbarSource, /role === "admin"/);
  assert.match(navbarSource, /navigate\("\/admin"\)/);
});

test("la page admin charge les donnees et gere les roles et statuts via l'API", async () => {
  const adminSource = await readFile(
    new URL("../client/src/pages/Admin/Admin.jsx", import.meta.url),
    "utf8",
  );

  assert.match(adminSource, /fetch\("\/api\/admin"/);
  assert.match(adminSource, /`\/api\/admin\/users\/\$\{user\.id\}\/role`/);
  assert.match(adminSource, /`\/api\/admin\/users\/\$\{user\.id\}\/status`/);
  assert.match(adminSource, /JSON\.stringify\(\{ isActive: !user\.isActive \}\)/);
  assert.match(adminSource, /user\.isActive \? "is-active" : "is-disabled"/);
  assert.match(adminSource, /method: "PATCH"/);
});

test("les boutons de statut admin restent visibles au survol", async () => {
  const adminStyles = await readFile(
    new URL("../client/src/pages/Admin/Admin.css", import.meta.url),
    "utf8",
  );

  assert.match(
    adminStyles,
    /\.admin-status-button\.is-danger:hover:not\(:disabled\)\s*{[^}]*background:\s*#b63d3d/s,
  );
  assert.match(
    adminStyles,
    /\.admin-status-button\.is-success:hover:not\(:disabled\)\s*{[^}]*background:\s*#24774e/s,
  );
});
