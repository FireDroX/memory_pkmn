import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("les dialogues de resultat exposent les actions solo et online", () => {
  const solo = read("client/src/pages/Memory/Solo/Solo.jsx");
  const online = read("client/src/pages/Memory/Online/Online.jsx");

  assert.match(solo, /t\("game\.home"\)/);
  assert.match(solo, /t\("game\.restart"\)/);
  assert.match(solo, /onRestart/);
  assert.match(online, /t\("online\.revenge"\)/);
  assert.match(online, /t\("online\.deleteRoom"\)/);
  assert.match(online, /fetch\("\/api\/rooms\/revenge"/);
  assert.match(online, /fetch\("\/api\/rooms\/delete"/);
});

test("la revanche regenere les cartes et remet la room a zero", () => {
  const route = read("server/express/roomsRoute.js");
  assert.match(route, /createCards\(columns, rows\)/);
  assert.match(route, /score: 0/);
  assert.match(route, /completed_at = NULL/);
  assert.match(route, /refresh-room/);
});
