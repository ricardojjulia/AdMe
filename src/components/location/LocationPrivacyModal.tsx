"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/UserContext';
import { LocationPrivacyMode } from '@/types/location';
import styles from './LocationPrivacyModal.module.css';

interface LocationPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_CITIES = [
  { city: 'Santa Monica', region: 'CA' },
  { city: 'San Juan', region: 'PR' },
  { city: 'New York', region: 'NY' },
  { city: 'Austin', region: 'TX' },
  { city: 'London', region: 'UK' },
  { city: 'Tokyo', region: 'JP' },
];

export function LocationPrivacyModal({ isOpen, onClose }: LocationPrivacyModalProps) {
  const { locationState, setLocationMode, setManualCity, clearLocation } = useUser();
  const [customCity, setCustomCity] = useState('');
  const [customRegion, setCustomRegion] = useState('');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentMode = locationState.privacyMode;
  const currentCity = locationState.coarseLocation?.city;
  const currentRegion = locationState.coarseLocation?.region;
  const hasQuantizedCoords = !!locationState.quantizedCoordinates;

  const handleModeSelect = (mode: LocationPrivacyMode) => {
    setLocationMode(mode);
  };

  const handleChipSelect = (city: string, region: string) => {
    setManualCity(city, region);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCity.trim()) {
      setManualCity(customCity.trim(), customRegion.trim() || undefined);
      setCustomCity('');
      setCustomRegion('');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="location-modal-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 id="location-modal-title" className={styles.title}>
              🛡️ Location Privacy Controls
            </h2>
            <div className={styles.subtitle}>
              Zero-Knowledge Architecture · Council Decision COUNCIL-2026-004
            </div>
          </div>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Current Status Box */}
        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <span>Active Proximity Context</span>
            <span className={styles.modeBadge}>
              {currentMode === 'disabled' ? 'Disabled' : 'Evaluated On-Device'}
            </span>
          </div>
          <div className={styles.statusText}>
            {currentMode === 'disabled' ? (
              '🌐 Global (No Location Used)'
            ) : currentCity ? (
              `📍 ${currentCity}${currentRegion ? `, ${currentRegion}` : ''}`
            ) : (
              '📍 Coarse City Detection Active'
            )}
          </div>
          <div className={styles.statusSub}>
            <span>🔒 Zero Cloud Persistence</span>
            <span>·</span>
            <span>
              {hasQuantizedCoords
                ? `Fuzzed to ~${locationState.quantizedCoordinates?.precisionKm}km grid in browser memory`
                : 'Coarse city metadata only'}
            </span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className={styles.sectionTitle}>Select Privacy Level</div>
        <div className={styles.modesList}>
          {/* Mode 1: Edge Baseline */}
          <label
            className={`${styles.modeOption} ${
              currentMode === 'coarse-edge' ? styles.modeOptionActive : ''
            }`}
          >
            <input
              type="radio"
              name="locationMode"
              checked={currentMode === 'coarse-edge'}
              onChange={() => handleModeSelect('coarse-edge')}
              className={styles.modeRadio}
            />
            <div className={styles.modeContent}>
              <div className={styles.modeTitle}>
                <span>Coarse Edge Baseline</span>
                <span className={styles.modeBadge}>Recommended</span>
              </div>
              <div className={styles.modeDesc}>
                Detects general city passively via Edge CDN headers. Requires NO browser GPS sensor access or permission prompts.
              </div>
            </div>
          </label>

          {/* Mode 2: Fuzzed Neighborhood */}
          <label
            className={`${styles.modeOption} ${
              currentMode === 'fuzzed-neighborhood' ? styles.modeOptionActive : ''
            }`}
          >
            <input
              type="radio"
              name="locationMode"
              checked={currentMode === 'fuzzed-neighborhood'}
              onChange={() => handleModeSelect('fuzzed-neighborhood')}
              className={styles.modeRadio}
            />
            <div className={styles.modeContent}>
              <div className={styles.modeTitle}>
                <span>Neighborhood Proximity Grid</span>
                <span className={styles.modeBadge}>~1.1km Fuzzed</span>
              </div>
              <div className={styles.modeDesc}>
                Coordinates are synchronously rounded to 2 decimals on-device. Raw GPS is immediately discarded. Proximity to local deals is evaluated in client memory.
              </div>
            </div>
          </label>

          {/* Mode 3: Manual City Selection */}
          <label
            className={`${styles.modeOption} ${
              currentMode === 'manual' ? styles.modeOptionActive : ''
            }`}
          >
            <input
              type="radio"
              name="locationMode"
              checked={currentMode === 'manual'}
              onChange={() => handleModeSelect('manual')}
              className={styles.modeRadio}
            />
            <div className={styles.modeContent}>
              <div className={styles.modeTitle}>
                <span>Manual City Override</span>
              </div>
              <div className={styles.modeDesc}>
                Choose your city or region manually. No device location is queried.
              </div>
            </div>
          </label>

          {/* Mode 4: Disabled */}
          <label
            className={`${styles.modeOption} ${
              currentMode === 'disabled' ? styles.modeOptionActive : ''
            }`}
          >
            <input
              type="radio"
              name="locationMode"
              checked={currentMode === 'disabled'}
              onChange={() => handleModeSelect('disabled')}
              className={styles.modeRadio}
            />
            <div className={styles.modeContent}>
              <div className={styles.modeTitle}>
                <span>Completely Disabled</span>
              </div>
              <div className={styles.modeDesc}>
                Disables all geographical personalization. You will see global/national content without location sorting.
              </div>
            </div>
          </label>
        </div>

        {/* Manual City Picker (visible when manual or quick switching) */}
        <div className={styles.manualInputSection}>
          <div className={styles.sectionTitle} style={{ fontSize: '0.85rem' }}>
            Quick City Selector
          </div>
          <div className={styles.cityChips}>
            {POPULAR_CITIES.map((c) => (
              <button
                key={c.city}
                type="button"
                onClick={() => handleChipSelect(c.city, c.region)}
                className={`${styles.chip} ${
                  currentCity?.toLowerCase() === c.city.toLowerCase()
                    ? styles.chipActive
                    : ''
                }`}
              >
                {c.city}, {c.region}
              </button>
            ))}
          </div>

          <form onSubmit={handleApplyCustom} className={styles.customInputRow}>
            <input
              type="text"
              placeholder="City (e.g. Miami)"
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
              className={styles.cityInput}
            />
            <input
              type="text"
              placeholder="State/Country (e.g. FL)"
              value={customRegion}
              onChange={(e) => setCustomRegion(e.target.value)}
              className={styles.cityInput}
              style={{ maxWidth: '120px' }}
            />
            <button type="submit" className={styles.applyBtn}>
              Set
            </button>
          </form>
        </div>

        {/* Technical Guarantee Box */}
        <div className={styles.guaranteeBox}>
          <strong>🛡️ AdMe Privacy Mandate:</strong> Your coordinates are NEVER sent to our database or logged in telemetry. In-memory proximity matching runs entirely on your device using client-side Haversine math.
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={() => {
              clearLocation();
            }}
            className={styles.clearBtn}
          >
            Clear / Disable Location
          </button>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
