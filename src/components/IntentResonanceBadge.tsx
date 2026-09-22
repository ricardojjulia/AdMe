"use client";

import { useUser } from "@/lib/UserContext";
import styles from "./IntentResonanceBadge.module.css";
import { IntentMode } from "@/lib/services/intent-tuner";

interface IntentResonanceBadgeProps {
  labelKey?: string;
  defaultText?: string;
  intent?: IntentMode;
}

export function IntentResonanceBadge({
  labelKey,
  defaultText = "Intent Match",
  intent = "all"
}: IntentResonanceBadgeProps) {
  const { t } = useUser();

  if (intent === "all" || !labelKey) return null;

  const localizedText = t(labelKey as any) || defaultText;

  let badgeTypeClass = styles.badgeGeneric;
  if (intent === "local") badgeTypeClass = styles.badgeLocal;
  if (intent === "deals") badgeTypeClass = styles.badgeDeals;
  if (intent === "mindful") badgeTypeClass = styles.badgeMindful;

  return (
    <div
      className={`${styles.badge} ${badgeTypeClass}`}
      data-testid={`intent-resonance-badge-${intent}`}
      title={localizedText}
    >
      <span className={styles.pulseDot} />
      <span className={styles.text}>{localizedText}</span>
    </div>
  );
}
