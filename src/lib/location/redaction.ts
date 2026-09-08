/**
 * Telemetry and logger redaction utilities.
 *
 * Implements Binding Amendment #1 of COUNCIL-2026-004:
 * Lat/lng coordinates and raw IP addresses must be added to telemetry/logger
 * redaction lists to prevent accidental ingestion in observability tools.
 */

const REDACTED_KEYS = new Set([
  'lat',
  'latitude',
  'lng',
  'longitude',
  'coords',
  'coordinates',
  'raw_ip',
  'ip',
  'client_ip',
  'x-forwarded-for',
  'x-real-ip',
  'user_location',
  'gps',
]);

const REDACTED_VALUE = '[REDACTED_PRIVACY_COUNCIL_004]';

/**
 * Recursively redacts sensitive location coordinates and IP addresses from
 * any payload before sending to logging or analytics.
 */
export function sanitizeTelemetryPayload<T>(payload: T): T {
  if (payload === null || payload === undefined) {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map(item => sanitizeTelemetryPayload(item)) as unknown as T;
  }

  if (typeof payload === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (REDACTED_KEYS.has(key.toLowerCase())) {
        sanitized[key] = REDACTED_VALUE;
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeTelemetryPayload(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized as T;
  }

  return payload;
}

/**
 * Checks whether an object contains any unredacted location/GPS keys.
 */
export function hasSensitiveLocationData(obj: Record<string, any>): boolean {
  if (!obj || typeof obj !== 'object') return false;

  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      if (value !== REDACTED_VALUE) return true;
    }
    if (typeof value === 'object' && value !== null) {
      if (hasSensitiveLocationData(value)) return true;
    }
  }

  return false;
}
