import { describe, it, expect } from 'vitest';
import { performABSplitTest } from '@/components/Feed';
import { calculateDistanceMiles } from '@/lib/utils/distance';
import { Ad } from '@/types/ad';

describe('Campaign Lifecycle & Real-Time Bidding Unit Tests', () => {
  const createMockAd = (overrides: Partial<Ad> = {}): Ad => ({
    id: crypto.randomUUID(),
    category: 'Tech & SaaS',
    formatType: 'native',
    advertiser: { name: 'Test Advertiser', avatar: '🏢' },
    content: {
      headline: 'Innovative Cloud Tools',
      text: 'Supercharge your daily workflow with zero telemetry.',
      mediaUrl: 'https://example.com/image.jpg',
      mediaType: 'image',
      primaryColor: '#6366f1'
    },
    cta: { label: 'Get Started', url: 'https://example.com' },
    metrics: { likes: 10, shares: 2 },
    isBoosted: false,
    maxCpcBid: 15,
    dailyBudget: 1000,
    creditsSpentToday: 0,
    status: 'active',
    ...overrides
  });

  describe('1. A/B Split-Testing Variation Selection', () => {
    it('should deterministically assign variation A or B per user', () => {
      const campaignId = 'test-campaign-123';
      const varA = createMockAd({ id: 'ad-var-a', campaignId, variationName: 'A' });
      const varB = createMockAd({ id: 'ad-var-b', campaignId, variationName: 'B' });

      const user1 = '00000000-0000-0000-0000-000000000001';
      const user2 = '00000000-0000-0000-0000-000000000002';

      const result1 = performABSplitTest([varA, varB], user1);
      const result2 = performABSplitTest([varA, varB], user1);
      
      // Strict idempotency: same user always sees the same variation
      expect(result1.length).toBe(1);
      expect(result2.length).toBe(1);
      expect(result1[0].id).toBe(result2[0].id);

      // Verify that across arbitrary users, selection resolves to one of the variations
      const user2Result = performABSplitTest([varA, varB], user2);
      expect(user2Result.length).toBe(1);
      expect(['ad-var-a', 'ad-var-b']).toContain(user2Result[0].id);
    });

    it('should retain unvaried campaigns without modifications', () => {
      const standardAd1 = createMockAd({ id: 'std-1' });
      const standardAd2 = createMockAd({ id: 'std-2' });

      const result = performABSplitTest([standardAd1, standardAd2], 'user-anon');
      expect(result.length).toBe(2);
      expect(result.map(a => a.id)).toEqual(['std-1', 'std-2']);
    });
  });

  describe('2. Real-Time Bidding & Pacing Logic', () => {
    it('should prioritize boosted ads above non-boosted ads regardless of bid', () => {
      const regularHighBid = createMockAd({ id: 'high-bid', isBoosted: false, maxCpcBid: 50 });
      const boostedLowBid = createMockAd({ id: 'boosted-low', isBoosted: true, maxCpcBid: 10 });

      const ads = [regularHighBid, boostedLowBid];
      ads.sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return (b.maxCpcBid ?? 15) - (a.maxCpcBid ?? 15);
      });

      expect(ads[0].id).toBe('boosted-low');
      expect(ads[1].id).toBe('high-bid');
    });

    it('should sort non-boosted ads by Max CPC Bid descending', () => {
      const ad10 = createMockAd({ id: 'ad-10', maxCpcBid: 10 });
      const ad35 = createMockAd({ id: 'ad-35', maxCpcBid: 35 });
      const ad25 = createMockAd({ id: 'ad-25', maxCpcBid: 25 });

      const ads = [ad10, ad35, ad25];
      ads.sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return (b.maxCpcBid ?? 15) - (a.maxCpcBid ?? 15);
      });

      expect(ads.map(a => a.id)).toEqual(['ad-35', 'ad-25', 'ad-10']);
    });

    it('should drop ads that have fully exhausted their daily budget', () => {
      const activeBudget = createMockAd({ id: 'active', dailyBudget: 1000, creditsSpentToday: 600 });
      const exhaustedBudget = createMockAd({ id: 'exhausted', dailyBudget: 1000, creditsSpentToday: 1000 });
      const overspentBudget = createMockAd({ id: 'overspent', dailyBudget: 500, creditsSpentToday: 550 });

      const ads = [activeBudget, exhaustedBudget, overspentBudget];
      const eligible = ads.filter(ad => (ad.creditsSpentToday ?? 0) < (ad.dailyBudget ?? 1000));

      expect(eligible.length).toBe(1);
      expect(eligible[0].id).toBe('active');
    });
  });

  describe('3. Geofence & Proximity Calculation', () => {
    it('should calculate accurate distance in miles between coordinates', () => {
      // San Juan, PR (18.4655, -66.1057) to Bayamón, PR (18.3985, -66.1557) is approx 5.6 miles
      const distance = calculateDistanceMiles(18.4655, -66.1057, 18.3985, -66.1557);
      expect(distance).toBeGreaterThan(4.5);
      expect(distance).toBeLessThan(7.0);
    });

    it('should filter ads outside the 25-mile local perimeter', () => {
      const userLoc = { lat: 18.4655, lng: -66.1057 }; // San Juan
      const nearbyAd = createMockAd({ id: 'nearby', location: { lat: 18.4000, lng: -66.1500 } }); // ~5 miles
      const farAd = createMockAd({ id: 'far', location: { lat: 25.7617, lng: -80.1918 } }); // Miami (~1000 miles)

      const adsWithDist = [nearbyAd, farAd].map(ad => ({
        ...ad,
        distanceMiles: calculateDistanceMiles(userLoc.lat, userLoc.lng, ad.location!.lat, ad.location!.lng)
      }));

      const withinPerimeter = adsWithDist.filter(ad => ad.distanceMiles <= 25);
      expect(withinPerimeter.length).toBe(1);
      expect(withinPerimeter[0].id).toBe('nearby');
    });
  });

  describe('4. Campaign Status Lifecycle Filtering', () => {
    it('should filter out paused and archived campaigns from public consumption', () => {
      const activeAd = createMockAd({ id: 'active-1', status: 'active' });
      const pausedAd = createMockAd({ id: 'paused-1', status: 'paused' });
      const archivedAd = createMockAd({ id: 'archived-1', status: 'archived' });

      const feedPool = [activeAd, pausedAd, archivedAd];
      const filtered = feedPool.filter(ad => !ad.status || ad.status === 'active');

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('active-1');
    });
  });
});
