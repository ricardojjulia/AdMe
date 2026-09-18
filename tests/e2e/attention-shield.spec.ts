import { test, expect } from '@playwright/test';

test.describe('Attention Shield & Value-Exchange Voucher Minting (COUNCIL-2026-009)', () => {
  test('should display Attention Shield badge, permit session fatigue resets, and mint value-exchange vouchers', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3400');

    // Authenticate as Marcus via Demo Switcher
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Marcus (Local Foodie)' }).click()
    ]);
    await expect(page.locator('header')).toContainText('M');

    // Wait for the feed to load
    await page.waitForSelector('article', { timeout: 10000 });

    // 1. Verify Attention Shield status badge is visible
    const shieldBadge = page.locator('[data-testid="attention-shield-badge"]');
    await expect(shieldBadge).toBeVisible();

    // Click badge to expand shield statistics and controls
    await shieldBadge.click();
    const dropdown = page.locator('[data-testid="attention-shield-panel"]');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toContainText('Anti-Clustering');
    await expect(dropdown).toContainText('Reset Session Fatigue');

    // Click Reset Session Fatigue
    const resetBtn = page.getByRole('button', { name: /Reset Session Fatigue/i });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // 2. Locate a "Claim Deal" voucher button on an ad card
    const claimBtn = page.getByRole('button', { name: /Claim Deal/i }).first();
    await expect(claimBtn).toBeVisible();

    // Click Claim Deal
    await claimBtn.click();

    // Verify voucher button transitions to "Saved to Wallet"
    const savedLink = page.getByRole('link', { name: /Saved to Wallet/i }).first();
    await expect(savedLink).toBeVisible();

    // 3. Navigate to Rewards Wallet page
    await page.goto('http://localhost:3400/rewards');

    // Verify Coupon Wallet displays
    await page.waitForSelector('h1, h2, h3', { timeout: 10000 });
    const couponWalletHeading = page.locator('h3').filter({ hasText: 'My Voucher Wallet' });
    await expect(couponWalletHeading).toBeVisible();
  });
});
