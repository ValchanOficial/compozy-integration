.PHONY: install dev build test lint format preview clean

# Install dependencies
install:
	npm install

# Start development server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Run tests
test:
	npm run test

# Run tests with coverage
test-coverage:
	npm run test:coverage

# Run tests in watch mode
test-watch:
	npm run test:watch

# Run linting
lint:
	npm run lint

# Fix linting and formatting issues
lint-fix:
	npm run lint:fix

# Format code with Prettier
format:
	npm run format

# Preview production build
preview:
	npm run preview

# Clean build artifacts and dependencies
clean:
	rm -rf node_modules dist coverage .vite

# Full setup: clean install and verify
setup: clean install lint test build
	@echo "Setup complete!"
