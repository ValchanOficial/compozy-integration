import "./App.css";
import { GameCanvas } from "@/components/GameCanvas";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Snake Game</h1>
        <p>A modern Snake game built with React and Phaser</p>
      </header>
      <main className="app-main">
        <GameCanvas containerId="game-container" />
      </main>
    </div>
  );
}

export default App;
