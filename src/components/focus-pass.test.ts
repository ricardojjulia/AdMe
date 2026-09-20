import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createFocusToken,
  verifyFocusToken,
  FOCUS_TIERS,
  ZEN_STREAM_ITEMS,
  getStoredFocusPass,
  setStoredFocusPass,
  clearStoredFocusPass,
  FocusPassState
} from "@/lib/services/focus-pass";
import { formatFocusTimeLeft } from "@/lib/hooks/useFocusPass";

const mockStorage: Record<string, string> = {};
const storageMock = {
  getItem: (k: string) => (k in mockStorage ? mockStorage[k] : null),
  setItem: (k: string, v: string) => {
    mockStorage[k] = String(v);
  },
  removeItem: (k: string) => {
    delete mockStorage[k];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  }
};

(global as any).window = (global as any).window || {};
(global as any).window.localStorage = storageMock;
(global as any).localStorage = storageMock;

describe("Focus Pass Cryptography and Token Lifecycle", () => {
  beforeEach(() => {
    storageMock.clear();
  });

  afterEach(() => {
    storageMock.clear();
    vi.restoreAllMocks();
  });

  it("generates deterministic tamper-evident tokens with correct tier prefix", () => {
    const futureExpiry = Date.now() + 15 * 60 * 1000;
    const token = createFocusToken("15m", futureExpiry);

    expect(token).toMatch(/^FP-15M-[a-f0-9]+-[A-Z0-9]+$/);
    expect(verifyFocusToken("15m", futureExpiry, token)).toBe(true);
  });

  it("verifies all three tiers correctly", () => {
    const tiers = ["15m", "1h", "24h"] as const;
    tiers.forEach((tier) => {
      const duration = FOCUS_TIERS[tier].durationMs;
      const expiry = Date.now() + duration;
      const token = createFocusToken(tier, expiry);
      expect(verifyFocusToken(tier, expiry, token)).toBe(true);
    });
  });

  it("rejects tokens that have expired", () => {
    const pastExpiry = Date.now() - 1000; // 1 second ago
    const token = createFocusToken("15m", pastExpiry);

    expect(verifyFocusToken("15m", pastExpiry, token)).toBe(false);
  });

  it("rejects tampered tokens or mismatched tiers", () => {
    const futureExpiry = Date.now() + 3600 * 1000;
    const token = createFocusToken("1h", futureExpiry);

    // Mismatched tier
    expect(verifyFocusToken("15m", futureExpiry, token)).toBe(false);

    // Tampered token payload
    const tampered = token.slice(0, -2) + "99";
    expect(verifyFocusToken("1h", futureExpiry, tampered)).toBe(false);

    // Mismatched expiry
    expect(verifyFocusToken("1h", futureExpiry + 1000, token)).toBe(false);
  });

  it("persists and reads valid state from localStorage safely", () => {
    const futureExpiry = Date.now() + 15 * 60 * 1000;
    const token = createFocusToken("15m", futureExpiry);

    const validState: FocusPassState = {
      active: true,
      tier: "15m",
      expiresAt: futureExpiry,
      token
    };

    setStoredFocusPass(validState);
    const retrieved = getStoredFocusPass();

    expect(retrieved.active).toBe(true);
    expect(retrieved.tier).toBe("15m");
    expect(retrieved.token).toBe(token);

    // Test clearing
    clearStoredFocusPass();
    expect(getStoredFocusPass().active).toBe(false);
  });

  it("rejects tampered localStorage entries automatically", () => {
    const futureExpiry = Date.now() + 15 * 60 * 1000;
    const tamperedState = {
      active: true,
      tier: "15m",
      expiresAt: futureExpiry,
      token: "FP-15M-FORGED-TOKEN"
    };

    localStorage.setItem("adme_focus_pass_state", JSON.stringify(tamperedState));
    const retrieved = getStoredFocusPass();
    expect(retrieved.active).toBe(false);
    expect(retrieved.tier).toBeNull();
  });
});

describe("Focus Pass Configurations and Formatting", () => {
  it("enforces mandated tier pricing and durations", () => {
    expect(FOCUS_TIERS["15m"]).toEqual({
      tier: "15m",
      name: "15m Sprint",
      cost: 100,
      durationMinutes: 15,
      durationMs: 15 * 60 * 1000,
      description: expect.any(String)
    });

    expect(FOCUS_TIERS["1h"]).toEqual({
      tier: "1h",
      name: "1h Deep Work",
      cost: 250,
      durationMinutes: 60,
      durationMs: 60 * 60 * 1000,
      description: expect.any(String)
    });

    expect(FOCUS_TIERS["24h"]).toEqual({
      tier: "24h",
      name: "24h Day of Calm",
      cost: 500,
      durationMinutes: 1440,
      durationMs: 24 * 60 * 60 * 1000,
      description: expect.any(String)
    });
  });

  it("formats remaining countdown time cleanly", () => {
    expect(formatFocusTimeLeft(900)).toBe("15:00");
    expect(formatFocusTimeLeft(75)).toBe("01:15");
    expect(formatFocusTimeLeft(9)).toBe("00:09");
    expect(formatFocusTimeLeft(3600)).toBe("1h 00m");
    expect(formatFocusTimeLeft(3665)).toBe("1h 01m");
    expect(formatFocusTimeLeft(0)).toBe("00:00");
    expect(formatFocusTimeLeft(-5)).toBe("00:00");
  });

  it("provides curated Zen Stream items", () => {
    expect(ZEN_STREAM_ITEMS.length).toBeGreaterThanOrEqual(4);
    ZEN_STREAM_ITEMS.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.quote.length).toBeGreaterThan(5);
      expect(item.author.length).toBeGreaterThan(2);
      expect(item.image).toMatch(/^https?:\/\//);
      expect(item.theme.length).toBeGreaterThan(2);
    });
  });
});

describe("Feed Commercial Ad Suppression", () => {
  const mockAds = [
    { id: "ad-1", advertiser: { name: "Coffee Shop" } },
    { id: "ad-2", advertiser: { name: "Tech Gear" } }
  ];
  const mockOrganic = [
    { id: "post-1", author: { name: "Alice" } },
    { id: "post-2", author: { name: "Bob" } }
  ];
  const fullTimeline = [...mockAds, ...mockOrganic];

  it("preserves ads when Focus Pass is inactive", () => {
    const isFocusActive = false;
    const visible = fullTimeline.filter((item) => {
      const isAdItem = (item as any).advertiser !== undefined;
      if (isAdItem && isFocusActive) return false;
      return true;
    });

    expect(visible).toHaveLength(4);
    expect(visible.some((i: any) => i.id === "ad-1")).toBe(true);
  });

  it("completely silences commercial ads when Focus Pass is active while keeping organic posts", () => {
    const isFocusActive = true;
    const visible = fullTimeline.filter((item) => {
      const isAdItem = (item as any).advertiser !== undefined;
      if (isAdItem && isFocusActive) return false;
      return true;
    });

    expect(visible).toHaveLength(2);
    expect(visible.every((i: any) => i.advertiser === undefined)).toBe(true);
    expect(visible.map((i: any) => i.id)).toEqual(["post-1", "post-2"]);
  });
});
