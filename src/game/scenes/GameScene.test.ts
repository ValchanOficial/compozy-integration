import { describe, it, expect, beforeEach } from "vitest";
import { Snake } from "@/game/entities/Snake";
import { Food } from "@/game/entities/Food";
import { GRID, DIFFICULTY_SPEED } from "@/game/constants";
import {
  useGameStore,
  getGameState,
  resetGameState,
  incrementScore,
} from "@/stores/gameStore";
import { CollisionType } from "@/types/game";

/**
 * Integration tests for GameScene logic.
 * Since Phaser requires a browser canvas, we test the game logic
 * (entities, store integration, collision detection) independently.
 */

// Helper function to simulate game loop collision check logic
function checkCollisions(snake: Snake, food: Food): CollisionType {
  if (snake.isOutOfBounds()) {
    return "wall";
  }
  if (snake.checkSelfCollision()) {
    return "self";
  }
  if (snake.isHeadAt(food.getPosition())) {
    return "food";
  }
  return "none";
}

// Helper function to simulate food collection logic
function handleFoodCollision(snake: Snake, food: Food): void {
  snake.grow();
  incrementScore(10);
  food.respawn(snake.getBody());
}

// Helper function to simulate game over logic
function handleGameOver(): void {
  const state = getGameState();
  state.setGameStatus("gameover");
}

describe("GameScene integration", () => {
  let snake: Snake;
  let food: Food;

  beforeEach(() => {
    // Reset store state
    useGameStore.setState({
      score: 0,
      highScore: 0,
      difficulty: "medium",
      gameStatus: "menu",
    });

    // Create fresh entities
    snake = new Snake({ x: 20, y: 15 });
    food = new Food();
    food.spawn(snake.getBody());
  });

  describe("difficulty configuration", () => {
    it("easy difficulty has 150ms interval", () => {
      expect(DIFFICULTY_SPEED.easy).toBe(150);
    });

    it("medium difficulty has 100ms interval", () => {
      expect(DIFFICULTY_SPEED.medium).toBe(100);
    });

    it("hard difficulty has 60ms interval", () => {
      expect(DIFFICULTY_SPEED.hard).toBe(60);
    });

    it("difficulty affects game speed appropriately", () => {
      expect(DIFFICULTY_SPEED.easy).toBeGreaterThan(DIFFICULTY_SPEED.medium);
      expect(DIFFICULTY_SPEED.medium).toBeGreaterThan(DIFFICULTY_SPEED.hard);
    });
  });

  describe("game initialization", () => {
    it("snake starts with correct length", () => {
      expect(snake.getLength()).toBe(3);
    });

    it("food spawns away from snake", () => {
      const foodPos = food.getPosition();
      expect(snake.occupiesPosition(foodPos)).toBe(false);
    });

    it("game store is reset on game start", () => {
      // Simulate previous game
      incrementScore(100);
      getGameState().setGameStatus("gameover");

      // Reset for new game
      resetGameState();

      expect(getGameState().score).toBe(0);
      expect(getGameState().gameStatus).toBe("playing");
    });
  });

  describe("collision detection integration", () => {
    it("detects no collision during normal movement", () => {
      snake.move();
      const collision = checkCollisions(snake, food);
      expect(collision).toBe("none");
    });

    it("detects food collision when snake reaches food", () => {
      // Position food directly ahead of snake
      const head = snake.getHead();
      food.setPosition({ x: head.x + 1, y: head.y });

      snake.move();
      const collision = checkCollisions(snake, food);
      expect(collision).toBe("food");
    });

    it("detects wall collision (left wall)", () => {
      const wallSnake = new Snake({ x: 0, y: 15 }, "left");
      wallSnake.move();
      const collision = checkCollisions(wallSnake, food);
      expect(collision).toBe("wall");
    });

    it("detects wall collision (right wall)", () => {
      const wallSnake = new Snake({ x: GRID.WIDTH - 1, y: 15 }, "right");
      wallSnake.move();
      const collision = checkCollisions(wallSnake, food);
      expect(collision).toBe("wall");
    });

    it("detects wall collision (top wall)", () => {
      const wallSnake = new Snake({ x: 20, y: 0 }, "up");
      wallSnake.move();
      const collision = checkCollisions(wallSnake, food);
      expect(collision).toBe("wall");
    });

    it("detects wall collision (bottom wall)", () => {
      const wallSnake = new Snake({ x: 20, y: GRID.HEIGHT - 1 }, "down");
      wallSnake.move();
      const collision = checkCollisions(wallSnake, food);
      expect(collision).toBe("wall");
    });

    it("detects self collision after U-turn", () => {
      // Grow snake to make self-collision possible
      for (let i = 0; i < 10; i++) {
        snake.grow();
        snake.move();
      }

      // Make U-turn
      snake.setDirection("up");
      snake.move();
      snake.setDirection("left");
      snake.move();
      snake.setDirection("down");
      snake.move();

      const collision = checkCollisions(snake, food);
      expect(collision).toBe("self");
    });
  });

  describe("score updates", () => {
    it("score increments by 10 when eating food", () => {
      const initialScore = getGameState().score;

      // Simulate eating food
      const head = snake.getHead();
      food.setPosition({ x: head.x + 1, y: head.y });
      snake.move();

      if (checkCollisions(snake, food) === "food") {
        handleFoodCollision(snake, food);
      }

      expect(getGameState().score).toBe(initialScore + 10);
    });

    it("high score updates when score exceeds it", () => {
      expect(getGameState().highScore).toBe(0);

      // Eat multiple foods
      for (let i = 0; i < 5; i++) {
        incrementScore(10);
      }

      expect(getGameState().highScore).toBe(50);
    });

    it("high score preserved across game resets", () => {
      incrementScore(100);
      expect(getGameState().highScore).toBe(100);

      resetGameState();

      expect(getGameState().score).toBe(0);
      expect(getGameState().highScore).toBe(100);
    });
  });

  describe("game status transitions", () => {
    it("starts in menu status", () => {
      useGameStore.setState({ gameStatus: "menu" });
      expect(getGameState().gameStatus).toBe("menu");
    });

    it("transitions to playing on game start", () => {
      resetGameState();
      expect(getGameState().gameStatus).toBe("playing");
    });

    it("transitions to gameover on wall collision", () => {
      const wallSnake = new Snake({ x: 0, y: 15 }, "left");
      wallSnake.move();

      const collision = checkCollisions(wallSnake, food);
      if (collision === "wall") {
        handleGameOver();
      }

      expect(getGameState().gameStatus).toBe("gameover");
    });

    it("transitions to gameover on self collision", () => {
      // Create collision scenario
      for (let i = 0; i < 10; i++) {
        snake.grow();
        snake.move();
      }
      snake.setDirection("up");
      snake.move();
      snake.setDirection("left");
      snake.move();
      snake.setDirection("down");
      snake.move();

      const collision = checkCollisions(snake, food);
      if (collision === "self") {
        handleGameOver();
      }

      expect(getGameState().gameStatus).toBe("gameover");
    });
  });

  describe("food respawn behavior", () => {
    it("food respawns after being eaten", () => {
      const oldPos = food.getPosition();

      // Position snake to eat food
      snake = new Snake({ x: oldPos.x - 1, y: oldPos.y });
      snake.move();

      if (checkCollisions(snake, food) === "food") {
        handleFoodCollision(snake, food);
      }

      const newPos = food.getPosition();
      // New position should be different or snake should occupy old position
      const foodMoved = newPos.x !== oldPos.x || newPos.y !== oldPos.y;
      expect(foodMoved).toBe(true);
    });

    it("food never respawns on snake body", () => {
      // Grow snake significantly
      for (let i = 0; i < 20; i++) {
        snake.grow();
        snake.move();
      }

      // Respawn food multiple times
      for (let i = 0; i < 10; i++) {
        food.respawn(snake.getBody());
        const pos = food.getPosition();
        expect(snake.occupiesPosition(pos)).toBe(false);
      }
    });
  });

  describe("snake growth mechanics", () => {
    it("snake grows by 1 segment when eating food", () => {
      const initialLength = snake.getLength();

      // Eat food
      const head = snake.getHead();
      food.setPosition({ x: head.x + 1, y: head.y });
      snake.move();

      if (checkCollisions(snake, food) === "food") {
        handleFoodCollision(snake, food);
        snake.move(); // Growth takes effect on next move
      }

      expect(snake.getLength()).toBe(initialLength + 1);
    });

    it("multiple food collections increase snake length correctly", () => {
      const initialLength = snake.getLength();

      for (let i = 0; i < 5; i++) {
        // Position food ahead
        const head = snake.getHead();
        food.setPosition({ x: head.x + 1, y: head.y });
        snake.move();

        if (checkCollisions(snake, food) === "food") {
          handleFoodCollision(snake, food);
        }
      }

      // One more move to apply the last scheduled growth
      snake.move();

      expect(snake.getLength()).toBe(initialLength + 5);
    });
  });

  describe("timer-based movement simulation", () => {
    it("movement respects interval timing", () => {
      const moveInterval = DIFFICULTY_SPEED.medium; // 100ms
      let moveTimer = 0;
      let moveCount = 0;

      // Simulate 500ms of game time with 16ms frames (60fps)
      const frameDelta = 16.67;
      for (let elapsed = 0; elapsed < 500; elapsed += frameDelta) {
        moveTimer += frameDelta;

        if (moveTimer >= moveInterval) {
          moveTimer = 0;
          moveCount++;
        }
      }

      // At 100ms interval, 500ms should result in ~5 moves
      expect(moveCount).toBeGreaterThanOrEqual(4);
      expect(moveCount).toBeLessThanOrEqual(6);
    });

    it("harder difficulty results in more moves", () => {
      const easyInterval = DIFFICULTY_SPEED.easy; // 150ms
      const hardInterval = DIFFICULTY_SPEED.hard; // 60ms

      let easyMoves = 0;
      let hardMoves = 0;
      let easyTimer = 0;
      let hardTimer = 0;

      // Simulate 1 second of game time
      const frameDelta = 16.67;
      for (let elapsed = 0; elapsed < 1000; elapsed += frameDelta) {
        easyTimer += frameDelta;
        hardTimer += frameDelta;

        if (easyTimer >= easyInterval) {
          easyTimer = 0;
          easyMoves++;
        }
        if (hardTimer >= hardInterval) {
          hardTimer = 0;
          hardMoves++;
        }
      }

      expect(hardMoves).toBeGreaterThan(easyMoves);
    });
  });

  describe("grid boundaries", () => {
    it("uses correct grid dimensions", () => {
      expect(GRID.WIDTH).toBe(40);
      expect(GRID.HEIGHT).toBe(30);
      expect(GRID.CELL_SIZE).toBe(20);
    });

    it("canvas dimensions match grid calculations", () => {
      const expectedWidth = GRID.WIDTH * GRID.CELL_SIZE;
      const expectedHeight = GRID.HEIGHT * GRID.CELL_SIZE;
      expect(expectedWidth).toBe(800);
      expect(expectedHeight).toBe(600);
    });
  });
});
