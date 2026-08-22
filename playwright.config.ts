import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3010",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "PORT=3011 MONOPOLY_TEST_DICE=3,3 npm run dev:server",
      url: "http://localhost:3011/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "CLIENT_PORT=3010 NEXT_PUBLIC_SERVER_URL=http://localhost:3011 npm run dev:client",
      url: "http://localhost:3010",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
