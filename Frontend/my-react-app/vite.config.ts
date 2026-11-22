import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";

const IDE_SERVER = process.env.IDE_SERVER_URL ?? "http://127.0.0.1:7071";
const BACKEND_SERVER = process.env.BACKEND_URL ?? "http://localhost:9080";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      // REST API of the bike booking backend.
      "/api": {
        target: BACKEND_SERVER,
        changeOrigin: true,
        rewrite: (pathname) => pathname.replace(/^\/api/, ""),
      },
      // File tree, solution explorer and file contents.
      "/ide-api": {
        target: IDE_SERVER,
        changeOrigin: true,
        rewrite: (pathname) => pathname.replace(/^\/ide-api/, "/api"),
      },
      // WebSocket bridge to the real PTY shell.
      "/ide-pty": {
        target: IDE_SERVER.replace(/^http/, "ws"),
        ws: true,
      },
      // OpenCode chat API (proxied again by ide-server to the local OpenCode server).
      "/oc": {
        target: IDE_SERVER,
        changeOrigin: true,
      },
    },
  },
});
