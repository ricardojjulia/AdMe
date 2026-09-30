"use client";

import { useState } from "react";
import { useAttentionBudget } from "@/lib/hooks/useAttentionBudget";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import styles from "./MindfulCeilingCard.module.css";

interface MindfulCeilingCardProps {
  onContinueOrganic?: () => void;
}

export function MindfulCeilingCard({ onContinueOrganic }: MindfulCeilingCardProps) {
  const [claiming, setClaiming] = useState(false);
  const {
    mounted,
    config,
    streakCount,
    isBudgetReached,
    isBonusClaimed,
    canClaimBonus,
    claimBonus,
    extendBudget,
  } = useAttentionBudget();
  const { t } = useUser();
  const { addToast } = useToast();

  if (!mounted || !isBudgetReached) {
    return null;
  }

  const handleClaim = async () => {
    if (!canClaimBonus || claiming) return;
    setClaiming(true);
    try {
      const ok = await claimBonus();
      if (ok) {
        addToast(t("attention_budget_dividend_claimed_toast"));
      }
    } finally {
      setClaiming(false);
    }
  };

  return (
    <article
      className={styles.card}
      data-testid="mindful-ceiling-card"
      aria-live="polite"
    >
      <div className={styles.header}>
        <div className={styles.iconCircle}>
          <span className={styles.icon}>🌟</span>
        </div>
        <div>
          <span className={styles.badge}>{t("attention_budget_goal_badge")}</span>
          <h3 className={styles.title}>{t("attention_budget_ceiling_title")}</h3>
        </div>
      </div>

      <p className={styles.message}>
        {t("attention_budget_ceiling_desc", {
          count: config.dailyCap,
        })}
      </p>

      {streakCount > 0 && (
        <div className={styles.streakNotice}>
          <span className={styles.streakFlame}>🔥</span>
          <span className={styles.streakText}>
            {t("attention_budget_streak_banner", { count: streakCount })}
          </span>
        </div>
      )}

      <div className={styles.dividendSection}>
        <div className={styles.dividendInfo}>
          <span className={styles.dividendTitle}>
            {t("attention_budget_dividend_title")}
          </span>
          <span className={styles.dividendDesc}>
            {t("attention_budget_dividend_desc")}
          </span>
        </div>

        {canClaimBonus ? (
          <button
            type="button"
            className={styles.claimBtn}
            onClick={handleClaim}
            disabled={claiming}
            data-testid="claim-mindful-dividend-btn"
          >
            {claiming ? "..." : `+25 ${t("points")} 🎁`}
          </button>
        ) : isBonusClaimed ? (
          <span className={styles.claimedBadge} data-testid="dividend-claimed-badge">
            ✓ {t("attention_budget_dividend_claimed")}
          </span>
        ) : null}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.extendBtn}
          onClick={() => extendBudget(3)}
          data-testid="ceiling-extend-btn"
        >
          +3 {t("attention_budget_extend_label")}
        </button>

        {onContinueOrganic && (
          <button
            type="button"
            className={styles.organicBtn}
            onClick={onContinueOrganic}
            data-testid="ceiling-organic-btn"
          >
            {t("attention_budget_continue_organic")}
          </button>
        )}
      </div>

      <div className={styles.footerNote}>
        <span className={styles.zkShield}>🛡️</span>
        <span>{t("attention_budget_ephemeral_note")}</span>
      </div>
    </article>
  );
}
