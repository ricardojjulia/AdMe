"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { IntentMode } from "@/lib/services/intent-tuner";
import styles from "./IntentTunerHUD.module.css";

interface IntentTunerHUDProps {
  activeIntent: IntentMode;
  onSelectIntent: (intent: IntentMode) => void;
}

interface IntentOption {
  id: IntentMode;
  icon: string;
  labelKey: string;
  defaultLabel: string;
  activeClass: string;
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    id: "all",
    icon: "🧭",
    labelKey: "intent_mode_all",
    defaultLabel: "Discovery",
    activeClass: styles.pillActive
  },
  {
    id: "local",
    icon: "📍",
    labelKey: "intent_mode_local",
    defaultLabel: "Local Gems",
    activeClass: styles.pillActiveLocal
  },
  {
    id: "deals",
    icon: "🏷️",
    labelKey: "intent_mode_deals",
    defaultLabel: "Deal Hunter",
    activeClass: styles.pillActiveDeals
  },
  {
    id: "mindful",
    icon: "🍃",
    labelKey: "intent_mode_mindful",
    defaultLabel: "Mindful",
    activeClass: styles.pillActiveMindful
  }
];

export function IntentTunerHUD({
  activeIntent,
  onSelectIntent
}: IntentTunerHUDProps) {
  const [mounted, setMounted] = useState(false);
  const { t } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section
      className={styles.hudContainer}
      aria-label="Feed Contextual Intent Tuner"
      data-testid="intent-tuner-hud"
    >
      <div className={styles.hudCard}>
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <span className={styles.titleIcon}>🎯</span>
            <span className={styles.titleText}>
              {t("intent_tuner_title" as any) || "Intent Tuner"}
            </span>
          </div>
          <div
            className={styles.privacyBadge}
            title="Zero tracking: your intent selection is stored purely in client memory"
          >
            <span>🔒</span>
            <span>
              {t("intent_zero_tracking_tooltip" as any) || "Zero Tracking • Client Only"}
            </span>
          </div>
        </div>

        <div
          className={styles.pillsRow}
          role="radiogroup"
          aria-label="Select feed intent mode"
        >
          {INTENT_OPTIONS.map((opt) => {
            const isActive = activeIntent === opt.id;
            const label = t(opt.labelKey as any) || opt.defaultLabel;

            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                data-testid={`intent-pill-${opt.id}`}
                className={`${styles.pillButton} ${isActive ? opt.activeClass : ""}`}
                onClick={() => onSelectIntent(opt.id)}
              >
                <span className={styles.pillIcon}>{opt.icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
