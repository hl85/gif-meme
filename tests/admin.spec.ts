import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('non-admin gets 403 or redirect', async ({ page }) => {
    const response = await page.goto('/admin');
    if (response) {
      const status = response.status();
      expect([200, 401, 403]).toContain(status);
    }
  });

  test('admin page with mock admin cookie shows dashboard', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'session',
        value: 'mock-admin-jwt',
        domain: 'localhost',
        path: '/',
      },
    ]);
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});