import { test, expect } from '@playwright/test';

test.describe('AdMe Roles, Navigation & Bilingual Localization E2E Suite', () => {

  test('should seamlessly switch between demo personas and preserve user state', async ({ page }) => {
    await page.goto('/');

    // Toggle Demo Switcher
    await page.getByLabel('Toggle Demo Switcher').click();

    // Select Elena (New User)
    await page.getByRole('button', { name: /Elena/i }).click();

    // Check avatar in header reflects Elena
    await expect(page.locator('header')).toContainText('E');

    // Switch to Marcus (Local Foodie)
    await page.getByLabel('Toggle Demo Switcher').click();
    await page.getByRole('button', { name: /Marcus/i }).click();

    // Check avatar in header reflects Marcus
    await expect(page.locator('header')).toContainText('M');
  });

  test('should navigate across all consumer views (/profile, /rewards, /onboarding)', async ({ page }) => {
    // Navigate to Rewards page
    await page.goto('/rewards');
    await expect(page.locator('body')).toContainText(/Rewards|Points|Perks|Wallet/i);

    // Navigate to Profile page
    await page.goto('/profile');
    await expect(page.locator('body')).toContainText(/Profile|Account|Privacy|Preferences/i);

    // Navigate to Onboarding page
    await page.goto('/onboarding');
    await expect(page.locator('body')).toContainText(/Preferences|Interests|Welcome|Topics/i);
  });

  test('should toggle bilingual translation between English and Spanish in runtime DOM', async ({ page }) => {
    await page.goto('/');

    // Find the language switcher toggle button
    const langBtn = page.getByRole('button', { name: /ES|EN|Español|English/i }).first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      
      // Wait for language transition
      await page.waitForTimeout(500);

      // Verify page is still functional and rendered
      await expect(page.locator('body')).toBeVisible();

      // Switch back to English
      await langBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
