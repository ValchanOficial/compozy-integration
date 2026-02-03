import { useCallback } from "react";
import { useGameStore } from "@/stores/gameStore";
import "./AudioControls.css";

/**
 * Props for the AudioControls component.
 */
export interface AudioControlsProps {
  /** Whether to show as a compact inline version */
  compact?: boolean;
  /** Optional class name for additional styling */
  className?: string;
}

/**
 * AudioControls component provides UI for managing audio settings.
 * Includes volume sliders for effects and music, plus a mute toggle.
 */
export function AudioControls({
  compact = false,
  className = "",
}: AudioControlsProps): JSX.Element {
  const audioSettings = useGameStore((state) => state.audioSettings);
  const setEffectsVolume = useGameStore((state) => state.setEffectsVolume);
  const setMusicVolume = useGameStore((state) => state.setMusicVolume);
  const toggleMuted = useGameStore((state) => state.toggleMuted);

  const handleEffectsVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setEffectsVolume(parseFloat(e.target.value));
    },
    [setEffectsVolume]
  );

  const handleMusicVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setMusicVolume(parseFloat(e.target.value));
    },
    [setMusicVolume]
  );

  const handleMuteToggle = useCallback((): void => {
    toggleMuted();
  }, [toggleMuted]);

  if (compact) {
    return (
      <div
        className={`audio-controls audio-controls--compact ${className}`}
        data-testid="audio-controls"
      >
        <button
          className={`mute-button ${audioSettings.isMuted ? "muted" : ""}`}
          onClick={handleMuteToggle}
          aria-label={audioSettings.isMuted ? "Unmute audio" : "Mute audio"}
          data-testid="mute-button"
        >
          {audioSettings.isMuted ? (
            <MutedIcon />
          ) : (
            <VolumeIcon volume={audioSettings.effectsVolume} />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`audio-controls ${className}`} data-testid="audio-controls">
      <h3 className="audio-controls__title">Audio Settings</h3>

      <div className="audio-controls__section">
        <div className="audio-controls__row">
          <label htmlFor="effects-volume" className="audio-controls__label">
            Sound Effects
          </label>
          <div className="audio-controls__slider-container">
            <input
              type="range"
              id="effects-volume"
              className="audio-controls__slider"
              min="0"
              max="1"
              step="0.1"
              value={audioSettings.effectsVolume}
              onChange={handleEffectsVolumeChange}
              disabled={audioSettings.isMuted}
              data-testid="effects-volume-slider"
              aria-label="Sound effects volume"
            />
            <span className="audio-controls__value">
              {Math.round(audioSettings.effectsVolume * 100)}%
            </span>
          </div>
        </div>

        <div className="audio-controls__row">
          <label htmlFor="music-volume" className="audio-controls__label">
            Music
          </label>
          <div className="audio-controls__slider-container">
            <input
              type="range"
              id="music-volume"
              className="audio-controls__slider"
              min="0"
              max="1"
              step="0.1"
              value={audioSettings.musicVolume}
              onChange={handleMusicVolumeChange}
              disabled={audioSettings.isMuted}
              data-testid="music-volume-slider"
              aria-label="Music volume"
            />
            <span className="audio-controls__value">
              {Math.round(audioSettings.musicVolume * 100)}%
            </span>
          </div>
        </div>
      </div>

      <button
        className={`audio-controls__mute-button ${audioSettings.isMuted ? "muted" : ""}`}
        onClick={handleMuteToggle}
        data-testid="mute-button"
        aria-pressed={audioSettings.isMuted}
      >
        {audioSettings.isMuted ? (
          <>
            <MutedIcon />
            <span>Unmute All</span>
          </>
        ) : (
          <>
            <VolumeIcon
              volume={Math.max(
                audioSettings.effectsVolume,
                audioSettings.musicVolume
              )}
            />
            <span>Mute All</span>
          </>
        )}
      </button>
    </div>
  );
}

/**
 * SVG icon for muted state.
 */
function MutedIcon(): JSX.Element {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

/**
 * SVG icon for volume with level indicator.
 */
function VolumeIcon({ volume }: { volume: number }): JSX.Element {
  const showLowWave = volume > 0;
  const showHighWave = volume > 0.5;

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {showLowWave && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
      {showHighWave && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
    </svg>
  );
}

export default AudioControls;
