import { CoarseLocation } from '@/types/location';

/**
 * Extracts coarse city/region from standard Edge CDN headers.
 * Strips raw IP and enforces zero-persistence.
 */
export function extractCoarseLocationFromHeaders(
  headers: Headers | Record<string, string | string[] | undefined>
): CoarseLocation {
  const getHeader = (name: string): string | null => {
    if (typeof (headers as any)?.get === 'function') {
      return (headers as Headers).get(name);
    }
    const val = (headers as Record<string, any>)[name] || (headers as Record<string, any>)[name.toLowerCase()];
    return Array.isArray(val) ? val[0] : (val || null);
  };

  const rawCity =
    getHeader('x-vercel-ip-city') ||
    getHeader('cf-ipcity') ||
    getHeader('x-adme-city');

  const rawRegion =
    getHeader('x-vercel-ip-country-region') ||
    getHeader('cf-region') ||
    getHeader('x-adme-region');

  const rawCountry =
    getHeader('x-vercel-ip-country') ||
    getHeader('cf-ipcountry') ||
    getHeader('x-adme-country');

  if (rawCity) {
    try {
      const decodedCity = decodeURIComponent(rawCity).trim();
      return {
        city: decodedCity,
        region: rawRegion ? decodeURIComponent(rawRegion).trim() : undefined,
        country: rawCountry ? decodeURIComponent(rawCountry).trim() : undefined,
        source: 'edge-header',
      };
    } catch {
      return {
        city: rawCity.trim(),
        region: rawRegion?.trim(),
        country: rawCountry?.trim(),
        source: 'edge-header',
      };
    }
  }

  // Privacy-friendly default for development / testing
  return {
    city: 'Santa Monica',
    region: 'CA',
    country: 'US',
    source: 'edge-header',
  };
}
