import test from "node:test";
import assert from "node:assert/strict";
import {
  localizedStatus,
  statusDisplayDuration,
  translateServerStatus,
  translateStatus,
} from "../client/src/utils/serverStatus.js";

test("les statuts restent visibles deux secondes", () => {
  assert.equal(statusDisplayDuration, 2000);
});

const translate = (key, values = {}) => `${key}:${JSON.stringify(values)}`;

test("translateServerStatus traduit les statuts fixes et dynamiques", () => {
  assert.equal(
    translateServerStatus("Identifiant ou mot de passe incorrect.", translate),
    "status.invalidCredentials:{}",
  );
  assert.equal(
    translateServerStatus(
      "Salon ROOM-123 cree. Les invitations sont pretes !",
      translate,
    ),
    'status.roomCreated:{"roomID":"ROOM-123"}',
  );
});

test("translateStatus retraduit un statut local au moment du rendu", () => {
  const status = localizedStatus("auth.required");
  assert.equal(translateStatus(status, translate), "auth.required:{}");
});
