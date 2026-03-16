import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function resolveBase() {
  if (!process.env.GITHUB_ACTIONS) return "/";

  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
  if (!repo || repo.toLowerCase().endsWith(".github.io")) {
    return "/";
  }

  return `/${repo}/`;
}

export default defineConfig({
  plugins: [react()],
  // Auto-detect correct base for GitHub Pages project vs user site.
  base: resolveBase(),
});
