import { useEffect, useRef, useCallback } from "react";
import Phaser from "phaser";
import { GAME_CONFIG } from "@/game/config";
import { GameScene } from "@/game/scenes/GameScene";

/**
 * Props for the GameCanvas component.
 */
export interface GameCanvasProps {
  /** ID of the DOM element to mount the Phaser game into */
  containerId?: string;
}

/**
 * GameCanvas component that mounts and manages the Phaser game instance.
 * Handles initialization, resize events, and cleanup on unmount.
 */
export function GameCanvas({
  containerId = "game-container",
}: GameCanvasProps): JSX.Element {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
  }, [containerId, handleResize]);

  return (
    <div
      ref={containerRef}
      id={containerId}
      data-testid="game-canvas"
      className="game-canvas"
    />
  );
}

export default GameCanvas;
