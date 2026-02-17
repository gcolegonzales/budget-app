import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Relative base so assets load at .../budget-app/assets/... on GitHub Pages
  base: "./",
  plugins: [react(), tailwindcss()],
});
