import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site: https://visacode.github.io/daily-dose/
export default defineConfig({
  plugins: [react()],
  base: "/daily-dose/",
  server: { host: "127.0.0.1", port: 5173 },
  preview: { host: "127.0.0.1", port: 4173 },
  build: { outDir: "dist", assetsDir: "assets", sourcemap: false },
});
