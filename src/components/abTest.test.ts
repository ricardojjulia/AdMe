import { describe, it, expect } from "vitest";
import { performABSplitTest } from "./Feed";
import { Ad } from "@/types/ad";

describe("performABSplitTest sticky A/B variation hashing", () => {
  const mockAds: Ad[] = [
    {
      id: "ad-1-a",
      category: "Tech & SaaS",
      formatType: "social",
      advertiser: { name: "Test brand", avatar: "" },
      content: { headline: "Headline A", text: "", mediaUrl: "", mediaType: "image", primaryColor: "" },
      cta: { label: "CTA", url: "" },
      metrics: { likes: 0, shares: 0 },
      campaignId: "campaign-1",
      variationName: "A"
    },
    {
      id: "ad-1-b",
      category: "Tech & SaaS",
      formatType: "social",
      advertiser: { name: "Test brand", avatar: "" },
      content: { headline: "Headline B", text: "", mediaUrl: "", mediaType: "image", primaryColor: "" },
      cta: { label: "CTA", url: "" },
      metrics: { likes: 0, shares: 0 },
      campaignId: "campaign-1",
      variationName: "B"
    },
    {
      id: "ad-ungrouped",
      category: "Tech & SaaS",
      formatType: "social",
      advertiser: { name: "Test brand 2", avatar: "" },
      content: { headline: "Normal Ad", text: "", mediaUrl: "", mediaType: "image", primaryColor: "" },
      cta: { label: "CTA", url: "" },
      metrics: { likes: 0, shares: 0 }
    }
  ];

  it("should always return ungrouped ads", () => {
    const results = performABSplitTest(mockAds, "user-1");
    const ungrouped = results.find(a => !a.campaignId);
    expect(ungrouped).toBeDefined();
    expect(ungrouped?.id).toBe("ad-ungrouped");
  });

  it("should consistently assign the same variation to the same user", () => {
    const user1ResultsFirstRun = performABSplitTest(mockAds, "user-1");
    const user1VarFirstRun = user1ResultsFirstRun.find(a => a.campaignId === "campaign-1");

    for (let i = 0; i < 20; i++) {
      const run = performABSplitTest(mockAds, "user-1");
      const variation = run.find(a => a.campaignId === "campaign-1");
      expect(variation?.id).toBe(user1VarFirstRun?.id);
    }
  });

  it("should assign different variations to different users depending on hash splits", () => {
    const variationsSelected = new Set<string>();
    
    for (let i = 0; i < 50; i++) {
      const results = performABSplitTest(mockAds, `user-id-${i}`);
      const ad = results.find(a => a.campaignId === "campaign-1");
      if (ad) {
        variationsSelected.add(ad.id);
      }
    }
    
    expect(variationsSelected.has("ad-1-a")).toBe(true);
    expect(variationsSelected.has("ad-1-b")).toBe(true);
  });
});
