import { Ad } from '@/types/ad';
import { OrganicPost } from '@/lib/mock-data';

export type IntentMode = 'all' | 'local' | 'deals' | 'mindful';

export interface IntentScoreResult {
  score: number;
  badgeLabelKey?: string;
  badgeText?: string;
  isResonant: boolean;
}

export interface IntentResonanceInfo {
  labelKey: string;
  defaultText: string;
}

export interface IntentReorderResult {
  timeline: (Ad | OrganicPost)[];
  intentResonances: Record<string, IntentResonanceInfo>;
}

const LOCAL_CATEGORIES = new Set([
  'Local Eateries',
  'Specialty Coffee',
  'Local',
  'Farm-to-Table',
  'Neighborhood'
]);

const LOCAL_KEYWORDS = [
  'local',
  'neighborhood',
  'artisan',
  'roasters',
  'roaster',
  'micro-batch',
  'community',
  'downtown',
  'craft',
  'harvest'
];

const DEAL_KEYWORDS = [
  'off',
  'save',
  'discount',
  'deal',
  'voucher',
  'coupon',
  'points',
  'free',
  'special offer',
  'perk',
  'rewards'
];

const MINDFUL_POSITIVE_WORDS = [
  'sustainable',
  'artisan',
  'crafted',
  'thoughtful',
  'organic',
  'quiet',
  'zen',
  'calm',
  'natural',
  'slow',
  'heritage',
  'balance'
];

const MINDFUL_AGGRESSIVE_WORDS = [
  'hurry',
  'limited time',
  'urgent',
  'instant',
  'fastest',
  'don\'t miss',
  'act now'
];

export function scoreAdIntent(ad: Ad, intent: IntentMode): IntentScoreResult {
  if (intent === 'all') {
    return { score: 0, isResonant: false };
  }

  const headline = (ad.content?.headline || '').toLowerCase();
  const text = (ad.content?.text || '').toLowerCase();
  const combined = `${headline} ${text}`;
  const cta = (ad.cta?.label || '').toLowerCase();

  let score = 0;

  if (intent === 'local') {
    if (ad.distanceMiles !== undefined) {
      if (ad.distanceMiles <= 5) score += 40;
      else if (ad.distanceMiles <= 15) score += 25;
      else if (ad.distanceMiles <= 30) score += 10;
    } else if (ad.location) {
      score += 20;
    }

    if (LOCAL_CATEGORIES.has(ad.category) || ad.isLocalDiscovery) {
      score += 35;
    }

    for (const kw of LOCAL_KEYWORDS) {
      if (combined.includes(kw)) {
        score += 10;
        break;
      }
    }

    const isResonant = score >= 25;
    return {
      score,
      isResonant,
      badgeLabelKey: isResonant ? 'intent_badge_local' : undefined,
      badgeText: isResonant ? '📍 Local Gem' : undefined
    };
  }

  if (intent === 'deals') {
    // Discount percentage or dollar discount regex (e.g. 15% off, $5 off, $10)
    if (/\b\d{1,2}%\b/.test(combined) || /\$\d+/.test(combined)) {
      score += 35;
    }

    for (const kw of DEAL_KEYWORDS) {
      if (combined.includes(kw)) {
        score += 20;
        break;
      }
    }

    if (cta.includes('shop') || cta.includes('claim') || cta.includes('save') || cta.includes('redeem') || cta.includes('order')) {
      score += 15;
    }

    const isResonant = score >= 25;
    return {
      score,
      isResonant,
      badgeLabelKey: isResonant ? 'intent_badge_deal' : undefined,
      badgeText: isResonant ? '🏷️ Deal Pick' : undefined
    };
  }

  if (intent === 'mindful') {
    // Low typographical agitation (few exclamation marks)
    const exclamationCount = (combined.match(/!/g) || []).length;
    if (exclamationCount === 0) {
      score += 25;
    } else if (exclamationCount >= 2) {
      score -= 25;
    }

    // Checking for all-caps words (> 3 chars)
    const rawText = `${ad.content?.headline || ''} ${ad.content?.text || ''}`;
    const capsWords = rawText.match(/\b[A-Z]{4,}\b/g) || [];
    if (capsWords.length === 0) {
      score += 20;
    } else {
      score -= 20;
    }

    // High ethical score if available
    if (ad.smartScore && ad.smartScore >= 80) {
      score += 20;
    }

    for (const kw of MINDFUL_POSITIVE_WORDS) {
      if (combined.includes(kw)) {
        score += 15;
        break;
      }
    }

    for (const kw of MINDFUL_AGGRESSIVE_WORDS) {
      if (combined.includes(kw)) {
        score -= 30;
        break;
      }
    }

    const isResonant = score >= 25;
    return {
      score,
      isResonant,
      badgeLabelKey: isResonant ? 'intent_badge_mindful' : undefined,
      badgeText: isResonant ? '🍃 Mindful Pick' : undefined
    };
  }

  return { score: 0, isResonant: false };
}

export function scorePostIntent(post: OrganicPost, intent: IntentMode): number {
  if (intent === 'all') return 0;

  const content = (post.content || '').toLowerCase();
  let score = 0;

  if (intent === 'local') {
    if (LOCAL_CATEGORIES.has(post.category)) score += 30;
    if (post.syndication?.neighborhood || post.syndication?.venue) score += 25;
    for (const kw of LOCAL_KEYWORDS) {
      if (content.includes(kw)) {
        score += 10;
        break;
      }
    }
  } else if (intent === 'deals') {
    if (/\b\d{1,2}%\b/.test(content)) score += 30;
    for (const kw of DEAL_KEYWORDS) {
      if (content.includes(kw)) {
        score += 15;
        break;
      }
    }
  } else if (intent === 'mindful') {
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount === 0) score += 25;
    for (const kw of MINDFUL_POSITIVE_WORDS) {
      if (content.includes(kw)) {
        score += 15;
        break;
      }
    }
  }

  return score;
}

export function applyIntentRanking(
  items: (Ad | OrganicPost)[],
  intent: IntentMode
): IntentReorderResult {
  const intentResonances: Record<string, IntentResonanceInfo> = {};

  if (intent === 'all' || items.length === 0) {
    return { timeline: items, intentResonances };
  }

  // Pre-calculate scores
  const scoredItems = items.map((item) => {
    const isAd = (item as Ad).advertiser !== undefined;
    let score = 0;

    if (isAd) {
      const ad = item as Ad;
      const res = scoreAdIntent(ad, intent);
      score = res.score;
      if (res.isResonant && res.badgeLabelKey && res.badgeText) {
        intentResonances[ad.id] = {
          labelKey: res.badgeLabelKey,
          defaultText: res.badgeText
        };
      }
    } else {
      score = scorePostIntent(item as OrganicPost, intent);
    }

    return { item, score };
  });

  // Sort descending by score while preserving original relative order for ties (stable sort)
  const ranked = [...scoredItems].sort((a, b) => b.score - a.score).map((s) => s.item);

  return {
    timeline: ranked,
    intentResonances
  };
}
