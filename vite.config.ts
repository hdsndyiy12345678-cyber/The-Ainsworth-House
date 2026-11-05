import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/ai": { target: "http://127.0.0.1:8788", changeOrigin: false },
    },
  },
  preview: {
    proxy: {
      "/api/ai": { target: "http://127.0.0.1:8788", changeOrigin: false },
    },
  },
  test: { include: ["src/**/*.test.ts"] },
});
