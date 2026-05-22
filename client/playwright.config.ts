import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  // reporter: "html",
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "cd .. && ./gradlew server:bootRun",
      env: {
        SPRING_PROFILES_ACTIVE: "test",
      },
      url: "http://localhost:8080/api/public/auth/me",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
})
