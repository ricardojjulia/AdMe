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
});
