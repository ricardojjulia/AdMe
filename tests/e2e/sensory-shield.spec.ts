import { test, expect } from '@playwright/test';

test.describe('Sensory Shield & Cognitive Comfort Mode E2E (COUNCIL-2026-012)', () => {

  test('should display Sensory Shield HUD, toggle comfort mode, and enforce reduced motion CSS', async ({ page }) => {
    await page.goto('/');

    // 1. Locate Sensory Shield HUD
    const hud = page.locator('[data-testid="sensory-shield-hud"]');
    await expect(hud).toBeVisible();

    const toggleBtn = page.locator('[data-testid="sensory-shield-toggle"]');
    await expect(toggleBtn).toBeVisible();

    // 2. Activate Sensory Shield (Calm Mode)
    await toggleBtn.click();

    // 3. Assert root <html> attribute is updated to comfort mode
    const rootHtml = page.locator('html');
    await expect(rootHtml).toHaveAttribute('data-sensory-mode', 'comfort');

    // 4. Assert toggle button state updates to active
    await expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(toggleBtn).toContainText('Calm Mode');

    // 5. Explicitly verify CSS keyframes and animations are disabled on target DOM nodes (Amendment 3)
    const animDuration = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="sensory-shield-hud"]');
      if (!el) return null;
      return window.getComputedStyle(el).animationDuration;
    });

    // In comfort mode, animation-duration is clamped to 0.001ms (Chromium renders 1e-06s)
    expect(animDuration).toMatch(/^(0s|0\.001ms|0\.000001s|1e-06s)$/);
    expect(parseFloat(animDuration || '1')).toBeLessThan(0.001);

    // 6. Assert persistence across reload
    const storedPref = await page.evaluate(() => {
      return localStorage.getItem('adme_sensory_shield_v1');
    });
    expect(storedPref).toBe('true');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-sensory-mode', 'comfort');

    // 7. Toggle back to Standard mode
    await page.locator('[data-testid="sensory-shield-toggle"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-sensory-mode', 'standard');
    await expect(page.locator('[data-testid="sensory-shield-toggle"]')).toHaveAttribute('aria-pressed', 'false');

    const updatedStoredPref = await page.evaluate(() => {
      return localStorage.getItem('adme_sensory_shield_v1');
    });
    expect(updatedStoredPref).toBe('false');
  });

  test('should render accessible single-tap reveal cards for interactive units when Comfort Mode is active and persist attribute across routes', async ({ page }) => {
    await page.goto('/');

    // 1. Activate Sensory Shield
    const toggleBtn = page.locator('[data-testid="sensory-shield-toggle"]');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-sensory-mode', 'comfort');

    // 2. Locate an interaction button in the feed and activate it
    const scratchTrigger = page.locator('button:has-text("Scratch to Win")').first();
    if (await scratchTrigger.isVisible()) {
      await scratchTrigger.click();

      // Verify that instead of a canvas scratch-off, the sensory-adaptive reveal card is rendered
      const sensoryCard = page.locator('[data-testid="sensory-scratch-card"]');
      await expect(sensoryCard).toBeVisible();

      const revealBtn = page.locator('[data-testid="sensory-reveal-btn"]');
      await expect(revealBtn).toBeVisible();

      // Click to instantly reveal and claim reward
      await revealBtn.click();

      // Assert interaction completes
      await expect(page.locator('text=Claimed (+50 pts)').first()).toBeVisible();
    }

    // 3. Verify that navigating to another route (e.g. /rewards) initializes data-sensory-mode="comfort" immediately
    await page.goto('/rewards');
    await expect(page.locator('html')).toHaveAttribute('data-sensory-mode', 'comfort');
  });
});
