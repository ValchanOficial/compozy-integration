/**
 * Game constants that do not depend on Phaser.
 * These can be safely imported in tests without canvas requirements.
 */

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

/**
 * Canvas dimensions (derived from grid)
 */
export const CANVAS = {
  WIDTH: GRID.WIDTH * GRID.CELL_SIZE, // 800
  HEIGHT: GRID.HEIGHT * GRID.CELL_SIZE, // 600
};
