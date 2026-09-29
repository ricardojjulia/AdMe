import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  COMMUNITY_CAUSES_REGISTRY,
  COMMUNITY_IMPACT_STORAGE_KEY,
  COMMUNITY_IMPACT_EVENT,
  calculateImpactSplit,
  calculateImpactUnits,
  generateDeterministicCertificateId,
  getCauseById,
  loadCommunityImpactState,
  saveCommunityImpactState,
  DEFAULT_COMMUNITY_IMPACT_STATE,
  CommunityImpactState,
} from '@/lib/services/community-impact';

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
(global as any).window.dispatchEvent = (global as any).window.dispatchEvent || vi.fn();
if (typeof (global as any).CustomEvent === 'undefined') {
  (global as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params: any = {}) {
      this.type = type;
      this.detail = params.detail;
    }
  };
}
(global as any).localStorage = storageMock;

describe('Ads for Good & Community Impact Co-Sponsorship Service (COUNCIL-2026-013)', () => {
  beforeEach(() => {
    storageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates verified civic causes in registry with bilingual fields and positive targets', () => {
    expect(COMMUNITY_CAUSES_REGISTRY.length).toBeGreaterThanOrEqual(4);
    for (const cause of COMMUNITY_CAUSES_REGISTRY) {
      expect(cause.id).toBeDefined();
      expect(cause.title).toBeTruthy();
      expect(cause.titleEs).toBeTruthy();
      expect(cause.description).toBeTruthy();
      expect(cause.descriptionEs).toBeTruthy();
      expect(cause.conversionRate).toBeGreaterThan(0);
      expect(cause.targetGoal).toBeGreaterThan(0);
      expect(cause.currentProgress).toBeGreaterThanOrEqual(0);
      expect(cause.sponsorBrand).toBeTruthy();
    }
  });

  it('finds cause by ID using getCauseById', () => {
    const cause = getCauseById('urban-tree-canopy');
    expect(cause).toBeDefined();
    expect(cause?.sponsorBrand).toBe('The Green Kitchen');
    expect(getCauseById('non-existent-cause')).toBeUndefined();
  });

  it('calculates 50/50 dual benefit split correctly', () => {
    const split50 = calculateImpactSplit(50, 'balanced');
    expect(split50.perksPoints).toBe(25);
    expect(split50.causePoints).toBe(25);

    // Odd numbers round personal up and cause down
    const split25 = calculateImpactSplit(25, 'balanced');
    expect(split25.perksPoints).toBe(13);
    expect(split25.causePoints).toBe(12);
  });

  it('calculates cause_only (100% community champion) split correctly', () => {
    const split = calculateImpactSplit(50, 'cause_only');
    expect(split.perksPoints).toBe(0);
    expect(split.causePoints).toBe(50);
  });

  it('calculates perks_only (100% personal rewards) split correctly', () => {
    const split = calculateImpactSplit(50, 'perks_only');
    expect(split.perksPoints).toBe(50);
    expect(split.causePoints).toBe(0);
  });

  it('returns zero splits for non-positive point values', () => {
    expect(calculateImpactSplit(0, 'balanced')).toEqual({ perksPoints: 0, causePoints: 0 });
    expect(calculateImpactSplit(-10, 'balanced')).toEqual({ perksPoints: 0, causePoints: 0 });
  });

  it('calculates tangible impact units based on conversion rate', () => {
    // 50 points with 25 pts/unit = 2 units
    expect(calculateImpactUnits(50, 25)).toBe(2);
    // 10 points with 20 pts/unit = 0.5 units
    expect(calculateImpactUnits(10, 20)).toBe(0.5);
    // 0 points = 0
    expect(calculateImpactUnits(0, 25)).toBe(0);
  });

  it('generates deterministic client-side certificate IDs without PII', () => {
    const cert1 = generateDeterministicCertificateId('urban-tree-canopy', 1700000000000, 50);
    const cert2 = generateDeterministicCertificateId('urban-tree-canopy', 1700000000000, 50);
    expect(cert1).toBe(cert2);
    expect(cert1).toMatch(/^IMP-URB-\d{5}-50P$/);
  });

  it('reads default state when localStorage is empty', () => {
    const state = loadCommunityImpactState();
    expect(state.splitMode).toBe(DEFAULT_COMMUNITY_IMPACT_STATE.splitMode);
    expect(state.totalPointsDonated).toBe(0);
    expect(state.contributions).toEqual([]);
  });

  it('saves state and dispatches custom DOM event for cross-component sync', () => {
    let capturedEvent: any = null;
    (global as any).window.dispatchEvent = vi.fn((e: any) => {
      capturedEvent = e;
      return true;
    });

    const newState: CommunityImpactState = {
      splitMode: 'cause_only',
      selectedCauseId: 'neighborhood-meals',
      totalPointsDonated: 100,
      contributions: [
        {
          id: 'test-1',
          causeId: 'neighborhood-meals',
          causeTitle: 'Warm Meals for Local Shelters',
          pointsContributed: 100,
          impactUnits: 6,
          unitLabel: 'meals funded',
          timestamp: 123456789,
          certificateId: 'IMP-NEI-56789-100P',
        },
      ],
    };

    saveCommunityImpactState(newState);

    expect((global as any).window.dispatchEvent).toHaveBeenCalled();
    expect(capturedEvent?.type).toBe(COMMUNITY_IMPACT_EVENT);
    expect(capturedEvent?.detail?.splitMode).toBe('cause_only');

    const loaded = loadCommunityImpactState();
    expect(loaded.splitMode).toBe('cause_only');
    expect(loaded.totalPointsDonated).toBe(100);
    expect(loaded.contributions.length).toBe(1);
  });
});
