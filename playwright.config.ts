import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000, // cold `next dev` compiles each page on first visit
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
  use: { baseURL: "http://localhost:3000" },
});
