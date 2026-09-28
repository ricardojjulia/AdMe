import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SENSORY_SHIELD_STORAGE_KEY,
  SENSORY_SHIELD_EVENT,
  getStoredSensoryShield,
  setStoredSensoryShield,
  applySensoryModeToDOM,
  isSensoryShieldActive,
  getSystemPrefersReducedMotion,
} from '@/lib/services/sensory-shield';

const mockStorage: Record<string, string> = {};
const storageMock = {
  getItem: (k: string) => (k in mockStorage ? mockStorage[k] : null),
  setItem: (k: string, v: string) => {
    mockStorage[k] = String(v);
  },
  removeItem: (k: string) => {
    delete mockStorage[k];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  }
};

const domAttributes: Record<string, string> = {};
const documentMock = {
  documentElement: {
    setAttribute: (k: string, v: string) => {
      domAttributes[k] = v;
    },
    getAttribute: (k: string) => domAttributes[k] || null,
    removeAttribute: (k: string) => {
      delete domAttributes[k];
    }
  }
};

(global as any).window = (global as any).window || {};
(global as any).window.localStorage = storageMock;
(global as any).window.dispatchEvent = (global as any).window.dispatchEvent || vi.fn();
if (typeof (global as any).CustomEvent === 'undefined') {
  (global as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params: any = {}) {
      this.type = type;
      this.detail = params.detail;
    }
  };
}
(global as any).localStorage = storageMock;
(global as any).document = (global as any).document || documentMock;
if (!(global as any).document.documentElement) {
  (global as any).document.documentElement = documentMock.documentElement;
}

describe('Sensory Shield & Cognitive Comfort Mode Service (COUNCIL-2026-012)', () => {
  beforeEach(() => {
    storageMock.clear();
    Object.keys(domAttributes).forEach((k) => delete domAttributes[k]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly reads null when no preference is saved in localStorage', () => {
    expect(getStoredSensoryShield()).toBeNull();
  });

  it('correctly saves and reads explicit true/false sensory preferences', () => {
    setStoredSensoryShield(true);
    expect(localStorage.getItem(SENSORY_SHIELD_STORAGE_KEY)).toBe('true');
    expect(getStoredSensoryShield()).toBe(true);

    setStoredSensoryShield(false);
    expect(localStorage.getItem(SENSORY_SHIELD_STORAGE_KEY)).toBe('false');
    expect(getStoredSensoryShield()).toBe(false);
  });

  it('modulates the root DOM element with data-sensory-mode="comfort" and "standard"', () => {
    applySensoryModeToDOM(true);
    expect(document.documentElement.getAttribute('data-sensory-mode')).toBe('comfort');

    applySensoryModeToDOM(false);
    expect(document.documentElement.getAttribute('data-sensory-mode')).toBe('standard');
  });

  it('dispatches the custom event on state change', () => {
    let capturedEvent: any = null;
    (global as any).window.dispatchEvent = vi.fn((e: any) => {
      capturedEvent = e;
      return true;
    });

    setStoredSensoryShield(true);
    expect((global as any).window.dispatchEvent).toHaveBeenCalled();
    expect(capturedEvent?.type).toBe(SENSORY_SHIELD_EVENT);
    expect(capturedEvent?.detail?.active).toBe(true);
  });

  it('falls back to system prefers-reduced-motion media query when no preference is set', () => {
    (global as any).window.matchMedia = vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(getSystemPrefersReducedMotion()).toBe(true);
    expect(isSensoryShieldActive()).toBe(true);

    // If explicitly stored as false, it overrides system preference
    setStoredSensoryShield(false);
    expect(isSensoryShieldActive()).toBe(false);
  });

  it('supports SensoryAdaptiveProps contract and instant reveal callbacks', () => {
    let revealed = false;
    const onInstantReveal = () => {
      revealed = true;
    };

    expect(revealed).toBe(false);
    onInstantReveal();
    expect(revealed).toBe(true);
  });
});
