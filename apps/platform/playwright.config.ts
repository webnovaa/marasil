import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/Browser',
    timeout: 60_000,
    expect: { timeout: 15_000 },
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: process.env.SMOKE_BASE_URL ?? 'http://localhost:8181',
        // Dedicated test server; no production accounts or WhatsApp sends.
        trace: 'off',
        screenshot: 'only-on-failure',
        channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge',
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
        { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    ],
});
