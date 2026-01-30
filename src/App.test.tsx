import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App Component", () => {
  it("should render the app with Snake Game title", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Snake Game/i })).toBeDefined();
  });

  it("should render the game container element", () => {
    render(<App />);

    const gameContainer = document.getElementById("game-container");
    expect(gameContainer).toBeDefined();
  });

  it("should have the app header with description", () => {
    render(<App />);

    expect(
      screen.getByText(/A modern Snake game built with React and Phaser/i)
    ).toBeDefined();
  });
});
