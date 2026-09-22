import { describe, it, expect } from 'vitest';
import {
  scoreAdIntent,
  scorePostIntent,
  applyIntentRanking
} from '@/lib/services/intent-tuner';
import { Ad } from '@/types/ad';
import { OrganicPost } from '@/lib/mock-data';

const mockAdLocal: Ad = {
  id: 'ad-local-1',
  category: 'Local Eateries',
  formatType: 'native',
  advertiser: { name: 'Main Street Bistro', avatar: '/bistro.jpg' },
  content: {
    headline: 'Fresh Farm-to-Table Lunch',
    text: 'Handcrafted daily specials by our neighborhood chef. Support local farms.',
    mediaUrl: '/bistro.jpg',
    mediaType: 'image',
    primaryColor: '#10b981'
  },
  cta: { label: 'View Menu', url: 'https://example.com' },
  metrics: { likes: 50, shares: 12 },
  location: { lat: 34.01, lng: -118.49 },
  distanceMiles: 1.2,
  status: 'active'
};

const mockAdDeal: Ad = {
  id: 'ad-deal-1',
  category: 'Retail & Fashion',
  formatType: 'social',
  advertiser: { name: 'Urban Threads', avatar: '/threads.jpg' },
  content: {
    headline: 'End of Season Sale',
    text: 'Get 25% off all jackets this weekend! Use code SAVE25 at checkout for special discount perks.',
    mediaUrl: '/threads.jpg',
    mediaType: 'image',
    primaryColor: '#6366f1'
  },
  cta: { label: 'Claim Discount', url: 'https://example.com' },
  metrics: { likes: 120, shares: 35 },
  status: 'active'
};

const mockAdMindful: Ad = {
  id: 'ad-mindful-1',
  category: 'Mindfulness & Wellbeing',
  formatType: 'native',
  advertiser: { name: 'Serene Living', avatar: '/serene.jpg' },
  content: {
    headline: 'Mindful Spaces for Quiet Reflection',
    text: 'Thoughtful artisan home decor crafted with natural sustainable materials to bring balance and calm to your home.',
    mediaUrl: '/serene.jpg',
    mediaType: 'image',
    primaryColor: '#0ea5e9'
  },
  cta: { label: 'Explore Journal', url: 'https://example.com' },
  metrics: { likes: 85, shares: 20 },
  smartScore: 92,
  status: 'active'
};

const mockAdAggressive: Ad = {
  id: 'ad-aggressive-1',
  category: 'Fast Deals',
  formatType: 'social',
  advertiser: { name: 'Flash Deals Inc', avatar: '/flash.jpg' },
  content: {
    headline: 'HURRY! LIMITED TIME FLASH DEAL!',
    text: 'ACT NOW! Don\'t miss this incredible flash offer today!!',
    mediaUrl: '/flash.jpg',
    mediaType: 'image',
    primaryColor: '#ef4444'
  },
  cta: { label: 'BUY NOW', url: 'https://example.com' },
  metrics: { likes: 10, shares: 2 },
  status: 'active'
};

const mockPostLocal: OrganicPost = {
  id: 'post-local-1',
  author: { name: 'Elena', avatar: '/elena.jpg' },
  category: 'Local Eateries',
  content: 'Checked out the new neighborhood bakery this morning, the artisan sourdough is unbeatable!',
  likes: 45,
  createdAt: '2026-09-22T08:00:00Z',
  syndication: {
    sourceType: 'marketplace',
    sourceName: 'Community Board',
    sourceUrl: 'https://example.com/board',
    neighborhood: 'Downtown Art District'
  }
};

describe('Contextual Intent Tuner Service', () => {
  describe('scoreAdIntent', () => {
    it('returns score 0 for "all" intent', () => {
      const res = scoreAdIntent(mockAdLocal, 'all');
      expect(res.score).toBe(0);
      expect(res.isResonant).toBe(false);
      expect(res.badgeText).toBeUndefined();
    });

    it('scores local ad highly under "local" intent', () => {
      const res = scoreAdIntent(mockAdLocal, 'local');
      expect(res.score).toBeGreaterThanOrEqual(30);
      expect(res.isResonant).toBe(true);
      expect(res.badgeLabelKey).toBe('intent_badge_local');
      expect(res.badgeText).toBe('📍 Local Gem');
    });

    it('scores deal ad highly under "deals" intent', () => {
      const res = scoreAdIntent(mockAdDeal, 'deals');
      expect(res.score).toBeGreaterThanOrEqual(30);
      expect(res.isResonant).toBe(true);
      expect(res.badgeLabelKey).toBe('intent_badge_deal');
      expect(res.badgeText).toBe('🏷️ Deal Pick');
    });

    it('scores mindful ad highly under "mindful" intent', () => {
      const res = scoreAdIntent(mockAdMindful, 'mindful');
      expect(res.score).toBeGreaterThanOrEqual(30);
      expect(res.isResonant).toBe(true);
      expect(res.badgeLabelKey).toBe('intent_badge_mindful');
      expect(res.badgeText).toBe('🍃 Mindful Pick');
    });

    it('penalizes aggressive clickbait under "mindful" intent', () => {
      const res = scoreAdIntent(mockAdAggressive, 'mindful');
      expect(res.score).toBeLessThan(0);
      expect(res.isResonant).toBe(false);
    });
  });

  describe('scorePostIntent', () => {
    it('scores organic local post highly in local mode', () => {
      const score = scorePostIntent(mockPostLocal, 'local');
      expect(score).toBeGreaterThan(0);
    });

    it('returns 0 for "all" mode', () => {
      expect(scorePostIntent(mockPostLocal, 'all')).toBe(0);
    });
  });

  describe('applyIntentRanking', () => {
    it('returns original items when mode is "all"', () => {
      const items = [mockAdDeal, mockAdLocal, mockPostLocal];
      const res = applyIntentRanking(items, 'all');
      expect(res.timeline).toEqual(items);
      expect(Object.keys(res.intentResonances)).toHaveLength(0);
    });

    it('reorders timeline prioritizing local items when mode is "local"', () => {
      const items = [mockAdDeal, mockAdAggressive, mockAdLocal, mockPostLocal];
      const res = applyIntentRanking(items, 'local');
      // Local ad and local post should be ranked higher than aggressive or deal ad
      const firstItemId = (res.timeline[0] as Ad).id;
      expect(firstItemId).toBe('ad-local-1');
      expect(res.intentResonances['ad-local-1']).toBeDefined();
      expect(res.intentResonances['ad-local-1'].defaultText).toBe('📍 Local Gem');
    });

    it('reorders timeline prioritizing deals when mode is "deals"', () => {
      const items = [mockAdMindful, mockAdLocal, mockAdDeal];
      const res = applyIntentRanking(items, 'deals');
      const firstItemId = (res.timeline[0] as Ad).id;
      expect(firstItemId).toBe('ad-deal-1');
      expect(res.intentResonances['ad-deal-1']).toBeDefined();
      expect(res.intentResonances['ad-deal-1'].defaultText).toBe('🏷️ Deal Pick');
    });

    it('reorders timeline prioritizing calm/mindful items when mode is "mindful"', () => {
      const items = [mockAdAggressive, mockAdDeal, mockAdMindful];
      const res = applyIntentRanking(items, 'mindful');
      const firstItemId = (res.timeline[0] as Ad).id;
      expect(firstItemId).toBe('ad-mindful-1');
      const lastItemId = (res.timeline[res.timeline.length - 1] as Ad).id;
      expect(lastItemId).toBe('ad-aggressive-1');
    });

    it('handles empty input gracefully', () => {
      const res = applyIntentRanking([], 'local');
      expect(res.timeline).toEqual([]);
      expect(res.intentResonances).toEqual({});
    });
  });
});
