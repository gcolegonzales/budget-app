import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  // Absolute base so assets load correctly when the page is served from a deep route
  // (e.g. refresh at /budget-app/budget/1). Relative base would resolve to /budget-app/budget/assets/ → 404.
  base: command === "build" ? "/budget-app/" : "/",
  plugins: [react(), tailwindcss()],
}));
