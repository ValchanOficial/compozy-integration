import {
  Position,
  Direction,
  OPPOSITE_DIRECTION,
  DIRECTION_VECTORS,
} from "@/types/game";
import { GRID } from "@/game/constants";

/**
 * Snake entity representing the player-controlled snake.
 * Handles movement, growth, and self-collision detection.
 */
export class Snake {
  private body: Position[];
  private direction: Direction;
  private nextDirection: Direction;
  private hasGrown: boolean;

  /**
   * Creates a new Snake instance.
   * @param initialPosition - Starting position of the snake head (defaults to center)
   * @param initialDirection - Starting direction (defaults to 'right')
   */
  constructor(
    initialPosition?: Position,
    initialDirection: Direction = "right"
  ) {
    const startPos = initialPosition || {
      x: Math.floor(GRID.WIDTH / 2),
      y: Math.floor(GRID.HEIGHT / 2),
    };

    // Initialize snake with 3 segments
    this.body = [
      { x: startPos.x, y: startPos.y },
      { x: startPos.x - 1, y: startPos.y },
      { x: startPos.x - 2, y: startPos.y },
    ];

    this.direction = initialDirection;
    this.nextDirection = initialDirection;
    this.hasGrown = false;
  }

  /**
   * Gets the current head position.
   */
  getHead(): Position {
    return { ...this.body[0] };
  }

  /**
   * Gets all body segment positions.
   */
  getBody(): Position[] {
    return this.body.map((segment) => ({ ...segment }));
  }

  /**
   * Gets the current movement direction.
   */
  getDirection(): Direction {
    return this.direction;
  }

  /**
   * Gets the snake length.
   */
  getLength(): number {
    return this.body.length;
  }

  /**
   * Changes the snake direction.
   * Prevents 180-degree turns (cannot reverse direction).
   * @param newDirection - The new direction to move
   * @returns true if direction was changed, false if invalid
   */
  setDirection(newDirection: Direction): boolean {
    // Cannot reverse 180 degrees
    if (OPPOSITE_DIRECTION[this.direction] === newDirection) {
      return false;
    }

    this.nextDirection = newDirection;
    return true;
  }

  /**
   * Moves the snake one step in the current direction.
   * The direction is updated before moving to support buffered input.
   */
  move(): void {
    // Apply buffered direction change
    this.direction = this.nextDirection;

    const head = this.body[0];
    const vector = DIRECTION_VECTORS[this.direction];

    // Create new head position
    const newHead: Position = {
      x: head.x + vector.x,
      y: head.y + vector.y,
    };

    // Add new head to the front
    this.body.unshift(newHead);

    // Remove tail unless the snake has grown
    if (!this.hasGrown) {
      this.body.pop();
    } else {
      this.hasGrown = false;
    }
  }

  /**
   * Grows the snake by one segment on the next move.
   */
  grow(): void {
    this.hasGrown = true;
  }

  /**
   * Checks if the snake head collides with its own body.
   * @returns true if self-collision detected
   */
  checkSelfCollision(): boolean {
    const head = this.body[0];

    // Check collision with body segments (excluding head)
    for (let i = 1; i < this.body.length; i++) {
      if (this.body[i].x === head.x && this.body[i].y === head.y) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if the snake head is at a specific position.
   * Used for food collision detection.
   * @param position - Position to check
   * @returns true if head is at the position
   */
  isHeadAt(position: Position): boolean {
    const head = this.body[0];
    return head.x === position.x && head.y === position.y;
  }

  /**
   * Checks if any part of the snake body occupies a position.
   * @param position - Position to check
   * @returns true if any segment is at the position
   */
  occupiesPosition(position: Position): boolean {
    return this.body.some(
      (segment) => segment.x === position.x && segment.y === position.y
    );
  }

  /**
   * Checks if the snake head is outside the grid boundaries.
   * @param gridWidth - Width of the grid in cells
   * @param gridHeight - Height of the grid in cells
   * @returns true if head is out of bounds
   */
  isOutOfBounds(
    gridWidth: number = GRID.WIDTH,
    gridHeight: number = GRID.HEIGHT
  ): boolean {
    const head = this.body[0];
    return (
      head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight
    );
  }

  /**
   * Resets the snake to initial state.
   * @param initialPosition - Starting position (defaults to center)
   * @param initialDirection - Starting direction (defaults to 'right')
   */
  reset(
    initialPosition?: Position,
    initialDirection: Direction = "right"
  ): void {
    const startPos = initialPosition || {
      x: Math.floor(GRID.WIDTH / 2),
      y: Math.floor(GRID.HEIGHT / 2),
    };

    this.body = [
      { x: startPos.x, y: startPos.y },
      { x: startPos.x - 1, y: startPos.y },
      { x: startPos.x - 2, y: startPos.y },
    ];

    this.direction = initialDirection;
    this.nextDirection = initialDirection;
    this.hasGrown = false;
  }
}
