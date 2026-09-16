/**
 * Ethical Ad Scorer
 * Evaluates advertisement copy against AdMe's core ethical guidelines:
 * 1. Non-Intrusiveness & Politeness (no excessive caps, punctuation, high-pressure demands)
 * 2. Value Exchange Clarity (clear articulation of consumer benefits, perks, savings, or utility)
 * 3. Honesty & Transparency (penalizes deceptive urgency, clickbait triggers, and exaggerated claims)
 *
 * Implements Architecture Decision COUNCIL-2026-008.
 */

export interface EthicalScoreResult {
  overallScore: number; // 0 - 100
  politenessScore: number; // 0 - 100
  valueClarityScore: number; // 0 - 100
  honestyScore: number; // 0 - 100
  rating: 'Excellent' | 'Good' | 'Fair' | 'Needs Revision';
  issues: string[];
  recommendations: string[];
}

export interface AdCreativeInput {
  headline: string;
  contentText: string;
  ctaLabel?: string;
  category?: string;
}

// Clickbait and deceptive urgency patterns to penalize
const CLICKBAIT_PATTERNS = [
  /\bhurry\b/i,
  /\blast chance\b/i,
  /\bdon't miss out\b/i,
  /\bact now\b/i,
  /\blimited time only\b/i,
  /\bsecret trick\b/i,
  /\bone weird trick\b/i,
  /\byou won't believe\b/i,
  /\bshocking\b/i,
  /\brisk[- ]free\b/i,
  /\bguaranteed\b/i,
  /\b100% free\b/i,
  /\bmiracle\b/i,
  /\binstant riches\b/i,
  /\bonly \d+ left\b/i,
];

// Value exchange indicators that demonstrate consumer benefit
const VALUE_INDICATORS = [
  /\b(off|discount|save|savings|coupon|voucher|perk|reward|deal|points)\b/i,
  /\b(free shipping|complimentary|cashback|bonus|gift|sample)\b/i,
  /\b(veterans?|locals?|community|students?|members?)\b/i,
  /\b(\d+%\s*off|\$\d+\s*off)\b/i,
  /\b(ethically sourced|single[- ]origin|sustainable|handmade|handcrafted|organic)\b/i,
  /\b(warranty|guarantee|artisan|craft)\b/i,
];

// High-pressure imperative commands
const HIGH_PRESSURE_IMPERATIVES = [
  /\bbuy now or\b/i,
  /\bstop what you're doing\b/i,
  /\byou must\b/i,
  /\bnever before seen\b/i,
  /\bclick here immediately\b/i,
];

export function scoreAdCreative(input: AdCreativeInput): EthicalScoreResult {
  const headline = (input.headline || '').trim();
  const contentText = (input.contentText || '').trim();
  const cta = (input.ctaLabel || '').trim();
  const combined = `${headline} ${contentText} ${cta}`;

  const issues: string[] = [];
  const recommendations: string[] = [];

  // --- 1. Politeness & Tone (Max 100) ---
  let politenessScore = 100;

  // Excessive uppercase letters (excluding short acronyms)
  const lettersOnly = combined.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length > 10) {
    const uppercaseCount = (combined.match(/[A-Z]/g) || []).length;
    const uppercaseRatio = uppercaseCount / lettersOnly.length;
    if (uppercaseRatio > 0.4) {
      politenessScore -= 30;
      issues.push('Excessive uppercase text detected (appears shouting).');
      recommendations.push('Use sentence case for natural, approachable readability.');
    } else if (uppercaseRatio > 0.25) {
      politenessScore -= 15;
      issues.push('Elevated uppercase letter usage.');
    }
  }

  // Excessive punctuation (e.g. "!!!", "???", "?!")
  const excessivePunct = (combined.match(/[!?]{2,}/g) || []).length;
  if (excessivePunct > 0) {
    politenessScore -= Math.min(30, excessivePunct * 15);
    issues.push('Excessive exclamation/question marks detected.');
    recommendations.push('Replace multiple punctuation marks with a single period or question mark.');
  }

  // High pressure imperatives
  for (const pattern of HIGH_PRESSURE_IMPERATIVES) {
    if (pattern.test(combined)) {
      politenessScore -= 20;
      issues.push('High-pressure or manipulative phrasing detected.');
      recommendations.push('Invite consumer exploration rather than issuing aggressive demands.');
      break;
    }
  }
  politenessScore = Math.max(10, Math.min(100, politenessScore));

  // --- 2. Value Exchange Clarity (Max 100) ---
  let valueClarityScore = 50; // Neutral baseline

  let valueMatchCount = 0;
  for (const pattern of VALUE_INDICATORS) {
    if (pattern.test(combined)) {
      valueMatchCount++;
    }
  }

  if (valueMatchCount >= 3) {
    valueClarityScore = 95;
  } else if (valueMatchCount === 2) {
    valueClarityScore = 85;
  } else if (valueMatchCount === 1) {
    valueClarityScore = 70;
  } else {
    valueClarityScore = 40;
    issues.push('No tangible consumer benefit, reward, or value proposition found.');
    recommendations.push('Clarify the specific perk, discount, or quality benefit the user receives.');
  }

  // Bonus for clear, non-pushy CTA
  if (cta && cta.length <= 20) {
    if (/^(learn more|explore|discover|view menu|shop|visit|try|claim|get offer)/i.test(cta)) {
      valueClarityScore = Math.min(100, valueClarityScore + 5);
    }
  }
  valueClarityScore = Math.max(10, Math.min(100, valueClarityScore));

  // --- 3. Honesty & Zero-Clickbait (Max 100) ---
  let honestyScore = 100;
  let clickbaitCount = 0;

  for (const pattern of CLICKBAIT_PATTERNS) {
    if (pattern.test(combined)) {
      clickbaitCount++;
    }
  }

  if (clickbaitCount > 0) {
    const penalty = Math.min(60, clickbaitCount * 20);
    honestyScore -= penalty;
    issues.push(`Deceptive urgency or clickbait pattern detected (${clickbaitCount} match${clickbaitCount > 1 ? 'es' : ''}).`);
    recommendations.push('Remove artificial scarcity ("Hurry", "Act Now") to build long-term consumer trust.');
  }

  honestyScore = Math.max(10, Math.min(100, honestyScore));

  // --- Composite Overall Score ---
  // Weights: Politeness (30%), Value Clarity (35%), Honesty (35%)
  const overallScore = Math.round(
    politenessScore * 0.3 + valueClarityScore * 0.35 + honestyScore * 0.35
  );

  let rating: 'Excellent' | 'Good' | 'Fair' | 'Needs Revision';
  if (overallScore >= 85) {
    rating = 'Excellent';
  } else if (overallScore >= 70) {
    rating = 'Good';
  } else if (overallScore >= 50) {
    rating = 'Fair';
  } else {
    rating = 'Needs Revision';
  }

  if (recommendations.length === 0) {
    recommendations.push('Ad copy meets high ethical standards for non-intrusive consumer engagement.');
  }

  return {
    overallScore,
    politenessScore,
    valueClarityScore,
    honestyScore,
    rating,
    issues,
    recommendations,
  };
}
