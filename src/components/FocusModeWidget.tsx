"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { FOCUS_TIERS } from "@/lib/services/focus-pass";
import styles from "./FocusModeWidget.module.css";

export function FocusModeWidget() {
  const { isFocusActive, focusPass, focusTimeLeft, cancelFocusPass, t } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isFocusActive) {
    return null;
  }

  const tierConfig = focusPass.tier ? FOCUS_TIERS[focusPass.tier] : null;
  const tierName = tierConfig?.name || focusPass.tier || "Active";

  return (
    <div className={styles.widgetContainer} data-testid="focus-mode-hud">
      <div className={styles.hudCard}>
        <div className={styles.leftSection}>
          <div className={styles.zenBadge}>
            <span className={styles.pulseDot} />
            <span>🧘 {t("focus_mode_zen_active")}</span>
          </div>
          <span className={styles.tierLabel}>{tierName}</span>
        </div>

        <div className={styles.timeContainer} data-testid="focus-time-left">
          <span className={styles.clockIcon}>⏳</span>
          <span>{focusTimeLeft}</span>
        </div>

        <div className={styles.rightSection}>
          <span className={styles.infoTooltip}>{t("focus_mode_silence_tooltip")}</span>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={cancelFocusPass}
            data-testid="cancel-focus-pass"
            title={t("focus_mode_cancel_title")}
          >
            {t("focus_mode_end_early")}
          </button>
        </div>
      </div>
    </div>
  );
}
