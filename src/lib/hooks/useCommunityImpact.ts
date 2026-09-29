"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  COMMUNITY_CAUSES_REGISTRY,
  COMMUNITY_IMPACT_EVENT,
  CommunityCause,
  CommunityImpactState,
  DEFAULT_COMMUNITY_IMPACT_STATE,
  ImpactContribution,
  ImpactSplitMode,
  calculateImpactSplit,
  calculateImpactUnits,
  generateDeterministicCertificateId,
  getCauseById,
  loadCommunityImpactState,
  saveCommunityImpactState,
} from '@/lib/services/community-impact';

export function useCommunityImpact() {
  const [impactState, setImpactState] = useState<CommunityImpactState>(
    DEFAULT_COMMUNITY_IMPACT_STATE
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setImpactState(loadCommunityImpactState());

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<CommunityImpactState>;
      if (customEvent.detail) {
        setImpactState(customEvent.detail);
      } else {
        setImpactState(loadCommunityImpactState());
      }
    };

    window.addEventListener(COMMUNITY_IMPACT_EVENT, handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener(COMMUNITY_IMPACT_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const setSplitMode = useCallback((mode: ImpactSplitMode) => {
    setImpactState((prev) => {
      const next = { ...prev, splitMode: mode };
      saveCommunityImpactState(next);
      return next;
    });
  }, []);

  const setSelectedCauseId = useCallback((causeId: string) => {
    setImpactState((prev) => {
      const next = { ...prev, selectedCauseId: causeId };
      saveCommunityImpactState(next);
      return next;
    });
  }, []);

  const selectedCause = getCauseById(impactState.selectedCauseId) || COMMUNITY_CAUSES_REGISTRY[0];

  /**
   * Directly converts rewards points to a community cause contribution.
   */
  const contributePoints = useCallback(
    (points: number, causeId?: string): { success: boolean; certificateId?: string; units?: number } => {
      if (points <= 0) return { success: false };
      const targetCause = getCauseById(causeId || impactState.selectedCauseId) || selectedCause;
      const now = Date.now();
      const units = calculateImpactUnits(points, targetCause.conversionRate);
      const certificateId = generateDeterministicCertificateId(targetCause.id, now, points);

      const contribution: ImpactContribution = {
        id: `contrib-${now}-${Math.random().toString(36).slice(2, 7)}`,
        causeId: targetCause.id,
        causeTitle: targetCause.title,
        pointsContributed: points,
        impactUnits: units,
        unitLabel: targetCause.unit,
        timestamp: now,
        certificateId,
      };

      setImpactState((prev) => {
        const next: CommunityImpactState = {
          ...prev,
          totalPointsDonated: prev.totalPointsDonated + points,
          contributions: [contribution, ...prev.contributions],
        };
        saveCommunityImpactState(next);
        return next;
      });

      return { success: true, certificateId, units };
    },
    [impactState.selectedCauseId, selectedCause]
  );

  /**
   * Routes an in-feed attention value-exchange reward based on user's split preference.
   */
  const routeRewardBonus = useCallback(
    (totalBonusPoints: number, causeId?: string) => {
      const split = calculateImpactSplit(totalBonusPoints, impactState.splitMode);
      const targetCause = getCauseById(causeId || impactState.selectedCauseId) || selectedCause;

      if (split.causePoints > 0) {
        contributePoints(split.causePoints, targetCause.id);
      }

      return {
        personalBonus: split.perksPoints,
        causeBonus: split.causePoints,
        causeTitle: targetCause.title,
        causeIcon: targetCause.icon,
      };
    },
    [impactState.splitMode, impactState.selectedCauseId, selectedCause, contributePoints]
  );

  return {
    mounted,
    splitMode: impactState.splitMode,
    setSplitMode,
    selectedCause,
    selectedCauseId: impactState.selectedCauseId,
    setSelectedCauseId,
    causes: COMMUNITY_CAUSES_REGISTRY,
    totalPointsDonated: impactState.totalPointsDonated,
    contributions: impactState.contributions,
    contributePoints,
    routeRewardBonus,
  };
}
