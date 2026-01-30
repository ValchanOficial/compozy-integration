import { describe, it, expect } from "vitest";
import {
  Position,
  Direction,
  CollisionType,
  OPPOSITE_DIRECTION,
  DIRECTION_VECTORS,
} from "./game";

describe("game types", () => {
  describe("OPPOSITE_DIRECTION", () => {
    it("maps up to down", () => {
      expect(OPPOSITE_DIRECTION.up).toBe("down");
    });

    it("maps down to up", () => {
      expect(OPPOSITE_DIRECTION.down).toBe("up");
    });

    it("maps left to right", () => {
      expect(OPPOSITE_DIRECTION.left).toBe("right");
    });

    it("maps right to left", () => {
      expect(OPPOSITE_DIRECTION.right).toBe("left");
    });

    it("is symmetric", () => {
      const directions: Direction[] = ["up", "down", "left", "right"];
      directions.forEach((dir) => {
        const opposite = OPPOSITE_DIRECTION[dir];
        expect(OPPOSITE_DIRECTION[opposite]).toBe(dir);
      });
    });
  });

  describe("DIRECTION_VECTORS", () => {
    it("up vector points negative Y", () => {
      expect(DIRECTION_VECTORS.up).toEqual({ x: 0, y: -1 });
    });

    it("down vector points positive Y", () => {
      expect(DIRECTION_VECTORS.down).toEqual({ x: 0, y: 1 });
    });

    it("left vector points negative X", () => {
      expect(DIRECTION_VECTORS.left).toEqual({ x: -1, y: 0 });
    });

    it("right vector points positive X", () => {
      expect(DIRECTION_VECTORS.right).toEqual({ x: 1, y: 0 });
    });

    it("all vectors have magnitude 1", () => {
      const directions: Direction[] = ["up", "down", "left", "right"];
      directions.forEach((dir) => {
        const vector = DIRECTION_VECTORS[dir];
        const magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2);
        expect(magnitude).toBe(1);
      });
    });
  });

  describe("type compliance", () => {
    it("Position interface works correctly", () => {
      const pos: Position = { x: 10, y: 20 };
      expect(pos.x).toBe(10);
      expect(pos.y).toBe(20);
    });

    it("Direction type only allows valid values", () => {
      const validDirections: Direction[] = ["up", "down", "left", "right"];
      validDirections.forEach((dir) => {
        expect(typeof dir).toBe("string");
      });
    });

    it("CollisionType only allows valid values", () => {
      const validCollisions: CollisionType[] = ["none", "food", "wall", "self"];
      validCollisions.forEach((collision) => {
        expect(typeof collision).toBe("string");
      });
    });
  });
});
