import { test, expect } from "@playwright/test";

test.describe("Mindful Attention Budget & Digital Wellness Dividend E2E (COUNCIL-2026-014)", () => {
  test("should display Attention Budget HUD, open modal, adjust daily cap, and persist configuration", async ({ page }) => {
    await page.goto("/");

    // 1. Locate Attention Budget HUD
    const hud = page.locator('[data-testid="attention-budget-hud"]');
    await expect(hud).toBeVisible();

    const toggleBtn = page.locator('[data-testid="attention-budget-toggle"]');
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toContainText("Mindful Attention Budget");

    // 2. Open Settings Modal
    await toggleBtn.click();
    const modal = page.locator('[data-testid="attention-budget-modal"]');
    await expect(modal).toBeVisible();

    // 3. Select 3 Ads Preset
    const preset3 = page.locator('[data-testid="budget-preset-3"]');
    await expect(preset3).toBeVisible();
    await preset3.click();

    // 4. Verify localStorage updated
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem("adme_attention_budget_v1");
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored).not.toBeNull();
    expect(stored.config.dailyCap).toBe(3);

    // 5. Close modal via close button
    const closeBtn = page.locator('[data-testid="attention-budget-modal-close"]');
    await closeBtn.click();
    await expect(modal).not.toBeVisible();

    // 6. Verify HUD now reflects 3 ads limit
    await expect(toggleBtn).toContainText("3 Ads");
  });

  test("should display Mindful Ceiling Card when quota is met, allow claiming +25 pt dividend, and extend session", async ({ page }) => {
    await page.goto("/");

    // 1. Set budget in localStorage to already completed state
    await page.evaluate(() => {
      const today = new Date().toISOString().split("T")[0];
      const testState = {
        config: { dailyCap: 3, enabled: true },
        today: {
          dateKey: today,
          adsViewed: 3,
          pointsEarnedToday: 60,
          completedAt: new Date().toISOString(),
          claimedDividend: false,
        },
        streakCount: 2,
        lastCompletedDate: today,
        history: {},
      };
      localStorage.setItem("adme_attention_budget_v1", JSON.stringify(testState));
      // Dispatch custom event to sync active hook
      window.dispatchEvent(new CustomEvent("adme:attention-budget-change", { detail: testState }));
    });

    await page.reload();

    // 2. Verify Mindful Ceiling Card is rendered
    const ceilingCard = page.locator('[data-testid="mindful-ceiling-card"]');
    await expect(ceilingCard).toBeVisible();
    await expect(ceilingCard).toContainText("Mindful Goal Achieved!");
    await expect(ceilingCard).toContainText("2 Day Mindful Attention Streak!");

    // 3. Claim the +25 pt Daily Mindful Completion Dividend
    const claimBtn = page.locator('[data-testid="claim-mindful-dividend-btn"]');
    await expect(claimBtn).toBeVisible();
    await claimBtn.click();

    // 4. Verify claimed badge appears
    const claimedBadge = page.locator('[data-testid="dividend-claimed-badge"]');
    await expect(claimedBadge).toBeVisible();
    await expect(claimedBadge).toContainText("Dividend Claimed (+25 pts)");

    // 5. Verify extend session button (+3 ads) clears ceiling card and restores commercial ads
    const extendBtn = page.locator('[data-testid="ceiling-extend-btn"]');
    await expect(extendBtn).toBeVisible();
    await extendBtn.click();

    // Ceiling card should now disappear because quota was extended
    await expect(ceilingCard).not.toBeVisible();

    // Verify localStorage reflected extension
    const updated = await page.evaluate(() => {
      const raw = localStorage.getItem("adme_attention_budget_v1");
      return raw ? JSON.parse(raw) : null;
    });
    expect(updated.config.dailyCap).toBe(6);
  });

  test("should display Mindful Attention Budget card in profile Controls tab and allow presets", async ({ page }) => {
    await page.goto("/");

    // Log in as Marcus to have a persistent session
    await page.getByLabel("Toggle Demo Switcher").click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }),
      page.getByRole("button", { name: "Marcus (Local Foodie)" }).click(),
    ]);

    await page.goto("/profile");

    // 1. Switch to Controls tab
    const controlsTab = page.getByRole("button", { name: "Ad Controls" });
    await expect(controlsTab).toBeVisible();
    await controlsTab.click();

    // 2. Locate Mindful Attention Budget card
    const budgetCard = page.locator('[data-testid="profile-attention-budget-card"]');
    await expect(budgetCard).toBeVisible();
    await expect(budgetCard).toContainText("Mindful Attention Budget");

    // 3. Click cap preset button 10
    const cap10Btn = page.locator('[data-testid="profile-budget-cap-10"]');
    await expect(cap10Btn).toBeVisible();
    await cap10Btn.click();

    // 4. Verify localStorage updated to 10
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem("adme_attention_budget_v1");
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored.config.dailyCap).toBe(10);
  });
});
