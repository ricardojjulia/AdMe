import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateVoucherSignature,
  extractOfferHeadline,
  applyAntiClustering,
  recordSessionImpression,
  getFatiguedAdIds,
  isAdFatigued,
  clearSessionImpressions,
  FATIGUE_THRESHOLD
} from '@/lib/services/attention-shield';

describe('COUNCIL-2026-009: Anti-Fatigue Attention Shield & Value Exchange Suite', () => {
  beforeEach(() => {
    // Mock sessionStorage in environment
    const storage: Record<string, string> = {};
    globalThis.sessionStorage = {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, val: string) => { storage[key] = String(val); },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
      key: (idx: number) => Object.keys(storage)[idx] ?? null,
      length: Object.keys(storage).length,
    } as Storage;
    clearSessionImpressions();
  });

  describe('Cryptographic Voucher Minting & Code Generation', () => {
    it('should generate a deterministic, collision-resistant code with merchant prefix', () => {
      const code1 = generateVoucherSignature('ad-123', 'Valor Brews');
      const code2 = generateVoucherSignature('ad-123', 'Valor Brews');
      const codeDifferent = generateVoucherSignature('ad-456', 'Valor Brews');

      expect(code1).toMatch(/^VAL-[A-F0-9]{4}-\d{4}$/);
      expect(code1).toBe(code2);
      expect(code1).not.toBe(codeDifferent);
    });

    it('should extract percentage discounts and offer headlines accurately', () => {
      expect(extractOfferHeadline('Get 25% off all espresso beans', 'Shop Now').toLowerCase()).toBe('25% off');
      expect(extractOfferHeadline('Save $15 on your first tune-up', 'Claim')).toBe('$15');
      expect(extractOfferHeadline('Buy one, get one free artisanal roast', 'Redeem')).toBe('BOGO Free');
      expect(extractOfferHeadline('Explore our cutting-edge SaaS platform', 'Claim Trial')).toBe('Claim Trial');
    });
  });

  describe('Anti-Clustering Feed Dispersion Algorithm', () => {
    it('should not alter an already well-dispersed sequence of ads', () => {
      const ads = [
        { id: '1', category: 'Tech' },
        { id: '2', category: 'Food' },
        { id: '3', category: 'Auto' },
        { id: '4', category: 'Tech' },
      ];

      const { reordered, rotatedCount } = applyAntiClustering(ads as any);
      expect(reordered.map(a => a.id)).toEqual(['1', '2', '3', '4']);
      expect(rotatedCount).toBe(0);
    });

    it('should rotate ads when 3 or more contiguous ads share the same category', () => {
      const ads = [
        { id: '1', category: 'Tech' },
        { id: '2', category: 'Tech' },
        { id: '3', category: 'Tech' }, // Clustering violation
        { id: '4', category: 'Food' },
        { id: '5', category: 'Auto' },
      ];

      const { reordered, rotatedCount } = applyAntiClustering(ads as any);
      // id 3 should have been rotated to prevent 3 consecutive 'Tech' ads
      expect(rotatedCount).toBeGreaterThanOrEqual(1);
      
      // Verify no 3 contiguous items have the same category
      for (let i = 0; i < reordered.length - 2; i++) {
        const cat1 = reordered[i].category;
        const cat2 = reordered[i + 1].category;
        const cat3 = reordered[i + 2].category;
        const isTriple = cat1 === cat2 && cat2 === cat3;
        expect(isTriple).toBe(false);
      }
    });

    it('should handle small lists (<= 2 items) gracefully without mutation', () => {
      const single = [{ id: '1', category: 'Tech' }];
      const pair = [{ id: '1', category: 'Tech' }, { id: '2', category: 'Tech' }];

      expect(applyAntiClustering(single as any).reordered).toHaveLength(1);
      expect(applyAntiClustering(pair as any).reordered).toHaveLength(2);
    });
  });

  describe('Ephemeral Session Impression & Fatigue Capping', () => {
    it('should increment session impressions correctly', () => {
      recordSessionImpression('ad-1', 'Tech');
      recordSessionImpression('ad-1', 'Tech');
      recordSessionImpression('ad-2', 'Food');

      expect(isAdFatigued('ad-1')).toBe(false);
      expect(isAdFatigued('ad-2')).toBe(false);
      expect(getFatiguedAdIds()).toEqual([]);
    });

    it('should flag an ad as fatigued when impression count reaches FATIGUE_THRESHOLD (3)', () => {
      for (let i = 0; i < FATIGUE_THRESHOLD; i++) {
        recordSessionImpression('ad-overexposed', 'Tech');
      }

      expect(isAdFatigued('ad-overexposed')).toBe(true);
      expect(getFatiguedAdIds()).toContain('ad-overexposed');
    });

    it('should clear all session fatigue upon explicit reset', () => {
      for (let i = 0; i < FATIGUE_THRESHOLD + 1; i++) {
        recordSessionImpression('ad-overexposed', 'Tech');
      }
      expect(isAdFatigued('ad-overexposed')).toBe(true);

      clearSessionImpressions();

      expect(isAdFatigued('ad-overexposed')).toBe(false);
      expect(getFatiguedAdIds()).toEqual([]);
    });
  });
});
