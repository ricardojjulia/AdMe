import { test, expect } from '@playwright/test';

test.describe('Ads for Good & Community Impact Co-Sponsorship (COUNCIL-2026-013)', () => {
  test('should render Ads for Good badge on feed cards and open cause modal', async ({ page }) => {
    await page.goto('/');

    // 1. Locate the Ads for Good pill on an ad card
    const impactPill = page.locator('button').filter({ hasText: /Ads for Good/i }).first();
    await expect(impactPill).toBeVisible();

    // 2. Click the pill to open the cause modal
    await impactPill.click();

    // 3. Verify modal elements
    await expect(page.locator('h3').filter({ hasText: /Urban Reforestation|Warm Meals|Youth Robotics|Animal Rescue/i }).first()).toBeVisible();
    await expect(page.locator('text=Co-Sponsor Partner:').first()).toBeVisible();
    await expect(page.locator('text=Impact rate:').first()).toBeVisible();

    // 4. Close the modal
    const closeBtn = page.getByRole('button', { name: 'Close', exact: true }).or(page.locator('button[aria-label="Close"]'));
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click();
    }
  });

  test('should display Community Impact tab on /rewards?tab=impact and allow split preference toggle', async ({ page }) => {
    // 1. Log in as Marcus Ramirez via Demo Switcher
    await page.goto('/');
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Marcus (Local Foodie)' }).click(),
    ]);
    await expect(page.locator('header')).toContainText('M');

    // 2. Navigate directly to /rewards?tab=impact
    await page.goto('/rewards?tab=impact');

    // 3. Verify hero title and split options
    await expect(page.locator('h2').filter({ hasText: /Ads for Good: Community Impact Co-Sponsorship/i })).toBeVisible();
    await expect(page.locator('text=50/50 Dual Benefit')).toBeVisible();
    await expect(page.locator('text=100% Community Champion')).toBeVisible();
    await expect(page.locator('text=100% Personal Perks')).toBeVisible();

    // 4. Select "100% Community Champion"
    await page.locator('div').filter({ hasText: /100% Community Champion/i }).last().click();

    // 5. Verify cause cards are displayed
    await expect(page.locator('h4').filter({ hasText: /Urban Reforestation & Shade Canopy/i })).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: /Warm Meals for Local Shelters/i })).toBeVisible();

    // 6. Donate 25 points to a cause
    const donateBtn = page.getByRole('button', { name: /Donate 25 pts/i }).first();
    await expect(donateBtn).toBeEnabled();
    await donateBtn.click();

    // 7. Verify certificate is created
    await expect(page.locator('div[class*="certCard"]').first()).toBeVisible();
    await expect(page.locator('div[class*="certId"]').first()).toContainText('IMP-');
  });

  test('should switch between tabs on /rewards without losing navigation', async ({ page }) => {
    // 1. Log in as Marcus Ramirez via Demo Switcher
    await page.goto('/');
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Marcus (Local Foodie)' }).click(),
    ]);
    await expect(page.locator('header')).toContainText('M');

    await page.goto('/rewards');

    // 2. Check default tab shows tab buttons and poll deck
    await expect(page.locator('button[data-testid="tab-community-impact"]')).toBeVisible();

    // 3. Switch to impact tab
    await page.locator('button[data-testid="tab-community-impact"]').click();
    await expect(page.locator('h2').filter({ hasText: /Ads for Good/i })).toBeVisible();

    // 4. Switch back to perks tab
    await page.locator('button[data-testid="tab-all-perks"]').click();
    await expect(page.locator('h4').filter({ hasText: 'Vibe-check preferences' })).toBeVisible();
  });

  test('should support complete Spanish (es-PR) impact flow in feed and rewards dashboard', async ({ page }) => {
    // 1. Initialize page with Spanish locale
    await page.addInitScript(() => {
      localStorage.setItem('adme_locale', 'es-PR');
    });

    await page.goto('/');

    // 2. Locate the Ads for Good pill with Spanish text
    const impactPill = page.locator('button').filter({ hasText: /Anuncios con Causa/i }).first();
    await expect(impactPill).toBeVisible();

    // 3. Open modal and verify Spanish labels
    await impactPill.click();
    await expect(page.locator('text=Patrocinador Solidario:').first()).toBeVisible();
    await expect(page.locator('text=Tasa de impacto:').first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /Contribuir 25 pts/i }).first()).toBeVisible();

    // Close modal
    const closeBtn = page.getByRole('button', { name: 'Close', exact: true }).or(page.locator('button[aria-label="Close"]'));
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click();
    }

    // 4. Log in as Marcus Ramirez via Demo Switcher
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Marcus (Local Foodie)' }).click(),
    ]);
    await expect(page.locator('header')).toContainText('M');

    // 5. Navigate to /rewards?tab=impact
    await page.goto('/rewards?tab=impact');

    // 6. Verify Spanish titles and split options
    await expect(page.locator('h2').filter({ hasText: /Anuncios con Causa: Co-Patrocinio de Impacto Comunitario/i })).toBeVisible();
    await expect(page.locator('text=50/50 Beneficio Dual')).toBeVisible();
    await expect(page.locator('text=100% Campeón Comunitario')).toBeVisible();
    await expect(page.locator('text=100% Recompensas Personales')).toBeVisible();

    // 7. Verify Spanish cause cards
    await expect(page.locator('h4').filter({ hasText: /Siembra Urbana y Reforestación/i })).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: /Comidas Calientes para Albergues/i })).toBeVisible();

    // 8. Donate 25 points in Spanish
    const donateBtn = page.locator('button').filter({ hasText: /Donar 25 pts/i }).first();
    await expect(donateBtn).toBeVisible();
    await donateBtn.click();

    // 9. Verify certificate is created with Spanish cause title
    await expect(page.locator('div[class*="certCard"]').first()).toBeVisible();
    await expect(page.locator('div[class*="certId"]').first()).toContainText('IMP-');
  });
});

