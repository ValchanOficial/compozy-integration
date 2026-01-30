import { describe, it, expect, beforeEach } from "vitest";
import { Food } from "./Food";
import { Position } from "@/types/game";

describe("Food", () => {
  let food: Food;

  beforeEach(() => {
    food = new Food(40, 30); // Default grid size
  });

  describe("initialization", () => {
    it("initializes with default position", () => {
      const pos = food.getPosition();
      expect(pos).toHaveProperty("x");
      expect(pos).toHaveProperty("y");
    });

    it("initializes with custom position", () => {
      const customFood = new Food(40, 30, { x: 10, y: 15 });
      const pos = customFood.getPosition();
      expect(pos.x).toBe(10);
      expect(pos.y).toBe(15);
    });

    it("returns a copy of position, not reference", () => {
      const pos1 = food.getPosition();
      const pos2 = food.getPosition();
      pos1.x = 999;
      expect(pos2.x).not.toBe(999);
    });
  });

  describe("setPosition", () => {
    it("sets position correctly", () => {
      food.setPosition({ x: 25, y: 20 });
      const pos = food.getPosition();
      expect(pos.x).toBe(25);
      expect(pos.y).toBe(20);
    });

    it("creates a copy of the position", () => {
      const newPos = { x: 10, y: 10 };
      food.setPosition(newPos);
      newPos.x = 999;
      expect(food.getPosition().x).toBe(10);
    });
  });

  describe("spawn", () => {
    it("spawns at a random valid position", () => {
      const occupied: Position[] = [];
      const result = food.spawn(occupied);
      expect(result).toBe(true);

      const pos = food.getPosition();
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThan(40);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThan(30);
    });

    it("avoids occupied positions", () => {
      // Occupy most of a small grid
      const smallFood = new Food(3, 3);
      const occupied: Position[] = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        // Leave (2, 2) available
      ];

      const result = smallFood.spawn(occupied);
      expect(result).toBe(true);

      const pos = smallFood.getPosition();
      expect(pos.x).toBe(2);
      expect(pos.y).toBe(2);
    });

    it("returns false when grid is full", () => {
      const tinyFood = new Food(2, 2);
      const occupied: Position[] = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ];

      const result = tinyFood.spawn(occupied);
      expect(result).toBe(false);
    });

    it("never spawns on any snake segment", () => {
      // Create a snake body
      const snakeBody: Position[] = [];
      for (let i = 0; i < 100; i++) {
        snakeBody.push({ x: i % 40, y: Math.floor(i / 40) });
      }

      // Spawn multiple times and verify
      for (let i = 0; i < 50; i++) {
        food.spawn(snakeBody);
        const pos = food.getPosition();
        const isOnSnake = snakeBody.some(
          (segment) => segment.x === pos.x && segment.y === pos.y
        );
        expect(isOnSnake).toBe(false);
      }
    });

    it("uses random positions", () => {
      // Spawn many times and check for variety
      const positions = new Set<string>();
      for (let i = 0; i < 100; i++) {
        food.spawn([]);
        const pos = food.getPosition();
        positions.add(`${pos.x},${pos.y}`);
      }
      // Should have multiple unique positions (not deterministic)
      expect(positions.size).toBeGreaterThan(1);
    });
  });

  describe("isAt", () => {
    it("returns true when food is at position", () => {
      food.setPosition({ x: 10, y: 15 });
      expect(food.isAt({ x: 10, y: 15 })).toBe(true);
    });

    it("returns false when food is not at position", () => {
      food.setPosition({ x: 10, y: 15 });
      expect(food.isAt({ x: 10, y: 16 })).toBe(false);
      expect(food.isAt({ x: 11, y: 15 })).toBe(false);
    });
  });

  describe("respawn", () => {
    it("respawns at a new position", () => {
      food.setPosition({ x: 5, y: 5 });
      const oldPos = food.getPosition();

      // Occupy the old position
      const occupied: Position[] = [{ x: 5, y: 5 }];

      const result = food.respawn(occupied);
      expect(result).toBe(true);

      const newPos = food.getPosition();
      expect(newPos.x !== oldPos.x || newPos.y !== oldPos.y).toBe(true);
    });

    it("returns false when no valid position available", () => {
      const tinyFood = new Food(1, 1);
      const occupied: Position[] = [{ x: 0, y: 0 }];

      const result = tinyFood.respawn(occupied);
      expect(result).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles empty occupied array", () => {
      const result = food.spawn([]);
      expect(result).toBe(true);
    });

    it("handles single-cell grid with no occupied positions", () => {
      const singleCell = new Food(1, 1);
      const result = singleCell.spawn([]);
      expect(result).toBe(true);
      const pos = singleCell.getPosition();
      expect(pos.x).toBe(0);
      expect(pos.y).toBe(0);
    });

    it("handles duplicates in occupied positions", () => {
      const occupied: Position[] = [
        { x: 0, y: 0 },
        { x: 0, y: 0 }, // Duplicate
        { x: 0, y: 0 }, // Duplicate
      ];
      const smallGrid = new Food(2, 1);
      const result = smallGrid.spawn(occupied);
      expect(result).toBe(true);
      const pos = smallGrid.getPosition();
      expect(pos.x).toBe(1);
      expect(pos.y).toBe(0);
    });
  });
});
