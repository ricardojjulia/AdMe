import { test, expect } from '@playwright/test';

test.describe('Explainable Advertising & Transparency Controls (COUNCIL-2026-007)', () => {
  test('should open AdTransparencyModal, display Zero-Knowledge explainability, and allow feedback actions', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3400');

    // Wait for the feed to load
    await page.waitForSelector('article', { timeout: 10000 });

    // Locate the first "Why am I seeing this ad?" trigger on a sponsored card
    const whyButton = page.getByRole('button', { name: /Why am I seeing this ad/i }).first();
    await expect(whyButton).toBeVisible();

    // Click the "Why this ad?" trigger
    await whyButton.click();

    // Assert that the portaled dialog is mounted to document.body and visible
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Why Am I Seeing This Ad?');
    await expect(modal).toContainText('Zero-Knowledge Privacy Attestation');
    await expect(modal).toContainText('Curate Your Experience');

    // Assert action buttons exist
    await expect(modal.getByRole('button', { name: /This ad was relevant/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /See 50% less/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /Snooze/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /Not relevant to me/i })).toBeVisible();

    // Click "This ad was relevant and interesting"
    await modal.getByRole('button', { name: /This ad was relevant/i }).click();

    // Assert modal closes cleanly
    await expect(modal).not.toBeVisible();
  });
});
