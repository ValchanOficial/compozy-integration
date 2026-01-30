import Phaser from "phaser";

/**
 * Phaser game configuration.
 * This configuration will be used when initializing the Phaser game instance.
 */
export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
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

/**
 * Difficulty speed mapping (in milliseconds).
 * Lower values mean faster snake movement.
 */
export const DIFFICULTY_SPEED: Record<string, number> = {
  easy: 150,
  medium: 100,
  hard: 60,
};

/**
 * Grid constants for the snake game.
 */
export const GRID = {
  CELL_SIZE: 20,
  WIDTH: 40, // 800 / 20
  HEIGHT: 30, // 600 / 20
};
