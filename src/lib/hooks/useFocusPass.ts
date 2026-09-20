"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FocusPassTier,
  FocusPassState,
  getStoredFocusPass,
  setStoredFocusPass,
  clearStoredFocusPass,
  createFocusToken,
  FOCUS_TIERS
} from "../services/focus-pass";

export function formatFocusTimeLeft(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function useFocusPass() {
  const [passState, setPassState] = useState<FocusPassState>({
    active: false,
    tier: null,
    expiresAt: null,
    token: null
  });
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  // Synchronize on client mount
  useEffect(() => {
    setMounted(true);
    const stored = getStoredFocusPass();
    setPassState(stored);
    if (stored.active && stored.expiresAt) {
      const diffSecs = Math.max(0, Math.floor((stored.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(diffSecs);
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!passState.active || !passState.expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const diffMs = passState.expiresAt! - Date.now();
      if (diffMs <= 0) {
        clearStoredFocusPass();
        setPassState({ active: false, tier: null, expiresAt: null, token: null });
        setRemainingSeconds(0);
      } else {
        setRemainingSeconds(Math.floor(diffMs / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [passState.active, passState.expiresAt]);

  const activatePass = useCallback((tier: FocusPassTier) => {
    const config = FOCUS_TIERS[tier];
    if (!config) return false;

    const expiresAt = Date.now() + config.durationMs;
    const token = createFocusToken(tier, expiresAt);
    const newState: FocusPassState = {
      active: true,
      tier,
      expiresAt,
      token
    };

    setStoredFocusPass(newState);
    setPassState(newState);
    setRemainingSeconds(Math.floor(config.durationMs / 1000));
    return true;
  }, []);

  const cancelPass = useCallback(() => {
    clearStoredFocusPass();
    setPassState({ active: false, tier: null, expiresAt: null, token: null });
    setRemainingSeconds(0);
  }, []);

  return {
    isFocusActive: mounted && passState.active && remainingSeconds > 0,
    activeTier: passState.tier,
    expiresAt: passState.expiresAt,
    remainingSeconds,
    formattedTimeLeft: formatFocusTimeLeft(remainingSeconds),
    activatePass,
    cancelPass,
    mounted
  };
}
