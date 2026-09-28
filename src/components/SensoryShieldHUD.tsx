"use client";

import { useSensoryShield } from "@/lib/hooks/useSensoryShield";
import { useUser } from "@/lib/UserContext";
import styles from "./SensoryShieldHUD.module.css";

export function SensoryShieldHUD() {
  const { mounted, isSensoryActive, toggleSensory } = useSensoryShield();
  const { t } = useUser();

  if (!mounted) return null;

  return (
    <div className={styles.container} data-testid="sensory-shield-hud">
      <div
        className={`${styles.hudPill} ${isSensoryActive ? styles.activePill : ""}`}
        onClick={toggleSensory}
        role="button"
        tabIndex={0}
        data-testid="sensory-shield-toggle"
        aria-pressed={isSensoryActive}
        aria-label={t("sensory_shield_title")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleSensory();
          }
        }}
      >
        <div className={styles.indicatorContainer}>
          <span
            className={`${styles.indicatorDot} ${
              isSensoryActive ? styles.indicatorActive : ""
            }`}
          />
          <span className={styles.icon}>🌱</span>
          <span className={styles.title}>{t("sensory_shield_title")}</span>
        </div>

        <div className={styles.statusSection}>
          <span className={styles.modeBadge}>
            {isSensoryActive
              ? t("sensory_shield_calm")
              : t("sensory_shield_standard")}
          </span>
          <span className={styles.helpText}>
            {isSensoryActive
              ? t("sensory_shield_active_desc")
              : t("sensory_shield_paused_desc")}
          </span>
        </div>

        <button
          type="button"
          className={styles.toggleButton}
          tabIndex={-1}
          aria-hidden="true"
        >
          {isSensoryActive ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}
