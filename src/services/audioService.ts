import { type AudioSettings } from "@/types";

/**
 * LocalStorage key for audio settings persistence.
 */
const AUDIO_SETTINGS_KEY = "snake_game_audio_settings";

/**
 * Default audio settings.
 */
const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  effectsVolume: 0.7,
  musicVolume: 0.5,
  isMuted: false,
};

/**
 * Audio context and nodes for web audio API.
 */
let audioContext: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let effectsGainNode: GainNode | null = null;
let musicGainNode: GainNode | null = null;
let currentMusicSource: AudioBufferSourceNode | null = null;
let isInitialized = false;

/**
 * Audio buffers cache for loaded sounds.
 */
const audioBuffers: Map<string, AudioBuffer> = new Map();

/**
 * Checks if LocalStorage is available.
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__audio_storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates audio settings object structure.
 */
function isValidAudioSettings(value: unknown): value is AudioSettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.effectsVolume === "number" &&
    Number.isFinite(obj.effectsVolume) &&
    obj.effectsVolume >= 0 &&
    obj.effectsVolume <= 1 &&
    typeof obj.musicVolume === "number" &&
    Number.isFinite(obj.musicVolume) &&
    obj.musicVolume >= 0 &&
    obj.musicVolume <= 1 &&
    typeof obj.isMuted === "boolean"
  );
}

/**
 * Loads audio settings from LocalStorage.
 * @returns AudioSettings object with saved or default values
 */
export function loadAudioSettings(): AudioSettings {
  if (!isLocalStorageAvailable()) {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(AUDIO_SETTINGS_KEY);

    if (raw === null) {
      return { ...DEFAULT_AUDIO_SETTINGS };
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isValidAudioSettings(parsed)) {
      // Data is corrupted, remove it and return defaults
      window.localStorage.removeItem(AUDIO_SETTINGS_KEY);
      return { ...DEFAULT_AUDIO_SETTINGS };
    }

    return { ...parsed };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

/**
 * Saves audio settings to LocalStorage.
 * @param settings - The audio settings to save
 * @returns true if settings were saved successfully
 */
export function saveAudioSettings(settings: AudioSettings): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  // Validate settings before saving
  if (!isValidAudioSettings(settings)) {
    return false;
  }

  try {
    window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears audio settings from LocalStorage.
 * @returns true if settings were cleared
 */
export function clearAudioSettings(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(AUDIO_SETTINGS_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Initializes the Web Audio API context and gain nodes.
 * Must be called in response to a user gesture (click/touch).
 * @returns true if initialization was successful
 */
export function initializeAudio(): boolean {
  if (isInitialized && audioContext) {
    return true;
  }

  try {
    // Create audio context
    audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();

    // Create master gain node
    masterGainNode = audioContext.createGain();
    masterGainNode.connect(audioContext.destination);

    // Create effects gain node
    effectsGainNode = audioContext.createGain();
    effectsGainNode.connect(masterGainNode);

    // Create music gain node
    musicGainNode = audioContext.createGain();
    musicGainNode.connect(masterGainNode);

    // Load saved settings and apply
    const settings = loadAudioSettings();
    applyAudioSettings(settings);

    isInitialized = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * Applies audio settings to the gain nodes.
 * @param settings - The audio settings to apply
 */
export function applyAudioSettings(settings: AudioSettings): void {
  if (!isInitialized || !masterGainNode || !effectsGainNode || !musicGainNode) {
    return;
  }

  // Apply mute by setting master volume to 0
  masterGainNode.gain.value = settings.isMuted ? 0 : 1;

  // Apply individual volumes
  effectsGainNode.gain.value = settings.effectsVolume;
  musicGainNode.gain.value = settings.musicVolume;
}

/**
 * Sets the effects volume.
 * @param volume - Volume level (0-1)
 */
export function setEffectsVolume(volume: number): void {
  if (!effectsGainNode) return;
  const clampedVolume = Math.max(0, Math.min(1, volume));
  effectsGainNode.gain.value = clampedVolume;
}

/**
 * Sets the music volume.
 * @param volume - Volume level (0-1)
 */
export function setMusicVolume(volume: number): void {
  if (!musicGainNode) return;
  const clampedVolume = Math.max(0, Math.min(1, volume));
  musicGainNode.gain.value = clampedVolume;
}

/**
 * Sets the mute state.
 * @param muted - Whether audio should be muted
 */
export function setMuted(muted: boolean): void {
  if (!masterGainNode) return;
  masterGainNode.gain.value = muted ? 0 : 1;
}

/**
 * Generates a simple tone for sound effects.
 * This replaces the need for external audio files.
 * @param frequency - Frequency in Hz
 * @param duration - Duration in seconds
 * @param type - Oscillator wave type
 * @returns AudioBuffer with the generated tone
 */
function generateTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine"
): AudioBuffer | null {
  if (!audioContext) return null;

  const sampleRate = audioContext.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // Apply envelope (attack-decay-sustain-release)
    const envelope =
      i < length * 0.1
        ? i / (length * 0.1) // Attack
        : Math.pow(1 - (i - length * 0.1) / (length * 0.9), 0.5); // Decay

    let sample = 0;
    switch (type) {
      case "sine":
        sample = Math.sin(2 * Math.PI * frequency * t);
        break;
      case "square":
        sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
        break;
      case "sawtooth":
        sample = 2 * ((frequency * t) % 1) - 1;
        break;
      case "triangle":
        sample = 2 * Math.abs(2 * ((frequency * t) % 1) - 1) - 1;
        break;
    }
    data[i] = sample * envelope * 0.3; // Reduce overall volume
  }

  return buffer;
}

/**
 * Pre-generates sound effect buffers.
 */
function ensureSoundBuffers(): void {
  if (!audioContext || audioBuffers.size > 0) return;

  // Eat sound - pleasant ascending tone
  const eatBuffer = generateTone(880, 0.1, "sine");
  if (eatBuffer) audioBuffers.set("eat", eatBuffer);

  // Collision sound - lower pitched buzz
  const collisionBuffer = generateTone(220, 0.3, "square");
  if (collisionBuffer) audioBuffers.set("collision", collisionBuffer);

  // Level up sound - two ascending tones
  const levelUpBuffer = audioContext.createBuffer(
    1,
    Math.floor(audioContext.sampleRate * 0.4),
    audioContext.sampleRate
  );
  const levelUpData = levelUpBuffer.getChannelData(0);
  const levelUpLength = levelUpBuffer.length;
  const levelUpSampleRate = audioContext.sampleRate;

  for (let i = 0; i < levelUpLength; i++) {
    const t = i / levelUpSampleRate;
    const freq = i < levelUpLength / 2 ? 523 : 784; // C5 then G5
    const localT = i < levelUpLength / 2 ? t : t - 0.2;
    const envelope =
      localT < 0.05 ? localT / 0.05 : Math.pow(1 - (localT - 0.05) / 0.15, 0.5);
    levelUpData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
  }
  audioBuffers.set("levelup", levelUpBuffer);
}

/**
 * Plays a sound effect.
 * @param soundId - The sound effect identifier ('eat', 'collision', 'levelup')
 */
export function playSoundEffect(
  soundId: "eat" | "collision" | "levelup"
): void {
  if (!isInitialized || !audioContext || !effectsGainNode) {
    return;
  }

  // Resume audio context if suspended (browser autoplay policy)
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  ensureSoundBuffers();

  const buffer = audioBuffers.get(soundId);
  if (!buffer) return;

  try {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(effectsGainNode);
    source.start(0);
  } catch {
    // Silently fail if audio playback fails
  }
}

/**
 * Starts playing background music.
 * Music is generated procedurally using a simple melody pattern.
 */
export function startBackgroundMusic(): void {
  if (!isInitialized || !audioContext || !musicGainNode) {
    return;
  }

  // Stop existing music first
  stopBackgroundMusic();

  // Resume audio context if suspended
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  try {
    // Generate a simple looping music pattern
    const bpm = 120;
    const beatDuration = 60 / bpm;
    const patternLength = 8; // 8 beats
    const totalDuration = beatDuration * patternLength;

    const sampleRate = audioContext.sampleRate;
    const length = Math.floor(sampleRate * totalDuration);
    const musicBuffer = audioContext.createBuffer(1, length, sampleRate);
    const data = musicBuffer.getChannelData(0);

    // Simple melody notes (frequencies in Hz)
    const melody = [262, 330, 392, 330, 262, 330, 392, 494]; // C4, E4, G4, E4, C4, E4, G4, B4

    for (let beat = 0; beat < patternLength; beat++) {
      const startSample = Math.floor(beat * beatDuration * sampleRate);
      const noteDuration = beatDuration * 0.8;
      const noteLength = Math.floor(noteDuration * sampleRate);
      const freq = melody[beat];

      for (let i = 0; i < noteLength && startSample + i < length; i++) {
        const t = i / sampleRate;
        // Simple envelope
        const envelope =
          i < noteLength * 0.1
            ? i / (noteLength * 0.1)
            : i > noteLength * 0.7
              ? (noteLength - i) / (noteLength * 0.3)
              : 1;
        data[startSample + i] =
          Math.sin(2 * Math.PI * freq * t) * envelope * 0.15;
      }
    }

    currentMusicSource = audioContext.createBufferSource();
    currentMusicSource.buffer = musicBuffer;
    currentMusicSource.loop = true;
    currentMusicSource.connect(musicGainNode);
    currentMusicSource.start(0);
  } catch {
    // Silently fail if music playback fails
  }
}

/**
 * Stops the background music.
 */
export function stopBackgroundMusic(): void {
  if (currentMusicSource) {
    try {
      currentMusicSource.stop();
    } catch {
      // May throw if already stopped
    }
    currentMusicSource = null;
  }
}

/**
 * Checks if audio is initialized.
 * @returns true if audio system is initialized
 */
export function isAudioInitialized(): boolean {
  return isInitialized;
}

/**
 * Gets the current audio context state.
 * @returns AudioContext state or 'uninitialized' if not initialized
 */
export function getAudioContextState(): AudioContextState | "uninitialized" {
  if (!audioContext) return "uninitialized";
  return audioContext.state;
}

/**
 * Resumes the audio context (needed after browser autoplay policy blocks).
 * @returns Promise that resolves when context is resumed
 */
export async function resumeAudioContext(): Promise<void> {
  if (audioContext && audioContext.state === "suspended") {
    await audioContext.resume();
  }
}

/**
 * Cleans up audio resources.
 * Should be called when the application is unmounting.
 */
export function cleanupAudio(): void {
  stopBackgroundMusic();

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  masterGainNode = null;
  effectsGainNode = null;
  musicGainNode = null;
  audioBuffers.clear();
  isInitialized = false;
}

/**
 * Gets the default audio settings.
 * @returns Default audio settings object
 */
export function getDefaultAudioSettings(): AudioSettings {
  return { ...DEFAULT_AUDIO_SETTINGS };
}
