import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

function seedValue(file: string, constant: string): string {
    const source = readFileSync(new URL(`../../database/seeders/${file}`, import.meta.url), 'utf8');
    const value = source.match(new RegExp(`const ${constant} = '([^']+)'`))?.[1];
    if (!value) throw new Error('Missing local smoke account fixture');
    return value;
}

async function login(page: Page, admin: boolean) {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const phone = admin ? seedValue('SuperAdminSeeder.php', 'PHONE') : seedValue('DemoDataSeeder.php', 'DEMO_OWNER_PHONE');
    const password = admin ? seedValue('SuperAdminSeeder.php', 'PASSWORD') : seedValue('DemoDataSeeder.php', 'DEMO_OWNER_PASSWORD');
    const token = await page.locator('meta[name="csrf-token"]').getAttribute('content');
    const response = await page.request.post('/api/v1/auth/login', {
        headers: { 'X-CSRF-TOKEN': token ?? '', Accept: 'application/json', Referer: page.url() },
        data: { phone_e164: phone, password },
    });
    expect(response.status(), 'Local seeded account must exist; this check never creates accounts').toBe(200);
}

async function checkPage(page: Page, path: string) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), { message: `Horizontal overflow on ${path}` }).toBe(true);
}

test('public pages render without runtime errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const path of ['/', '/pricing', '/docs', '/faq', '/contact', '/login']) await checkPage(page, path);
    expect(errors).toEqual([]);
});

for (const admin of [false, true]) {
    test(`${admin ? 'admin' : 'tenant'} dashboard and navigation`, async ({ page }, testInfo) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await login(page, admin);
        const home = admin ? '/admin' : '/tenant';
        await page.goto(home, { waitUntil: 'domcontentloaded' });
        const initialToken = await page.locator('meta[name="csrf-token"]').getAttribute('content');
        await page.request.post('/locale', { headers: { 'X-CSRF-TOKEN': initialToken ?? '', Referer: page.url() }, form: { locale: 'ar' } });
        await checkPage(page, home);
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
        if (testInfo.project.name === 'mobile') {
            await expect(page.locator('aside[data-mobile="true"]')).toHaveCount(0);
            const menu = page.locator('button[aria-expanded]').first();
            await menu.click();
            await expect(page.getByRole('dialog')).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(page.getByRole('dialog')).toHaveCount(0);
        }
        await page.screenshot({ path: testInfo.outputPath('dashboard-ar.png'), fullPage: true });
        const paths = admin ? ['/admin/users', '/admin/subscription-requests', '/admin/plans', '/admin/support'] : ['/devices', '/messages', '/webhooks', '/subscription'];
        for (const path of paths) await checkPage(page, path);
        const token = await page.locator('meta[name="csrf-token"]').getAttribute('content');
        await page.request.post('/locale', { headers: { 'X-CSRF-TOKEN': token ?? '', Referer: page.url() }, form: { locale: 'en' } });
        await checkPage(page, home);
        await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
        await page.screenshot({ path: testInfo.outputPath('dashboard-en.png'), fullPage: true });
        expect(errors).toEqual([]);
    });
}
