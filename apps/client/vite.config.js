import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        categories: resolve(__dirname, "categories.html"),
        game: resolve(__dirname, "game.html"),
        lobby: resolve(__dirname, "lobby.html"),
      },
    },
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        // Docker: API_PROXY_TARGET=http://core-api:1968 (set in client.yml)
        // Local:  falls back to localhost
        target: process.env.API_PROXY_TARGET || "http://localhost:1968",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
