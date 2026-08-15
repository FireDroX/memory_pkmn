export const gameSoundSources = Object.freeze({
  menuClick: "/audio/menu-click.mp3",
  cardFlip: "/audio/card-flip.mp3",
  pairFound: "/audio/pair-found.mp3",
  error: "/audio/error.mp3",
  victory: "/audio/victory.mp3",
});

const storageKey = "pokeflip_game_sounds";
const defaultSettings = Object.freeze({ enabled: true, volume: 0.45 });

const getBrowserStorage = () =>
  typeof window === "undefined" ? undefined : window.localStorage;

export const normalizeGameSoundSettings = (settings = {}) => {
  const requestedVolume = Number(settings.volume);
  const volume = Number.isFinite(requestedVolume)
    ? Math.min(1, Math.max(0, requestedVolume))
    : defaultSettings.volume;

  return {
    enabled:
      typeof settings.enabled === "boolean"
        ? settings.enabled
        : defaultSettings.enabled,
    volume,
  };
};

export const loadGameSoundSettings = (storage = getBrowserStorage()) => {
  if (!storage) return normalizeGameSoundSettings();

  try {
    return normalizeGameSoundSettings(
      JSON.parse(storage.getItem(storageKey) || "{}"),
    );
  } catch {
    return normalizeGameSoundSettings();
  }
};

export const saveGameSoundSettings = (
  settings,
  storage = getBrowserStorage(),
) => {
  const normalizedSettings = normalizeGameSoundSettings(settings);
  if (storage) {
    storage.setItem(storageKey, JSON.stringify(normalizedSettings));
  }
  return normalizedSettings;
};

let activeSettings = loadGameSoundSettings();

export const updateGameSoundSettings = (settings, storage) => {
  activeSettings = saveGameSoundSettings(settings, storage);
  return activeSettings;
};

export const playGameSound = (
  sound,
  AudioConstructor = globalThis.Audio,
) => {
  const source = gameSoundSources[sound];
  if (!activeSettings.enabled || !source || !AudioConstructor) return null;

  const audio = new AudioConstructor(source);
  audio.volume = activeSettings.volume;
  const playback = audio.play();
  if (playback?.catch) playback.catch(() => undefined);
  return audio;
};
