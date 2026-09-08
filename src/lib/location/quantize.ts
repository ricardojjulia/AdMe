/**
 * Pure mathematical functions for privacy-preserving coordinate quantization
 * and client-side proximity calculation.
 *
 * Implements Binding Amendment #2 of COUNCIL-2026-004:
 * Quantization must occur synchronously in the browser before any state dispatch,
 * capping precision at 2 decimal places (~1.11km at the equator).
 */

import { QuantizedCoordinates } from '@/types/location';

/**
 * Clamps latitude within [-90, 90] and longitude within [-180, 180].
 */
export function clampCoordinates(lat: number, lng: number): { lat: number; lng: number } {
  const clampedLat = Math.max(-90, Math.min(90, lat));
  // Wrap longitude to [-180, 180]
  let wrappedLng = lng % 360;
  if (wrappedLng > 180) wrappedLng -= 360;
  if (wrappedLng < -180) wrappedLng += 360;
  return { lat: clampedLat, lng: wrappedLng };
}

/**
 * Synchronously quantizes raw GPS coordinates to a coarse neighborhood-level grid.
 * Raw coordinates are never stored or leaked.
 *
 * 2 decimal places = ~1.11km resolution at the equator.
 */
export function quantizeCoordinates(
  lat: number,
  lng: number,
  decimals: number = 2
): QuantizedCoordinates | null {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  const { lat: clampedLat, lng: clampedLng } = clampCoordinates(lat, lng);

  // Enforce council constraint: maximum 2 decimal places precision (~1.11km)
  const cappedDecimals = Math.min(2, Math.max(0, Math.floor(decimals)));
  const factor = Math.pow(10, cappedDecimals);

  const quantizedLat = Math.round(clampedLat * factor) / factor;
  const quantizedLng = Math.round(clampedLng * factor) / factor;

  // Approximate km resolution: 1 degree latitude ~ 111.32 km
  const precisionKm = Math.round(111.32 * Math.pow(10, -cappedDecimals) * 100) / 100;

  return {
    lat: quantizedLat,
    lng: quantizedLng,
    precisionKm,
    timestamp: Date.now(),
  };
}

/**
 * Haversine formula to compute great-circle distance between two points on Earth in km.
 * Executed 100% on the client device.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number' || isNaN(v))) {
    return Infinity;
  }

  const R = 6371; // Earth's radius in kilometers
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Checks whether an item coordinate is within a proximity radius of the user's
 * quantized coordinates on-device.
 */
export function isWithinRadius(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  radiusKm: number = 15
): boolean {
  const dist = calculateHaversineDistanceKm(userLat, userLng, targetLat, targetLng);
  return dist <= radiusKm;
}
