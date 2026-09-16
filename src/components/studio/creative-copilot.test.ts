import { describe, it, expect } from 'vitest';
import { scoreAdCreative } from '@/lib/services/ethical-ad-scorer';
import { generateCreativeVariants } from '@/lib/services/creative-copilot-service';

describe('Ethical Ad Scorer (COUNCIL-2026-008)', () => {
  it('awards high score (Excellent) for polite, value-driven ad copy', () => {
    const result = scoreAdCreative({
      headline: 'Fresh Artisan Roast · 15% Veteran Discount',
      contentText: 'Craft roasted single-origin whole bean coffee delivered directly to your door. Enjoy free shipping and 15% off.',
      ctaLabel: 'Shop Coffee',
      category: 'Veteran-owned',
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toMatch(/Excellent|Good/);
    expect(result.politenessScore).toBe(100);
    expect(result.valueClarityScore).toBeGreaterThanOrEqual(80);
    expect(result.honestyScore).toBe(100);
    expect(result.issues).toHaveLength(0);
  });

  it('penalizes aggressive uppercase shouting and multiple exclamation marks', () => {
    const result = scoreAdCreative({
      headline: 'BUY NOW BEFORE IT IS TOO LATE!!!!!',
      contentText: 'DO NOT WAIT ANY LONGER CLICK HERE IMMEDIATELY TO GET THIS CRAZY DEAL!!!',
      ctaLabel: 'BUY NOW OR REGRET IT',
      category: 'General',
    });

    expect(result.politenessScore).toBeLessThan(70);
    expect(result.issues.some((i) => i.includes('uppercase'))).toBe(true);
    expect(result.issues.some((i) => i.includes('exclamation'))).toBe(true);
  });

  it('penalizes clickbait patterns and deceptive urgency', () => {
    const result = scoreAdCreative({
      headline: 'Hurry! Last Chance Secret Trick!',
      contentText: 'You won’t believe this miracle discovery! Limited time only, act now or lose out forever!',
      ctaLabel: 'Act Now',
      category: 'Wellness & Health',
    });

    expect(result.honestyScore).toBeLessThan(60);
    expect(result.overallScore).toBeLessThan(75);
    expect(result.issues.some((i) => i.includes('clickbait'))).toBe(true);
    expect(result.recommendations.some((r) => r.includes('artificial scarcity'))).toBe(true);
  });

  it('flags ads lacking a clear value exchange or consumer benefit', () => {
    const result = scoreAdCreative({
      headline: 'We Have An Office Building',
      contentText: 'The building is located downtown on the fourth floor next to the street.',
      ctaLabel: 'Click Here',
      category: 'Tech & SaaS',
    });

    expect(result.valueClarityScore).toBeLessThanOrEqual(50);
    expect(result.issues.some((i) => i.includes('consumer benefit') || i.includes('value proposition'))).toBe(true);
  });
});

describe('Creative Co-Pilot Generation Service (COUNCIL-2026-008)', () => {
  it('generates 3 distinct creative angles with complete metadata and ethical scores', async () => {
    const response = await generateCreativeVariants({
      merchantName: 'Valor Brews',
      category: 'Veteran-owned',
      productBrief: 'Micro-batch roasted fair-trade coffee supporting veteran transitions',
      currentHeadline: 'Coffee for sale',
      currentText: 'Buy our beans online',
    });

    expect(response.variants).toHaveLength(3);

    const [valueAngle, storyAngle, curiosityAngle] = response.variants;

    expect(valueAngle.angle).toBe('value');
    expect(valueAngle.angleTitle).toBe('Value & Utility');
    expect(valueAngle.headline.length).toBeGreaterThan(5);
    expect(valueAngle.contentText.length).toBeGreaterThan(10);
    expect(valueAngle.projectedCtrBoost).toMatch(/CTR/);
    expect(valueAngle.ethicalScore.overallScore).toBeGreaterThan(50);

    expect(storyAngle.angle).toBe('story');
    expect(storyAngle.angleTitle).toBe('Story & Mission');
    expect(storyAngle.headline.length).toBeGreaterThan(5);

    expect(curiosityAngle.angle).toBe('curiosity');
    expect(curiosityAngle.angleTitle).toBe('Curiosity & Innovation');
    expect(curiosityAngle.headline.length).toBeGreaterThan(5);
  });

  it('adapts generation to Local Eateries category', async () => {
    const response = await generateCreativeVariants({
      merchantName: 'The Green Kitchen',
      category: 'Local Eateries',
      productBrief: 'Organic bowls and seasonal scratch cooking',
    });

    expect(response.variants).toHaveLength(3);
    const headlines = response.variants.map((v) => v.headline).join(' ');
    expect(headlines.toLowerCase()).toMatch(/farm-to-table|kitchen|green|dining|flavor/);
  });
});
