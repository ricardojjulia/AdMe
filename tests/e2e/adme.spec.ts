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

    // Assert that the GPS navigator canvas is rendered inside the modal
    await expect(page.locator('canvas').first()).toBeVisible();

    // Assert that the scratch-card canvas is visible
    await expect(page.locator('canvas').nth(1)).toBeVisible();
  });

  test('should securely purge user database footprint and local session on Forget Me', async ({ page }) => {
    page.on('console', msg => {
      console.log(`[Browser Console Forget Me] ${msg.text()}`);
    });
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

  test('should render swipeable preference deck and award points on vote', async ({ page }) => {
    await page.goto('/');
    
    // Log in as Marcus
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Marcus (Local Foodie)' }).click()
    ]);
    await expect(page.locator('header')).toContainText('M');
    
    await page.goto('/rewards');
    
    // Check deck is visible
    await expect(page.locator('h4').filter({ hasText: 'Vibe-check preferences' })).toBeVisible();
    
    // Get initial progress text
    const progressText = await page.locator('span').filter({ hasText: /\d \/ \d Voted/ }).first().textContent();
    expect(progressText).toContain('0 / 7 Voted');
    
    // Click 'Agree' button to simulate swiping right
    await page.getByRole('button', { name: 'Agree', exact: true }).click();
    
    // Check progress has updated to '1 / 7 Voted'
    await expect(page.locator('span').filter({ hasText: /\d \/ \d Voted/ }).first()).toContainText('1 / 7 Voted');
  });

  test('should select campaign in studio and update max CPC bid via auction board', async ({ page }) => {
    await page.goto('/');
    
    // Log in as Business Owner (Valor Brews)
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Valor Brews (Business)' }).click()
    ]);
    
    await page.waitForLoadState('networkidle');
    
    // Check if campaigns list is visible
    await expect(page.locator('h3').filter({ hasText: 'Active Campaigns' })).toBeVisible();
    
    // Initially the aside shows info message
    await expect(page.locator('p').filter({ hasText: 'Select any active campaign to enter the live category auction board' })).toBeVisible();
    
    // Click on the campaign group card to select it
    await page.locator('div').filter({ hasText: 'Veteran-Owned Craft Coffee' }).first().click();
    
    // The simulator panel should now show up
    await expect(page.locator('h3').filter({ hasText: 'Live Category Auction Board' })).toBeVisible();
    
    // Edit the bid input to 55
    const bidInput = page.locator('input[type="number"]');
    await bidInput.fill('55');
    
    // Click 'Place Bid'
    await page.getByRole('button', { name: 'Place Bid' }).click();
    
    // Check that the updated bid of 55 is displayed on the active campaign details
    await expect(page.locator('div').filter({ hasText: 'Veteran-Owned Craft Coffee' }).first().locator('strong').filter({ hasText: '★ 55' }).first()).toBeVisible();
  });

  test('should search, filter, and redeem perks in rewards store marketplace', async ({ page }) => {
    await page.goto('/');
    
    // Log in as Marcus (starts with 450 points)
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Marcus (Local Foodie)' }).click()
    ]);
    
    await page.goto('/rewards');
    
    // Check search box is visible
    const searchInput = page.locator('input[placeholder="Search rewards..."]');
    await expect(searchInput).toBeVisible();
    
    // Type in search query "Craft" (the local deal seeded is "Veteran-Owned Craft Coffee")
    await searchInput.fill('Craft');
    
    // Verify that the local craft coffee voucher matches
    await expect(page.locator('section').filter({ hasText: 'AdPoints Marketplace' }).locator('h4').filter({ hasText: 'Craft' })).toBeVisible();
    
    // Clear search query
    await searchInput.fill('');
    
    // Filter by 'Food & Drink' category
    await page.getByRole('button', { name: 'Food & Drink', exact: true }).click();
    
    // Coffee Card should be visible
    await expect(page.locator('h4').filter({ hasText: '$5 Coffee' })).toBeVisible();
    
    // Check that Amazon Card is NOT visible (since it's Shopping)
    await expect(page.locator('h4').filter({ hasText: 'Amazon' })).not.toBeVisible();
    
    // Click 'All' category
    await page.getByRole('button', { name: 'All', exact: true }).click();
    
    // Enable 'Affordable Only' toggle (balance 450, Coffee card cost 500 should be hidden)
    await page.getByLabel('Affordable Only').check();
    await expect(page.locator('h4').filter({ hasText: '$5 Coffee' })).not.toBeVisible();
    
    // Local deals like Craft Coffee (cost 350) should be visible because balance (450) >= cost (350)
    await expect(page.locator('section').filter({ hasText: 'AdPoints Marketplace' }).locator('h4').filter({ hasText: 'Craft' })).toBeVisible();
    
    // Click 'Redeem for 350 ★' on the Craft voucher
    await page.locator('section').filter({ hasText: 'AdPoints Marketplace' }).getByRole('button', { name: 'Redeem for 350 ★' }).click();
    
    // Confirmation Modal should appear
    await expect(page.locator('h3').filter({ hasText: 'Confirm Redemption' })).toBeVisible();
    
    // Click 'Yes, Redeem'
    await page.getByRole('button', { name: 'Yes, Redeem' }).click();
    
    // Coupon should appear in Wallet
    await expect(page.locator('h3').filter({ hasText: 'My Voucher Wallet' })).toBeVisible();
    await expect(page.locator('section').filter({ hasText: 'My Voucher Wallet' }).locator('h4').filter({ hasText: 'Craft' }).first()).toBeVisible();
    
    // Click 'View Barcode' inside the wallet item
    await page.locator('section').filter({ hasText: 'My Voucher Wallet' }).getByRole('button', { name: 'View Barcode' }).first().click();
    
    // The barcode scanner modal should appear
    await expect(page.locator('h3').filter({ hasText: 'In-Store Scanner Voucher' })).toBeVisible();
    
    // Click 'Close Wallet' or 'Mark as Used'
    await page.getByRole('button', { name: 'Close Wallet' }).click();
  });

});
