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
    <button
      className="game-sound-controls"
      type="button"
      onClick={() => applySettings({ ...settings, enabled: !settings.enabled })}
      aria-label={t(settings.enabled ? "sound.mute" : "sound.enable")}
      aria-pressed={settings.enabled}
      title={t(settings.enabled ? "sound.mute" : "sound.enable")}
    >
      {settings.enabled ? <FaVolumeUp /> : <FaVolumeMute />}
    </button>
  );
};

export default GameSoundControls;
