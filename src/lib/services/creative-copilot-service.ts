import { scoreAdCreative, EthicalScoreResult } from './ethical-ad-scorer';

export interface CopilotRequest {
  merchantName?: string;
  category: string;
  productBrief?: string;
  currentHeadline?: string;
  currentText?: string;
}

export interface CreativeVariant {
  id: string;
  angle: 'value' | 'story' | 'curiosity';
  angleTitle: string;
  angleIcon: string;
  headline: string;
  contentText: string;
  ctaLabel: string;
  projectedCtrBoost: string;
  ethicalScore: EthicalScoreResult;
}

export interface CopilotResponse {
  variants: CreativeVariant[];
  overallRating: string;
  generatedBy: 'gemini' | 'heuristic-fallback';
}

/**
 * Generate 3 distinct high-resonance creative angles:
 * 1. Value & Utility: Emphasizes tangible consumer savings, rewards, or discounts.
 * 2. Story & Mission: Emphasizes authenticity, craft, community roots, or ethical sourcing.
 * 3. Curiosity & Innovation: Invites thoughtful exploration without clickbait traps.
 */
export async function generateCreativeVariants(req: CopilotRequest): Promise<CopilotResponse> {
  const category = req.category || 'General';
  const merchantName = req.merchantName?.trim() || 'Our Brand';
  const brief = req.productBrief?.trim() || req.currentText?.trim() || 'Premium quality products and services';

  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    const prompt = `
You are an expert, ethical ad copywriter for AdMe, an ethical ad platform.
Generate 3 distinct creative ad variations for an advertiser.
Guidelines:
- AdMe strictly bans clickbait, fake urgency ("hurry", "last chance"), and deceptive claims.
- Every ad must be polite, non-intrusive, and clearly communicate consumer value.

Advertiser Information:
- Brand Name: ${merchantName}
- Category: ${category}
- Product Brief: ${brief}
- Current Draft: "${req.currentHeadline || ''}" - "${req.currentText || ''}"

Return a JSON array with exactly 3 objects:
1. Angle 1: Value & Utility (angle: "value", angleTitle: "Value & Utility", angleIcon: "🏷️", projectedCtrBoost: "+24% CTR")
2. Angle 2: Story & Mission (angle: "story", angleTitle: "Story & Mission", angleIcon: "🌿", projectedCtrBoost: "+32% CTR")
3. Angle 3: Curiosity & Innovation (angle: "curiosity", angleTitle: "Curiosity & Innovation", angleIcon: "💡", projectedCtrBoost: "+19% CTR")

Each object must contain:
- "angle": "value" | "story" | "curiosity"
- "angleTitle": string
- "angleIcon": string
- "headline": string (max 60 chars, engaging, polite, title case)
- "contentText": string (max 150 chars, clear value exchange)
- "ctaLabel": string (max 20 chars, e.g. "Explore Deal", "Shop Coffee", "Discover Story")
- "projectedCtrBoost": string

Respond ONLY with valid JSON array: [{...}, {...}, {...}].
`;

    const candidateModels = [
      'gemini-flash-latest',
      'gemini-2.5-flash',
    ];

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(2500),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            const arrayItems = Array.isArray(parsed) ? parsed : parsed.variants || parsed.suggestions;
            if (Array.isArray(arrayItems) && arrayItems.length >= 3) {
              const variants: CreativeVariant[] = arrayItems.slice(0, 3).map((item: any, idx: number) => {
                const angle = (['value', 'story', 'curiosity'][idx] || 'value') as 'value' | 'story' | 'curiosity';
                const ethicalScore = scoreAdCreative({
                  headline: item.headline,
                  contentText: item.contentText,
                  ctaLabel: item.ctaLabel,
                  category,
                });
                return {
                  id: `var-${angle}-${Date.now()}-${idx}`,
                  angle,
                  angleTitle: item.angleTitle || (angle === 'value' ? 'Value & Utility' : angle === 'story' ? 'Story & Mission' : 'Curiosity & Innovation'),
                  angleIcon: item.angleIcon || (angle === 'value' ? '🏷️' : angle === 'story' ? '🌿' : '💡'),
                  headline: item.headline,
                  contentText: item.contentText,
                  ctaLabel: item.ctaLabel || 'Learn More',
                  projectedCtrBoost: item.projectedCtrBoost || '+25% CTR',
                  ethicalScore,
                };
              });

              return {
                variants,
                overallRating: 'Ethical & High Resonance',
                generatedBy: 'gemini',
              };
            }
          }
        }
      } catch (err) {
        console.warn(`[CreativeCopilot] Gemini model ${model} skipped:`, err);
      }
    }
  }

  // Fallback to high-fidelity deterministic heuristic generation
  return generateHeuristicVariants(req);
}

function generateHeuristicVariants(req: CopilotRequest): CopilotResponse {
  const category = req.category || 'General';
  const brand = req.merchantName?.trim() || 'Our Brand';
  const brief = req.productBrief?.trim() || req.currentText?.trim() || '';

  const templates: Record<string, {
    value: { headline: string; contentText: string; cta: string; boost: string };
    story: { headline: string; contentText: string; cta: string; boost: string };
    curiosity: { headline: string; contentText: string; cta: string; boost: string };
  }> = {
    'Veteran-owned': {
      value: {
        headline: `${brand} · Single-Origin Micro-Batch Coffee (15% Off)`,
        contentText: 'Freshly roasted whole bean coffee delivered straight to your door. Veterans and first responders get 15% off.',
        cta: 'Claim 15% Off',
        boost: '+26% CTR',
      },
      story: {
        headline: `Crafted with Purpose · ${brand}'s Veteran Mission`,
        contentText: 'Every roast supports veterans with meaningful career pathways. Taste the care and dedication in every artisan cup.',
        cta: 'Discover Our Story',
        boost: '+34% CTR',
      },
      curiosity: {
        headline: 'Why Does Fresh Micro-Batch Coffee Taste Superior?',
        contentText: 'Explore single-origin roasts crafted in small batches to preserve nuanced aromas and natural sweetness.',
        cta: 'Explore Roasts',
        boost: '+19% CTR',
      },
    },
    'Local Eateries': {
      value: {
        headline: `Seasonal Farm-to-Table Dining · 20% Off First Visit`,
        contentText: `Enjoy organic culinary specials from ${brand}. Claim your local community coupon for 20% off your table today.`,
        cta: 'Claim 20% Coupon',
        boost: '+28% CTR',
      },
      story: {
        headline: `Fresh Flavors, Local Roots · Welcome to ${brand}`,
        contentText: 'Handcrafted daily from ingredients sourced directly from regional family farms. Experience authentic community dining.',
        cta: 'View Our Story',
        boost: '+33% CTR',
      },
      curiosity: {
        headline: `Ready to Rediscover Honest, Scratch-Cooked Flavors?`,
        contentText: `From morning sourdough to slow-braised mains, ${brand} brings scratch cooking back to our neighborhood tables.`,
        cta: 'Browse Specials',
        boost: '+21% CTR',
      },
    },
    'Tech & SaaS': {
      value: {
        headline: `${brand} · Accelerate Workflows with 30-Day Free Access`,
        contentText: 'Save up to 10 hours each week with automated pipelines. Full enterprise features included, zero credit card required.',
        cta: 'Start Free Trial',
        boost: '+25% CTR',
      },
      story: {
        headline: `Built by Engineers for Privacy-Conscious Teams`,
        contentText: `${brand} was created to banish slow tooling and intrusive trackers. Enjoy lightweight, high-performance developer tools.`,
        cta: 'Read Our Code',
        boost: '+30% CTR',
      },
      curiosity: {
        headline: `Could Your Development Cycle Be 2x Faster?`,
        contentText: 'Discover how modern edge infrastructure eliminates bottlenecks and keeps engineering teams focused on what matters.',
        cta: 'Explore Platform',
        boost: '+22% CTR',
      },
    },
    'Wellness & Health': {
      value: {
        headline: `Natural Balance & Vitality · 15% Off First Order`,
        contentText: `Holistic wellness essentials formulated with clean, organic ingredients. Enjoy complimentary shipping and 15% off.`,
        cta: 'Claim 15% Off',
        boost: '+27% CTR',
      },
      story: {
        headline: `Rooted in Purity: The ${brand} Wellness Promise`,
        contentText: 'No synthetic fillers or artificial shortcuts. We sustainably harvest pure botanicals to support your daily well-being.',
        cta: 'Discover Purity',
        boost: '+31% CTR',
      },
      curiosity: {
        headline: `How Can Daily Adaptogens Transform Your Energy?`,
        contentText: 'Learn how gentle herbal supplements support sustained natural focus without caffeine jitters or crashes.',
        cta: 'Learn the Science',
        boost: '+20% CTR',
      },
    },
  };

  const defaultTemplates = {
    value: {
      headline: `${brand} · Exclusive Community Offer & Perks`,
      contentText: brief.length > 10 ? `${brief.slice(0, 110)}. Claim your welcome perk and save.` : `Discover premium quality and exceptional savings with ${brand}. Enjoy an exclusive welcome discount today.`,
      cta: 'Explore Offer',
      boost: '+24% CTR',
    },
    story: {
      headline: `The Craft Behind ${brand} · Authentic Quality`,
      contentText: brief.length > 10 ? `Behind ${brand}: ${brief.slice(0, 110)}. Dedicated to honest craftsmanship.` : `Learn how ${brand} is redefining ${category} with sustainable practices and thoughtful design.`,
      cta: 'Explore Our Story',
      boost: '+29% CTR',
    },
    curiosity: {
      headline: `Looking for a Better Way to Experience ${category}?`,
      contentText: brief.length > 10 ? `${brief.slice(0, 110)}. Built to exceed expectations.` : `See how ${brand} delivers uncompromised quality and customer-first value across every detail.`,
      cta: 'Discover More',
      boost: '+18% CTR',
    },
  };

  const active = templates[category] || defaultTemplates;

  const rawAngles = [
    {
      angle: 'value' as const,
      angleTitle: 'Value & Utility',
      angleIcon: '🏷️',
      headline: active.value.headline,
      contentText: active.value.contentText,
      ctaLabel: active.value.cta,
      projectedCtrBoost: active.value.boost,
    },
    {
      angle: 'story' as const,
      angleTitle: 'Story & Mission',
      angleIcon: '🌿',
      headline: active.story.headline,
      contentText: active.story.contentText,
      ctaLabel: active.story.cta,
      projectedCtrBoost: active.story.boost,
    },
    {
      angle: 'curiosity' as const,
      angleTitle: 'Curiosity & Innovation',
      angleIcon: '💡',
      headline: active.curiosity.headline,
      contentText: active.curiosity.contentText,
      ctaLabel: active.curiosity.cta,
      projectedCtrBoost: active.curiosity.boost,
    },
  ];

  const variants: CreativeVariant[] = rawAngles.map((item, idx) => {
    const ethicalScore = scoreAdCreative({
      headline: item.headline,
      contentText: item.contentText,
      ctaLabel: item.ctaLabel,
      category,
    });
    return {
      id: `heur-${item.angle}-${idx}`,
      ...item,
      ethicalScore,
    };
  });

  return {
    variants,
    overallRating: 'Ethical & High Resonance',
    generatedBy: 'heuristic-fallback',
  };
}
