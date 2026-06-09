import { describe, it, expect, vi } from 'vitest';
import { normalizeLocale, getClientActiveCatalog } from '../../src/lib/i18n/client';
import canonicalCatalog from '../../src/lib/i18n/catalog.en-US.json';
import spanishCatalog from '../../src/lib/i18n/catalog.es-PR.json';

// Minimal implementation matching t() from UserContext.tsx for unit testing interpolation logic
function interpolate(msg: string, variables: Record<string, any> = {}): string {
  return msg.replace(/\{([A-Za-z0-9_]+)\}/g, (match, name) => {
    return name in variables ? String(variables[name]) : match;
  });
}

describe('Frontend Translation Integration Tests', () => {
  describe('1. Locale Normalization', () => {
    it('should normalize shorthand and lowercase locales correctly', () => {
      expect(normalizeLocale('en')).toBe('en-US');
      expect(normalizeLocale('es')).toBe('es-PR'); // Default es to es-PR for app context
      expect(normalizeLocale('en-us')).toBe('en-US');
      expect(normalizeLocale('es-pr')).toBe('es-PR');
      expect(normalizeLocale('fr-fr')).toBe('fr-FR');
    });

    it('should fallback to en-US for empty or undefined locales', () => {
      expect(normalizeLocale('')).toBe('en-US');
      expect(normalizeLocale(null as any)).toBe('en-US');
    });
  });

  describe('2. Catalog Retrieval & Offline Fallbacks', () => {
    it('should return English canonical catalog for en-US', async () => {
      const catalog = await getClientActiveCatalog('en-US');
      expect(catalog.app_name).toBe('AdMe');
      expect(catalog.welcome_message).toBe('Welcome back, {name}!');
    });

    it('should return Spanish catalog for es-PR as default local/offline fallback', async () => {
      // Mock global fetch to reject, forcing fallback to local offline catalog.es-PR.json
      const spy = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network offline'));

      try {
        const catalog = await getClientActiveCatalog('es-PR');
        expect(catalog.app_name).toBe('AdMe');
        expect(catalog.welcome_message).toBe('¡Bienvenido de nuevo, {name}!');
        expect(catalog.feed_disabled).toBe('Las colocaciones en el feed están desactivadas en tus Controles de Anuncios.');
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('3. Variable Interpolation & Parameter Swapping', () => {
    it('should correctly replace parameters in the English catalog', () => {
      const rawMsg = canonicalCatalog.welcome_message;
      const result = interpolate(rawMsg, { name: 'Sarah' });
      expect(result).toBe('Welcome back, Sarah!');
    });

    it('should correctly replace parameters in the Spanish catalog', () => {
      const rawMsg = spanishCatalog.welcome_message;
      const result = interpolate(rawMsg, { name: 'Elena' });
      expect(result).toBe('¡Bienvenido de nuevo, Elena!');
    });

    it('should handle missing variables by returning the original placeholder', () => {
      const rawMsg = canonicalCatalog.welcome_message;
      const result = interpolate(rawMsg, {});
      expect(result).toBe('Welcome back, {name}!');
    });
  });

  describe('4. Translation Catalog Parity', () => {
    it('should ensure the Spanish catalog mirrors every key in the English catalog', () => {
      const englishKeys = Object.keys(canonicalCatalog);
      const spanishKeys = Object.keys(spanishCatalog);

      // Verify that no keys are missing in Spanish
      englishKeys.forEach((key) => {
        expect(spanishKeys).toContain(key);
      });
    });

    it('should ensure every key in the Spanish catalog matches a key in the English catalog', () => {
      const englishKeys = Object.keys(canonicalCatalog);
      const spanishKeys = Object.keys(spanishCatalog);

      // Verify that there are no extra keys in Spanish
      spanishKeys.forEach((key) => {
        expect(englishKeys).toContain(key);
      });
    });
  });
});
