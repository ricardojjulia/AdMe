/**
 * Mindful Attention Budget & Digital Wellness Dividend Service
 * Ratified in COUNCIL-2026-014
 * 
 * Provides pure, zero-tracking, client-side utilities for voluntary
 * daily ad exposure caps, anti-doomscrolling soft ceilings, and
 * mindful streak rewards.
 */

export const ATTENTION_BUDGET_STORAGE_KEY = 'adme_attention_budget_v1';
export const ATTENTION_BUDGET_EVENT = 'adme:attention-budget-change';
export const DAILY_MINDFUL_DIVIDEND_POINTS = 25;
export const DEFAULT_DAILY_CAP = 5;

export const BUDGET_CAP_PRESETS = [3, 5, 10, 0] as const;
export type BudgetCapPreset = (typeof BUDGET_CAP_PRESETS)[number];

export interface AttentionBudgetConfig {
  dailyCap: number; // 0 represents unlimited
  enabled: boolean;
}

export interface AttentionDayRecord {
  dateKey: string; // UTC YYYY-MM-DD
  adsViewed: number;
  pointsEarnedToday: number;
  completedAt: string | null;
  claimedDividend: boolean;
}

export interface DayHistoryItem {
  adsViewed: number;
  targetCap: number;
  completed: boolean;
}

export interface AttentionBudgetState {
  config: AttentionBudgetConfig;
  today: AttentionDayRecord;
  streakCount: number;
  lastCompletedDate: string | null;
  history: Record<string, DayHistoryItem>;
}

/**
 * Returns the current date formatted as UTC YYYY-MM-DD.
 */
export function getTodayUTCKey(d: Date = new Date()): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's date formatted as UTC YYYY-MM-DD.
 */
export function getYesterdayUTCKey(d: Date = new Date()): string {
  const yesterday = new Date(d.getTime() - 24 * 60 * 60 * 1000);
  return getTodayUTCKey(yesterday);
}

/**
 * Creates default initial state.
 */
export function getDefaultAttentionBudgetState(todayKey: string = getTodayUTCKey()): AttentionBudgetState {
  return {
    config: {
      dailyCap: DEFAULT_DAILY_CAP,
      enabled: true,
    },
    today: {
      dateKey: todayKey,
      adsViewed: 0,
      pointsEarnedToday: 0,
      completedAt: null,
      claimedDividend: false,
    },
    streakCount: 0,
    lastCompletedDate: null,
    history: {},
  };
}

/**
 * Broadcasts an attention budget state change event to the window.
 */
function broadcastBudgetChange(state: AttentionBudgetState): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ATTENTION_BUDGET_EVENT, { detail: state }));
  }
}

/**
 * Loads attention budget state from localStorage with safe fallback and UTC rollover handling.
 */
export function loadAttentionBudgetState(): AttentionBudgetState {
  const todayKey = getTodayUTCKey();
  const defaultState = getDefaultAttentionBudgetState(todayKey);

  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const raw = localStorage.getItem(ATTENTION_BUDGET_STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return defaultState;
    }

    const config: AttentionBudgetConfig = {
      dailyCap: typeof parsed.config?.dailyCap === 'number' ? parsed.config.dailyCap : DEFAULT_DAILY_CAP,
      enabled: typeof parsed.config?.enabled === 'boolean' ? parsed.config.enabled : true,
    };

    let streakCount = typeof parsed.streakCount === 'number' ? parsed.streakCount : 0;
    const lastCompletedDate = typeof parsed.lastCompletedDate === 'string' ? parsed.lastCompletedDate : null;
    const history: Record<string, DayHistoryItem> = (parsed.history && typeof parsed.history === 'object') ? parsed.history : {};

    // Check if recorded day matches today (UTC)
    let today: AttentionDayRecord;
    if (parsed.today && parsed.today.dateKey === todayKey) {
      today = {
        dateKey: todayKey,
        adsViewed: typeof parsed.today.adsViewed === 'number' ? parsed.today.adsViewed : 0,
        pointsEarnedToday: typeof parsed.today.pointsEarnedToday === 'number' ? parsed.today.pointsEarnedToday : 0,
        completedAt: typeof parsed.today.completedAt === 'string' ? parsed.today.completedAt : null,
        claimedDividend: Boolean(parsed.today.claimedDividend),
      };
    } else {
      // Day has rolled over!
      // Archive previous today if valid
      if (parsed.today?.dateKey) {
        history[parsed.today.dateKey] = {
          adsViewed: parsed.today.adsViewed || 0,
          targetCap: config.dailyCap,
          completed: Boolean(parsed.today.completedAt),
        };
      }

      // Check if streak was broken (must have completed yesterday or today)
      const yesterdayKey = getYesterdayUTCKey();
      if (lastCompletedDate && lastCompletedDate !== yesterdayKey && lastCompletedDate !== todayKey) {
        streakCount = 0;
      }

      today = {
        dateKey: todayKey,
        adsViewed: 0,
        pointsEarnedToday: 0,
        completedAt: null,
        claimedDividend: false,
      };
    }

    return {
      config,
      today,
      streakCount,
      lastCompletedDate,
      history,
    };
  } catch {
    return defaultState;
  }
}

/**
 * Saves attention budget state to localStorage.
 */
export function saveAttentionBudgetState(state: AttentionBudgetState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ATTENTION_BUDGET_STORAGE_KEY, JSON.stringify(state));
    broadcastBudgetChange(state);
  } catch (err) {
    console.error('Failed to save attention budget state:', err);
  }
}

/**
 * Checks whether user has reached their daily mindful budget.
 */
export function isDailyBudgetReached(state: AttentionBudgetState): boolean {
  if (!state.config.enabled || state.config.dailyCap <= 0) {
    return false;
  }
  return state.today.adsViewed >= state.config.dailyCap;
}

/**
 * Records an ad view exposure towards the user's daily budget.
 */
export function recordAdExposure(pointsEarned: number = 0): AttentionBudgetState {
  const state = loadAttentionBudgetState();
  const todayKey = state.today.dateKey;
  const newAdsViewed = state.today.adsViewed + 1;
  const newPoints = state.today.pointsEarnedToday + pointsEarned;

  let completedAt = state.today.completedAt;
  let streakCount = state.streakCount;
  let lastCompletedDate = state.lastCompletedDate;

  // Check if daily cap reached on this view
  if (state.config.enabled && state.config.dailyCap > 0 && newAdsViewed >= state.config.dailyCap && !completedAt) {
    completedAt = new Date().toISOString();
    
    // Check if already completed today
    if (lastCompletedDate !== todayKey) {
      const yesterdayKey = getYesterdayUTCKey();
      if (lastCompletedDate === yesterdayKey) {
        streakCount += 1;
      } else {
        streakCount = 1;
      }
      lastCompletedDate = todayKey;
    }
  }

  const updatedState: AttentionBudgetState = {
    ...state,
    today: {
      ...state.today,
      adsViewed: newAdsViewed,
      pointsEarnedToday: newPoints,
      completedAt,
    },
    streakCount,
    lastCompletedDate,
  };

  saveAttentionBudgetState(updatedState);
  return updatedState;
}

/**
 * Claims the +25 pt Daily Mindful Completion Dividend.
 */
export function claimMindfulDividend(): { success: boolean; bonusPoints: number; newState: AttentionBudgetState } {
  const state = loadAttentionBudgetState();

  if (!isDailyBudgetReached(state)) {
    return { success: false, bonusPoints: 0, newState: state };
  }

  if (state.today.claimedDividend) {
    return { success: false, bonusPoints: 0, newState: state };
  }

  const updatedState: AttentionBudgetState = {
    ...state,
    today: {
      ...state.today,
      claimedDividend: true,
      pointsEarnedToday: state.today.pointsEarnedToday + DAILY_MINDFUL_DIVIDEND_POINTS,
    },
  };

  saveAttentionBudgetState(updatedState);
  return {
    success: true,
    bonusPoints: DAILY_MINDFUL_DIVIDEND_POINTS,
    newState: updatedState,
  };
}

/**
 * Updates attention budget configuration (e.g. changing daily cap or toggling).
 */
export function updateAttentionBudgetConfig(partial: Partial<AttentionBudgetConfig>): AttentionBudgetState {
  const state = loadAttentionBudgetState();
  const newConfig: AttentionBudgetConfig = {
    ...state.config,
    ...partial,
  };

  const updatedState: AttentionBudgetState = {
    ...state,
    config: newConfig,
  };

  saveAttentionBudgetState(updatedState);
  return updatedState;
}

/**
 * Voluntarily extends today's budget by a given number of ads.
 */
export function extendTodayBudget(additionalAds: number = 3): AttentionBudgetState {
  const state = loadAttentionBudgetState();
  const newCap = Math.max(state.today.adsViewed + additionalAds, state.config.dailyCap + additionalAds);

  const updatedState: AttentionBudgetState = {
    ...state,
    config: {
      ...state.config,
      dailyCap: newCap,
    },
    today: {
      ...state.today,
      // Reset completedAt so user can continue viewing
      completedAt: null,
    },
  };

  saveAttentionBudgetState(updatedState);
  return updatedState;
}

/**
 * Resets today's ad viewed count (useful for testing or manual refresh).
 */
export function resetTodayBudget(): AttentionBudgetState {
  const state = loadAttentionBudgetState();
  const updatedState: AttentionBudgetState = {
    ...state,
    today: {
      ...state.today,
      adsViewed: 0,
      completedAt: null,
      claimedDividend: false,
    },
  };

  saveAttentionBudgetState(updatedState);
  return updatedState;
}
