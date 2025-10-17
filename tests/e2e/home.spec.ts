import { test, expect } from '@playwright/test';

const subscriptionEnabled = process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTION === 'true';

test.describe('Home experience', () => {
  test('hero tabs switch and show content', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /На ваш вкус/i }).click();
    await expect(page.getByRole('heading', { level: 2, name: /На ваш вкус/i })).toBeVisible();
    await page.getByRole('tab', { name: /Новинки/i }).click();
    await expect(page.getByRole('heading', { level: 3, name: /Новинки/i })).toBeVisible();
  });

  test('subscription banner respects feature flag', async ({ page }) => {
    await page.goto('/');
    const banner = page.getByText(/KASBOOK Premium/i);
    if (subscriptionEnabled) {
      await expect(banner).toBeVisible();
    } else {
      await expect(banner).toHaveCount(0);
    }
  });
});
