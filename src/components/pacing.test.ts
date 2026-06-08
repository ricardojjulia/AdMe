import { describe, it, expect } from "vitest";

function shouldDisplayPacedAd(
  dailyBudget: number,
  spentToday: number,
  currentHour: number,
  currentMinute: number,
  mockRandomValue: number
): boolean {
  if (spentToday >= dailyBudget) return false;
  
  const elapsedFraction = (currentHour * 60 + currentMinute) / 1440.0;
  const spentFraction = spentToday / dailyBudget;
  
  if (spentFraction > elapsedFraction) {
    const pacingRate = Math.max(0.1, 1.0 - (spentFraction - elapsedFraction));
    return mockRandomValue <= pacingRate;
  }
  
  return true;
}

describe("Advertiser Budget Pacemaker Logic", () => {
  it("should display ad normally if budget is not spent much", () => {
    // 10:00 AM (elapsed 41.6% of day), spent 20% of budget
    const result = shouldDisplayPacedAd(1000, 200, 10, 0, 0.5);
    expect(result).toBe(true);
  });

  it("should filter out ad immediately if budget is fully spent", () => {
    const result = shouldDisplayPacedAd(1000, 1000, 12, 0, 0.01);
    expect(result).toBe(false);
  });

  it("should throttle ad display if spend velocity is ahead of schedule", () => {
    // 6:00 AM (elapsed 25% of day), spent 75% of budget. spentFraction = 0.75, elapsedFraction = 0.25
    // spentFraction - elapsedFraction = 0.5
    // pacingRate = 1.0 - 0.5 = 0.5
    // random = 0.3 (should display)
    const result1 = shouldDisplayPacedAd(1000, 750, 6, 0, 0.3);
    expect(result1).toBe(true);

    // random = 0.8 (should filter out)
    const result2 = shouldDisplayPacedAd(1000, 750, 6, 0, 0.8);
    expect(result2).toBe(false);
  });

  it("should enforce a floor of 10% display rate even under severe over-spending", () => {
    // 1:00 AM (elapsed 4% of day), spent 90% of budget
    // spentFraction - elapsedFraction = 0.86 => pacingRate = 0.14
    // random = 0.12 (should display)
    const result1 = shouldDisplayPacedAd(1000, 900, 1, 0, 0.12);
    expect(result1).toBe(true);

    // random = 0.2 (should filter out)
    const result2 = shouldDisplayPacedAd(1000, 900, 1, 0, 0.2);
    expect(result2).toBe(false);
  });
});

function perturbLDP(swipeRight: boolean, enableLDP: boolean, coin1: number, coin2: number): boolean {
  if (!enableLDP) return swipeRight;
  if (coin1 < 0.3) {
    return coin2 < 0.5;
  }
  return swipeRight;
}

function performContextualInjection(
  posts: { category: string }[],
  ads: { category: string; id: string }[],
  adFrequency: 'low' | 'balanced' | 'high'
): string[] {
  const timeline: string[] = [];
  const usedAdIds = new Set<string>();
  const adSpacing = adFrequency === 'low' ? 5 : (adFrequency === 'balanced' ? 3 : 2);

  posts.forEach((post) => {
    timeline.push(`post-${post.category}`);

    const matchingAd = ads.find(ad => ad.category === post.category && !usedAdIds.has(ad.id));
    if (matchingAd) {
      timeline.push(`ad-${matchingAd.category}`);
      usedAdIds.add(matchingAd.id);
    } else {
      const unusedAds = ads.filter(ad => !usedAdIds.has(ad.id));
      if (unusedAds.length > 0 && timeline.length % adSpacing === 0) {
        timeline.push(`ad-${unusedAds[0].category}`);
        usedAdIds.add(unusedAds[0].id);
      }
    }
  });

  return timeline;
}

describe("Local Differential Privacy (LDP) swiping perturbation", () => {
  it("should output true choice if LDP is disabled", () => {
    expect(perturbLDP(true, false, 0.1, 0.1)).toBe(true);
    expect(perturbLDP(false, false, 0.1, 0.1)).toBe(false);
  });

  it("should perturb with randomized response when coin1 falls within noise ratio", () => {
    // coin1 = 0.2 (randomize), coin2 = 0.8 (false) => should return false even though true swipe
    expect(perturbLDP(true, true, 0.2, 0.8)).toBe(false);

    // coin1 = 0.2 (randomize), coin2 = 0.2 (true) => should return true
    expect(perturbLDP(false, true, 0.2, 0.2)).toBe(true);
  });

  it("should preserve true choice if coin1 is above noise ratio", () => {
    expect(perturbLDP(true, true, 0.5, 0.1)).toBe(true);
    expect(perturbLDP(false, true, 0.5, 0.1)).toBe(false);
  });
});

describe("Client-side Contextual Ad Injection", () => {
  it("should match ads contextually adjacent to matching organic post categories", () => {
    const posts = [
      { category: "Tech & SaaS" },
      { category: "Gaming" }
    ];
    const ads = [
      { id: "ad1", category: "Gaming" },
      { id: "ad2", category: "Tech & SaaS" }
    ];

    const result = performContextualInjection(posts, ads, "balanced");
    expect(result).toEqual([
      "post-Tech & SaaS",
      "ad-Tech & SaaS",
      "post-Gaming",
      "ad-Gaming"
    ]);
  });
});

