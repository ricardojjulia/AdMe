"use client";

import { useState } from "react";
import { useAttentionShield } from "@/lib/hooks/useAttentionShield";
import styles from "./AttentionShieldBadge.module.css";

interface AttentionShieldBadgeProps {
  rotatedCount?: number;
  onResetFeed?: () => void;
}

export function AttentionShieldBadge({
  rotatedCount = 0,
  onResetFeed,
}: AttentionShieldBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    mounted,
    isShieldActive,
    toggleShield,
    fatiguedAdsCount,
    totalImpressions,
    resetFatigue,
  } = useAttentionShield();

  if (!mounted) return null;

  const handleReset = () => {
    resetFatigue();
    if (onResetFeed) {
      onResetFeed();
    }
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.badge}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        data-testid="attention-shield-badge"
        aria-expanded={isOpen}
        aria-label="Attention Shield details"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={styles.activeDot} style={{ background: isShieldActive ? "#10b981" : "#94a3b8", boxShadow: isShieldActive ? "0 0 6px #10b981" : "none" }} />
        <span className={styles.label}>
          🛡️ Attention Shield
        </span>
        <span className={styles.statsText}>
          {isShieldActive ? `Active · ${fatiguedAdsCount} fatigued suppressed` : "Paused"}
        </span>
        <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}>
          ▼
        </span>
      </div>

      {isOpen && (
        <div className={styles.panel} data-testid="attention-shield-panel">
          <div className={styles.panelTitle}>
            <span>🛡️ Anti-Fatigue Attention Shield</span>
            <span style={{ fontSize: "0.75rem", color: isShieldActive ? "#10b981" : "#94a3b8", fontWeight: 600 }}>
              {isShieldActive ? "PROTECTED" : "PAUSED"}
            </span>
          </div>
          <p className={styles.panelDescription}>
            Protects your attention from ad repetition and category fatigue. Completely ephemeral in sessionStorage with zero tracking telemetry.
          </p>

          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <span>🔀</span>
              <div>
                <strong>Anti-Clustering:</strong> Max 2 consecutive ads of the same category.
              </div>
            </div>
            <div className={styles.featureItem}>
              <span>🛑</span>
              <div>
                <strong>Session Fatigue Cap:</strong> Over-served ads (&ge;3 impressions) are automatically de-prioritized.
              </div>
            </div>
            <div className={styles.featureItem}>
              <span>🔒</span>
              <div>
                <strong>Zero-Knowledge:</strong> Dwell and impression counts clear when you close this session.
              </div>
            </div>
          </div>

          <div className={styles.metricsRow}>
            <div className={styles.metricBlock}>
              <span className={styles.metricValue}>{totalImpressions}</span>
              <span className={styles.metricLabel}>Session Views</span>
            </div>
            <div className={styles.metricBlock}>
              <span className={styles.metricValue}>{fatiguedAdsCount}</span>
              <span className={styles.metricLabel}>Suppressed Repeat Ads</span>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleReset}
              title="Clear session impressions"
            >
              🔄 Reset Session Fatigue
            </button>
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={toggleShield}
            >
              {isShieldActive ? "Pause Shield" : "Resume Shield"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
