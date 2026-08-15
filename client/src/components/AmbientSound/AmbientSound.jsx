import { useEffect, useRef, useState } from "react";
import { FaMusic, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import {
  ambientSoundscapes,
  loadAmbientSettings,
  saveAmbientSettings,
} from "../../utils/ambientSound";
import "./AmbientSound.css";

const createNoise = (context, seconds = 2) => {
  const buffer = context.createBuffer(
    1,
    context.sampleRate * seconds,
    context.sampleRate,
  );
  const data = buffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < data.length; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.97 + white * 0.03;
    data[index] = previous * 2.5;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
};

const createEngine = (soundscape, volume) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = volume * 0.28;
  master.connect(context.destination);
  const sources = [];

  const addNoise = (frequency, gainValue) => {
    const source = createNoise(context);
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "lowpass";
    filter.frequency.value = frequency;
    gain.gain.value = gainValue;
    source.connect(filter).connect(gain).connect(master);
    source.start();
    sources.push(source);
  };

  const addTone = (frequency, gainValue, detune = 0) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.detune.value = detune;
    gain.gain.value = gainValue;
    oscillator.connect(gain).connect(master);
    oscillator.start();
    sources.push(oscillator);
  };

  if (soundscape === "rain") {
    addNoise(2400, 0.8);
    addNoise(700, 0.35);
  } else if (soundscape === "forest") {
    addNoise(850, 0.28);
    addTone(196, 0.12, -8);
    addTone(293.66, 0.06, 6);
  } else {
    addTone(130.81, 0.19, -4);
    addTone(164.81, 0.13, 3);
    addTone(196, 0.1, 0);
    addTone(261.63, 0.05, 5);
  }

  return {
    context,
    master,
    stop: async () => {
      sources.forEach((source) => source.stop());
      await context.close();
    },
  };
};

const AmbientSound = () => {
  const [settings, setSettings] = useState(loadAmbientSettings);
  const [isPlaying, setIsPlaying] = useState(false);
  const engine = useRef(null);

  const stop = async () => {
    const activeEngine = engine.current;
    engine.current = null;
    setIsPlaying(false);
    if (activeEngine) await activeEngine.stop();
  };

  const start = async () => {
    if (engine.current) await stop();
    const nextEngine = createEngine(settings.soundscape, settings.volume);
    if (!nextEngine) return;
    engine.current = nextEngine;
    await nextEngine.context.resume();
    setIsPlaying(true);
  };

  const selectSoundscape = async (soundscape) => {
    const nextSettings = { ...settings, soundscape };
    setSettings(nextSettings);
    saveAmbientSettings(nextSettings);
    if (isPlaying) {
      await stop();
      const nextEngine = createEngine(soundscape, nextSettings.volume);
      if (nextEngine) {
        engine.current = nextEngine;
        await nextEngine.context.resume();
        setIsPlaying(true);
      }
    }
  };

  const changeVolume = (volume) => {
    const nextSettings = { ...settings, volume };
    setSettings(nextSettings);
    saveAmbientSettings(nextSettings);
    if (engine.current) engine.current.master.gain.value = volume * 0.28;
  };

  useEffect(() => () => {
    if (engine.current) engine.current.stop();
  }, []);

  return (
    <aside className="ambient-sound" aria-label="Sons ambiants">
      <span className="ambient-sound-title">
        <FaMusic aria-hidden="true" /> Ambiance
      </span>
      <select
        value={settings.soundscape}
        onChange={(event) => selectSoundscape(event.target.value)}
        aria-label="Choisir une ambiance sonore"
      >
        {ambientSoundscapes.map((soundscape) => (
          <option value={soundscape.id} key={soundscape.id}>
            {soundscape.label}
          </option>
        ))}
      </select>
      <label>
        <span className="sr-only">Volume</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.volume}
          onChange={(event) => changeVolume(Number(event.target.value))}
        />
      </label>
      <button
        type="button"
        className={isPlaying ? "playing" : ""}
        onClick={isPlaying ? stop : start}
        aria-pressed={isPlaying}
      >
        {isPlaying ? <FaVolumeUp /> : <FaVolumeMute />}
        <span>{isPlaying ? "Couper" : "Ecouter"}</span>
      </button>
    </aside>
  );
};

export default AmbientSound;
