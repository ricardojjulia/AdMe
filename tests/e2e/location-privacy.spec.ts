import { test, expect } from '@playwright/test';

test.describe('Privacy-Preserving Location & Proximity Controls (COUNCIL-2026-004)', () => {
  test('should display LocationBadge, open privacy modal, switch manual city, and toggle disabled mode', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3400');

    // 1. Assert LocationBadge is present
    const locationBadge = page.locator('button[aria-label="Location privacy settings"]');
    await expect(locationBadge).toBeVisible();

    // Verify badge shows coarse edge baseline or local indicator
    await expect(locationBadge).toContainText('Santa Monica');
    await expect(locationBadge).toContainText('Zero tracking');

    // 2. Click badge to open LocationPrivacyModal
    await locationBadge.click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Location Privacy Controls');
    await expect(modal).toContainText('COUNCIL-2026-004');
    await expect(modal).toContainText('Zero Cloud Persistence');

    // 3. Select quick chip for "San Juan, PR"
    const sanJuanChip = modal.locator('button', { hasText: 'San Juan, PR' });
    await sanJuanChip.click();

    // Verify current status updates in modal
    await expect(modal).toContainText('San Juan, PR');

    // 4. Click Done to close modal
    const doneButton = modal.locator('button', { hasText: 'Done' });
    await doneButton.click();
    await expect(modal).not.toBeVisible();

    // Verify LocationBadge reflects the manual override
    await expect(locationBadge).toContainText('San Juan, PR');

    // 5. Re-open modal and disable location completely
    await locationBadge.click();
    await expect(modal).toBeVisible();

    const clearButton = modal.locator('button', { hasText: 'Clear / Disable Location' });
    await clearButton.click();

    // Close modal
    await doneButton.click();
    await expect(modal).not.toBeVisible();

    // 6. Verify badge shows disabled state
    await expect(locationBadge).toContainText('Global Feed');
    await expect(locationBadge).toContainText('Disabled');
  });
});
