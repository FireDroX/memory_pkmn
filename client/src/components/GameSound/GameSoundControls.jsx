import { useEffect, useState } from "react";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import {
  loadGameSoundSettings,
  playGameSound,
  updateGameSoundSettings,
} from "../../utils/gameSounds";
import "./GameSoundControls.css";

const interactiveSelector = "button, a, [role='button']";

const GameSoundControls = () => {
  const [settings, setSettings] = useState(loadGameSoundSettings);

  const applySettings = (nextSettings) => {
    const savedSettings = updateGameSoundSettings(nextSettings);
    setSettings(savedSettings);
  };

  useEffect(() => {
    const playMenuClick = (event) => {
      if (!(event.target instanceof Element)) return;
      const interactiveElement = event.target.closest(interactiveSelector);
      if (!interactiveElement || interactiveElement.matches(":disabled")) return;
      playGameSound("menuClick");
    };

    document.addEventListener("click", playMenuClick);
    return () => document.removeEventListener("click", playMenuClick);
  }, []);

  return (
    <aside className="game-sound-controls" aria-label="Effets sonores du jeu">
      <button
        type="button"
        onClick={() => applySettings({ ...settings, enabled: !settings.enabled })}
        aria-pressed={settings.enabled}
        title={settings.enabled ? "Couper les sons" : "Activer les sons"}
      >
        {settings.enabled ? <FaVolumeUp /> : <FaVolumeMute />}
        <span>Sons</span>
      </button>
      <label>
        <span className="sr-only">Volume des effets sonores</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.volume}
          disabled={!settings.enabled}
          onChange={(event) =>
            applySettings({ ...settings, volume: Number(event.target.value) })
          }
        />
      </label>
    </aside>
  );
};

export default GameSoundControls;
