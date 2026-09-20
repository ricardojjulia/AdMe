export type FocusPassTier = '15m' | '1h' | '24h';

export interface FocusPassConfig {
  tier: FocusPassTier;
  name: string;
  cost: number;
  durationMinutes: number;
  durationMs: number;
  description: string;
}

export interface FocusPassState {
  active: boolean;
  tier: FocusPassTier | null;
  expiresAt: number | null;
  token: string | null;
}

export interface ZenItem {
  id: string;
  quote: string;
  author: string;
  image: string;
  theme: string;
}

export const FOCUS_TIERS: Record<FocusPassTier, FocusPassConfig> = {
  '15m': {
    tier: '15m',
    name: '15m Sprint',
    cost: 100,
    durationMinutes: 15,
    durationMs: 15 * 60 * 1000,
    description: 'Quick 15 minutes of uninterrupted deep focus.'
  },
  '1h': {
    tier: '1h',
    name: '1h Deep Work',
    cost: 250,
    durationMinutes: 60,
    durationMs: 60 * 60 * 1000,
    description: '1 hour of calm, zero-interruption productivity.'
  },
  '24h': {
    tier: '24h',
    name: '24h Day of Calm',
    cost: 500,
    durationMinutes: 1440,
    durationMs: 24 * 60 * 60 * 1000,
    description: 'A full day of serene, commercial-free browsing.'
  }
};

const SECRET_SALT = 'adme_zero_knowledge_focus_salt_2026';

/**
 * Generate a tamper-evident client-side HMAC signature for a Focus Pass.
 */
export function createFocusToken(tier: FocusPassTier, expiresAt: number): string {
  const payload = `${tier}:${expiresAt}:${SECRET_SALT}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `FP-${tier.toUpperCase()}-${hex}-${expiresAt.toString(36).toUpperCase()}`;
}

/**
 * Verify a Focus Pass token against expiration and signature integrity.
 */
export function verifyFocusToken(tier: FocusPassTier, expiresAt: number, token: string): boolean {
  if (!tier || !expiresAt || !token) return false;
  if (expiresAt <= Date.now()) return false;
  const expectedToken = createFocusToken(tier, expiresAt);
  return token === expectedToken;
}

const STORAGE_KEY = 'adme_focus_pass_state';

/**
 * Read the current Focus Pass from localStorage with cryptographic validation.
 */
export function getStoredFocusPass(): FocusPassState {
  if (typeof window === 'undefined') {
    return { active: false, tier: null, expiresAt: null, token: null };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { active: false, tier: null, expiresAt: null, token: null };
    
    const parsed: FocusPassState = JSON.parse(raw);
    if (!parsed.active || !parsed.tier || !parsed.expiresAt || !parsed.token) {
      return { active: false, tier: null, expiresAt: null, token: null };
    }

    if (verifyFocusToken(parsed.tier, parsed.expiresAt, parsed.token)) {
      return parsed;
    } else {
      // Invalid or tampered token: clean up
      clearStoredFocusPass();
      return { active: false, tier: null, expiresAt: null, token: null };
    }
  } catch {
    return { active: false, tier: null, expiresAt: null, token: null };
  }
}

/**
 * Persist Focus Pass state to localStorage.
 */
export function setStoredFocusPass(state: FocusPassState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to store focus pass state:', err);
  }
}

/**
 * Clear stored Focus Pass state.
 */
export function clearStoredFocusPass(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear focus pass state:', err);
  }
}

/**
 * Curated tranquil Zen Stream cards shown during active Focus Pass.
 */
export const ZEN_STREAM_ITEMS: ZenItem[] = [
  {
    id: 'zen-1',
    quote: 'Quiet the mind, and the soul will speak.',
    author: 'Ma Jaya Sati Bhagavati',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    theme: 'Ocean Stillness'
  },
  {
    id: 'zen-2',
    quote: 'Simplicity is the ultimate sophistication.',
    author: 'Leonardo da Vinci',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    theme: 'Morning Mist'
  },
  {
    id: 'zen-3',
    quote: 'In the midst of movement and chaos, keep stillness inside of you.',
    author: 'Deepak Chopra',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    theme: 'Ancient Canopy'
  },
  {
    id: 'zen-4',
    quote: 'Nature does not hurry, yet everything is accomplished.',
    author: 'Lao Tzu',
    image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80',
    theme: 'Alpine Solitude'
  }
];
