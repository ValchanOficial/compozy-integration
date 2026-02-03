import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AudioControls } from "./AudioControls";
import { useGameStore } from "@/stores/gameStore";
import { AudioSettings } from "@/types";

// Mock the game store
vi.mock("@/stores/gameStore", () => ({
  useGameStore: vi.fn(),
}));

describe("AudioControls", () => {
  const mockSetEffectsVolume = vi.fn();
  const mockSetMusicVolume = vi.fn();
  const mockToggleMuted = vi.fn();

  const defaultAudioSettings: AudioSettings = {
    effectsVolume: 0.7,
    musicVolume: 0.5,
    isMuted: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementation
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: { audioSettings: AudioSettings }) => unknown) => {
        const state = {
          audioSettings: defaultAudioSettings,
          setEffectsVolume: mockSetEffectsVolume,
          setMusicVolume: mockSetMusicVolume,
          toggleMuted: mockToggleMuted,
        };
        return selector(state as Parameters<typeof selector>[0]);
      }
    );
  });

  describe("full mode (default)", () => {
    it("renders audio controls container", () => {
      render(<AudioControls />);

      expect(screen.getByTestId("audio-controls")).toBeInTheDocument();
    });

    it("displays Audio Settings title", () => {
      render(<AudioControls />);

      expect(screen.getByText("Audio Settings")).toBeInTheDocument();
    });

    it("renders effects volume slider", () => {
      render(<AudioControls />);

      const slider = screen.getByTestId("effects-volume-slider");
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveValue("0.7");
    });

    it("renders music volume slider", () => {
      render(<AudioControls />);

      const slider = screen.getByTestId("music-volume-slider");
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveValue("0.5");
    });

    it("displays volume percentages", () => {
      render(<AudioControls />);

      expect(screen.getByText("70%")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("calls setEffectsVolume when effects slider changes", () => {
      render(<AudioControls />);

      const slider = screen.getByTestId("effects-volume-slider");
      fireEvent.change(slider, { target: { value: "0.5" } });

      expect(mockSetEffectsVolume).toHaveBeenCalledWith(0.5);
    });

    it("calls setMusicVolume when music slider changes", () => {
      render(<AudioControls />);

      const slider = screen.getByTestId("music-volume-slider");
      fireEvent.change(slider, { target: { value: "0.3" } });

      expect(mockSetMusicVolume).toHaveBeenCalledWith(0.3);
    });

    it("renders mute button with Mute All text when unmuted", () => {
      render(<AudioControls />);

      const muteButton = screen.getByTestId("mute-button");
      expect(muteButton).toBeInTheDocument();
      expect(screen.getByText("Mute All")).toBeInTheDocument();
    });

    it("calls toggleMuted when mute button is clicked", () => {
      render(<AudioControls />);

      const muteButton = screen.getByTestId("mute-button");
      fireEvent.click(muteButton);

      expect(mockToggleMuted).toHaveBeenCalled();
    });

    it("disables sliders when muted", () => {
      (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: { audioSettings: AudioSettings }) => unknown) => {
          const state = {
            audioSettings: { ...defaultAudioSettings, isMuted: true },
            setEffectsVolume: mockSetEffectsVolume,
            setMusicVolume: mockSetMusicVolume,
            toggleMuted: mockToggleMuted,
          };
          return selector(state as Parameters<typeof selector>[0]);
        }
      );

      render(<AudioControls />);

      expect(screen.getByTestId("effects-volume-slider")).toBeDisabled();
      expect(screen.getByTestId("music-volume-slider")).toBeDisabled();
    });

    it("shows Unmute All text when muted", () => {
      (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: { audioSettings: AudioSettings }) => unknown) => {
          const state = {
            audioSettings: { ...defaultAudioSettings, isMuted: true },
            setEffectsVolume: mockSetEffectsVolume,
            setMusicVolume: mockSetMusicVolume,
            toggleMuted: mockToggleMuted,
          };
          return selector(state as Parameters<typeof selector>[0]);
        }
      );

      render(<AudioControls />);

      expect(screen.getByText("Unmute All")).toBeInTheDocument();
    });

    it("applies muted class to mute button when muted", () => {
      (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: { audioSettings: AudioSettings }) => unknown) => {
          const state = {
            audioSettings: { ...defaultAudioSettings, isMuted: true },
            setEffectsVolume: mockSetEffectsVolume,
            setMusicVolume: mockSetMusicVolume,
            toggleMuted: mockToggleMuted,
          };
          return selector(state as Parameters<typeof selector>[0]);
        }
      );

      render(<AudioControls />);

      const muteButton = screen.getByTestId("mute-button");
      expect(muteButton).toHaveClass("muted");
    });

    it("has proper aria-pressed attribute on mute button", () => {
      render(<AudioControls />);

      const muteButton = screen.getByTestId("mute-button");
      expect(muteButton).toHaveAttribute("aria-pressed", "false");
    });

    it("has proper aria-pressed when muted", () => {
      (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: { audioSettings: AudioSettings }) => unknown) => {
          const state = {
            audioSettings: { ...defaultAudioSettings, isMuted: true },
            setEffectsVolume: mockSetEffectsVolume,
            setMusicVolume: mockSetMusicVolume,
            toggleMuted: mockToggleMuted,
          };
          return selector(state as Parameters<typeof selector>[0]);
        }
      );

      render(<AudioControls />);

      const muteButton = screen.getByTestId("mute-button");
      expect(muteButton).toHaveAttribute("aria-pressed", "true");
    });

    it("applies custom className", () => {
      render(<AudioControls className="custom-class" />);

      const controls = screen.getByTestId("audio-controls");
      expect(controls).toHaveClass("custom-class");
    });

    it("has accessible labels on sliders", () => {
      render(<AudioControls />);

      expect(
        screen.getByRole("slider", { name: "Sound effects volume" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("slider", { name: "Music volume" })
      ).toBeInTheDocument();
    });
  });

  describe("compact mode", () => {
    it("renders compact version with just mute button", () => {
      render(<AudioControls compact />);

      expect(screen.getByTestId("audio-controls")).toHaveClass(
        "audio-controls--compact"
      );
      expect(screen.getByTestId("mute-button")).toBeInTheDocument();
    });

    it("does not render sliders in compact mode", () => {
      render(<AudioControls compact />);

      expect(
        screen.queryByTestId("effects-volume-slider")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("music-volume-slider")
      ).not.toBeInTheDocument();
    });

    it("does not render title in compact mode", () => {
      render(<AudioControls compact />);

      expect(screen.queryByText("Audio Settings")).not.toBeInTheDocument();
    });

    it("calls toggleMuted when compact mute button is clicked", () => {
      render(<AudioControls compact />);

      const muteButton = screen.getByTestId("mute-button");
      fireEvent.click(muteButton);

      expect(mockToggleMuted).toHaveBeenCalled();
    });

    it("has accessible aria-label for mute button when unmuted", () => {
      render(<AudioControls compact />);

      const muteButton = screen.getByTestId("mute-button");
      expect(muteButton).toHaveAttribute("aria-label", "Mute audio");
    });

    it("has accessible aria-label for mute button when muted", () => {
      (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: { audioSettings: AudioSettings }) => unknown) => {
          const state = {
            audioSettings: { ...defaultAudioSettings, isMuted: true },
            setEffectsVolume: mockSetEffectsVolume,
            setMusicVolume: mockSetMusicVolume,
            toggleMuted: mockToggleMuted,
          };
          return selector(state as Parameters<typeof selector>[0]);
        }
      );

      render(<AudioControls compact />);

      const muteButton = screen.getByTestId("mute-button");
      expect(muteButton).toHaveAttribute("aria-label", "Unmute audio");
    });

    it("applies custom className in compact mode", () => {
      render(<AudioControls compact className="compact-custom" />);

      const controls = screen.getByTestId("audio-controls");
      expect(controls).toHaveClass("compact-custom");
    });

    it("applies muted class in compact mode when muted", () => {
      (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: { audioSettings: AudioSettings }) => unknown) => {
          const state = {
            audioSettings: { ...defaultAudioSettings, isMuted: true },
            setEffectsVolume: mockSetEffectsVolume,
            setMusicVolume: mockSetMusicVolume,
            toggleMuted: mockToggleMuted,
          };
          return selector(state as Parameters<typeof selector>[0]);
        }
      );

      render(<AudioControls compact />);

      const muteButton = screen.getByTestId("mute-button");
      expect(muteButton).toHaveClass("muted");
    });
  });

  describe("volume icon states", () => {
    it("shows low volume icon when volume is low", () => {
      (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: { audioSettings: AudioSettings }) => unknown) => {
          const state = {
            audioSettings: {
              effectsVolume: 0.3,
              musicVolume: 0.2,
              isMuted: false,
            },
            setEffectsVolume: mockSetEffectsVolume,
            setMusicVolume: mockSetMusicVolume,
            toggleMuted: mockToggleMuted,
          };
          return selector(state as Parameters<typeof selector>[0]);
        }
      );

      render(<AudioControls />);

      const muteButton = screen.getByTestId("mute-button");
      expect(muteButton.querySelector("svg")).toBeInTheDocument();
    });

    it("shows muted icon when muted", () => {
      (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: { audioSettings: AudioSettings }) => unknown) => {
          const state = {
            audioSettings: { ...defaultAudioSettings, isMuted: true },
            setEffectsVolume: mockSetEffectsVolume,
            setMusicVolume: mockSetMusicVolume,
            toggleMuted: mockToggleMuted,
          };
          return selector(state as Parameters<typeof selector>[0]);
        }
      );

      render(<AudioControls />);

      const muteButton = screen.getByTestId("mute-button");
      expect(muteButton.querySelector("svg")).toBeInTheDocument();
    });

    it("shows volume icon when volume is 0 (but not muted)", () => {
      (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: { audioSettings: AudioSettings }) => unknown) => {
          const state = {
            audioSettings: {
              effectsVolume: 0,
              musicVolume: 0,
              isMuted: false,
            },
            setEffectsVolume: mockSetEffectsVolume,
            setMusicVolume: mockSetMusicVolume,
            toggleMuted: mockToggleMuted,
          };
          return selector(state as Parameters<typeof selector>[0]);
        }
      );

      render(<AudioControls />);

      expect(screen.getByText("Mute All")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles volume at 0%", () => {
      (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: { audioSettings: AudioSettings }) => unknown) => {
          const state = {
            audioSettings: {
              effectsVolume: 0,
              musicVolume: 0,
              isMuted: false,
            },
            setEffectsVolume: mockSetEffectsVolume,
            setMusicVolume: mockSetMusicVolume,
            toggleMuted: mockToggleMuted,
          };
          return selector(state as Parameters<typeof selector>[0]);
        }
      );

      render(<AudioControls />);

      expect(screen.getAllByText("0%")).toHaveLength(2);
    });

    it("handles volume at 100%", () => {
      (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: { audioSettings: AudioSettings }) => unknown) => {
          const state = {
            audioSettings: {
              effectsVolume: 1,
              musicVolume: 1,
              isMuted: false,
            },
            setEffectsVolume: mockSetEffectsVolume,
            setMusicVolume: mockSetMusicVolume,
            toggleMuted: mockToggleMuted,
          };
          return selector(state as Parameters<typeof selector>[0]);
        }
      );

      render(<AudioControls />);

      expect(screen.getAllByText("100%")).toHaveLength(2);
    });

    it("handles slider precision correctly", () => {
      (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: { audioSettings: AudioSettings }) => unknown) => {
          const state = {
            audioSettings: {
              effectsVolume: 0.333,
              musicVolume: 0.666,
              isMuted: false,
            },
            setEffectsVolume: mockSetEffectsVolume,
            setMusicVolume: mockSetMusicVolume,
            toggleMuted: mockToggleMuted,
          };
          return selector(state as Parameters<typeof selector>[0]);
        }
      );

      render(<AudioControls />);

      // Math.round(0.333 * 100) = 33, Math.round(0.666 * 100) = 67
      expect(screen.getByText("33%")).toBeInTheDocument();
      expect(screen.getByText("67%")).toBeInTheDocument();
    });

    it("supports multiple renders without issues", () => {
      const { rerender } = render(<AudioControls />);

      expect(screen.getByTestId("audio-controls")).toBeInTheDocument();

      rerender(<AudioControls compact />);

      expect(screen.getByTestId("audio-controls")).toHaveClass(
        "audio-controls--compact"
      );

      rerender(<AudioControls />);

      expect(screen.getByTestId("audio-controls")).not.toHaveClass(
        "audio-controls--compact"
      );
    });
  });
});
