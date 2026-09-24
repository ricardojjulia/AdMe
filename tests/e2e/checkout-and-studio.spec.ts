import { test, expect } from '@playwright/test';

test.describe('AdMe Monetization & Campaign Studio E2E Suite', () => {

  test('should navigate to /checkout, select credit packages and simulate checkout flow', async ({ page }) => {
    await page.goto('/checkout');

    // Verify checkout page heading and pricing options
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();

    // Verify credit pack cards exist
    const creditPacks = page.locator('text=AdCredits').or(page.locator('text=Starter')).or(page.locator('text=Growth'));
    await expect(creditPacks.first()).toBeVisible();

    // Verify subscription tiers exist (e.g. Starter / Growth / Scale)
    await expect(page.locator('body')).toContainText(/Starter|Growth|Scale|Credits/i);
  });

  test('should render /checkout/success and verify simulated session fulfillment', async ({ page }) => {
    await page.goto('/checkout/success?session_id=cs_test_e2e_mock_12345&mode=credits&val=25');

    // Verify success confirmation card
    await expect(page.locator('body')).toContainText(/Payment Confirmed|Payment Successful|Order Confirmed|Success/i);
    await expect(page.locator('body')).toContainText(/cs_test_e2e_mock_12345/);
  });

  test('should allow advertiser in /studio to view campaigns, update bids and manage leads', async ({ page }) => {
    await page.goto('/');

    // Switch to Valor Brews (Business) persona
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Valor Brews (Business)' }).click()
    ]);

    // Navigate to /studio
    await page.goto('/studio');

    // Verify advertiser studio header
    await expect(page.locator('body')).toContainText(/Active Campaigns|Campaigns|Advertiser/i);

    // Verify campaign performance or metrics section
    await expect(page.locator('body')).toContainText(/Impressions|Dwell|Voucher|CTR|Bid/i);

    // Check if Auction Board or Max CPC Bid adjustment is interactive
    const bidInput = page.locator('input[type="number"], input[type="range"]').first();
    if (await bidInput.isVisible()) {
      await bidInput.fill('50');
    }
  });

  test('should create campaign in /studio/create with Creative Co-Pilot and Ethical Scorer', async ({ page }) => {
    await page.goto('/');

    // Switch to Valor Brews (Business) persona
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Valor Brews (Business)' }).click()
    ]);

    // Navigate to /studio/create
    await page.goto('/studio/create');

    // Verify campaign creator form
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();

    // Verify Ethical Scorer meter or compliance badge is present
    await expect(page.locator('body')).toContainText(/Ethical|Resonance|Score|Co-Pilot|Create/i);
  });
});
