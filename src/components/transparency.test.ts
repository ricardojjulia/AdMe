import { describe, it, expect } from 'vitest';

describe('COUNCIL-2026-007: Consumer Ad Transparency & Relevance Suite', () => {
  describe('Explainability & Interest Tag Matching', () => {
    it('should identify a direct topic interest match when user preferences include the ad category', () => {
      const userPreferences = ['Local Eateries', 'Tech & SaaS'];
      const adCategory = 'Local Eateries';

      const isDirectMatch = userPreferences.includes(adCategory);
      expect(isDirectMatch).toBe(true);
    });

    it('should designate exploratory community discovery when category is not an explicit preference', () => {
      const userPreferences = ['Tech & SaaS', 'Gaming'];
      const adCategory = 'Local Eateries';

      const isDirectMatch = userPreferences.includes(adCategory);
      expect(isDirectMatch).toBe(false);
    });
  });

  describe('Merchant Snoozing & Category Down-weighting Logic', () => {
    it('should correctly filter out snoozed merchants from feed items', () => {
      const ads = [
        { id: 'ad-1', advertiser: { name: 'Valor Brews' }, category: 'Local Eateries' },
        { id: 'ad-2', advertiser: { name: 'The Green Kitchen' }, category: 'Local Eateries' },
        { id: 'ad-3', advertiser: { name: 'Nomad Motors' }, category: 'Auto' }
      ];

      const snoozedMerchants = ['The Green Kitchen'];

      const visibleAds = ads.filter(
        ad => !snoozedMerchants.includes(ad.advertiser.name) && !snoozedMerchants.includes(ad.id)
      );

      expect(visibleAds).toHaveLength(2);
      expect(visibleAds.map(a => a.advertiser.name)).toEqual(['Valor Brews', 'Nomad Motors']);
    });

    it('should calculate attenuated category weights on down-weighting', () => {
      const initialWeights: Record<string, number> = {};
      const category = 'Local Eateries';

      // First down-weight: 1.0 -> 0.5
      const current1 = initialWeights[category] ?? 1.0;
      const weight1 = Math.max(0.1, parseFloat((current1 * 0.5).toFixed(2)));
      expect(weight1).toBe(0.5);

      // Second down-weight: 0.5 -> 0.25
      const weight2 = Math.max(0.1, parseFloat((weight1 * 0.5).toFixed(2)));
      expect(weight2).toBe(0.25);

      // Floor check: ensures weight never drops below 0.1
      let floorWeight = weight2;
      for (let i = 0; i < 5; i++) {
        floorWeight = Math.max(0.1, parseFloat((floorWeight * 0.5).toFixed(2)));
      }
      expect(floorWeight).toBe(0.1);
    });
  });

  describe('Studio Relevance Score Computation', () => {
    it('should compute 100% relevance when only positive engagements exist', () => {
      const engagements = [
        { engagement_type: 'view' },
        { engagement_type: 'click' },
        { engagement_type: 'helpful' }
      ];

      const negative = engagements.filter(e =>
        e.engagement_type === 'snooze_advertiser' ||
        e.engagement_type === 'downweight_category' ||
        e.engagement_type === 'irrelevant'
      ).length;
      const positive = engagements.filter(e =>
        e.engagement_type === 'helpful' ||
        e.engagement_type === 'like' ||
        e.engagement_type === 'click'
      ).length;
      const total = negative + positive;
      const score = total > 0 ? Math.round((positive / total) * 100) : 98;

      expect(negative).toBe(0);
      expect(positive).toBe(2);
      expect(score).toBe(100);
    });

    it('should reduce relevance score proportionally when negative feedback is received', () => {
      const engagements = [
        { engagement_type: 'click' },
        { engagement_type: 'helpful' },
        { engagement_type: 'snooze_advertiser' },
        { engagement_type: 'irrelevant' }
      ];

      const negative = engagements.filter(e =>
        e.engagement_type === 'snooze_advertiser' ||
        e.engagement_type === 'downweight_category' ||
        e.engagement_type === 'irrelevant'
      ).length;
      const positive = engagements.filter(e =>
        e.engagement_type === 'helpful' ||
        e.engagement_type === 'like' ||
        e.engagement_type === 'click'
      ).length;
      const total = negative + positive;
      const score = total > 0 ? Math.round((positive / total) * 100) : 98;

      expect(negative).toBe(2);
      expect(positive).toBe(2);
      expect(score).toBe(50);
    });

    it('should default to high clean baseline (98%) when no feedback has been recorded', () => {
      const engagements = [
        { engagement_type: 'view' }
      ];

      const negative = engagements.filter(e =>
        e.engagement_type === 'snooze_advertiser' ||
        e.engagement_type === 'downweight_category' ||
        e.engagement_type === 'irrelevant'
      ).length;
      const positive = engagements.filter(e =>
        e.engagement_type === 'helpful' ||
        e.engagement_type === 'like' ||
        e.engagement_type === 'click'
      ).length;
      const total = negative + positive;
      const score = total > 0 ? Math.round((positive / total) * 100) : 98;

      expect(score).toBe(98);
    });
  });

  describe('Anonymous Feedback API Action Validation', () => {
    const VALID_ACTIONS = new Set([
      'snooze_advertiser',
      'downweight_category',
      'irrelevant',
      'helpful'
    ]);

    it('should accept valid feedback action keys', () => {
      expect(VALID_ACTIONS.has('snooze_advertiser')).toBe(true);
      expect(VALID_ACTIONS.has('downweight_category')).toBe(true);
      expect(VALID_ACTIONS.has('irrelevant')).toBe(true);
      expect(VALID_ACTIONS.has('helpful')).toBe(true);
    });

    it('should reject invalid or malicious action keys', () => {
      expect(VALID_ACTIONS.has('delete_account')).toBe(false);
      expect(VALID_ACTIONS.has('drop_table')).toBe(false);
      expect(VALID_ACTIONS.has('')).toBe(false);
    });
  });
});
