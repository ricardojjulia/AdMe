import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ATTENTION_BUDGET_STORAGE_KEY,
  DAILY_MINDFUL_DIVIDEND_POINTS,
  DEFAULT_DAILY_CAP,
  getTodayUTCKey,
  getYesterdayUTCKey,
  getDefaultAttentionBudgetState,
  loadAttentionBudgetState,
  saveAttentionBudgetState,
  recordAdExposure,
  claimMindfulDividend,
  updateAttentionBudgetConfig,
  extendTodayBudget,
  resetTodayBudget,
  isDailyBudgetReached,
  AttentionBudgetState,
} from "@/lib/services/attention-budget";

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
  },
};

(global as any).window = (global as any).window || {};
(global as any).window.localStorage = storageMock;
(global as any).localStorage = storageMock;
(global as any).window.dispatchEvent = (global as any).window.dispatchEvent || vi.fn();
if (typeof (global as any).CustomEvent === "undefined") {
  (global as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params: any = {}) {
      this.type = type;
      this.detail = params.detail;
    }
  };
}

describe("Mindful Attention Budget Service (COUNCIL-2026-014)", () => {
  beforeEach(() => {
    storageMock.clear();
    vi.restoreAllMocks();
  });

  it("should generate deterministic UTC date keys", () => {
    const d = new Date(Date.UTC(2026, 8, 30, 12, 0, 0));
    expect(getTodayUTCKey(d)).toBe("2026-09-30");

    const yesterdayKey = getYesterdayUTCKey(d);
    expect(yesterdayKey).toBe("2026-09-29");
  });

  it("should initialize default state correctly", () => {
    const today = getTodayUTCKey();
    const state = getDefaultAttentionBudgetState(today);

    expect(state.config.dailyCap).toBe(DEFAULT_DAILY_CAP);
    expect(state.config.enabled).toBe(true);
    expect(state.today.dateKey).toBe(today);
    expect(state.today.adsViewed).toBe(0);
    expect(state.today.completedAt).toBeNull();
    expect(state.today.claimedDividend).toBe(false);
    expect(state.streakCount).toBe(0);
    expect(state.lastCompletedDate).toBeNull();
  });

  it("should safely handle corrupted JSON in localStorage", () => {
    storageMock.setItem(ATTENTION_BUDGET_STORAGE_KEY, "invalid-json{{{");
    const state = loadAttentionBudgetState();

    expect(state.config.dailyCap).toBe(DEFAULT_DAILY_CAP);
    expect(state.today.adsViewed).toBe(0);
  });

  it("should record ad exposures and identify when budget is reached", () => {
    updateAttentionBudgetConfig({ dailyCap: 3, enabled: true });

    let state = loadAttentionBudgetState();
    expect(isDailyBudgetReached(state)).toBe(false);

    recordAdExposure(10);
    state = loadAttentionBudgetState();
    expect(state.today.adsViewed).toBe(1);
    expect(state.today.pointsEarnedToday).toBe(10);
    expect(isDailyBudgetReached(state)).toBe(false);

    recordAdExposure(10);
    recordAdExposure(10);
    state = loadAttentionBudgetState();
    expect(state.today.adsViewed).toBe(3);
    expect(isDailyBudgetReached(state)).toBe(true);
    expect(state.today.completedAt).not.toBeNull();
    expect(state.streakCount).toBe(1);
    expect(state.lastCompletedDate).toBe(getTodayUTCKey());
  });

  it("should claim the +25 pt Daily Mindful Completion Dividend once only", () => {
    updateAttentionBudgetConfig({ dailyCap: 2, enabled: true });

    // Not yet reached
    let claimRes = claimMindfulDividend();
    expect(claimRes.success).toBe(false);
    expect(claimRes.bonusPoints).toBe(0);

    // Meet cap
    recordAdExposure();
    recordAdExposure();

    // Now claim
    claimRes = claimMindfulDividend();
    expect(claimRes.success).toBe(true);
    expect(claimRes.bonusPoints).toBe(DAILY_MINDFUL_DIVIDEND_POINTS);
    expect(claimRes.newState.today.claimedDividend).toBe(true);

    // Try claiming again (duplicate claim prevention)
    const duplicateRes = claimMindfulDividend();
    expect(duplicateRes.success).toBe(false);
    expect(duplicateRes.bonusPoints).toBe(0);
  });

  it("should voluntarily extend budget and allow further exposures", () => {
    updateAttentionBudgetConfig({ dailyCap: 3, enabled: true });
    recordAdExposure();
    recordAdExposure();
    recordAdExposure();

    let state = loadAttentionBudgetState();
    expect(isDailyBudgetReached(state)).toBe(true);

    // Extend budget by 3 ads
    extendTodayBudget(3);
    state = loadAttentionBudgetState();
    expect(state.config.dailyCap).toBe(6);
    expect(isDailyBudgetReached(state)).toBe(false);
  });

  it("should reset today's budget when requested", () => {
    recordAdExposure(50);
    let state = loadAttentionBudgetState();
    expect(state.today.adsViewed).toBe(1);

    resetTodayBudget();
    state = loadAttentionBudgetState();
    expect(state.today.adsViewed).toBe(0);
    expect(state.today.completedAt).toBeNull();
    expect(state.today.claimedDividend).toBe(false);
  });

  it("should handle UTC date rollover and maintain streak if completed yesterday", () => {
    const yesterday = getYesterdayUTCKey();
    const storedState: AttentionBudgetState = {
      config: { dailyCap: 3, enabled: true },
      today: {
        dateKey: yesterday,
        adsViewed: 3,
        pointsEarnedToday: 60,
        completedAt: "2026-09-29T18:00:00.000Z",
        claimedDividend: true,
      },
      streakCount: 2,
      lastCompletedDate: yesterday,
      history: {},
    };

    saveAttentionBudgetState(storedState);

    // Loading on today (new dateKey) should archive yesterday and retain streak
    const loaded = loadAttentionBudgetState();
    expect(loaded.today.dateKey).toBe(getTodayUTCKey());
    expect(loaded.today.adsViewed).toBe(0);
    expect(loaded.streakCount).toBe(2);
    expect(loaded.history[yesterday]).toBeDefined();
    expect(loaded.history[yesterday].completed).toBe(true);
  });

  it("should reset streak if previous day was missed", () => {
    const twoDaysAgo = "2026-09-27";
    const storedState: AttentionBudgetState = {
      config: { dailyCap: 3, enabled: true },
      today: {
        dateKey: twoDaysAgo,
        adsViewed: 3,
        pointsEarnedToday: 60,
        completedAt: "2026-09-27T18:00:00.000Z",
        claimedDividend: true,
      },
      streakCount: 5,
      lastCompletedDate: twoDaysAgo,
      history: {},
    };

    saveAttentionBudgetState(storedState);

    const loaded = loadAttentionBudgetState();
    expect(loaded.streakCount).toBe(0);
  });
});
