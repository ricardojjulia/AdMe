/**
 * Type definitions for Privacy-Preserving Location & Proximity Matching.
 * Ratified by Architecture Council Decision Record: COUNCIL-2026-004.
 */

export type LocationPrivacyMode =
  | 'coarse-edge'
  | 'fuzzed-neighborhood'
  | 'manual'
  | 'disabled';

export type LocationSource =
  | 'edge-header'
  | 'device-fuzzed'
  | 'manual'
  | 'disabled';

export interface CoarseLocation {
  city: string;
  region?: string;
  country?: string;
  source: LocationSource;
}

export interface QuantizedCoordinates {
  lat: number;
  lng: number;
  precisionKm: number; // Approximate grid resolution in km (e.g. 1.11km for 2 decimal places)
  timestamp: number;
}

export interface LocationState {
  privacyMode: LocationPrivacyMode;
  coarseLocation: CoarseLocation | null;
  quantizedCoordinates: QuantizedCoordinates | null;
  isEvaluatingOnDevice: boolean;
  lastUpdated: string | null;
}

export interface LocalDealProximity {
  distanceKm: number;
  isWithinProximity: boolean;
  label: string;
}
