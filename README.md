# Snake Game

A modern Snake game built with React 18 and Phaser 3, featuring a global leaderboard powered by Supabase.

## Tech Stack

- **Build Tool**: Vite 6
- **UI Framework**: React 18
- **Game Engine**: Phaser 3.80+
- **State Management**: Zustand 4
- **Backend**: Supabase (Authentication & Database)
- **Language**: TypeScript 5 (strict mode)
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at http://localhost:5173

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint and Prettier check |
| `npm run lint:fix` | Fix ESLint and Prettier issues |
| `npm run format` | Format code with Prettier |

### Using Make

You can also use the Makefile for common tasks:

```bash
make install    # Install dependencies
make dev        # Start development server
make build      # Build for production
make test       # Run tests
make lint       # Run linting
make lint-fix   # Fix linting issues
make setup      # Full setup (clean, install, lint, test, build)
```

## Project Structure

```
src/
├── components/     # React UI components
├── game/           # Phaser game code
│   ├── scenes/     # Game scenes
│   ├── entities/   # Game entities (snake, food)
│   └── config.ts   # Phaser configuration
├── stores/         # Zustand stores
├── services/       # External integrations (Supabase, localStorage)
├── hooks/          # React hooks
├── types/          # TypeScript definitions
└── test/           # Test utilities and setup
```

## Architecture

This project uses the **Embedded Canvas Architecture** pattern:

- **React** manages application state, routing, and UI components
- **Phaser** handles the 60fps game loop and rendering
- **Zustand** provides a shared state store accessible by both React and Phaser

## Configuration

### Path Aliases

The project supports path aliases. Use `@/` to import from the `src` directory:

```typescript
import { GameState } from "@/types";
import { GAME_CONFIG } from "@/game/config";
```

### Difficulty Levels

| Difficulty | Move Interval |
|------------|---------------|
| Easy | 150ms |
| Medium | 100ms |
| Hard | 60ms |

## License

MIT
