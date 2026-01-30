import Phaser from "phaser";
import { GRID, DIFFICULTY_SPEED, CANVAS } from "./constants";

// Re-export constants for convenience
export { GRID, DIFFICULTY_SPEED, CANVAS };

/**
 * Phaser game configuration.
 * This configuration will be used when initializing the Phaser game instance.
 */
export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CANVAS.WIDTH,
  height: CANVAS.HEIGHT,
  backgroundColor: "#1a1a2e",
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [], // Scenes will be added during game initialization
};
