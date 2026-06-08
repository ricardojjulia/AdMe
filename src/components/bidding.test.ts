import { describe, it, expect } from "vitest";

interface TestAd {
  id: string;
  isBoosted: boolean;
  maxCpcBid: number;
}

function sortAdsForFeed(ads: TestAd[]): TestAd[] {
  return [...ads].sort((a, b) => {
    if (a.isBoosted && !b.isBoosted) return -1;
    if (!a.isBoosted && b.isBoosted) return 1;

    const bidA = a.maxCpcBid ?? 15;
    const bidB = b.maxCpcBid ?? 15;
    if (bidA !== bidB) return bidB - bidA;

    return 0;
  });
}

function calculateWinProbability(rank: number): 'High' | 'Medium' | 'Low' {
  if (rank === 1) return 'High';
  if (rank === 2) return 'Medium';
  return 'Low';
}

describe("Bidding Priority Sorting Logic", () => {
  it("should sort ads by maxCpcBid descending when boosted status is identical", () => {
    const ads: TestAd[] = [
      { id: "ad1", isBoosted: false, maxCpcBid: 15 },
      { id: "ad2", isBoosted: false, maxCpcBid: 35 },
      { id: "ad3", isBoosted: false, maxCpcBid: 25 },
    ];
    const sorted = sortAdsForFeed(ads);
    expect(sorted[0].id).toBe("ad2"); // 35 bid
    expect(sorted[1].id).toBe("ad3"); // 25 bid
    expect(sorted[2].id).toBe("ad1"); // 15 bid
  });

  it("should prioritize boosted ads over standard ads, even if standard ads have higher bids", () => {
    const ads: TestAd[] = [
      { id: "ad1", isBoosted: false, maxCpcBid: 80 },
      { id: "ad2", isBoosted: true, maxCpcBid: 20 },
      { id: "ad3", isBoosted: true, maxCpcBid: 50 },
    ];
    const sorted = sortAdsForFeed(ads);
    expect(sorted[0].id).toBe("ad3"); // Boosted + 50 bid
    expect(sorted[1].id).toBe("ad2"); // Boosted + 20 bid
    expect(sorted[2].id).toBe("ad1"); // Standard + 80 bid
  });

  it("should maintain default value of 15 if bid is missing", () => {
    const ads: TestAd[] = [
      { id: "ad1", isBoosted: false, maxCpcBid: 10 } as any,
      { id: "ad2", isBoosted: false, maxCpcBid: undefined } as any, // should default to 15
    ];
    const sorted = sortAdsForFeed(ads);
    expect(sorted[0].id).toBe("ad2"); // 15 > 10
    expect(sorted[1].id).toBe("ad1");
  });
});

describe("Win Probability Rating", () => {
  it("should yield High for Rank 1", () => {
    expect(calculateWinProbability(1)).toBe("High");
  });

  it("should yield Medium for Rank 2", () => {
    expect(calculateWinProbability(2)).toBe("Medium");
  });

  it("should yield Low for Rank 3+", () => {
    expect(calculateWinProbability(3)).toBe("Low");
    expect(calculateWinProbability(4)).toBe("Low");
  });
});
