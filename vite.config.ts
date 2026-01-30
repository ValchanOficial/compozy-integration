import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Phaser into its own chunk for better caching
          // and to enable lazy loading in future implementations
          phaser: ["phaser"],
        },
      },
    },
  },
  optimizeDeps: {
    // Pre-bundle Phaser to improve dev server startup time
    include: ["phaser"],
  },
});
