import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("le client restaure et detruit l'authentification via la session serveur", async () => {
  const contextSource = await readFile(
    new URL("../client/src/utils/UserContext.jsx", import.meta.url),
    "utf8",
  );
  const profileSource = await readFile(
    new URL("../client/src/pages/Profile/Profile.jsx", import.meta.url),
    "utf8",
  );

  assert.match(contextSource, /fetch\("\/api\/login\/session"\)/);
  assert.match(
    profileSource,
    /fetch\("\/api\/login\/session", \{ method: "DELETE" \}\)/,
  );
  assert.doesNotMatch(contextSource, /localStorage|sessionStorage/);
  assert.doesNotMatch(profileSource, /localStorage|sessionStorage/);
});
