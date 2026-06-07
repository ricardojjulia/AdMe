import { test, expect } from '@playwright/test';

test.describe('AdMe End-to-End Remediations Verification', () => {

  test('should load the homepage and display brand tagline', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Discover campaigns you actually asked to see');
  });

  test('should switch demo personas and display correct profile context', async ({ page }) => {
    await page.goto('/');
    
    // Open Demo Switcher panel
    await page.getByLabel('Toggle Demo Switcher').click();
    
    // Select Marcus (Local Foodie) and wait for the page reload navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Marcus (Local Foodie)' }).click()
    ]);
    
    // Assert that the avatar indicator in the header reflects Marcus's avatar 'M'
    await expect(page.locator('header')).toContainText('M');
  });

  test('should trigger proximity deals when locations are simulated for saved ads', async ({ page }) => {
    // Forward browser console logs to node terminal
    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.text()}`);
    });

    await page.goto('/');
    
    // Login as Marcus to have a stable starting context (follows Local Eateries)
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Marcus (Local Foodie)' }).click()
    ]);
    await expect(page.locator('header')).toContainText('M');
    
    // Save the Green Kitchen ad (which is local and matched with our simulator location)
    const greenKitchenCard = page.locator('article').filter({ hasText: 'The Green Kitchen' });
    const saveButton = greenKitchenCard.getByRole('button', { name: /Save/i }).first();
    await saveButton.click();
    
    // Wait for the button state to update to Saved
    await expect(saveButton).toHaveText(/Saved/i);
    
    // Proximity Simulator - click '🥗 At The Green Kitchen'
    const locationBtn = page.getByRole('button', { name: '🥗 At The Green Kitchen' });
    await locationBtn.click();
    
    // Assert that the geofence deal modal popup is triggered and visible
    await expect(page.getByText('Proximity Deal Alert')).toBeVisible();
  });

  test('should securely purge user database footprint and local session on Forget Me', async ({ page }) => {
    await page.goto('/');
    
    // Log in as Marcus
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Marcus (Local Foodie)' }).click()
    ]);
    await expect(page.locator('header')).toContainText('M');
    
    // Navigate to profile page
    await page.goto('/profile');
    
    // Click 'Ad Controls' tab
    await page.getByRole('button', { name: 'Ad Controls' }).click();
    
    // Prepare dialog handler for the verification prompt
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('delete your anonymous profile footprint');
      await dialog.accept();
    });
    
    // Click Forget Me
    await page.getByRole('button', { name: '⚠️ Forget Me & Purge Footprint' }).click();
    
    // Assert that we are redirected back to the landing page
    await expect(page).toHaveURL('/');
  });

});
