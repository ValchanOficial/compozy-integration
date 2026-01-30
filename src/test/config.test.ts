/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Simple JSON5-like parser that strips comments from JSON
 */
function parseJsonWithComments(content: string): unknown {
  // Remove multi-line comments (/* ... */)
  let stripped = content.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove single-line comments (// ...)
  stripped = stripped.replace(/\/\/.*$/gm, "");
  return JSON.parse(stripped);
}

describe("Project Configuration", () => {
  const rootDir = path.resolve(__dirname, "../..");

  describe("TypeScript Configuration", () => {
    it("should have strict mode enabled in tsconfig.app.json", () => {
      const tsconfigPath = path.join(rootDir, "tsconfig.app.json");
      const tsconfig = parseJsonWithComments(
        fs.readFileSync(tsconfigPath, "utf-8")
      ) as { compilerOptions: { strict: boolean } };

      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it("should have path aliases configured", () => {
      const tsconfigPath = path.join(rootDir, "tsconfig.app.json");
      const tsconfig = parseJsonWithComments(
        fs.readFileSync(tsconfigPath, "utf-8")
      ) as { compilerOptions: { paths: Record<string, string[]> } };

      expect(tsconfig.compilerOptions.paths).toBeDefined();
      expect(tsconfig.compilerOptions.paths["@/*"]).toEqual(["./src/*"]);
    });

    it("should have React JSX configured", () => {
      const tsconfigPath = path.join(rootDir, "tsconfig.app.json");
      const tsconfig = parseJsonWithComments(
        fs.readFileSync(tsconfigPath, "utf-8")
      ) as { compilerOptions: { jsx: string } };

      expect(tsconfig.compilerOptions.jsx).toBe("react-jsx");
    });
  });

  describe("Package Configuration", () => {
    let packageJson: {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
    };

    beforeAll(() => {
      const packagePath = path.join(rootDir, "package.json");
      packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
    });

    it("should have React 18.x as dependency", () => {
      expect(packageJson.dependencies.react).toMatch(/^\^18\./);
      expect(packageJson.dependencies["react-dom"]).toMatch(/^\^18\./);
    });

    it("should have Phaser 3.80+ as dependency", () => {
      expect(packageJson.dependencies.phaser).toBeDefined();
      const phaserVersion = packageJson.dependencies.phaser;
      expect(phaserVersion).toMatch(/^\^3\.8/);
    });

    it("should have Zustand as dependency", () => {
      expect(packageJson.dependencies.zustand).toBeDefined();
      expect(packageJson.dependencies.zustand).toMatch(/^\^4\./);
    });

    it("should have Supabase client as dependency", () => {
      expect(packageJson.dependencies["@supabase/supabase-js"]).toBeDefined();
    });

    it("should have TypeScript as dev dependency", () => {
      expect(packageJson.devDependencies.typescript).toBeDefined();
    });

    it("should have Vitest as dev dependency", () => {
      expect(packageJson.devDependencies.vitest).toBeDefined();
    });

    it("should have ESLint as dev dependency", () => {
      expect(packageJson.devDependencies.eslint).toBeDefined();
    });

    it("should have Prettier as dev dependency", () => {
      expect(packageJson.devDependencies.prettier).toBeDefined();
    });

    it("should have test script configured", () => {
      expect(packageJson.scripts.test).toBeDefined();
      expect(packageJson.scripts.test).toContain("vitest");
    });

    it("should have lint script configured", () => {
      expect(packageJson.scripts.lint).toBeDefined();
      expect(packageJson.scripts.lint).toContain("eslint");
    });
  });

  describe("Folder Structure", () => {
    const srcDir = path.join(rootDir, "src");

    it("should have components directory", () => {
      expect(fs.existsSync(path.join(srcDir, "components"))).toBe(true);
    });

    it("should have game directory with scenes and entities subdirectories", () => {
      expect(fs.existsSync(path.join(srcDir, "game"))).toBe(true);
      expect(fs.existsSync(path.join(srcDir, "game", "scenes"))).toBe(true);
      expect(fs.existsSync(path.join(srcDir, "game", "entities"))).toBe(true);
    });

    it("should have stores directory", () => {
      expect(fs.existsSync(path.join(srcDir, "stores"))).toBe(true);
    });

    it("should have services directory", () => {
      expect(fs.existsSync(path.join(srcDir, "services"))).toBe(true);
    });

    it("should have hooks directory", () => {
      expect(fs.existsSync(path.join(srcDir, "hooks"))).toBe(true);
    });

    it("should have types directory", () => {
      expect(fs.existsSync(path.join(srcDir, "types"))).toBe(true);
    });
  });

  describe("Vite Configuration", () => {
    it("should have vite.config.ts file", () => {
      const viteConfigPath = path.join(rootDir, "vite.config.ts");
      expect(fs.existsSync(viteConfigPath)).toBe(true);
    });

    it("should have Phaser in vite.config.ts for optimization", () => {
      const viteConfigPath = path.join(rootDir, "vite.config.ts");
      const viteConfig = fs.readFileSync(viteConfigPath, "utf-8");
      expect(viteConfig).toContain("phaser");
    });

    it("should have path alias configured in vite.config.ts", () => {
      const viteConfigPath = path.join(rootDir, "vite.config.ts");
      const viteConfig = fs.readFileSync(viteConfigPath, "utf-8");
      expect(viteConfig).toContain("alias");
      expect(viteConfig).toContain("@");
    });
  });

  describe("ESLint Configuration", () => {
    it("should have eslint.config.js file", () => {
      const eslintConfigPath = path.join(rootDir, "eslint.config.js");
      expect(fs.existsSync(eslintConfigPath)).toBe(true);
    });

    it("should have TypeScript ESLint configuration", () => {
      const eslintConfigPath = path.join(rootDir, "eslint.config.js");
      const eslintConfig = fs.readFileSync(eslintConfigPath, "utf-8");
      expect(eslintConfig).toContain("tseslint");
    });

    it("should have React hooks plugin configured", () => {
      const eslintConfigPath = path.join(rootDir, "eslint.config.js");
      const eslintConfig = fs.readFileSync(eslintConfigPath, "utf-8");
      expect(eslintConfig).toContain("react-hooks");
    });
  });

  describe("Project Entry Files", () => {
    it("should have index.html", () => {
      const indexPath = path.join(rootDir, "index.html");
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    it("should have src/main.tsx", () => {
      const mainPath = path.join(rootDir, "src", "main.tsx");
      expect(fs.existsSync(mainPath)).toBe(true);
    });

    it("should have src/App.tsx", () => {
      const appPath = path.join(rootDir, "src", "App.tsx");
      expect(fs.existsSync(appPath)).toBe(true);
    });
  });

  describe("Game Configuration", () => {
    it("should have game config file", () => {
      const configPath = path.join(rootDir, "src", "game", "config.ts");
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it("should have GAME_CONFIG exported in config.ts", () => {
      const configPath = path.join(rootDir, "src", "game", "config.ts");
      const configContent = fs.readFileSync(configPath, "utf-8");
      expect(configContent).toContain("GAME_CONFIG");
      expect(configContent).toContain("width");
      expect(configContent).toContain("height");
    });

    it("should have difficulty speed mapping", () => {
      const constantsPath = path.join(rootDir, "src", "game", "constants.ts");
      const constantsContent = fs.readFileSync(constantsPath, "utf-8");
      expect(constantsContent).toContain("DIFFICULTY_SPEED");
      expect(constantsContent).toContain("easy");
      expect(constantsContent).toContain("medium");
      expect(constantsContent).toContain("hard");
    });
  });

  describe("Type Definitions", () => {
    it("should have types/index.ts file", () => {
      const typesPath = path.join(rootDir, "src", "types", "index.ts");
      expect(fs.existsSync(typesPath)).toBe(true);
    });

    it("should export game types", () => {
      const typesPath = path.join(rootDir, "src", "types", "index.ts");
      const typesContent = fs.readFileSync(typesPath, "utf-8");
      expect(typesContent).toContain("Difficulty");
      expect(typesContent).toContain("GameStatus");
      expect(typesContent).toContain("GameState");
    });
  });
});
