import { test, expect } from '@playwright/test';

test.describe("Zero-Knowledge Ad-Free Focus Pass and Editorial Zen Stream (COUNCIL-2026-010)", () => {
  test("should redeem a Focus Pass, suppress commercial ads, display floating Zen HUD, and show Zen Stream cards", async ({ page }) => {
    // 0. Ensure clean state
    await page.addInitScript(() => {
      localStorage.removeItem('adme_focus_pass');
    });

    // 1. Navigate to home and authenticate as Marcus (1250 reward points) via Demo Switcher
    await page.goto('http://localhost:3400');
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Marcus (Local Foodie)' }).click()
    ]);
    await expect(page.locator('header')).toContainText('M');

    // Wait for the feed to load ensuring session is fully active
    await page.waitForSelector('article', { timeout: 10000 });

    // 2. Navigate to /rewards where Marcus has points
    await page.goto('http://localhost:3400/rewards');

    // 3. Locate the Ad-Free Focus Passes section
    await page.waitForSelector('h3', { timeout: 10000 });
    const focusHeading = page.locator('h3').filter({ hasText: /Ad-Free Focus Passes/i });
    await expect(focusHeading).toBeVisible();

    // Verify all three tiers are present
    const pass15mBtn = page.locator('[data-testid="redeem-focus-pass-15m"]');
    const pass1hBtn = page.locator('[data-testid="redeem-focus-pass-1h"]');
    const pass24hBtn = page.locator('[data-testid="redeem-focus-pass-24h"]');

    await expect(pass15mBtn).toBeVisible();
    await expect(pass1hBtn).toBeVisible();
    await expect(pass24hBtn).toBeVisible();

    // Ensure points have loaded and pass button is enabled
    await expect(pass15mBtn).toBeEnabled({ timeout: 10000 });

    // 4. Redeem the 15m Sprint Focus Pass (100 points)
    await pass15mBtn.click();

    // Verify toast confirmation and button status change
    await expect(page.locator('[data-testid="redeem-focus-pass-15m"]')).toContainText(/Active Now/i);

    // 5. Navigate to Home Feed
    await page.goto('http://localhost:3400');
    await page.waitForSelector('main', { timeout: 10000 });

    // 6. Verify floating Zen HUD is mounted and active
    const hud = page.locator('[data-testid="focus-mode-hud"]');
    await expect(hud).toBeVisible();
    await expect(hud).toContainText(/Zen Focus Active/i);

    const timer = page.locator('[data-testid="focus-time-left"]');
    await expect(timer).toBeVisible();

    // 7. Verify Editorial Zen Stream container is rendered
    const zenStream = page.locator('[data-testid="zen-stream-container"]');
    await expect(zenStream).toBeVisible();

    const zenCards = page.locator('[data-testid="zen-card"]');
    await expect(zenCards.first()).toBeVisible();

    // Test mindful breath micro-interaction
    const breathBtn = page.locator('[data-testid="zen-breath-btn"]').first();
    await expect(breathBtn).toBeVisible();
    await breathBtn.click();
    await expect(breathBtn).toContainText(/Exhale/i);

    // 8. Test canceling Focus Pass to restore regular feed
    const cancelBtn = page.locator('[data-testid="cancel-focus-pass"]');
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // HUD and Zen Stream should cleanly unmount
    await expect(hud).not.toBeVisible();
    await expect(zenStream).not.toBeVisible();
  });
});
