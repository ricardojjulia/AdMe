"use client";

import { useState, useEffect } from "react";
import { useAttentionBudget } from "@/lib/hooks/useAttentionBudget";
import { useUser } from "@/lib/UserContext";
import { BUDGET_CAP_PRESETS, BudgetCapPreset } from "@/lib/services/attention-budget";
import styles from "./AttentionBudgetHUD.module.css";

export function AttentionBudgetHUD() {
  const [modalOpen, setModalOpen] = useState(false);
  const {
    mounted,
    config,
    today,
    streakCount,
    isBudgetReached,
    remainingQuota,
    progressPercent,
    updateConfig,
    resetBudget,
    extendBudget,
  } = useAttentionBudget();
  const { t } = useUser();

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) {
        setModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  if (!mounted) return null;

  const dailyCap = config.dailyCap;
  const isEnabled = config.enabled;
  const adsViewed = today.adsViewed;

  const handleSelectCap = (cap: BudgetCapPreset) => {
    updateConfig({ dailyCap: cap, enabled: cap !== 0 });
  };

  return (
    <>
      <div className={styles.hudContainer} data-testid="attention-budget-hud">
        <div
          className={`${styles.hudPill} ${isBudgetReached ? styles.reachedPill : ""}`}
          onClick={() => setModalOpen(true)}
          role="button"
          tabIndex={0}
          data-testid="attention-budget-toggle"
          aria-label={t("attention_budget_title")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setModalOpen(true);
            }
          }}
        >
          <div className={styles.pillLeft}>
            <span className={styles.icon}>🎯</span>
            <span className={styles.title}>{t("attention_budget_title")}</span>
          </div>

          <div className={styles.pillCenter}>
            {isEnabled && dailyCap > 0 ? (
              <>
                <div className={styles.progressBarBg}>
                  <div
                    className={`${styles.progressBarFill} ${
                      isBudgetReached ? styles.progressBarComplete : ""
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className={styles.quotaText}>
                  {isBudgetReached
                    ? t("attention_budget_completed_status")
                    : `${adsViewed} / ${dailyCap} ${t("attention_budget_ads_label")}`}
                </span>
              </>
            ) : (
              <span className={styles.unlimitedText}>
                {t("attention_budget_unlimited_label")}
              </span>
            )}
          </div>

          <div className={styles.pillRight}>
            {streakCount > 0 && (
              <span
                className={styles.streakBadge}
                title={`${streakCount} ${t("attention_budget_streak_title")}`}
              >
                🔥 {streakCount}d
              </span>
            )}
            <span className={styles.settingsIcon} aria-hidden="true">
              ⚙️
            </span>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setModalOpen(false)}
          data-testid="attention-budget-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="attention-budget-modal-title"
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={styles.modalIcon}>🎯</span>
                <h3 id="attention-budget-modal-title" className={styles.modalTitle}>
                  {t("attention_budget_title")}
                </h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setModalOpen(false)}
                aria-label={t("close")}
                data-testid="attention-budget-modal-close"
              >
                ✕
              </button>
            </div>

            <p className={styles.modalSubtitle}>
              {t("attention_budget_subtitle")}
            </p>

            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>{adsViewed}</span>
                <span className={styles.statLabel}>
                  {t("attention_budget_viewed_today")}
                </span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>
                  {dailyCap === 0 ? "∞" : remainingQuota}
                </span>
                <span className={styles.statLabel}>
                  {t("attention_budget_remaining_today")}
                </span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>
                  {streakCount > 0 ? `🔥 ${streakCount}` : "0"}
                </span>
                <span className={styles.statLabel}>
                  {t("attention_budget_streak_label")}
                </span>
              </div>
            </div>

            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                {t("attention_budget_cap_select_label")}
              </label>
              <div className={styles.presetGrid}>
                {BUDGET_CAP_PRESETS.map((cap) => {
                  const isSelected =
                    cap === 0
                      ? !isEnabled || dailyCap === 0
                      : isEnabled && dailyCap === cap;
                  return (
                    <button
                      key={cap}
                      type="button"
                      className={`${styles.presetBtn} ${
                        isSelected ? styles.presetSelected : ""
                      }`}
                      onClick={() => handleSelectCap(cap)}
                      data-testid={`budget-preset-${cap}`}
                    >
                      <span className={styles.presetNumber}>
                        {cap === 0 ? "∞" : cap}
                      </span>
                      <span className={styles.presetDesc}>
                        {cap === 0
                          ? t("attention_budget_unlimited_name")
                          : `${cap} ${t("attention_budget_ads_label")}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => extendBudget(3)}
                data-testid="attention-budget-extend-btn"
              >
                +3 {t("attention_budget_extend_label")}
              </button>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() => resetBudget()}
                data-testid="attention-budget-reset-btn"
              >
                {t("attention_budget_reset_label")}
              </button>
            </div>

            <div className={styles.zkNotice}>
              <span className={styles.zkIcon}>🛡️</span>
              <p className={styles.zkText}>
                {t("attention_budget_privacy_guarantee")}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
