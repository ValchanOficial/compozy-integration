import { GAME_CONFIG } from "@/game/config";
import { GameScene } from "@/game/scenes/GameScene";
import { useSwipeDetection } from "@/hooks/useResponsive";
import { type SwipeDirection } from "@/types";
import Phaser from "phaser";
import { useCallback, useEffect, useRef, useState } from "react";
import "./GameCanvas.css";

/**
 * Detect if device supports touch events.
 * Runs only on client side.
 */
function detectTouchCapability(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Props for the GameCanvas component.
 */
export interface GameCanvasProps {
  /** ID of the DOM element to mount the Phaser game into */
  containerId?: string;
  /** Whether to show touch controls on mobile devices */
  enableTouchControls?: boolean;
}

/**
 * GameCanvas component that mounts and manages the Phaser game instance.
 * Handles initialization, resize events, touch controls, and cleanup on unmount.
 */
export function GameCanvas({
  containerId = "game-container",
  enableTouchControls = true,
}: GameCanvasProps): JSX.Element {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTouchHint, setShowTouchHint] = useState(false);
  // Use lazy initial state to detect touch capability once on mount
  const [isTouchCapable] = useState(detectTouchCapability);

  /**
   * Handle swipe gesture to control snake direction.
   */
  const handleSwipe = useCallback((direction: SwipeDirection) => {
    if (!direction || !gameRef.current) return;

    const scene = gameRef.current.scene.getScene("GameScene") as GameScene;
    if (!scene) return;

    // Use the public method to set direction from touch
    scene.setDirectionFromTouch(direction);
  }, []);

  const { handlers } = useSwipeDetection(handleSwipe);

  /**
   * Handle window resize events to scale the Phaser canvas.
   */
  const handleResize = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.scale.resize(
        gameRef.current.scale.width,
        gameRef.current.scale.height
      );
    }
  }, []);

  /**
   * Initialize Phaser game instance on mount.
   */
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (gameRef.current) {
      return;
    }

    // Create Phaser game configuration with scenes
    const config: Phaser.Types.Core.GameConfig = {
      ...GAME_CONFIG,
      parent: containerId,
      scene: [GameScene],
      callbacks: {
        postBoot: () => {
          setIsLoading(false);
          // Show touch hint on touch devices
          if (isTouchCapable) {
            setShowTouchHint(true);
            setTimeout(() => setShowTouchHint(false), 3000);
          }
        },
      },
    };

    // Initialize Phaser game
    gameRef.current = new Phaser.Game(config);

    // Add resize event listener
    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);

      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [containerId, handleResize, isTouchCapable]);

  return (
    <div
      ref={containerRef}
      className="game-canvas-wrapper"
      data-testid="game-canvas-wrapper"
    >
      {isLoading && (
        <div className="loading-overlay" data-testid="loading-overlay">
          <div className="loading-spinner" />
          <p className="loading-text">Loading game...</p>
        </div>
      )}

      <div id={containerId} data-testid="game-canvas" className="game-canvas" />

      {enableTouchControls && isTouchCapable && (
        <div
          className="touch-controls-overlay"
          data-testid="touch-controls"
          onTouchStart={handlers.onTouchStart as React.TouchEventHandler}
          onTouchMove={handlers.onTouchMove as React.TouchEventHandler}
          onTouchEnd={handlers.onTouchEnd as React.TouchEventHandler}
        >
          {showTouchHint && (
            <div className="touch-hint" data-testid="touch-hint">
              Swipe to control the snake
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GameCanvas;
