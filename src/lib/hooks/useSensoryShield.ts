"use client";

import { useEffect, useState, useCallback } from "react";
import {
  isSensoryShieldActive,
  setStoredSensoryShield,
  applySensoryModeToDOM,
  SENSORY_SHIELD_EVENT,
  getStoredSensoryShield,
} from "@/lib/services/sensory-shield";

export function useSensoryShield() {
  const [mounted, setMounted] = useState(false);
  const [isSensoryActive, setIsSensoryActive] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const active = isSensoryShieldActive();
    setIsSensoryActive(active);
    applySensoryModeToDOM(active);

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ active: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.active === "boolean") {
        setIsSensoryActive(customEvent.detail.active);
      } else {
        setIsSensoryActive(isSensoryShieldActive());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "adme_sensory_shield_v1") {
        const active = isSensoryShieldActive();
        setIsSensoryActive(active);
        applySensoryModeToDOM(active);
      }
    };

    window.addEventListener(SENSORY_SHIELD_EVENT, handleCustomChange);
    window.addEventListener("storage", handleStorage);

    // Also respond to system accessibility changes if user has not set an explicit override
    let mql: MediaQueryList | null = null;
    const handleMediaChange = () => {
      if (getStoredSensoryShield() === null) {
        const active = isSensoryShieldActive();
        setIsSensoryActive(active);
        applySensoryModeToDOM(active);
      }
    };

    if (window.matchMedia) {
      mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      mql.addEventListener("change", handleMediaChange);
    }

    return () => {
      window.removeEventListener(SENSORY_SHIELD_EVENT, handleCustomChange);
      window.removeEventListener("storage", handleStorage);
      if (mql) {
        mql.removeEventListener("change", handleMediaChange);
      }
    };
  }, []);

  const toggleSensory = useCallback(() => {
    const next = !isSensoryActive;
    setIsSensoryActive(next);
    setStoredSensoryShield(next);
  }, [isSensoryActive]);

  const setSensory = useCallback((next: boolean) => {
    setIsSensoryActive(next);
    setStoredSensoryShield(next);
  }, []);

  return {
    mounted,
    isSensoryActive,
    toggleSensory,
    setSensory,
  };
}
