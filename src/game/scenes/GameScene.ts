import Phaser from "phaser";
import { Snake } from "@/game/entities/Snake";
import { Food } from "@/game/entities/Food";
import { GRID, DIFFICULTY_SPEED } from "@/game/config";
import { Direction, CollisionType } from "@/types/game";
import {
  getGameState,
  resetGameState,
  incrementScore,
} from "@/stores/gameStore";
import {
  playSoundEffect,
  initializeAudio,
  startBackgroundMusic,
  stopBackgroundMusic,
} from "@/services/audioService";
import { SwipeDirection } from "@/types";

/**
 * Main gameplay scene handling snake movement, food collection, and collisions.
 * Uses timer-based movement for consistent speed across different devices.
 */
export class GameScene extends Phaser.Scene {
  private snake!: Snake;
  private food!: Food;
  private moveTimer: number = 0;
  private moveInterval: number = 100;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private snakeGraphics!: Phaser.GameObjects.Graphics;
  private foodGraphics!: Phaser.GameObjects.Graphics;
  private isPaused: boolean = false;
  private lastScore: number = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  /**
   * Initialize scene data before create().
   */
  init(): void {
    const { difficulty } = getGameState();
    this.moveInterval = DIFFICULTY_SPEED[difficulty] || DIFFICULTY_SPEED.medium;
    this.moveTimer = 0;
    this.isPaused = false;
    this.lastScore = 0;
  }

  /**
   * Create game objects and set up input handlers.
   */
  create(): void {
    // Reset game state
    resetGameState();

    // Initialize audio (if not already initialized)
    initializeAudio();

    // Start background music
    startBackgroundMusic();

    // Create entities
    this.snake = new Snake();
    this.food = new Food();
    this.food.spawn(this.snake.getBody());

    // Create graphics objects for rendering
    this.snakeGraphics = this.add.graphics();
    this.foodGraphics = this.add.graphics();

    // Set up keyboard input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };

      // Pause key
      this.input.keyboard.on("keydown-ESC", () => {
        this.togglePause();
      });

      this.input.keyboard.on("keydown-P", () => {
        this.togglePause();
      });
    }

    // Initial render
    this.renderSnake();
    this.renderFood();
  }

  /**
   * Main game loop - called every frame (~60fps).
   * Uses delta time accumulation for consistent movement speed.
   */
  update(_time: number, delta: number): void {
    if (this.isPaused) {
      return;
    }

    // Handle input
    this.handleInput();

    // Accumulate time for movement
    this.moveTimer += delta;

    // Move snake at configured interval
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0;
      this.moveSnake();
    }
  }

  /**
   * Handle keyboard input for direction changes.
   */
  private handleInput(): void {
    if (!this.input.keyboard) return;

    let newDirection: Direction | null = null;

    // Arrow keys
    if (this.cursors.up.isDown) {
      newDirection = "up";
    } else if (this.cursors.down.isDown) {
      newDirection = "down";
    } else if (this.cursors.left.isDown) {
      newDirection = "left";
    } else if (this.cursors.right.isDown) {
      newDirection = "right";
    }

    // WASD keys
    if (this.wasdKeys.W.isDown) {
      newDirection = "up";
    } else if (this.wasdKeys.S.isDown) {
      newDirection = "down";
    } else if (this.wasdKeys.A.isDown) {
      newDirection = "left";
    } else if (this.wasdKeys.D.isDown) {
      newDirection = "right";
    }

    if (newDirection) {
      this.snake.setDirection(newDirection);
    }
  }

  /**
   * Set snake direction from touch swipe gesture.
   * Used by GameCanvas component for mobile controls.
   * @param direction - The swipe direction
   */
  setDirectionFromTouch(direction: SwipeDirection): void {
    if (!direction || this.isPaused) return;

    // Map SwipeDirection to game Direction (they're the same type values)
    const directionMap: Record<Exclude<SwipeDirection, null>, Direction> = {
      up: "up",
      down: "down",
      left: "left",
      right: "right",
    };

    this.snake.setDirection(directionMap[direction]);
  }

  /**
   * Move the snake and check for collisions.
   */
  private moveSnake(): void {
    this.snake.move();

    // Check collisions
    const collision = this.checkCollisions();

    if (collision === "food") {
      this.handleFoodCollision();
    } else if (collision === "wall" || collision === "self") {
      this.handleGameOver();
      return;
    }

    // Render updated positions
    this.renderSnake();
  }

  /**
   * Check all collision types.
   */
  private checkCollisions(): CollisionType {
    // Check wall collision first
    if (this.snake.isOutOfBounds()) {
      return "wall";
    }

    // Check self collision
    if (this.snake.checkSelfCollision()) {
      return "self";
    }

    // Check food collision
    if (this.snake.isHeadAt(this.food.getPosition())) {
      return "food";
    }

    return "none";
  }

  /**
   * Handle food collection.
   */
  private handleFoodCollision(): void {
    // Grow snake
    this.snake.grow();

    // Update score
    incrementScore(10);

    // Play eat sound effect
    playSoundEffect("eat");

    // Check for level up (every 50 points)
    const currentScore = getGameState().score;
    if (
      Math.floor(currentScore / 50) > Math.floor(this.lastScore / 50) &&
      currentScore > 0
    ) {
      playSoundEffect("levelup");
    }
    this.lastScore = currentScore;

    // Respawn food
    this.food.respawn(this.snake.getBody());

    // Re-render food at new position
    this.renderFood();
  }

  /**
   * Handle game over state.
   */
  private handleGameOver(): void {
    const state = getGameState();
    state.setGameStatus("gameover");

    // Play collision sound
    playSoundEffect("collision");

    // Stop background music
    stopBackgroundMusic();

    // Could transition to GameOverScene here
    // For now, just stop the game
    this.isPaused = true;
  }

  /**
   * Toggle pause state.
   */
  private togglePause(): void {
    this.isPaused = !this.isPaused;
    const state = getGameState();
    state.setGameStatus(this.isPaused ? "paused" : "playing");
  }

  /**
   * Render the snake on screen.
   */
  private renderSnake(): void {
    this.snakeGraphics.clear();

    const body = this.snake.getBody();

    body.forEach((segment, index) => {
      const x = segment.x * GRID.CELL_SIZE;
      const y = segment.y * GRID.CELL_SIZE;

      // Head is brighter color
      if (index === 0) {
        this.snakeGraphics.fillStyle(0x4ade80); // Green (head)
      } else {
        this.snakeGraphics.fillStyle(0x22c55e); // Darker green (body)
      }

      // Draw slightly smaller than cell for visual separation
      this.snakeGraphics.fillRect(
        x + 1,
        y + 1,
        GRID.CELL_SIZE - 2,
        GRID.CELL_SIZE - 2
      );
    });
  }

  /**
   * Render the food on screen.
   */
  private renderFood(): void {
    this.foodGraphics.clear();

    const pos = this.food.getPosition();
    const x = pos.x * GRID.CELL_SIZE;
    const y = pos.y * GRID.CELL_SIZE;

    this.foodGraphics.fillStyle(0xef4444); // Red
    this.foodGraphics.fillRect(
      x + 2,
      y + 2,
      GRID.CELL_SIZE - 4,
      GRID.CELL_SIZE - 4
    );
  }

  /**
   * Get the current move interval (for testing purposes).
   */
  getMoveInterval(): number {
    return this.moveInterval;
  }

  /**
   * Get the snake instance (for testing purposes).
   */
  getSnake(): Snake {
    return this.snake;
  }

  /**
   * Get the food instance (for testing purposes).
   */
  getFood(): Food {
    return this.food;
  }

  /**
   * Check if game is paused (for testing purposes).
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Set pause state externally (for testing purposes).
   */
  setIsPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  /**
   * Cleanup when scene is destroyed.
   */
  shutdown(): void {
    stopBackgroundMusic();
  }
}
