import { defineConfig } from "@playwright/test";

const E2E_DB = "postgresql://supply:supply@localhost:5432/supply_e2e";

export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  timeout: 45_000,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node tests/e2e/fixture-server.mjs",
      url: "http://localhost:3100/products.json?page=2",
      reuseExistingServer: false,
    },
    {
      command: "next dev",
      url: "http://localhost:3000",
      reuseExistingServer: false,
      env: {
        DATABASE_URL: E2E_DB,
        AUTH_SECRET: "e2e-secret",
        EMAIL_MODE: "capture",
        EMAIL_CAPTURE_DIR: ".email-capture-e2e",
        TEAM_INBOX: "team@example.com",
        CATALOGUE_BASE_URL: "http://localhost:3100",
      },
    },
  ],
});
