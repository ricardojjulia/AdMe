import { test, expect } from '@playwright/test';

test.describe('Ephemeral Contextual Intent Tuner (COUNCIL-2026-011)', () => {
  test('should mount Intent Tuner HUD, switch contextual modes, re-rank feed, display resonance badges, and preserve zero-tracking privacy', async ({ page }) => {
    // 1. Navigate to homepage
    await page.goto('http://localhost:3400');

    // Authenticate as Marcus via Demo Switcher
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Marcus (Local Foodie)' }).click()
    ]);
    await expect(page.locator('header')).toContainText('M');

    // Wait for the feed articles to load
    await page.waitForSelector('article', { timeout: 10000 });

    // 2. Verify Intent Tuner HUD is mounted
    const hud = page.locator('[data-testid="intent-tuner-hud"]');
    await expect(hud).toBeVisible();
    await expect(hud).toContainText('Intent Tuner');

    // 3. Verify all 4 pills are visible and 'all' is checked initially
    const pillAll = page.locator('[data-testid="intent-pill-all"]');
    const pillLocal = page.locator('[data-testid="intent-pill-local"]');
    const pillDeals = page.locator('[data-testid="intent-pill-deals"]');
    const pillMindful = page.locator('[data-testid="intent-pill-mindful"]');

    await expect(pillAll).toBeVisible();
    await expect(pillLocal).toBeVisible();
    await expect(pillDeals).toBeVisible();
    await expect(pillMindful).toBeVisible();

    await expect(pillAll).toHaveAttribute('aria-checked', 'true');
    await expect(pillLocal).toHaveAttribute('aria-checked', 'false');

    // In 'all' mode, resonance badges should not be displayed
    await expect(page.locator('[data-testid^="intent-resonance-badge-"]')).toHaveCount(0);

    // 4. Switch to 'Local Gems' mode
    await pillLocal.click();
    await expect(pillLocal).toHaveAttribute('aria-checked', 'true');
    await expect(pillAll).toHaveAttribute('aria-checked', 'false');

    // Verify local resonance badge appears on at least one card
    const localBadges = page.locator('[data-testid="intent-resonance-badge-local"]');
    await expect(localBadges.first()).toBeVisible();

    // 5. Switch to 'Deal Hunter' mode
    await pillDeals.click();
    await expect(pillDeals).toHaveAttribute('aria-checked', 'true');
    await expect(pillLocal).toHaveAttribute('aria-checked', 'false');

    // Verify deal resonance badge appears
    const dealBadges = page.locator('[data-testid="intent-resonance-badge-deals"]');
    await expect(dealBadges.first()).toBeVisible();

    // 6. Switch to 'Mindful' mode
    await pillMindful.click();
    await expect(pillMindful).toHaveAttribute('aria-checked', 'true');
    await expect(pillDeals).toHaveAttribute('aria-checked', 'false');

    // Verify mindful resonance badge appears
    const mindfulBadges = page.locator('[data-testid="intent-resonance-badge-mindful"]');
    await expect(mindfulBadges.first()).toBeVisible();

    // 7. Verify Zero-Tracking Privacy: no intent cookie or persistent tracking profile written
    const cookies = await page.context().cookies();
    const intentCookies = cookies.filter(c => c.name.toLowerCase().includes('intent'));
    expect(intentCookies).toHaveLength(0);

    const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
    const intentStorage = localStorageKeys.filter(k => k.toLowerCase().includes('intent_tracker'));
    expect(intentStorage).toHaveLength(0);

    // 8. Return to 'all' mode
    await pillAll.click();
    await expect(pillAll).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('[data-testid^="intent-resonance-badge-"]')).toHaveCount(0);
  });
});
