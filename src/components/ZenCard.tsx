"use client";

import { useState } from "react";
import { ZenItem } from "@/lib/services/focus-pass";
import { useUser } from "@/lib/UserContext";
import styles from "./ZenCard.module.css";

interface ZenCardProps {
  item: ZenItem;
}

export function ZenCard({ item }: ZenCardProps) {
  const { t } = useUser();
  const [breathing, setBreathing] = useState(false);

  const handleBreathe = () => {
    setBreathing(true);
    setTimeout(() => {
      setBreathing(false);
    }, 4000);
  };

  return (
    <article className={styles.card} data-testid="zen-card" data-zen-id={item.id}>
      <div className={styles.imageWrapper}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.theme}
          className={styles.image}
          loading="lazy"
        />
        <div className={styles.gradientOverlay} />

        <div className={styles.headerBadge}>
          <span>🌿</span>
          <span>{item.theme}</span>
        </div>

        <div className={styles.peaceIndicator}>
          <span>🧘 {t("zen_mode_badge")}</span>
        </div>
      </div>

      <div className={styles.content}>
        <blockquote className={styles.quoteText}>
          &ldquo;{item.quote}&rdquo;
        </blockquote>
        <p className={styles.quoteAuthor}>
          <span>—</span>
          <span>{item.author}</span>
        </p>

        <div className={styles.footer}>
          <span className={styles.zenNote}>
            {t("zen_editorial_note")}
          </span>
          <button
            type="button"
            className={styles.breathBtn}
            onClick={handleBreathe}
            data-testid="zen-breath-btn"
          >
            {breathing ? `🌬️ ${t("zen_exhale_breathe")}` : `✨ ${t("zen_take_a_breath")}`}
          </button>
        </div>
      </div>
    </article>
  );
}
