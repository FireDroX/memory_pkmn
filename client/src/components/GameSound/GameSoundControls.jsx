import { useEffect, useState } from "react";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  loadGameSoundSettings,
  playGameSound,
  updateGameSoundSettings,
} from "../../utils/gameSounds";
import "./GameSoundControls.css";

const interactiveSelector = "button, a, [role='button']";

const GameSoundControls = () => {
  const { t } = useTranslation();
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
    <aside className="game-sound-controls" aria-label={t("sound.label")}>
      <button
        type="button"
        onClick={() => applySettings({ ...settings, enabled: !settings.enabled })}
        aria-pressed={settings.enabled}
        title={t(settings.enabled ? "sound.mute" : "sound.enable")}
      >
        {settings.enabled ? <FaVolumeUp /> : <FaVolumeMute />}
        <span>{t("sound.short")}</span>
      </button>
      <label>
        <span className="sr-only">{t("sound.volume")}</span>
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
