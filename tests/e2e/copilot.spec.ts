import { test, expect } from '@playwright/test';

test.describe('Autonomous AI Creative Co-Pilot & Ethical Scorer (COUNCIL-2026-008)', () => {
  test('should generate creative angles, display ethical compliance score, and populate A/B test variants with 1-click', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3400');

    // Switch to Business Persona (Valor Brews)
    await page.getByLabel('Toggle Demo Switcher').click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.getByRole('button', { name: 'Valor Brews (Business)' }).click(),
    ]);

    // Navigate to Campaign Creation Studio
    await page.goto('http://localhost:3400/studio/create');
    await page.waitForLoadState('networkidle');

    // Assert Co-Pilot card is mounted and visible
    const copilot = page.locator('[data-testid="creative-copilot"]');
    await expect(copilot).toBeVisible();
    await expect(copilot).toContainText('AI Creative Co-Pilot');
    await expect(copilot).toContainText('Ethical Engine');

    // Enter a brief and trigger angle generation
    const briefInput = page.locator('[data-testid="copilot-brief-input"]');
    await briefInput.fill('Single-origin micro-batch coffee supporting veteran job skills');

    const generateBtn = page.locator('[data-testid="copilot-generate-btn"]');
    await generateBtn.click();

    // Verify angle tabs appear
    const valueTab = page.locator('[data-testid="copilot-tab-value"]');
    await expect(valueTab).toBeVisible({ timeout: 20000 });
    const storyTab = page.locator('[data-testid="copilot-tab-story"]');
    await expect(storyTab).toBeVisible();
    const curiosityTab = page.locator('[data-testid="copilot-tab-curiosity"]');
    await expect(curiosityTab).toBeVisible();

    // Verify ethics score pill and preview headline
    const ethicsPill = page.locator('[data-testid="copilot-ethics-pill"]');
    await expect(ethicsPill).toBeVisible();
    await expect(ethicsPill).toContainText('Ethics:');

    // Read the generated headline for Value angle
    const previewHeadline = page.locator('[data-testid="copilot-preview-headline"]');
    const generatedValueHeadline = await previewHeadline.innerText();
    expect(generatedValueHeadline.length).toBeGreaterThan(5);

    // Apply to Variant A (Main)
    const applyBtnA = page.locator('[data-testid="copilot-apply-a-btn"]');
    await applyBtnA.click();

    // Verify main headline input now has the generated text
    const headlineInput = page.locator('[data-testid="headline-a-input"]');
    await expect(headlineInput).toHaveValue(generatedValueHeadline);

    // Switch to Story & Mission angle
    await storyTab.click();
    const storyHeadline = await previewHeadline.innerText();
    expect(storyHeadline.length).toBeGreaterThan(5);

    // Apply to Variant B (A/B Test)
    const applyBtnB = page.locator('[data-testid="copilot-apply-b-btn"]');
    await applyBtnB.click();

    // Verify Variant B input is populated
    const headlineBInput = page.locator('[data-testid="headline-b-input"]');
    await expect(headlineBInput).toHaveValue(storyHeadline);

    // Verify live draft ethics meter in the form
    const draftMeter = page.locator('[data-testid="draft-ethics-meter"]');
    await expect(draftMeter).toBeVisible();
    await expect(draftMeter).toContainText('Draft Ethical Compliance');

    // Verify live preview ethics badge on mockup card
    const previewBadge = page.locator('[data-testid="preview-ethics-badge"]');
    await expect(previewBadge).toBeVisible();
    await expect(previewBadge).toContainText('Ethics:');
  });
});
