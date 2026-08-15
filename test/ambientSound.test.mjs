import test from "node:test";
import assert from "node:assert/strict";
import {
  ambientSoundscapes,
  normalizeAmbientSettings,
  saveAmbientSettings,
} from "../client/src/utils/ambientSound.js";

test("normalizeAmbientSettings valide l'ambiance et borne le volume", () => {
  assert.deepEqual(normalizeAmbientSettings({ soundscape: "forest", volume: 2 }), {
    soundscape: "forest",
    volume: 1,
  });
  assert.deepEqual(normalizeAmbientSettings({ soundscape: "invalid", volume: -2 }), {
    soundscape: ambientSoundscapes[0].id,
    volume: 0,
  });
});

test("saveAmbientSettings persiste uniquement des reglages valides", () => {
  let saved;
  const storage = { setItem: (_key, value) => { saved = value; } };
  saveAmbientSettings({ soundscape: "center", volume: 0.5 }, storage);
  assert.deepEqual(JSON.parse(saved), { soundscape: "center", volume: 0.5 });
});
