import {
  calculateCanvasDimensions,
  useResponsive,
  useSwipeDetection,
} from "@/hooks/useResponsive";
import {
  applyAudioSettings,
  cleanupAudio,
  clearAudioSettings,
  getDefaultAudioSettings,
  initializeAudio,
  isAudioInitialized,
  loadAudioSettings,
  playSoundEffect,
  saveAudioSettings,
  setEffectsVolume,
  setMusicVolume,
  setMuted,
  startBackgroundMusic,
  stopBackgroundMusic,
} from "@/services/audioService";
import { type AudioSettings } from "@/types";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("Integration: Responsive Design and Audio System", () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;
  let originalAudioContext: typeof window.AudioContext;
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

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

    // Restore original window dimensions
    Object.defineProperty(window, "innerWidth", {
      value: originalInnerWidth,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: originalInnerHeight,
      writable: true,
    });
  });

  describe("Audio Settings Persistence Flow", () => {
    it("persists and restores audio settings across initializations", () => {
      // Save custom settings
      const customSettings: AudioSettings = {
        effectsVolume: 0.3,
        musicVolume: 0.2,
        isMuted: true,
      };
      expect(saveAudioSettings(customSettings)).toBe(true);

      // First initialization loads saved settings
      expect(initializeAudio()).toBe(true);
      const loadedSettings = loadAudioSettings();
      expect(loadedSettings).toEqual(customSettings);

      // Cleanup and reinitialize
      cleanupAudio();
      expect(isAudioInitialized()).toBe(false);

      // Settings should still be persisted
      const reloadedSettings = loadAudioSettings();
      expect(reloadedSettings).toEqual(customSettings);

      // Second initialization should work with same settings
      expect(initializeAudio()).toBe(true);
      expect(isAudioInitialized()).toBe(true);
    });

    it("handles corrupted localStorage data gracefully", () => {
      // Store corrupted data
      localStorageMock._setStore({
        snake_game_audio_settings: "not valid json {{{",
      });

      // Should return defaults and not throw
      const settings = loadAudioSettings();
      expect(settings).toEqual(getDefaultAudioSettings());

      // Should be able to save new valid settings
      expect(
        saveAudioSettings({
          effectsVolume: 0.5,
          musicVolume: 0.5,
          isMuted: false,
        })
      ).toBe(true);

      // Audio should initialize with cleaned data
      expect(initializeAudio()).toBe(true);
    });

    it("handles full workflow: initialize -> adjust -> save -> reload", () => {
      // Start fresh
      clearAudioSettings();

      // Initialize with defaults
      expect(initializeAudio()).toBe(true);
      let currentSettings = loadAudioSettings();
      expect(currentSettings.effectsVolume).toBe(0.7);

      // Adjust volumes through audio service
      setEffectsVolume(0.4);
      setMusicVolume(0.3);
      setMuted(true);

      // Save adjusted settings
      const newSettings: AudioSettings = {
        effectsVolume: 0.4,
        musicVolume: 0.3,
        isMuted: true,
      };
      expect(saveAudioSettings(newSettings)).toBe(true);

      // Cleanup
      cleanupAudio();

      // Reload and verify
      currentSettings = loadAudioSettings();
      expect(currentSettings).toEqual(newSettings);
    });
  });

  describe("Responsive Canvas Calculations for Different Devices", () => {
    it("calculates correct dimensions for mobile portrait (320x568)", () => {
      const dimensions = calculateCanvasDimensions(320, 568, 800, 600);

      // Minimum width is 320
      expect(dimensions.width).toBe(320);
      expect(dimensions.height).toBe(240);
      expect(dimensions.scale).toBeCloseTo(0.4, 1);
    });

    it("calculates correct dimensions for mobile landscape (568x320)", () => {
      const dimensions = calculateCanvasDimensions(568, 320, 800, 600);

      // Height limited: 320 * (800/600) = 426.67
      expect(dimensions.height).toBe(320);
      expect(dimensions.width).toBe(426);
    });

    it("calculates correct dimensions for tablet portrait (768x1024)", () => {
      const dimensions = calculateCanvasDimensions(768, 1024, 800, 600);

      // Width limited: 768, height = 768 / 1.333 = 576
      expect(dimensions.width).toBe(768);
      expect(dimensions.height).toBe(576);
    });

    it("calculates correct dimensions for desktop (1920x1080)", () => {
      const dimensions = calculateCanvasDimensions(1920, 1080, 800, 600);

      // Height limited: 1080, width = 1080 * 1.333 = 1440
      expect(dimensions.height).toBe(1080);
      expect(dimensions.width).toBe(1440);
    });

    it("calculates correct dimensions for 4K (3840x2160)", () => {
      const dimensions = calculateCanvasDimensions(3840, 2160, 800, 600);

      // Height limited: 2160, width = 2160 * 1.333 = 2880
      expect(dimensions.height).toBe(2160);
      expect(dimensions.width).toBe(2880);
      expect(dimensions.scale).toBeCloseTo(3.6, 1);
    });
  });

  describe("Touch and Swipe Controls Integration", () => {
    let dateNowSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      dateNowSpy = vi.spyOn(Date, "now");
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    const createTouchEvent = (x: number, y: number) => ({
      touches: [{ clientX: x, clientY: y }],
      changedTouches: [{ clientX: x, clientY: y }],
      preventDefault: vi.fn(),
    });

    it("detects all four directional swipes correctly", () => {
      const directions = [
        { start: [100, 100], end: [200, 100], expected: "right" },
        { start: [200, 100], end: [100, 100], expected: "left" },
        { start: [100, 200], end: [100, 100], expected: "up" },
        { start: [100, 100], end: [100, 200], expected: "down" },
      ];

      directions.forEach(({ start, end, expected }) => {
        dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100);

        const { result } = renderHook(() => useSwipeDetection());

        act(() => {
          result.current.handlers.onTouchStart(
            createTouchEvent(start[0], start[1]) as unknown as TouchEvent
          );
        });

        act(() => {
          result.current.handlers.onTouchEnd(
            createTouchEvent(end[0], end[1]) as unknown as TouchEvent
          );
        });

        expect(result.current.swipeDirection).toBe(expected);
      });
    });

    it("works with swipe callback for game control integration", () => {
      dateNowSpy.mockReturnValue(0);

      const directionHistory: string[] = [];
      const handleSwipe = (direction: string | null) => {
        if (direction) directionHistory.push(direction);
      };

      const { result } = renderHook(() => useSwipeDetection(handleSwipe));

      // Simulate rapid game control sequence
      const swipeSequence = [
        { start: [100, 100], end: [200, 100] }, // right
        { start: [100, 100], end: [100, 200] }, // down
        { start: [100, 100], end: [0, 100] }, // left
        { start: [100, 100], end: [100, 0] }, // up
      ];

      swipeSequence.forEach(({ start, end }) => {
        dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100);

        act(() => {
          result.current.handlers.onTouchStart(
            createTouchEvent(start[0], start[1]) as unknown as TouchEvent
          );
        });

        act(() => {
          result.current.handlers.onTouchEnd(
            createTouchEvent(end[0], end[1]) as unknown as TouchEvent
          );
        });
      });

      expect(directionHistory).toEqual(["right", "down", "left", "up"]);
    });
  });

  describe("Responsive Breakpoint Detection", () => {
    const setWindowSize = (width: number, height: number) => {
      Object.defineProperty(window, "innerWidth", {
        value: width,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        value: height,
        writable: true,
        configurable: true,
      });
    };

    it("correctly identifies device categories across breakpoints", () => {
      const testCases = [
        {
          width: 300,
          height: 500,
          expectedBreakpoint: "xs",
          isMobile: true,
          isTablet: false,
          isDesktop: false,
        },
        {
          width: 650,
          height: 800,
          expectedBreakpoint: "sm",
          isMobile: true,
          isTablet: false,
          isDesktop: false,
        },
        {
          width: 900,
          height: 900,
          expectedBreakpoint: "md",
          isMobile: false,
          isTablet: true,
          isDesktop: false,
        },
        {
          width: 1400,
          height: 700,
          expectedBreakpoint: "lg",
          isMobile: false,
          isTablet: false,
          isDesktop: true,
        },
        {
          width: 2000,
          height: 900,
          expectedBreakpoint: "xl",
          isMobile: false,
          isTablet: false,
          isDesktop: true,
        },
        {
          width: 2560,
          height: 1440,
          expectedBreakpoint: "xxl",
          isMobile: false,
          isTablet: false,
          isDesktop: true,
        },
      ];

      testCases.forEach(
        ({
          width,
          height,
          expectedBreakpoint,
          isMobile,
          isTablet,
          isDesktop,
        }) => {
          setWindowSize(width, height);
          const { result } = renderHook(() => useResponsive());

          expect(result.current.breakpoint).toBe(expectedBreakpoint);
          expect(result.current.isMobile).toBe(isMobile);
          expect(result.current.isTablet).toBe(isTablet);
          expect(result.current.isDesktop).toBe(isDesktop);
        }
      );
    });

    it("updates breakpoint on window resize", () => {
      setWindowSize(650, 600);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe("sm");
      expect(result.current.isMobile).toBe(true);

      act(() => {
        setWindowSize(1400, 800);
        window.dispatchEvent(new Event("resize"));
      });

      expect(result.current.breakpoint).toBe("lg");
      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe("Audio and Responsive System Cross-Integration", () => {
    it("audio system works independently of screen size", () => {
      const setWindowSize = (width: number, height: number) => {
        Object.defineProperty(window, "innerWidth", {
          value: width,
          writable: true,
          configurable: true,
        });
        Object.defineProperty(window, "innerHeight", {
          value: height,
          writable: true,
          configurable: true,
        });
      };

      // Initialize audio on mobile
      setWindowSize(320, 568);
      expect(initializeAudio()).toBe(true);

      // Play sounds - should work
      expect(() => playSoundEffect("eat")).not.toThrow();
      expect(() => startBackgroundMusic()).not.toThrow();

      // Resize to desktop
      setWindowSize(1920, 1080);
      window.dispatchEvent(new Event("resize"));

      // Audio should still work
      expect(() => playSoundEffect("collision")).not.toThrow();
      expect(isAudioInitialized()).toBe(true);

      // Stop music and cleanup
      expect(() => stopBackgroundMusic()).not.toThrow();
      cleanupAudio();
    });

    it("maintains audio settings when device orientation changes", () => {
      const setWindowSize = (width: number, height: number) => {
        Object.defineProperty(window, "innerWidth", {
          value: width,
          writable: true,
          configurable: true,
        });
        Object.defineProperty(window, "innerHeight", {
          value: height,
          writable: true,
          configurable: true,
        });
      };

      // Portrait mode
      setWindowSize(375, 812);

      // Set and save audio settings
      const settings: AudioSettings = {
        effectsVolume: 0.6,
        musicVolume: 0.4,
        isMuted: false,
      };
      saveAudioSettings(settings);
      initializeAudio();
      applyAudioSettings(settings);

      // Rotate to landscape
      setWindowSize(812, 375);
      window.dispatchEvent(new Event("resize"));

      // Load settings - should be same
      const reloadedSettings = loadAudioSettings();
      expect(reloadedSettings).toEqual(settings);
    });

    it("calculates appropriate canvas dimensions for audio visualizer overlay", () => {
      // Test that canvas dimensions work for potential audio visualizer integration
      const screenSizes = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 }, // Desktop
        { width: 3840, height: 2160 }, // 4K
      ];

      screenSizes.forEach(({ width, height }) => {
        const dimensions = calculateCanvasDimensions(width, height);

        // All dimensions should be valid
        expect(dimensions.width).toBeGreaterThanOrEqual(320);
        expect(dimensions.height).toBeGreaterThan(0);
        expect(dimensions.scale).toBeGreaterThan(0);

        // Aspect ratio should be maintained (approximately 800/600 = 1.333)
        const aspectRatio = dimensions.width / dimensions.height;
        expect(aspectRatio).toBeCloseTo(800 / 600, 1);
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles localStorage being unavailable", () => {
      // Make localStorage getItem throw - load should return defaults
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("Storage disabled");
      });

      // Should return defaults without crashing
      const settings = loadAudioSettings();
      expect(settings).toEqual(getDefaultAudioSettings());

      // Make localStorage setItem throw - save should fail
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage disabled");
      });

      // Save should gracefully fail
      expect(
        saveAudioSettings({
          effectsVolume: 0.5,
          musicVolume: 0.5,
          isMuted: false,
        })
      ).toBe(false);
    });

    it("handles AudioContext being unavailable", () => {
      // Remove AudioContext
      // @ts-expect-error Testing AudioContext unavailable
      delete window.AudioContext;
      // @ts-expect-error Testing webkitAudioContext unavailable
      delete window.webkitAudioContext;

      cleanupAudio();

      // Should gracefully fail
      expect(initializeAudio()).toBe(false);
      expect(isAudioInitialized()).toBe(false);

      // Sound effects should not throw
      expect(() => playSoundEffect("eat")).not.toThrow();
    });

    it("handles extreme window dimensions", () => {
      const setWindowSize = (width: number, height: number) => {
        Object.defineProperty(window, "innerWidth", {
          value: width,
          writable: true,
          configurable: true,
        });
        Object.defineProperty(window, "innerHeight", {
          value: height,
          writable: true,
          configurable: true,
        });
      };

      // Very small
      setWindowSize(100, 100);
      const { result: smallResult } = renderHook(() => useResponsive());
      expect(smallResult.current.breakpoint).toBe("xs");

      // Very large
      setWindowSize(10000, 5000);
      const { result: largeResult } = renderHook(() => useResponsive());
      expect(largeResult.current.breakpoint).toBe("xxl");
    });

    it("handles rapid successive swipes", () => {
      const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(0);
      const swipeResults: (string | null)[] = [];

      const { result } = renderHook(() =>
        useSwipeDetection((dir) => {
          swipeResults.push(dir);
        })
      );

      const createTouchEvent = (x: number, y: number) => ({
        touches: [{ clientX: x, clientY: y }],
        changedTouches: [{ clientX: x, clientY: y }],
        preventDefault: vi.fn(),
      });

      // Rapid swipes
      for (let i = 0; i < 10; i++) {
        dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100);

        act(() => {
          result.current.handlers.onTouchStart(
            createTouchEvent(100, 100) as unknown as TouchEvent
          );
        });

        act(() => {
          result.current.handlers.onTouchEnd(
            createTouchEvent(200, 100) as unknown as TouchEvent
          );
        });
      }

      expect(swipeResults).toHaveLength(10);
      expect(swipeResults.every((dir) => dir === "right")).toBe(true);

      dateNowSpy.mockRestore();
    });
  });
});
