import test from "node:test";
import assert from "node:assert/strict";
import {
  gameSoundSources,
  normalizeGameSoundSettings,
  playGameSound,
  saveGameSoundSettings,
  updateGameSoundSettings,
} from "../client/src/utils/gameSounds.js";

test("normalizeGameSoundSettings valide l'etat et borne le volume", () => {
  assert.deepEqual(normalizeGameSoundSettings({ enabled: false, volume: 2 }), {
    enabled: false,
    volume: 1,
  });
  assert.deepEqual(normalizeGameSoundSettings({ volume: -2 }), {
    enabled: true,
    volume: 0,
  });
});

test("saveGameSoundSettings persiste uniquement des reglages valides", () => {
  let saved;
  const storage = { setItem: (_key, value) => { saved = value; } };
  const settings = saveGameSoundSettings(
    { enabled: true, volume: 0.6 },
    storage,
  );

  assert.deepEqual(JSON.parse(saved), settings);
});

test("playGameSound joue le fichier demande avec le volume choisi", () => {
  let played = false;
  class AudioMock {
    constructor(source) {
      this.source = source;
    }

    play() {
      played = true;
      return Promise.resolve();
    }
  }

  updateGameSoundSettings({ enabled: true, volume: 0.3 });
  const audio = playGameSound("cardFlip", AudioMock);

  assert.equal(audio.source, gameSoundSources.cardFlip);
  assert.equal(audio.volume, 0.3);
  assert.equal(played, true);
});

test("playGameSound ne cree aucun audio lorsque les sons sont coupes", () => {
  let created = false;
  class AudioMock {
    constructor() {
      created = true;
    }
  }

  updateGameSoundSettings({ enabled: false, volume: 0.3 });
  assert.equal(playGameSound("victory", AudioMock), null);
  assert.equal(created, false);
});
