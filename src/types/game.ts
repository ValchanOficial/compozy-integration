/**
 * Game-specific TypeScript type definitions for the Snake game engine.
 */

/**
 * Position on the game grid.
 * Uses cell coordinates (not pixels).
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Cardinal direction for snake movement.
 */
export type Direction = "up" | "down" | "left" | "right";

/**
 * Opposite direction mapping for validating direction changes.
 * Snake cannot reverse 180 degrees.
 */
export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

/**
 * Direction vector mapping for movement calculations.
 */
export const DIRECTION_VECTORS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * Result of a collision check.
 */
export type CollisionType = "none" | "food" | "wall" | "self";

/**
 * Game configuration for the snake game.
 */
export interface SnakeGameConfig {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  moveInterval: number;
}
