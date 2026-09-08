"use client";

import React, { useState } from 'react';
import { useUser } from '@/lib/UserContext';
import { LocationPrivacyModal } from './LocationPrivacyModal';
import styles from './LocationBadge.module.css';

interface LocationBadgeProps {
  className?: string;
  compact?: boolean;
}

export function LocationBadge({ className = '', compact = false }: LocationBadgeProps) {
  const { locationState } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { privacyMode, coarseLocation, quantizedCoordinates } = locationState;
  const isEnabled = privacyMode !== 'disabled';
  const city = coarseLocation?.city;
  const region = coarseLocation?.region;

  let label = 'Global Feed';
  let subLabel = 'Location Off';

  if (isEnabled) {
    if (privacyMode === 'fuzzed-neighborhood' && quantizedCoordinates) {
      label = city ? `${city} (~1km grid)` : 'Neighborhood Grid';
      subLabel = 'Evaluated on-device';
    } else if (privacyMode === 'manual') {
      label = city ? `${city}${region ? `, ${region}` : ''}` : 'Custom City';
      subLabel = 'Manual Override';
    } else {
      // Coarse edge
      label = city ? `${city}${region ? `, ${region}` : ''}` : 'Local Metro';
      subLabel = 'Evaluated on-device';
    }
  }

  return (
    <>
      <div className={`${styles.badgeWrapper} ${className}`}>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`${styles.badge} ${!isEnabled ? styles.badgeDisabled : ''}`}
          title={`AdMe Zero-Knowledge Location (${subLabel}) — Click to customize`}
          aria-label="Location privacy settings"
        >
          <span
            className={isEnabled ? styles.pulseDot : styles.pulseDotDisabled}
            aria-hidden="true"
          />
          <span className={styles.icon} aria-hidden="true">
            {privacyMode === 'disabled' ? '🌐' : '📍'}
          </span>
          <span className={styles.locationText}>{label}</span>
          {!compact && (
            <>
              <span className={styles.divider}>·</span>
              <span className={styles.privacyLabel}>
                {isEnabled ? 'Zero tracking' : 'Disabled'}
              </span>
            </>
          )}
        </button>
      </div>

      <LocationPrivacyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
