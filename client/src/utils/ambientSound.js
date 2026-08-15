export const ambientSoundscapes = [
  { id: "rain", label: "Pluie douce" },
  { id: "forest", label: "Foret de Jade" },
  { id: "center", label: "Centre Pokemon" },
];

export const normalizeAmbientSettings = (settings = {}) => {
  const soundscape = ambientSoundscapes.some(
    (entry) => entry.id === settings.soundscape,
  )
    ? settings.soundscape
    : ambientSoundscapes[0].id;
  const requestedVolume = Number(settings.volume);
  const volume = Number.isFinite(requestedVolume)
    ? Math.min(1, Math.max(0, requestedVolume))
    : 0.35;

  return { soundscape, volume };
};

export const loadAmbientSettings = (storage = window.localStorage) => {
  try {
    return normalizeAmbientSettings(
      JSON.parse(storage.getItem("pokeflip_ambient_sound") || "{}"),
    );
  } catch {
    return normalizeAmbientSettings();
  }
};

export const saveAmbientSettings = (
  settings,
  storage = window.localStorage,
) => {
  storage.setItem(
    "pokeflip_ambient_sound",
    JSON.stringify(normalizeAmbientSettings(settings)),
  );
};
