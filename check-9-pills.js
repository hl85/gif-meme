const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://gifmeme.org');
  await page.waitForSelector('[data-testid="category-pill"]', { timeout: 10000 });
  const count = await page.locator('[data-testid="category-pill"]').count();
  console.log(`Number of category pills: ${count}`);
  // Click on GIF card and check URL
  await page.waitForSelector('[data-testid="gif-card"]', { timeout: 10000 });
  await page.locator('[data-testid="gif-card"]').first().click();
  await page.waitForURL(/\/gif\/\d+/, { timeout: 10000 });
  console.log(`After click URL: ${page.url()}`);
  await page.goto('https://gifmeme.org');
  // Click sign in
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForSelector('[data-testid="login-dialog"]', { timeout: 10000 });
  const hasLogo = await page.locator('[data-testid="login-logo"]').isVisible();
  console.log(`Login dialog has logo: ${hasLogo}`);
  await browser.close();
})();
