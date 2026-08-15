import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("le bouton ami declenche directement la creation du duel", async () => {
  const profileSource = await readFile(
    new URL("../client/src/pages/Profile/Profile.jsx", import.meta.url),
    "utf8",
  );
  const inviteHandler = profileSource.match(
    /const inviteFriend = [\s\S]*?\n  };\n\n  const handleInvite/,
  )?.[0];

  assert.ok(inviteHandler, "Le gestionnaire inviteFriend doit exister.");
  assert.match(
    inviteHandler,
    /createFriendDuel\(/,
    "Inviter un ami doit envoyer immediatement la creation du salon 1v1.",
  );
});

test("createFriendDuel laisse le serveur identifier le joueur connecte", async () => {
  const { createFriendDuel } = await import(
    "../client/src/utils/friendDuelInvite.js"
  );
  const requests = [];
  const result = await createFriendDuel({
    friendName: "Misty",
    pairs: { c: 4, r: 7 },
    request: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        json: async () => ({ status: "Salon cree.", roomID: "ROOM-1" }),
      };
    },
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "/api/invite");
  assert.equal(requests[0].options.method, "POST");
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    players: ["Misty"],
    pairs: { c: 4, r: 7 },
  });
  assert.deepEqual(result, {
    ok: true,
    status: "Salon cree.",
    roomID: "ROOM-1",
  });
});
