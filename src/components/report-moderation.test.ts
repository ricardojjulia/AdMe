import { describe, it, expect } from "vitest";
import { arbitrateUserReport } from "@/lib/moderation/aiModerator";

describe("COUNCIL-2026-005 Universal Content Reporting & Safety Arbitration", () => {
  it("should triage benign reports without unwarranted takedown", async () => {
    const result = await arbitrateUserReport(
      "Artisan Whole Bean Coffee",
      "Freshly roasted specialty coffee delivered to your door.",
      "Spam or Duplicate"
    );

    expect(result.shouldTakedown).toBe(false);
    expect(result.terminateMerchant).toBe(false);
    expect(result.decision).toContain("Report triaged by automated safety arbitrator");
  });

  it("should trigger immediate takedown for fraudulent or scam listings", async () => {
    const result = await arbitrateUserReport(
      "Brand New iPhone 16 Pro Max $50 Wire Transfer Only",
      "Send money now to claim this unbelievable deal. Not a scam.",
      "Scam or Fraudulent - Details: Deceptive pricing and wire transfer phishing."
    );

    expect(result.shouldTakedown).toBe(true);
    expect(result.decision).toContain("Policy Violation Confirmed");
  });

  it("should trigger immediate merchant termination for severe zero-tolerance violations", async () => {
    const result = await arbitrateUserReport(
      "Untraceable Ghost Gun Kits Fast Delivery",
      "No background checks required, direct to your door.",
      "Dangerous or Illegal - Details: Selling illegal ghost gun weapons."
    );

    expect(result.shouldTakedown).toBe(true);
    expect(result.terminateMerchant).toBe(true);
    expect(result.decision).toContain("Critical Zero-Tolerance Violation");
  });

  it("should arbitrate syndicated marketplace items using external headline and copy", async () => {
    // Non-UUID syndicated item e.g. from Facebook Marketplace
    const syndicatedItem = {
      id: "syndicated-market-891",
      headline: "Vintage Herman Miller Aeron Chair",
      content: "Excellent condition office chair, local pickup in Wesley Chapel.",
      reason: "Offensive or Inappropriate",
    };

    const result = await arbitrateUserReport(
      syndicatedItem.headline,
      syndicatedItem.content,
      syndicatedItem.reason
    );

    expect(result).toBeDefined();
    expect(typeof result.shouldTakedown).toBe("boolean");
    expect(typeof result.decision).toBe("string");
  });
});
