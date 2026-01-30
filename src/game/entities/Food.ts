import { Position } from "@/types/game";
import { GRID } from "@/game/constants";

/**
 * Food entity representing the collectible item for the snake.
 * Handles random spawn positioning that avoids snake body segments.
 */
export class Food {
  private position: Position;
  private gridWidth: number;
  private gridHeight: number;

  /**
   * Creates a new Food instance.
   * @param gridWidth - Width of the grid in cells (defaults to GRID.WIDTH)
   * @param gridHeight - Height of the grid in cells (defaults to GRID.HEIGHT)
   * @param initialPosition - Optional initial position
   */
  constructor(
    gridWidth: number = GRID.WIDTH,
    gridHeight: number = GRID.HEIGHT,
    initialPosition?: Position
  ) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.position = initialPosition || { x: 0, y: 0 };
  }

  /**
   * Gets the current food position.
   */
  getPosition(): Position {
    return { ...this.position };
  }

  /**
   * Sets the food position directly.
   * @param position - New position for the food
   */
  setPosition(position: Position): void {
    this.position = { ...position };
  }

  /**
   * Spawns food at a random position that doesn't overlap with snake body.
   * @param occupiedPositions - Array of positions occupied by the snake
   * @param maxAttempts - Maximum attempts to find a valid position (defaults to 1000)
   * @returns true if a valid position was found, false if grid is full
   */
  spawn(occupiedPositions: Position[], maxAttempts: number = 1000): boolean {
    // Create a set of occupied position strings for O(1) lookup
    const occupiedSet = new Set(
      occupiedPositions.map((pos) => `${pos.x},${pos.y}`)
    );

    // Check if there are any free positions (using set size to handle duplicates)
    const totalCells = this.gridWidth * this.gridHeight;
    if (occupiedSet.size >= totalCells) {
      return false; // Grid is full
    }

    // Try random positions
    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(Math.random() * this.gridWidth);
      const y = Math.floor(Math.random() * this.gridHeight);
      const key = `${x},${y}`;

      if (!occupiedSet.has(key)) {
        this.position = { x, y };
        return true;
      }
    }

    // Fallback: find first available position systematically
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        const key = `${x},${y}`;
        if (!occupiedSet.has(key)) {
          this.position = { x, y };
          return true;
        }
      }
    }

    return false; // Should not reach here unless grid is full
  }

  /**
   * Checks if the food is at a specific position.
   * @param position - Position to check
   * @returns true if food is at the position
   */
  isAt(position: Position): boolean {
    return this.position.x === position.x && this.position.y === position.y;
  }

  /**
   * Respawns the food at a new random position avoiding the snake.
   * @param occupiedPositions - Array of positions occupied by the snake
   * @returns true if respawn was successful
   */
  respawn(occupiedPositions: Position[]): boolean {
    return this.spawn(occupiedPositions);
  }
}
