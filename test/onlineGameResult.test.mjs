import test from "node:test";
import assert from "node:assert/strict";
import { findOnlineWinner } from "../client/src/utils/onlineGameResult.js";

test("findOnlineWinner projette la derniere paire avant le retour Socket.IO", () => {
  const players = [
    { name: "Rival", score: 2 },
    { name: "Admin", score: 2 },
  ];

  assert.equal(findOnlineWinner(players)?.name, "Rival");
  assert.equal(findOnlineWinner(players, "Admin")?.name, "Admin");
});
