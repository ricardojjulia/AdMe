"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSessionImpressions,
  recordSessionImpression,
  isAdFatigued,
  clearSessionFatigue,
  SessionImpressionLedger,
  MAX_IMPRESSIONS_PER_SESSION,
} from "@/lib/services/attention-shield";

export interface AttentionShieldState {
  isShieldActive: boolean;
  totalImpressions: number;
  fatiguedAdsCount: number;
  sessionStartTime: number | null;
}

export function useAttentionShield() {
  const [ledger, setLedger] = useState<SessionImpressionLedger>({});
  const [isShieldActive, setIsShieldActive] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLedger(getSessionImpressions());
  }, []);

  const recordImpression = useCallback((adId: string, category: string) => {
    if (!adId) return;
    const updated = recordSessionImpression(adId, category);
    setLedger(updated);
  }, []);

  const checkIsFatigued = useCallback(
    (adId: string): boolean => {
      if (!isShieldActive) return false;
      return isAdFatigued(adId, ledger);
    },
    [isShieldActive, ledger]
  );

  const resetFatigue = useCallback(() => {
    clearSessionFatigue();
    setLedger({});
  }, []);

  const toggleShield = useCallback(() => {
    setIsShieldActive((prev) => !prev);
  }, []);

  const fatiguedAdsCount = Object.values(ledger).filter(
    (r) => r.count >= MAX_IMPRESSIONS_PER_SESSION
  ).length;

  const totalImpressions = Object.values(ledger).reduce(
    (acc, r) => acc + r.count,
    0
  );

  return {
    mounted,
    isShieldActive,
    toggleShield,
    ledger,
    fatiguedAdsCount,
    totalImpressions,
    recordImpression,
    isFatigued: checkIsFatigued,
    resetFatigue,
  };
}
