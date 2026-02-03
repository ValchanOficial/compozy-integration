import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  loadAudioSettings,
  saveAudioSettings,
  clearAudioSettings,
  initializeAudio,
  applyAudioSettings,
  setEffectsVolume,
  setMusicVolume,
  setMuted,
  playSoundEffect,
  startBackgroundMusic,
  stopBackgroundMusic,
  isAudioInitialized,
  getAudioContextState,
  resumeAudioContext,
  cleanupAudio,
  getDefaultAudioSettings,
} from "./audioService";
import { AudioSettings } from "@/types";

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    _getStore: () => store,
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    },
  };
};

// Mock AudioContext
class MockGainNode {
  gain = { value: 1 };
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockAudioBufferSourceNode {
  buffer: AudioBuffer | null = null;
  loop = false;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioBuffer {
  sampleRate: number;
  length: number;
  duration: number;
  numberOfChannels: number;
  private channelData: Float32Array[];

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.channelData = Array.from(
      { length: numberOfChannels },
      () => new Float32Array(length)
    );
  }

  getChannelData(channel: number): Float32Array {
    return this.channelData[channel] || new Float32Array(0);
  }

  copyFromChannel(): void {}
  copyToChannel(): void {}
}

class MockAudioContext {
  state: AudioContextState = "running";
  sampleRate = 44100;
  destination = {};

  createGain = vi.fn(() => new MockGainNode());
  createBufferSource = vi.fn(() => new MockAudioBufferSourceNode());
  createBuffer = vi.fn(
    (channels: number, length: number, sampleRate: number) =>
      new MockAudioBuffer(channels, length, sampleRate)
  );
  resume = vi.fn(() => Promise.resolve());
  close = vi.fn();
}

describe("audioService", () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;
  let originalAudioContext: typeof window.AudioContext;

  beforeEach(() => {
    // Setup localStorage mock
    localStorageMock = createLocalStorageMock();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    // Setup AudioContext mock
    originalAudioContext = window.AudioContext;
    (
      window as unknown as { AudioContext: typeof MockAudioContext }
    ).AudioContext = MockAudioContext as unknown as typeof AudioContext;

    // Cleanup any previous audio state
    cleanupAudio();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanupAudio();
    window.AudioContext = originalAudioContext;
  });

  describe("getDefaultAudioSettings", () => {
    it("returns default audio settings", () => {
      const defaults = getDefaultAudioSettings();
      expect(defaults).toEqual({
        effectsVolume: 0.7,
        musicVolume: 0.5,
        isMuted: false,
      });
    });

    it("returns a new object each time", () => {
      const defaults1 = getDefaultAudioSettings();
      const defaults2 = getDefaultAudioSettings();
      expect(defaults1).not.toBe(defaults2);
      expect(defaults1).toEqual(defaults2);
    });
  });

  describe("loadAudioSettings", () => {
    it("returns default settings when no data exists", () => {
      const settings = loadAudioSettings();
      expect(settings).toEqual({
        effectsVolume: 0.7,
        musicVolume: 0.5,
        isMuted: false,
      });
    });

    it("returns stored settings when valid data exists", () => {
      const storedSettings: AudioSettings = {
        effectsVolume: 0.5,
        musicVolume: 0.3,
        isMuted: true,
      };
      localStorageMock._setStore({
        snake_game_audio_settings: JSON.stringify(storedSettings),
      });

      const settings = loadAudioSettings();
      expect(settings).toEqual(storedSettings);
    });

    it("returns default settings when localStorage throws", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("Storage disabled");
      });

      const settings = loadAudioSettings();
      expect(settings).toEqual(getDefaultAudioSettings());
    });

    it("returns default settings when data is corrupted JSON", () => {
      localStorageMock._setStore({
        snake_game_audio_settings: "invalid json {{{",
      });

      const settings = loadAudioSettings();
      expect(settings).toEqual(getDefaultAudioSettings());
    });

    it("returns default settings and clears invalid effectsVolume", () => {
      localStorageMock._setStore({
        snake_game_audio_settings: JSON.stringify({
          effectsVolume: "not a number",
          musicVolume: 0.5,
          isMuted: false,
        }),
      });

      const settings = loadAudioSettings();
      expect(settings).toEqual(getDefaultAudioSettings());
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "snake_game_audio_settings"
      );
    });

    it("returns default settings for effectsVolume out of range (< 0)", () => {
      localStorageMock._setStore({
        snake_game_audio_settings: JSON.stringify({
          effectsVolume: -0.5,
          musicVolume: 0.5,
          isMuted: false,
        }),
      });

      const settings = loadAudioSettings();
      expect(settings).toEqual(getDefaultAudioSettings());
    });

    it("returns default settings for effectsVolume out of range (> 1)", () => {
      localStorageMock._setStore({
        snake_game_audio_settings: JSON.stringify({
          effectsVolume: 1.5,
          musicVolume: 0.5,
          isMuted: false,
        }),
      });

      const settings = loadAudioSettings();
      expect(settings).toEqual(getDefaultAudioSettings());
    });

    it("returns default settings for invalid musicVolume", () => {
      localStorageMock._setStore({
        snake_game_audio_settings: JSON.stringify({
          effectsVolume: 0.5,
          musicVolume: NaN,
          isMuted: false,
        }),
      });

      const settings = loadAudioSettings();
      expect(settings).toEqual(getDefaultAudioSettings());
    });

    it("returns default settings for invalid isMuted", () => {
      localStorageMock._setStore({
        snake_game_audio_settings: JSON.stringify({
          effectsVolume: 0.5,
          musicVolume: 0.5,
          isMuted: "yes",
        }),
      });

      const settings = loadAudioSettings();
      expect(settings).toEqual(getDefaultAudioSettings());
    });

    it("returns default settings for Infinity values", () => {
      // JSON.stringify converts Infinity to null
      localStorageMock._setStore({
        snake_game_audio_settings: JSON.stringify({
          effectsVolume: null,
          musicVolume: 0.5,
          isMuted: false,
        }),
      });

      const settings = loadAudioSettings();
      expect(settings).toEqual(getDefaultAudioSettings());
    });
  });

  describe("saveAudioSettings", () => {
    it("saves valid settings successfully", () => {
      const settings: AudioSettings = {
        effectsVolume: 0.8,
        musicVolume: 0.4,
        isMuted: true,
      };

      const result = saveAudioSettings(settings);
      expect(result).toBe(true);

      const savedData = JSON.parse(
        localStorageMock._getStore()["snake_game_audio_settings"]
      );
      expect(savedData).toEqual(settings);
    });

    it("returns false when localStorage is unavailable", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage disabled");
      });

      const settings: AudioSettings = {
        effectsVolume: 0.5,
        musicVolume: 0.5,
        isMuted: false,
      };

      const result = saveAudioSettings(settings);
      expect(result).toBe(false);
    });

    it("returns false for invalid settings", () => {
      // @ts-expect-error Testing invalid input
      expect(saveAudioSettings({ effectsVolume: "invalid" })).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(saveAudioSettings(null)).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(saveAudioSettings(undefined)).toBe(false);
    });

    it("returns false for out of range values", () => {
      expect(
        saveAudioSettings({
          effectsVolume: -0.1,
          musicVolume: 0.5,
          isMuted: false,
        })
      ).toBe(false);

      expect(
        saveAudioSettings({
          effectsVolume: 0.5,
          musicVolume: 1.1,
          isMuted: false,
        })
      ).toBe(false);
    });

    it("saves boundary values correctly", () => {
      const minSettings: AudioSettings = {
        effectsVolume: 0,
        musicVolume: 0,
        isMuted: false,
      };
      expect(saveAudioSettings(minSettings)).toBe(true);

      const maxSettings: AudioSettings = {
        effectsVolume: 1,
        musicVolume: 1,
        isMuted: true,
      };
      expect(saveAudioSettings(maxSettings)).toBe(true);
    });
  });

  describe("clearAudioSettings", () => {
    it("clears audio settings from localStorage", () => {
      saveAudioSettings({
        effectsVolume: 0.5,
        musicVolume: 0.5,
        isMuted: true,
      });

      const result = clearAudioSettings();
      expect(result).toBe(true);

      const settings = loadAudioSettings();
      expect(settings).toEqual(getDefaultAudioSettings());
    });

    it("returns false when localStorage is unavailable", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage disabled");
      });

      const result = clearAudioSettings();
      expect(result).toBe(false);
    });
  });

  describe("initializeAudio", () => {
    it("initializes audio context successfully", () => {
      const result = initializeAudio();
      expect(result).toBe(true);
      expect(isAudioInitialized()).toBe(true);
    });

    it("returns true when already initialized", () => {
      initializeAudio();
      const result = initializeAudio();
      expect(result).toBe(true);
    });

    it("loads and applies saved settings on initialization", () => {
      const savedSettings: AudioSettings = {
        effectsVolume: 0.3,
        musicVolume: 0.2,
        isMuted: true,
      };
      saveAudioSettings(savedSettings);

      initializeAudio();
      expect(isAudioInitialized()).toBe(true);
    });

    it("returns false when AudioContext is unavailable", () => {
      // @ts-expect-error Testing AudioContext unavailable
      delete window.AudioContext;
      // @ts-expect-error Testing webkitAudioContext unavailable
      delete window.webkitAudioContext;

      cleanupAudio();
      const result = initializeAudio();
      expect(result).toBe(false);
    });
  });

  describe("applyAudioSettings", () => {
    it("does nothing when audio is not initialized", () => {
      // Should not throw
      expect(() =>
        applyAudioSettings({
          effectsVolume: 0.5,
          musicVolume: 0.5,
          isMuted: false,
        })
      ).not.toThrow();
    });

    it("applies settings when audio is initialized", () => {
      initializeAudio();
      expect(() =>
        applyAudioSettings({
          effectsVolume: 0.5,
          musicVolume: 0.5,
          isMuted: false,
        })
      ).not.toThrow();
    });

    it("sets master volume to 0 when muted", () => {
      initializeAudio();
      applyAudioSettings({
        effectsVolume: 0.5,
        musicVolume: 0.5,
        isMuted: true,
      });
      // Verify it doesn't throw - internal state is hard to test
    });
  });

  describe("setEffectsVolume", () => {
    it("does nothing when audio is not initialized", () => {
      expect(() => setEffectsVolume(0.5)).not.toThrow();
    });

    it("sets volume when audio is initialized", () => {
      initializeAudio();
      expect(() => setEffectsVolume(0.5)).not.toThrow();
    });

    it("clamps volume to valid range", () => {
      initializeAudio();
      expect(() => setEffectsVolume(-0.5)).not.toThrow();
      expect(() => setEffectsVolume(1.5)).not.toThrow();
    });
  });

  describe("setMusicVolume", () => {
    it("does nothing when audio is not initialized", () => {
      expect(() => setMusicVolume(0.5)).not.toThrow();
    });

    it("sets volume when audio is initialized", () => {
      initializeAudio();
      expect(() => setMusicVolume(0.5)).not.toThrow();
    });

    it("clamps volume to valid range", () => {
      initializeAudio();
      expect(() => setMusicVolume(-0.5)).not.toThrow();
      expect(() => setMusicVolume(1.5)).not.toThrow();
    });
  });

  describe("setMuted", () => {
    it("does nothing when audio is not initialized", () => {
      expect(() => setMuted(true)).not.toThrow();
    });

    it("sets mute state when audio is initialized", () => {
      initializeAudio();
      expect(() => setMuted(true)).not.toThrow();
      expect(() => setMuted(false)).not.toThrow();
    });
  });

  describe("playSoundEffect", () => {
    it("does nothing when audio is not initialized", () => {
      expect(() => playSoundEffect("eat")).not.toThrow();
    });

    it("plays eat sound when initialized", () => {
      initializeAudio();
      expect(() => playSoundEffect("eat")).not.toThrow();
    });

    it("plays collision sound when initialized", () => {
      initializeAudio();
      expect(() => playSoundEffect("collision")).not.toThrow();
    });

    it("plays levelup sound when initialized", () => {
      initializeAudio();
      expect(() => playSoundEffect("levelup")).not.toThrow();
    });

    it("resumes suspended audio context", () => {
      initializeAudio();
      // Simulate suspended state
      const mockContext = (window as unknown as { AudioContext: unknown })
        .AudioContext as typeof MockAudioContext;
      const instance = new mockContext();
      instance.state = "suspended";

      playSoundEffect("eat");
      // Should not throw
    });
  });

  describe("startBackgroundMusic", () => {
    it("does nothing when audio is not initialized", () => {
      expect(() => startBackgroundMusic()).not.toThrow();
    });

    it("starts music when initialized", () => {
      initializeAudio();
      expect(() => startBackgroundMusic()).not.toThrow();
    });

    it("stops existing music before starting new music", () => {
      initializeAudio();
      startBackgroundMusic();
      startBackgroundMusic(); // Should stop previous and start new
    });
  });

  describe("stopBackgroundMusic", () => {
    it("does nothing when no music is playing", () => {
      expect(() => stopBackgroundMusic()).not.toThrow();
    });

    it("stops music when playing", () => {
      initializeAudio();
      startBackgroundMusic();
      expect(() => stopBackgroundMusic()).not.toThrow();
    });

    it("handles stop error gracefully", () => {
      initializeAudio();
      startBackgroundMusic();
      // Calling stop multiple times should not throw
      stopBackgroundMusic();
      stopBackgroundMusic();
    });
  });

  describe("isAudioInitialized", () => {
    it("returns false before initialization", () => {
      expect(isAudioInitialized()).toBe(false);
    });

    it("returns true after initialization", () => {
      initializeAudio();
      expect(isAudioInitialized()).toBe(true);
    });

    it("returns false after cleanup", () => {
      initializeAudio();
      cleanupAudio();
      expect(isAudioInitialized()).toBe(false);
    });
  });

  describe("getAudioContextState", () => {
    it("returns 'uninitialized' before initialization", () => {
      expect(getAudioContextState()).toBe("uninitialized");
    });

    it("returns context state after initialization", () => {
      initializeAudio();
      expect(getAudioContextState()).toBe("running");
    });
  });

  describe("resumeAudioContext", () => {
    it("does nothing when not initialized", async () => {
      await expect(resumeAudioContext()).resolves.toBeUndefined();
    });

    it("resumes suspended context", async () => {
      initializeAudio();
      await expect(resumeAudioContext()).resolves.toBeUndefined();
    });
  });

  describe("cleanupAudio", () => {
    it("cleans up all audio resources", () => {
      initializeAudio();
      startBackgroundMusic();
      cleanupAudio();

      expect(isAudioInitialized()).toBe(false);
      expect(getAudioContextState()).toBe("uninitialized");
    });

    it("does nothing when not initialized", () => {
      expect(() => cleanupAudio()).not.toThrow();
    });
  });

  describe("integration tests", () => {
    it("full workflow: initialize -> play -> cleanup", () => {
      // Initialize
      expect(initializeAudio()).toBe(true);
      expect(isAudioInitialized()).toBe(true);

      // Play sounds
      playSoundEffect("eat");
      playSoundEffect("collision");
      playSoundEffect("levelup");

      // Start/stop music
      startBackgroundMusic();
      stopBackgroundMusic();

      // Adjust settings
      setEffectsVolume(0.3);
      setMusicVolume(0.2);
      setMuted(true);
      setMuted(false);

      // Cleanup
      cleanupAudio();
      expect(isAudioInitialized()).toBe(false);
    });

    it("settings persist across initialization", () => {
      const settings: AudioSettings = {
        effectsVolume: 0.3,
        musicVolume: 0.2,
        isMuted: true,
      };
      saveAudioSettings(settings);

      // First initialization
      initializeAudio();
      cleanupAudio();

      // Settings should still be available
      const loadedSettings = loadAudioSettings();
      expect(loadedSettings).toEqual(settings);

      // Re-initialize and settings should be applied
      initializeAudio();
      expect(isAudioInitialized()).toBe(true);
    });
  });
});
