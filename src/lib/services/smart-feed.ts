import { Ad, HeuristicsBreakdown, HeuristicsFactor } from "@/types/ad";

export interface TemporalContext {
  period: 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night';
  boostCategories: string[];
  labelKey: string;
  defaultLabel: string;
}

export interface SmartFeedContext {
  preferences: string[];
  userLocation?: { lat: number; lng: number } | null;
  activeTab?: string;
  savedAdIds?: string[];
  interactionHistory?: Record<string, number>; // category -> interaction count or dwell weight
}

/**
 * Returns the current temporal context based on local device time
 */
export function getTemporalContext(now: Date = new Date()): TemporalContext {
  const hour = now.getHours();

  if (hour >= 6 && hour < 11) {
    return {
      period: 'morning',
      boostCategories: ['Specialty Coffee', 'Local Eateries', 'Faith & Books', 'Tech & SaaS'],
      labelKey: 'morning_match',
      defaultLabel: 'Morning Ritual'
    };
  } else if (hour >= 11 && hour < 15) {
    return {
      period: 'lunch',
      boostCategories: ['Local Eateries', 'Wellness & Health', 'Specialty Coffee'],
      labelKey: 'lunch_match',
      defaultLabel: 'Midday Discovery'
    };
  } else if (hour >= 15 && hour < 18) {
    return {
      period: 'afternoon',
      boostCategories: ['Tech & SaaS', 'Design', 'Auto under $40k', 'Gaming', 'Vision & Care'],
      labelKey: 'afternoon_match',
      defaultLabel: 'Afternoon Pick'
    };
  } else if (hour >= 18 && hour < 22) {
    return {
      period: 'evening',
      boostCategories: ['Local Eateries', 'Gaming', 'Outdoors', 'Beauty', 'Home & Living', 'Home & Garden'],
      labelKey: 'evening_match',
      defaultLabel: 'Evening Social'
    };
  } else {
    return {
      period: 'night',
      boostCategories: ['Tech & SaaS', 'Gaming', 'Finance & Banking', 'Faith & Books'],
      labelKey: 'night_match',
      defaultLabel: 'Night Discovery'
    };
  }
}

/**
 * Computes a Zero-Knowledge on-device smart affinity score and user transparency reasons.
 * Everything runs purely client-side; no profile telemetry is transmitted.
 */
export function calculateSmartScore(
  ad: Ad,
  context: SmartFeedContext,
  temporal: TemporalContext = getTemporalContext()
): { score: number; reasons: string[]; breakdown: HeuristicsBreakdown } {
  let score = 45; // Base baseline score
  const reasons: string[] = [];
  const factors: HeuristicsFactor[] = [];

  // 1. Taste & Vibe Preference Match
  if (context.preferences && context.preferences.length > 0) {
    if (context.preferences.includes(ad.category)) {
      score += 28;
      reasons.push('Vibe Match');
      factors.push({
        factor: 'Taste Affinity',
        points: 28,
        description: `Aligned with your '${ad.category}' preference`
      });
    }
  } else {
    // If no explicit preferences set, provide general discovery points
    score += 15;
    factors.push({
      factor: 'Open Exploration',
      points: 15,
      description: 'Discovery mode across trending local categories'
    });
  }

  // 2. Temporal / Time-of-Day Contextual Relevance
  if (temporal.boostCategories.includes(ad.category)) {
    score += 12;
    reasons.push(temporal.defaultLabel);
    factors.push({
      factor: 'Time Context',
      points: 12,
      description: `Optimal timing for ${temporal.defaultLabel}`
    });
  }

  // 3. Hyper-Local Proximity Decay: score += 20 * exp(-distance / 4)
  if (ad.distanceMiles !== undefined) {
    const dist = ad.distanceMiles;
    const proxBonus = Math.round(20 * Math.exp(-dist / 4.0));
    score += proxBonus;
    factors.push({
      factor: 'Proximity Decay',
      points: proxBonus,
      description: `${dist.toFixed(1)} miles from your detected area`
    });

    if (dist <= 0.8) {
      reasons.push('Walking distance (<1 mi)');
    } else if (dist <= 3.5) {
      reasons.push(`${dist.toFixed(1)} mi nearby`);
    } else if (dist <= 15.0) {
      reasons.push('Local area');
    }
  }

  // 4. Local Discovery Spotlight Boost
  if (ad.isLocalDiscovery) {
    score += 10;
    reasons.push('Community Spotlight');
    factors.push({
      factor: 'Local Spotlight',
      points: 10,
      description: 'Physical brick-and-mortar venue in your immediate town'
    });
  }

  // 5. Community Rating & Patron Satisfaction
  if (ad.placeDetails?.rating && ad.placeDetails.rating >= 4.5) {
    score += 8;
    factors.push({
      factor: 'Community Trust',
      points: 8,
      description: `High patron satisfaction (${ad.placeDetails.rating}★ rating)`
    });
  }

  // 6. High-Quality / Boosted Campaign Signal
  if (ad.isBoosted) {
    score += 6;
    factors.push({
      factor: 'Featured Merchant',
      points: 6,
      description: 'Active advertiser verified on AdMe network'
    });
  }

  // 7. Interaction History & Taste Drift (Zero-Knowledge on-device weights)
  if (context.interactionHistory && context.interactionHistory[ad.category]) {
    const interactionBonus = Math.min(10, context.interactionHistory[ad.category] * 2);
    score += interactionBonus;
    factors.push({
      factor: 'Attention History',
      points: interactionBonus,
      description: 'Correlated with on-device viewing dwell time'
    });
    if (interactionBonus >= 4 && !reasons.includes('Vibe Match')) {
      reasons.push('Trending with you');
    }
  }

  // 8. Max CPC Bid Weighting
  const bidBonus = Math.min(5, Math.round(((ad.maxCpcBid ?? 15) - 15) / 5));
  score += Math.max(0, bidBonus);

  // Clamp final score to 50 - 99 range
  const finalScore = Math.max(50, Math.min(99, score));

  return {
    score: finalScore,
    reasons: reasons.slice(0, 2), // Keep top 2 concise tags for badge display
    breakdown: {
      baseScore: 45,
      factors,
      totalScore: finalScore
    }
  };
}

/**
 * Self-optimizing Multi-Armed Bandit variation selector.
 * Uses an epsilon-greedy policy: explores new variations 15% of the time,
 * and exploits the variation with highest engagement 85% of the time.
 */
export function smartBanditSelect(ads: Ad[], deviceId: string | null = 'anon'): Ad[] {
  const campaignGroups: Record<string, Ad[]> = {};

  ads.forEach(ad => {
    if (ad.campaignId) {
      campaignGroups[ad.campaignId] = campaignGroups[ad.campaignId] || [];
      campaignGroups[ad.campaignId].push(ad);
    }
  });

  const selectedWinners: Record<string, string> = {};

  Object.keys(campaignGroups).forEach(cid => {
    const variations = campaignGroups[cid];
    if (variations.length <= 1) {
      selectedWinners[cid] = variations[0].id;
      return;
    }

    // Determine deterministic pseudo-random seed per device & campaign
    const seedStr = `${deviceId || 'anon'}:${cid}:${new Date().toDateString()}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const pseudoRandom = (Math.abs(hash) % 1000) / 1000.0;

    // Epsilon = 0.15 (15% exploration, 85% exploitation of winning metrics)
    const EPSILON = 0.15;
    if (pseudoRandom < EPSILON) {
      // Explore: Pick random variation
      const randomIndex = Math.abs(hash) % variations.length;
      selectedWinners[cid] = variations[randomIndex].id;
    } else {
      // Exploit: Pick variation with highest metrics (likes + shares * 2)
      let bestVariation = variations[0];
      let bestScore = (bestVariation.metrics.likes || 0) + (bestVariation.metrics.shares || 0) * 2;

      for (let i = 1; i < variations.length; i++) {
        const v = variations[i];
        const vScore = (v.metrics.likes || 0) + (v.metrics.shares || 0) * 2;
        if (vScore > bestScore) {
          bestScore = vScore;
          bestVariation = v;
        }
      }
      selectedWinners[cid] = bestVariation.id;
    }
  });

  return ads.filter(ad => {
    if (!ad.campaignId) return true;
    return selectedWinners[ad.campaignId] === ad.id;
  });
}

/**
 * Category Dispersion Heuristic (Anti-Clustering):
 * Reorders scored candidates so no two adjacent cards share the identical category.
 * Prevents "echo-chamber clustering" where 4 restaurants or 4 coffee shops group together.
 */
export function applyCategoryDispersion(ads: Ad[]): Ad[] {
  if (ads.length <= 2) return ads;

  const dispersed: Ad[] = [];
  const remaining = [...ads];

  // Start with the top-ranked item
  dispersed.push(remaining.shift()!);

  while (remaining.length > 0) {
    const lastCategory = dispersed[dispersed.length - 1].category;

    // Find the next highest-scoring item with a DIFFERENT category
    const diffIndex = remaining.findIndex(ad => ad.category !== lastCategory);

    if (diffIndex !== -1) {
      dispersed.push(remaining.splice(diffIndex, 1)[0]);
    } else {
      // All remaining items belong to the same category; append the next best
      dispersed.push(remaining.shift()!);
    }
  }

  return dispersed;
}

/**
 * Smart Rank Pipeline: Scores, enriches with explainable transparency reasons,
 * and sorts ads by smart score with category dispersion heuristics.
 */
export function rankSmartFeed(ads: Ad[], context: SmartFeedContext): Ad[] {
  const temporal = getTemporalContext();

  const scoredAds = ads.map(ad => {
    const { score, reasons, breakdown } = calculateSmartScore(ad, context, temporal);
    return {
      ...ad,
      smartScore: score,
      smartScoreReasons: reasons,
      heuristicsBreakdown: breakdown
    };
  });

  // Sort primarily by smart score descending
  scoredAds.sort((a, b) => {
    // When on Local tab, boost distance factor
    if (context.activeTab === 'Local') {
      const distA = a.distanceMiles ?? 999;
      const distB = b.distanceMiles ?? 999;
      if (Math.abs(distA - distB) > 0.5) {
        return distA - distB;
      }
    }

    return (b.smartScore ?? 50) - (a.smartScore ?? 50);
  });

  // Apply Category Dispersion Heuristic to guarantee a diverse, well-balanced feed
  return applyCategoryDispersion(scoredAds);
}

