"use client";

import { useState } from 'react';
import { useUser } from '@/lib/UserContext';
import { useToast } from '@/lib/ToastContext';
import { useCommunityImpact } from '@/lib/hooks/useCommunityImpact';
import {
  COMMUNITY_CAUSES_REGISTRY,
  CommunityCause,
  getCauseById,
} from '@/lib/services/community-impact';
import styles from './CommunityImpactBadge.module.css';

interface CommunityImpactBadgeProps {
  causeId?: string;
  advertiserName?: string;
  category?: string;
}

export function CommunityImpactBadge({
  causeId,
  advertiserName,
  category,
}: CommunityImpactBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, locale, t, addReward } = useUser();
  const { addToast } = useToast();
  const { contributePoints } = useCommunityImpact();

  // Determine cause based on ID or advertiser mapping
  let activeCause: CommunityCause = COMMUNITY_CAUSES_REGISTRY[0];
  if (causeId) {
    activeCause = getCauseById(causeId) || activeCause;
  } else if (advertiserName === 'Valor Brews') {
    activeCause = getCauseById('neighborhood-meals') || activeCause;
  } else if (advertiserName === 'CyberPulse Security' || category === 'Technology') {
    activeCause = getCauseById('youth-stem-coding') || activeCause;
  } else if (advertiserName === 'Nomad Motors' || category === 'Automotive') {
    activeCause = getCauseById('paws-rescue') || activeCause;
  } else {
    activeCause = getCauseById('urban-tree-canopy') || activeCause;
  }

  const isEs = locale === 'es' || locale?.startsWith('es');
  const title = isEs ? activeCause.titleEs : activeCause.title;
  const description = isEs ? activeCause.descriptionEs : activeCause.description;
  const unit = isEs ? activeCause.unitEs : activeCause.unit;
  const sponsor = advertiserName || activeCause.sponsorBrand;

  const progressPercent = Math.min(
    100,
    Math.round((activeCause.currentProgress / activeCause.targetGoal) * 100)
  );

  const handleQuickDonate = () => {
    const cost = 25;
    if (!user || (user.rewardsBalance || 0) < cost) {
      addToast(
        isEs
          ? 'Puntos insuficientes para donar a esta causa'
          : 'Insufficient points to donate to this cause',
        'error'
      );
      return;
    }

    const res = contributePoints(cost, activeCause.id);
    if (res.success) {
      addReward(-cost, `Community Cause Donation: ${activeCause.title}`);
      addToast(
        isEs
          ? `🌱 Donaste ${cost} pts a ${title} (${res.units} ${unit})!`
          : `🌱 Donated ${cost} pts to ${title} (${res.units} ${unit})!`,
        'success'
      );
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.badgeContainer}>
      <button
        type="button"
        className={styles.impactPill}
        onClick={() => setIsOpen(true)}
        aria-label={`${title} cause co-sponsored by ${sponsor}`}
        title={`${title} - Ads for Good`}
      >
        <span className={styles.impactIcon}>{activeCause.icon}</span>
        <span className={styles.impactText}>
          {isEs ? 'Anuncios con Causa:' : 'Ads for Good:'} {title.split(' ')[0]}
        </span>
        {sponsor && <span className={styles.sponsorTag}>• {sponsor}</span>}
      </button>

      {isOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.titleArea}>
                <div className={styles.largeIcon}>{activeCause.icon}</div>
                <div>
                  <h3 className={styles.modalTitle}>{title}</h3>
                  <div className={styles.sponsorNote}>
                    {isEs ? 'Patrocinador Solidario:' : 'Co-Sponsor Partner:'} {sponsor}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label={t('close') || 'Close'}
              >
                &times;
              </button>
            </div>

            <p className={styles.modalDescription}>{description}</p>

            <div className={styles.metricsBox}>
              <div className={styles.metricsRow}>
                <span>
                  <strong>{activeCause.currentProgress}</strong> / {activeCause.targetGoal} {unit}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className={styles.sponsorNote}>
                ⚡ {isEs ? 'Tasa de impacto:' : 'Impact rate:'} {activeCause.conversionRate}{' '}
                {isEs ? 'pts equivalen a 1' : 'pts equal 1'} {unit}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={handleQuickDonate}
              >
                {activeCause.icon} {isEs ? 'Contribuir 25 pts' : 'Contribute 25 pts'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
