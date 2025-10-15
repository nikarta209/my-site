import { test, expect } from '@playwright/test';

const baseURL = process.env.KASBOOK_BASE_URL || 'http://127.0.0.1:4173';

test.describe('home page (smoke)', () => {
  test.skip(process.env.CI !== 'true', 'Run in CI with the application server running');

  test('renders hero tabs and allows keyboard navigation', async ({ page }) => {
    await page.goto(baseURL);
    await page.getByRole('tab', { name: /Стань автором|Become an author/i }).isVisible();
    await page.keyboard.press('End');
    const lastTab = await page.locator('[role="tab"]').last();
    await expect(lastTab).toBeFocused();
  });

  test('hides subscription banner when feature flag is false', async ({ page }) => {
    await page.goto(`${baseURL}/SubscriptionPage`);
    await expect(page.getByRole('heading', { level: 2 })).toContainText(/подписка временно недоступна|Premium is temporarily paused/i);
  });
});
