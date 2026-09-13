import { describe, it, expect } from 'vitest';
import { calculateSmartScore, getTemporalContext, rankSmartFeed, smartBanditSelect } from '@/lib/services/smart-feed';
import { spotToAd, getLocalDiscoveryAds } from '@/lib/services/local-discovery';
import { Ad } from '@/types/ad';

describe('Zero-Knowledge Smart Feed Recommender', () => {
  const sampleAd: Ad = {
    id: 'ad-sample-1',
    category: 'Specialty Coffee',
    formatType: 'native',
    advertiser: { name: 'Artisan Coffee Roasters', avatar: 'https://example.com/avatar.jpg' },
    content: {
      headline: 'Fresh Single-Origin Beans',
      text: 'Fresh roast delivered to your door',
      mediaUrl: 'https://example.com/img.jpg',
      mediaType: 'image',
      primaryColor: '#d97706'
    },
    cta: { label: 'Order Now', url: 'https://example.com' },
    metrics: { likes: 100, shares: 25 },
    distanceMiles: 0.5,
    maxCpcBid: 25,
    isBoosted: true
  };

  it('calculates higher smart score for matching taste preference and walking proximity', () => {
    const temporal = {
      period: 'morning' as const,
      boostCategories: ['Specialty Coffee'],
      labelKey: 'morning_match',
      defaultLabel: 'Morning Ritual'
    };

    const { score, reasons } = calculateSmartScore(
      sampleAd,
      { preferences: ['Specialty Coffee'], userLocation: { lat: 18.4, lng: -66.0 } },
      temporal
    );

    expect(score).toBeGreaterThanOrEqual(85);
    expect(reasons).toContain('Vibe Match');
    expect(reasons).toContain('Morning Ritual');
  });

  it('calculates lower score when category does not match user vibes', () => {
    const temporal = {
      period: 'night' as const,
      boostCategories: ['Tech & SaaS'],
      labelKey: 'night_match',
      defaultLabel: 'Night Discovery'
    };

    const unrelatedAd: Ad = {
      ...sampleAd,
      category: 'Auto under $40k',
      distanceMiles: 45.0,
      isBoosted: false,
      maxCpcBid: 15
    };

    const { score } = calculateSmartScore(
      unrelatedAd,
      { preferences: ['Specialty Coffee', 'Gaming'] },
      temporal
    );

    expect(score).toBeLessThan(70);
  });

  it('ranks smart feed with highest affinity items at the top', () => {
    const ads: Ad[] = [
      {
        ...sampleAd,
        id: 'ad-unrelated',
        category: 'Finance',
        distanceMiles: 30
      },
      {
        ...sampleAd,
        id: 'ad-coffee-nearby',
        category: 'Specialty Coffee',
        distanceMiles: 0.3
      }
    ];

    const ranked = rankSmartFeed(ads, {
      preferences: ['Specialty Coffee'],
      userLocation: { lat: 18.4, lng: -66.0 }
    });

    expect(ranked[0].id).toBe('ad-coffee-nearby');
    expect(ranked[0].smartScore).toBeGreaterThan(ranked[1].smartScore!);
  });

  it('Thompson / Bandit variation selector chooses valid variation', () => {
    const variations: Ad[] = [
      { ...sampleAd, id: 'var-a', campaignId: 'camp-1', variationName: 'A', metrics: { likes: 50, shares: 10 } },
      { ...sampleAd, id: 'var-b', campaignId: 'camp-1', variationName: 'B', metrics: { likes: 500, shares: 120 } }
    ];

    const chosen = smartBanditSelect(variations, 'device-test-123');
    expect(chosen.length).toBe(1);
    expect(['var-a', 'var-b']).toContain(chosen[0].id);
  });
});

describe('Local Discovery Cold-Start Engine', () => {
  it('converts local spots to native ads with claim flywheel metadata', () => {
    const userLocation = { lat: 18.4655, lng: -66.1167 };
    const spot = {
      name: 'Test Bakery',
      category: 'Local Eateries',
      headline: 'Fresh Croissants',
      description: 'Handmade daily',
      mediaUrl: 'https://example.com/bakery.jpg',
      avatarUrl: 'https://example.com/logo.jpg',
      address: '123 Calle Sol, San Juan',
      rating: 4.9,
      reviewsCount: 210,
      lat: 18.4660,
      lng: -66.1170,
      websiteUrl: 'https://testbakery.com',
      primaryColor: '#16a34a',
      ctaLabel: 'View Menu'
    };

    const ad = spotToAd(spot, userLocation);

    expect(ad.isLocalDiscovery).toBe(true);
    expect(ad.claimed).toBe(false);
    expect(ad.claimUrl).toContain('claim=true');
    expect(ad.claimUrl).toContain('name=Test+Bakery');
    expect(ad.placeDetails?.rating).toBe(4.9);
    expect(ad.distanceMiles).toBeDefined();
    expect(ad.distanceMiles!).toBeLessThan(1.0);
  });

  it('strictly adheres to zero-mock policy by returning empty array when unconfigured or offline', async () => {
    const spots = await getLocalDiscoveryAds({ lat: 18.4655, lng: -66.1167 });
    expect(spots).toEqual([]);
  });
});
