import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e-tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3001',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* Add test headers to bypass security */
    extraHTTPHeaders: {
      'X-Playwright-Test': 'true'
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'backend-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
      testMatch: '**/backend/**/*.spec.ts',
    },
    {
      name: 'frontend-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
      testMatch: '**/frontend/**/*.spec.ts',
    },
    {
      name: 'backend-firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:3001',
      },
      testMatch: '**/backend/**/*.spec.ts',
    },
    {
      name: 'frontend-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:3000',
      },
      testMatch: '**/frontend/**/*.spec.ts',
    },
    {
      name: 'mobile-backend',
      use: {
        ...devices['iPhone 13'],
        baseURL: 'http://localhost:3001',
      },
      testMatch: '**/backend/**/*.mobile.spec.ts',
    },
    {
      name: 'mobile-frontend',
      use: {
        ...devices['iPhone 13'],
        baseURL: 'http://localhost:3000',
      },
      testMatch: '**/frontend/**/*.mobile.spec.ts',
    },
    {
      name: 'mobile-responsive',
      use: {
        ...devices['iPhone 13'],
        baseURL: 'http://localhost:3001',
      },
      testMatch: '**/mobile/**/*.spec.ts',
    },
    {
      name: 'cross-browser-backend-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
      testMatch: '**/cross-browser/backend-*.spec.ts',
    },
    {
      name: 'cross-browser-backend-firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:3001',
      },
      testMatch: '**/cross-browser/backend-*.spec.ts',
    },
    {
      name: 'cross-browser-backend-webkit',
      use: {
        ...devices['Desktop Safari'],
        baseURL: 'http://localhost:3001',
      },
      testMatch: '**/cross-browser/backend-*.spec.ts',
    },
    {
      name: 'cross-browser-frontend-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
      testMatch: '**/cross-browser/frontend-*.spec.ts',
    },
    {
      name: 'cross-browser-frontend-firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:3000',
      },
      testMatch: '**/cross-browser/frontend-*.spec.ts',
    },
    {
      name: 'cross-browser-frontend-webkit',
      use: {
        ...devices['Desktop Safari'],
        baseURL: 'http://localhost:3000',
      },
      testMatch: '**/cross-browser/frontend-*.spec.ts',
    },
    {
      name: 'ui-only-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
      testMatch: '**/ui-only/**/*.spec.ts',
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'cd api && npx tsx src/index.ts',
      port: 4002,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd backend && npm run dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd frontend && npm run dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
