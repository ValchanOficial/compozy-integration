import { describe, it, expect, beforeEach } from "vitest";
import { Snake } from "./Snake";
import { GRID } from "@/game/constants";

describe("Snake", () => {
  let snake: Snake;

  beforeEach(() => {
    snake = new Snake();
  });

  describe("initialization", () => {
    it("initializes with default position at center", () => {
      const head = snake.getHead();
      expect(head.x).toBe(Math.floor(GRID.WIDTH / 2));
      expect(head.y).toBe(Math.floor(GRID.HEIGHT / 2));
    });

    it("initializes with 3 segments", () => {
      expect(snake.getLength()).toBe(3);
    });

    it("initializes with default direction right", () => {
      expect(snake.getDirection()).toBe("right");
    });

    it("initializes with custom position", () => {
      const customSnake = new Snake({ x: 5, y: 5 });
      const head = customSnake.getHead();
      expect(head.x).toBe(5);
      expect(head.y).toBe(5);
    });

    it("initializes with custom direction", () => {
      const customSnake = new Snake(undefined, "up");
      expect(customSnake.getDirection()).toBe("up");
    });
  });

  describe("movement", () => {
    it("moves right correctly", () => {
      const initialHead = snake.getHead();
      snake.move();
      const newHead = snake.getHead();
      expect(newHead.x).toBe(initialHead.x + 1);
      expect(newHead.y).toBe(initialHead.y);
    });

    it("moves left correctly", () => {
      // Create snake moving left
      const leftSnake = new Snake({ x: 10, y: 10 }, "left");
      const initialHead = leftSnake.getHead();
      leftSnake.move();
      const newHead = leftSnake.getHead();
      expect(newHead.x).toBe(initialHead.x - 1);
      expect(newHead.y).toBe(initialHead.y);
    });

    it("moves up correctly", () => {
      const upSnake = new Snake({ x: 10, y: 10 }, "up");
      const initialHead = upSnake.getHead();
      upSnake.move();
      const newHead = upSnake.getHead();
      expect(newHead.x).toBe(initialHead.x);
      expect(newHead.y).toBe(initialHead.y - 1);
    });

    it("moves down correctly", () => {
      const downSnake = new Snake({ x: 10, y: 10 }, "down");
      const initialHead = downSnake.getHead();
      downSnake.move();
      const newHead = downSnake.getHead();
      expect(newHead.x).toBe(initialHead.x);
      expect(newHead.y).toBe(initialHead.y + 1);
    });

    it("maintains body length after movement", () => {
      const initialLength = snake.getLength();
      snake.move();
      snake.move();
      snake.move();
      expect(snake.getLength()).toBe(initialLength);
    });
  });

  describe("direction changes", () => {
    it("changes direction to up", () => {
      expect(snake.setDirection("up")).toBe(true);
      snake.move();
      expect(snake.getDirection()).toBe("up");
    });

    it("changes direction to down", () => {
      expect(snake.setDirection("down")).toBe(true);
      snake.move();
      expect(snake.getDirection()).toBe("down");
    });

    it("prevents 180-degree turn from right to left", () => {
      // Default direction is right
      expect(snake.setDirection("left")).toBe(false);
      expect(snake.getDirection()).toBe("right");
    });

    it("prevents 180-degree turn from left to right", () => {
      const leftSnake = new Snake({ x: 10, y: 10 }, "left");
      expect(leftSnake.setDirection("right")).toBe(false);
      expect(leftSnake.getDirection()).toBe("left");
    });

    it("prevents 180-degree turn from up to down", () => {
      const upSnake = new Snake({ x: 10, y: 10 }, "up");
      expect(upSnake.setDirection("down")).toBe(false);
      expect(upSnake.getDirection()).toBe("up");
    });

    it("prevents 180-degree turn from down to up", () => {
      const downSnake = new Snake({ x: 10, y: 10 }, "down");
      expect(downSnake.setDirection("up")).toBe(false);
      expect(downSnake.getDirection()).toBe("down");
    });

    it("allows perpendicular direction changes", () => {
      // Right to up
      expect(snake.setDirection("up")).toBe(true);
      snake.move();

      // Up to left
      expect(snake.setDirection("left")).toBe(true);
      snake.move();

      // Left to down
      expect(snake.setDirection("down")).toBe(true);
      snake.move();

      // Down to right
      expect(snake.setDirection("right")).toBe(true);
    });
  });

  describe("growth", () => {
    it("grows by one segment when eating food", () => {
      const initialLength = snake.getLength();
      snake.grow();
      snake.move();
      expect(snake.getLength()).toBe(initialLength + 1);
    });

    it("maintains correct body positions after growth", () => {
      const initialBody = snake.getBody();
      snake.grow();
      snake.move();
      const newBody = snake.getBody();

      // New head should be at expected position
      expect(newBody[0].x).toBe(initialBody[0].x + 1);
      expect(newBody[0].y).toBe(initialBody[0].y);

      // Old head should now be second segment
      expect(newBody[1]).toEqual(initialBody[0]);
    });

    it("growth only affects one move", () => {
      const initialLength = snake.getLength();
      snake.grow();
      snake.move(); // Grows
      snake.move(); // Normal movement
      expect(snake.getLength()).toBe(initialLength + 1);
    });
  });

  describe("self-collision detection", () => {
    it("returns false for initial snake", () => {
      expect(snake.checkSelfCollision()).toBe(false);
    });

    it("detects self-collision when head hits body", () => {
      // Create a snake long enough to collide with itself
      // Starting position: head at center, moving right
      // Grow the snake several times
      for (let i = 0; i < 10; i++) {
        snake.grow();
        snake.move();
      }

      // Now make the snake turn back on itself
      // Turn up, then left, then down to hit body
      snake.setDirection("up");
      snake.move();
      snake.setDirection("left");
      snake.move();
      snake.setDirection("down");
      snake.move();

      // Should now be colliding with itself
      expect(snake.checkSelfCollision()).toBe(true);
    });

    it("does not detect collision with just adjacent segments", () => {
      // Simple L-turn should not trigger self-collision
      snake.setDirection("up");
      snake.move();
      expect(snake.checkSelfCollision()).toBe(false);
    });
  });

  describe("position checks", () => {
    it("correctly identifies head position", () => {
      const head = snake.getHead();
      expect(snake.isHeadAt(head)).toBe(true);
      expect(snake.isHeadAt({ x: head.x + 1, y: head.y })).toBe(false);
    });

    it("correctly identifies occupied positions", () => {
      const body = snake.getBody();
      body.forEach((segment) => {
        expect(snake.occupiesPosition(segment)).toBe(true);
      });
      expect(snake.occupiesPosition({ x: 0, y: 0 })).toBe(false);
    });
  });

  describe("boundary detection", () => {
    it("detects when head is out of bounds (left)", () => {
      const edgeSnake = new Snake({ x: 0, y: 10 }, "left");
      edgeSnake.move();
      expect(edgeSnake.isOutOfBounds()).toBe(true);
    });

    it("detects when head is out of bounds (right)", () => {
      const edgeSnake = new Snake({ x: GRID.WIDTH - 1, y: 10 }, "right");
      edgeSnake.move();
      expect(edgeSnake.isOutOfBounds()).toBe(true);
    });

    it("detects when head is out of bounds (top)", () => {
      const edgeSnake = new Snake({ x: 10, y: 0 }, "up");
      edgeSnake.move();
      expect(edgeSnake.isOutOfBounds()).toBe(true);
    });

    it("detects when head is out of bounds (bottom)", () => {
      const edgeSnake = new Snake({ x: 10, y: GRID.HEIGHT - 1 }, "down");
      edgeSnake.move();
      expect(edgeSnake.isOutOfBounds()).toBe(true);
    });

    it("returns false when within bounds", () => {
      expect(snake.isOutOfBounds()).toBe(false);
    });
  });

  describe("reset", () => {
    it("resets to initial state", () => {
      // Modify snake state
      snake.grow();
      snake.move();
      snake.setDirection("up");
      snake.move();

      // Reset
      snake.reset();

      // Check reset state
      expect(snake.getLength()).toBe(3);
      expect(snake.getDirection()).toBe("right");
      const head = snake.getHead();
      expect(head.x).toBe(Math.floor(GRID.WIDTH / 2));
      expect(head.y).toBe(Math.floor(GRID.HEIGHT / 2));
    });

    it("resets to custom position and direction", () => {
      snake.reset({ x: 5, y: 5 }, "down");
      const head = snake.getHead();
      expect(head.x).toBe(5);
      expect(head.y).toBe(5);
      expect(snake.getDirection()).toBe("down");
    });
  });
});
