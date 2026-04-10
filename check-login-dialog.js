const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://gifmeme.org');
  
  // Click Sign In button
  console.log('Clicking Sign In button...');
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for overlay to appear
  await page.waitForSelector('[data-testid="login-dialog-overlay"]', { timeout: 10000 });
  console.log('Login dialog overlay found');
  
  // Check for logo - the Logo component has data-testid=logo-wrapper
  const logoWrapper = page.locator('[data-testid="logo-wrapper"]');
  await logoWrapper.waitFor({ timeout: 5000 });
  const isLogoVisible = await logoWrapper.isVisible();
  console.log(`Logo is visible in LoginDialog: ${isLogoVisible}`);
  
  await browser.close();
})();
