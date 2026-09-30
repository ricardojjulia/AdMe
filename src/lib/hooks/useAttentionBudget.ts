"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AttentionBudgetState,
  AttentionBudgetConfig,
  ATTENTION_BUDGET_STORAGE_KEY,
  ATTENTION_BUDGET_EVENT,
  loadAttentionBudgetState,
  recordAdExposure,
  claimMindfulDividend,
  updateAttentionBudgetConfig,
  extendTodayBudget,
  resetTodayBudget,
  isDailyBudgetReached,
  getDefaultAttentionBudgetState,
} from "@/lib/services/attention-budget";
import { useUser } from "@/lib/UserContext";

export function useAttentionBudget() {
  const [mounted, setMounted] = useState(false);
  const [budgetState, setBudgetState] = useState<AttentionBudgetState>(() => getDefaultAttentionBudgetState());
  const { addReward } = useUser();

  const syncState = useCallback(() => {
    const current = loadAttentionBudgetState();
    setBudgetState(current);
  }, []);

  useEffect(() => {
    setMounted(true);
    syncState();

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<AttentionBudgetState>;
      if (customEvent.detail) {
        setBudgetState(customEvent.detail);
      } else {
        syncState();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === ATTENTION_BUDGET_STORAGE_KEY) {
        syncState();
      }
    };

    window.addEventListener(ATTENTION_BUDGET_EVENT, handleCustomChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(ATTENTION_BUDGET_EVENT, handleCustomChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncState]);

  const isBudgetReached = mounted ? isDailyBudgetReached(budgetState) : false;
  const dailyCap = budgetState.config.dailyCap;
  const isEnabled = budgetState.config.enabled;
  const adsViewed = budgetState.today.adsViewed;

  const remainingQuota = (!isEnabled || dailyCap === 0) 
    ? Infinity 
    : Math.max(0, dailyCap - adsViewed);

  const progressPercent = (!isEnabled || dailyCap === 0)
    ? 0
    : Math.min(100, Math.round((adsViewed / dailyCap) * 100));

  const isBonusClaimed = budgetState.today.claimedDividend;
  const canClaimBonus = isBudgetReached && !isBonusClaimed;

  const recordAdView = useCallback((pointsEarned: number = 0) => {
    const updated = recordAdExposure(pointsEarned);
    setBudgetState(updated);
  }, []);

  const claimBonus = useCallback(async (): Promise<boolean> => {
    const result = claimMindfulDividend();
    if (result.success) {
      setBudgetState(result.newState);
      if (addReward) {
        try {
          await addReward(result.bonusPoints);
        } catch (err) {
          console.error("Failed to add mindful dividend reward points to ledger:", err);
        }
      }
      return true;
    }
    return false;
  }, [addReward]);

  const updateConfig = useCallback((partial: Partial<AttentionBudgetConfig>) => {
    const updated = updateAttentionBudgetConfig(partial);
    setBudgetState(updated);
  }, []);

  const extendBudget = useCallback((additionalAds: number = 3) => {
    const updated = extendTodayBudget(additionalAds);
    setBudgetState(updated);
  }, []);

  const resetBudget = useCallback(() => {
    const updated = resetTodayBudget();
    setBudgetState(updated);
  }, []);

  return {
    mounted,
    state: budgetState,
    config: budgetState.config,
    today: budgetState.today,
    streakCount: budgetState.streakCount,
    isBudgetReached,
    remainingQuota,
    progressPercent,
    isBonusClaimed,
    canClaimBonus,
    recordAdView,
    claimBonus,
    updateConfig,
    extendBudget,
    resetBudget,
  };
}
