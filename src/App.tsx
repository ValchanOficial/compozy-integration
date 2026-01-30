import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Snake Game</h1>
        <p>A modern Snake game built with React and Phaser</p>
      </header>
      <main className="app-main">
        <div id="game-container" className="game-container">
          {/* Phaser game will be mounted here */}
        </div>
      </main>
    </div>
  );
}

export default App;
