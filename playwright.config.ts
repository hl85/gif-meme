import { defineConfig, devices } from '@playwright/test';

const localPort = process.env.LOCAL_PORT?.trim() || '8787';
const baseURL = process.env.PLAYWRIGHT_BASE_URL?.trim() || process.env.NEXT_PUBLIC_BASE_URL?.trim() || `http://localhost:${localPort}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
