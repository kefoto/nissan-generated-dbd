import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = "nissan-generated-dbd";

export default defineConfig({
  plugins: [react()],
  // Use repository subpath on GitHub Pages project deployments.
  base: process.env.GITHUB_ACTIONS ? `/${repoName}/` : "/",
});
