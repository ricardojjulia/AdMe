/**
 * Sensory Shield & Cognitive Comfort Mode Service
 * Ratified in COUNCIL-2026-012
 * 
 * Provides pure, zero-tracking client-side utilities for managing
 * reduced-motion and low-stimulus sensory preferences.
 */

export const SENSORY_SHIELD_STORAGE_KEY = 'adme_sensory_shield_v1';
export const SENSORY_SHIELD_EVENT = 'adme:sensory-shield-change';

export type SensoryMode = 'standard' | 'comfort';

/**
 * Checks system-level accessibility settings for reduced motion.
 */
export function getSystemPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reads explicitly stored sensory shield preference from localStorage.
 * Returns null if the user hasn't explicitly set a preference.
 */
export function getStoredSensoryShield(): boolean | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const val = localStorage.getItem(SENSORY_SHIELD_STORAGE_KEY);
    if (val === 'true') return true;
    if (val === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

/**
 * Computes whether the sensory shield should currently be active.
 * Defaults to system preference (prefers-reduced-motion) if no explicit choice was saved.
 */
export function isSensoryShieldActive(): boolean {
  const stored = getStoredSensoryShield();
  if (stored !== null) {
    return stored;
  }
  return getSystemPrefersReducedMotion();
}

/**
 * Modulates the root DOM element attribute data-sensory-mode.
 */
export function applySensoryModeToDOM(active: boolean): void {
  if (typeof document === 'undefined') {
    return;
  }
  const mode: SensoryMode = active ? 'comfort' : 'standard';
  document.documentElement.setAttribute('data-sensory-mode', mode);
}

/**
 * Sets explicit sensory shield preference, updates DOM, and emits local change event.
 */
export function setStoredSensoryShield(active: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(SENSORY_SHIELD_STORAGE_KEY, active ? 'true' : 'false');
  } catch {
    // Non-blocking storage exception
  }
  applySensoryModeToDOM(active);
  if (typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(SENSORY_SHIELD_EVENT, { detail: { active } })
    );
  }
}
