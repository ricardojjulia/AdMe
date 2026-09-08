/**
 * AdMe AI Content Safety, Moderation & Merchant Verification Engine
 * Supports OpenRouter API, Google Gemini API, and deterministic fallback heuristics.
 */

export interface AdCreativePayload {
  headline: string;
  contentText?: string;
  mediaUrl?: string;
  ctaUrl?: string;
  category?: string;
}

export interface ModerationResult {
  approved: boolean;
  riskScore: number; // 0.0 (clean) to 1.0 (critical violation)
  flags: string[];
  reason: string;
  category: 'clean' | 'warning' | 'rejected';
}

export interface MerchantVerificationPayload {
  businessName: string;
  websiteUrl: string;
  physicalAddress?: string;
  socialLinks?: string[];
}

export interface MerchantVerificationResult {
  verified: boolean;
  confidence: number;
  flags: string[];
  summary: string;
  locationStatus: 'verified' | 'unconfirmed' | 'virtual_only';
}

// Prohibited content keywords for local rapid zero-latency pre-filter
const PROHIBITED_PATTERNS = [
  { pattern: /\b(hate|racis[mt]|nazi|supremac|slur|subhuman)\b/i, flag: "social_hatred_or_racism", weight: 0.95 },
  { pattern: /\b(kill|murder|torture|genocide|terroris[mt]|suicide|self-harm)\b/i, flag: "violence_or_inhuman", weight: 0.95 },
  { pattern: /\b(guaranteed\s+10x|get\s+rich\s+quick|crypto\s+doubler|untraceable\s+funds)\b/i, flag: "misleading_or_fraud", weight: 0.85 },
  { pattern: /\b(cocaine|heroin|fentanyl|unlicensed\s+firearms|ghost\s+gun|counterfeit\s+passports)\b/i, flag: "illicit_or_illegal", weight: 1.0 },
  { pattern: /\b(miracle\s+cure|cure\s+cancer\s+overnight|fda\s+banned)\b/i, flag: "misleading_health_claims", weight: 0.85 }
];

export async function evaluateAdCreative(ad: AdCreativePayload): Promise<ModerationResult> {
  const fullText = `${ad.headline} ${ad.contentText || ''} ${ad.ctaUrl || ''}`.toLowerCase();
  const detectedFlags: string[] = [];
  let maxRisk = 0.0;

  // 1. Instant deterministic safety heuristic check
  for (const item of PROHIBITED_PATTERNS) {
    if (item.pattern.test(fullText)) {
      detectedFlags.push(item.flag);
      maxRisk = Math.max(maxRisk, item.weight);
    }
  }

  // 2. OpenRouter or Gemini LLM Deep Semantic Inspection
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (openRouterKey && maxRisk < 0.8) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ad-me.vercel.app",
          "X-Title": "AdMe Content Safety Engine"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an automated ad compliance officer. Inspect the ad headline and text for: violence, racism, hate speech, illegal goods/drugs/weapons, fraud/scams, or malformed content. Respond ONLY in JSON: { \"approved\": boolean, \"riskScore\": number (0.0 to 1.0), \"flags\": string[], \"reason\": string }"
            },
            {
              role: "user",
              content: `Ad Headline: "${ad.headline}"\nAd Body: "${ad.contentText || ''}"\nCategory: "${ad.category || ''}"\nURL: "${ad.ctaUrl || ''}"`
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (response.ok) {
        const json = await response.json();
        const parsed = JSON.parse(json.choices[0].message.content);
        return {
          approved: parsed.approved && maxRisk < 0.5,
          riskScore: Math.max(maxRisk, parsed.riskScore || 0),
          flags: Array.from(new Set([...detectedFlags, ...(parsed.flags || [])])),
          reason: parsed.reason || (detectedFlags.length ? `Violates safety policy: ${detectedFlags.join(', ')}` : "Passed automated compliance check."),
          category: (parsed.riskScore > 0.4 || maxRisk > 0.4) ? 'rejected' : 'clean'
        };
      }
    } catch (llmErr) {
      console.warn("[AI Moderation] OpenRouter API call bypassed, utilizing local safety heuristics:", llmErr);
    }
  } else if (geminiKey && maxRisk < 0.8) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Audit this advertisement for platform compliance:
Headline: "${ad.headline}"
Body: "${ad.contentText || ''}"
Category: "${ad.category || ''}"

Identify any of:
- Inhuman, violent, or dangerous acts
- Social hatred, racism, discrimination
- Misleading, fraud, deceptive claims
- Illicit or illegal products (weapons, contraband)

Respond ONLY with valid JSON:
{
  "approved": boolean,
  "riskScore": number between 0.0 and 1.0,
  "flags": string array of violations,
  "reason": brief explanation
}`
            }]
          }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (response.ok) {
        const json = await response.json();
        const rawContent = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawContent) {
          const parsed = JSON.parse(rawContent);
          return {
            approved: parsed.approved && maxRisk < 0.5,
            riskScore: Math.max(maxRisk, parsed.riskScore || 0),
            flags: Array.from(new Set([...detectedFlags, ...(parsed.flags || [])])),
            reason: parsed.reason || (detectedFlags.length ? `Violates safety policy: ${detectedFlags.join(', ')}` : "Passed automated compliance check."),
            category: (parsed.riskScore > 0.4 || maxRisk > 0.4) ? 'rejected' : 'clean'
          };
        }
      }
    } catch (geminiErr) {
      console.warn("[AI Moderation] Gemini API call bypassed, utilizing local safety heuristics:", geminiErr);
    }
  }

  // Deterministic Evaluation Return
  const isApproved = maxRisk < 0.5 && detectedFlags.length === 0;
  return {
    approved: isApproved,
    riskScore: maxRisk,
    flags: detectedFlags,
    reason: isApproved ? "Clean creative - passed automated safety filters." : `Rejected for policy violations: ${detectedFlags.join(', ')}.`,
    category: isApproved ? 'clean' : 'rejected'
  };
}

export async function arbitrateUserReport(
  adHeadline: string, 
  adContent: string, 
  reportReason: string
): Promise<{ shouldTakedown: boolean; terminateMerchant: boolean; decision: string }> {
  const fullText = `${adHeadline} ${adContent} ${reportReason}`.toLowerCase();
  
  // Severe zero-tolerance triggers lead to immediate merchant termination
  const severeViolation = /\b(child|nazi|kill|suicide|cocaine|fentanyl|bomb|ghost\s+gun)\b/i.test(fullText);
  const standardViolation = /\b(scam|hate|racis[mt]|fraud|fake|phishing|harass)\b/i.test(fullText);

  if (severeViolation) {
    return {
      shouldTakedown: true,
      terminateMerchant: true,
      decision: "Critical Zero-Tolerance Violation: Content pulled and merchant account permanently terminated."
    };
  }

  if (standardViolation) {
    return {
      shouldTakedown: true,
      terminateMerchant: false,
      decision: "Policy Violation Confirmed: Ad pulled from feed circulation pending full manual review."
    };
  }

  return {
    shouldTakedown: false,
    terminateMerchant: false,
    decision: "Report triaged by automated safety arbitrator: Content cleared for continued circulation."
  };
}
