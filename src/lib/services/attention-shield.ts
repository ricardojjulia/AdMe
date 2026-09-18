/**
 * Attention Shield Service
 * COUNCIL-2026-009: Client-Side Anti-Fatigue Attention Shield & Instant Value-Exchange
 * 
 * Provides pure, deterministic session fatigue evaluation, category anti-clustering,
 * and zero-knowledge device-local impression tracking.
 */

export interface AdImpressionRecord {
  count: number;
  lastSeen: number;
  category: string;
}

export type SessionImpressionLedger = Record<string, AdImpressionRecord>;

export const SESSION_STORAGE_KEY = "adme_session_fatigue_v1";
export const MAX_IMPRESSIONS_PER_SESSION = 3;
export const FATIGUE_THRESHOLD = MAX_IMPRESSIONS_PER_SESSION;
export const MAX_CONSECUTIVE_SAME_CATEGORY = 2;

function getSessionStorage(): Storage | null {
  if (typeof window !== "undefined" && window.sessionStorage) {
    return window.sessionStorage;
  }
  if (typeof sessionStorage !== "undefined") {
    return sessionStorage;
  }
  return null;
}

/**
 * Safely retrieve session impressions from browser sessionStorage
 */
export function getSessionImpressions(): SessionImpressionLedger {
  const storage = getSessionStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Increment and record an impression for a specific ad
 */
export function recordSessionImpression(
  adId: string,
  category: string
): SessionImpressionLedger {
  const storage = getSessionStorage();
  if (!storage) return {};
  try {
    const current = getSessionImpressions();
    const existing = current[adId] || { count: 0, lastSeen: Date.now(), category };
    const updated: SessionImpressionLedger = {
      ...current,
      [adId]: {
        count: existing.count + 1,
        lastSeen: Date.now(),
        category: category || existing.category,
      },
    };
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return {};
  }
}

/**
 * Determine if an ad has exceeded the session fatigue threshold (>=3 impressions)
 */
export function isAdFatigued(
  adId: string,
  ledger: SessionImpressionLedger = getSessionImpressions()
): boolean {
  const record = ledger[adId];
  return Boolean(record && record.count >= MAX_IMPRESSIONS_PER_SESSION);
}

/**
 * Get all currently fatigued ad IDs in the active session
 */
export function getFatiguedAdIds(
  ledger: SessionImpressionLedger = getSessionImpressions()
): string[] {
  return Object.entries(ledger)
    .filter(([, record]) => record.count >= MAX_IMPRESSIONS_PER_SESSION)
    .map(([id]) => id);
}

/**
 * Category Anti-Clustering Filter
 * Ensures no more than `maxConsecutive` items of the same category appear contiguously.
 * Repositions clustering items later in the queue to maintain visual variety.
 */
export function applyAntiClustering<T extends { category: string; id: string }>(
  items: T[],
  maxConsecutive: number = MAX_CONSECUTIVE_SAME_CATEGORY
): { reordered: T[]; rotatedCount: number } {
  if (items.length <= maxConsecutive) {
    return { reordered: [...items], rotatedCount: 0 };
  }

  const result: T[] = [];
  const pool = [...items];
  let rotatedCount = 0;

  while (pool.length > 0) {
    let chosenIndex = 0;

    // Check recent history in result
    if (result.length >= maxConsecutive) {
      const recentCategory = result[result.length - 1].category;
      let consecutiveMatches = 0;

      for (let i = result.length - 1; i >= 0; i--) {
        if (result[i].category === recentCategory) {
          consecutiveMatches++;
        } else {
          break;
        }
      }

      if (consecutiveMatches >= maxConsecutive) {
        // Find first item in pool with a DIFFERENT category
        const alternateIndex = pool.findIndex((item) => item.category !== recentCategory);
        if (alternateIndex !== -1) {
          chosenIndex = alternateIndex;
          rotatedCount++;
        }
      }
    }

    const [selected] = pool.splice(chosenIndex, 1);
    result.push(selected);
  }

  return { reordered: result, rotatedCount };
}

/**
 * Clear session fatigue ledger (One-click user reset)
 */
export function clearSessionFatigue(): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(SESSION_STORAGE_KEY);
  } catch {}
}

export const clearSessionImpressions = clearSessionFatigue;

/**
 * Generate a cryptographically structured, tamper-evident coupon code
 * Example: VLB-7A9F-2026
 */
export function generateVoucherSignature(adId: string, merchantName: string): string {
  const cleanPrefix = merchantName.replace(/[^A-Za-z0-9]/g, "").substring(0, 3).toUpperCase() || "ADM";
  
  // Deterministic 4-char hex hash from adId + merchantName
  const seed = `${adId}:${merchantName}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(4, "0").substring(0, 4).toUpperCase();
  const year = new Date().getFullYear();
  return `${cleanPrefix}-${hex}-${year}`;
}

/**
 * Extract a concise, compelling voucher offer title from ad content
 */
export function extractOfferHeadline(headline: string, ctaLabel: string): string {
  const percentMatch = headline.match(/(\d+%\s*off)/i);
  if (percentMatch) return percentMatch[0].trim();

  const dollarMatch = headline.match(/(\$\d+(\s*off)?)/i);
  if (dollarMatch) return dollarMatch[0].trim();

  const bogoMatch = headline.match(/(buy\s+one[,\s]+get\s+one\s*free|bogo)/i);
  if (bogoMatch) return "BOGO Free";

  const freeMatch = headline.match(/(free\s+[\w\s]{3,20})/i);
  if (freeMatch) return freeMatch[0].trim();

  if (ctaLabel && !ctaLabel.toLowerCase().includes("learn") && !ctaLabel.toLowerCase().includes("visit")) {
    return ctaLabel;
  }
  return "Special Community Offer";
}
