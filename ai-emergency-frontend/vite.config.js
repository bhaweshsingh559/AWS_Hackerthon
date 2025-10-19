// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_BASE = process.env.VITE_API_BASE_URL || "http://localhost:3002";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // forward /api/* to backend during development
      "/api": {
        target: API_BASE,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
  define: { "process.env": {} },
});