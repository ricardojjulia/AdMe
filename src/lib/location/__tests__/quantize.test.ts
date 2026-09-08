import { describe, it, expect } from 'vitest';
import {
  clampCoordinates,
  quantizeCoordinates,
  calculateHaversineDistanceKm,
  isWithinRadius,
} from '../quantize';
import {
  sanitizeTelemetryPayload,
  hasSensitiveLocationData,
} from '../redaction';
import { extractCoarseLocationFromHeaders } from '../edge';

describe('Privacy Location Quantization (COUNCIL-2026-004 Amendment #2)', () => {
  it('synchronously truncates raw coordinates to 2 decimal places (~1.1km grid)', () => {
    // Exact GPS: 34.019454, -118.491191 (Santa Monica Pier)
    const quantized = quantizeCoordinates(34.019454, -118.491191, 2);

    expect(quantized).not.toBeNull();
    expect(quantized!.lat).toBe(34.02);
    expect(quantized!.lng).toBe(-118.49);
    expect(quantized!.precisionKm).toBeCloseTo(1.11, 1);
  });

  it('caps decimal precision to maximum 2 decimal places even if higher is requested', () => {
    const quantized = quantizeCoordinates(34.1234567, -118.9876543, 6);
    expect(quantized!.lat).toBe(34.12);
    expect(quantized!.lng).toBe(-118.99);
  });

  it('safely clamps out-of-bounds latitudes and wraps longitudes', () => {
    const clamped = clampCoordinates(95.5, -190);
    expect(clamped.lat).toBe(90);
    expect(clamped.lng).toBe(170); // wrapped -190 -> 170

    const clamped2 = clampCoordinates(-105, 200);
    expect(clamped2.lat).toBe(-90);
    expect(clamped2.lng).toBe(-160); // wrapped 200 -> -160
  });

  it('returns null for non-numeric or NaN inputs', () => {
    expect(quantizeCoordinates(NaN, -118.49)).toBeNull();
    expect(quantizeCoordinates(34.01, NaN)).toBeNull();
    expect(quantizeCoordinates('34.01' as any, -118.49)).toBeNull();
  });
});

describe('Client-Side Haversine Distance & Proximity', () => {
  it('accurately calculates distance between known points in kilometers', () => {
    // Santa Monica (34.02, -118.49) to Downtown LA (34.05, -118.24)
    const distance = calculateHaversineDistanceKm(34.02, -118.49, 34.05, -118.24);
    // Real-world distance is ~23 km
    expect(distance).toBeGreaterThan(20);
    expect(distance).toBeLessThan(26);
  });

  it('returns 0 km for identical points', () => {
    const distance = calculateHaversineDistanceKm(34.02, -118.49, 34.02, -118.49);
    expect(distance).toBe(0);
  });

  it('is symmetric: distance(A, B) === distance(B, A)', () => {
    const dist1 = calculateHaversineDistanceKm(34.02, -118.49, 34.05, -118.24);
    const dist2 = calculateHaversineDistanceKm(34.05, -118.24, 34.02, -118.49);
    expect(dist1).toBe(dist2);
  });

  it('correctly evaluates isWithinRadius', () => {
    expect(isWithinRadius(34.02, -118.49, 34.05, -118.24, 30)).toBe(true);
    expect(isWithinRadius(34.02, -118.49, 34.05, -118.24, 15)).toBe(false);
  });
});

describe('Strict Zero-Telemetry Rule (COUNCIL-2026-004 Amendment #1)', () => {
  it('strips coordinates and IP addresses from telemetry payloads', () => {
    const sensitivePayload = {
      event: 'deal_view',
      userId: 'user-123',
      lat: 34.0194,
      lng: -118.4912,
      raw_ip: '192.168.1.1',
      metadata: {
        gps: { latitude: 34.0194, longitude: -118.4912 },
        other: 'safe_value',
      },
    };

    expect(hasSensitiveLocationData(sensitivePayload)).toBe(true);

    const sanitized = sanitizeTelemetryPayload(sensitivePayload);
    expect(sanitized.lat).toBe('[REDACTED_PRIVACY_COUNCIL_004]');
    expect(sanitized.lng).toBe('[REDACTED_PRIVACY_COUNCIL_004]');
    expect(sanitized.raw_ip).toBe('[REDACTED_PRIVACY_COUNCIL_004]');
    expect(sanitized.metadata.gps).toBe('[REDACTED_PRIVACY_COUNCIL_004]');
    expect(sanitized.metadata.other).toBe('safe_value');
    expect(hasSensitiveLocationData(sanitized)).toBe(false);
  });
});

describe('Edge Coarse Location Extraction (COUNCIL-2026-004)', () => {
  it('extracts city and region from standard Vercel CDN headers', () => {
    const headers = new Headers();
    headers.set('x-vercel-ip-city', 'San%20Francisco');
    headers.set('x-vercel-ip-country-region', 'CA');
    headers.set('x-vercel-ip-country', 'US');

    const result = extractCoarseLocationFromHeaders(headers);
    expect(result.city).toBe('San Francisco');
    expect(result.region).toBe('CA');
    expect(result.country).toBe('US');
    expect(result.source).toBe('edge-header');
  });

  it('provides safe fallback when CDN headers are absent in local development', () => {
    const headers = new Headers();
    const result = extractCoarseLocationFromHeaders(headers);
    expect(result.city).toBe('Santa Monica');
    expect(result.region).toBe('CA');
    expect(result.source).toBe('edge-header');
  });
});
