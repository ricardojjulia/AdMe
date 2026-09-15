"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import styles from "./AdTransparencyModal.module.css";

export interface AdTransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  adId: string;
  advertiserName: string;
  category: string;
  headline?: string;
  distanceMiles?: number;
  onDismissAd?: () => void;
}

export function AdTransparencyModal({
  isOpen,
  onClose,
  adId,
  advertiserName,
  category,
  headline,
  distanceMiles,
  onDismissAd,
}: AdTransparencyModalProps) {
  const {
    preferences,
    locationState,
    snoozeMerchant,
    adjustCategoryWeight,
    sendAdFeedback,
  } = useUser();
  const { addToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const isMatchedPreference = preferences.includes(category);
  const city = locationState.coarseLocation?.city || "Santa Monica";
  const region = locationState.coarseLocation?.region || "CA";

  const handleSnooze = async () => {
    snoozeMerchant(advertiserName);
    await sendAdFeedback(adId, "snooze_advertiser", category);
    addToast(`Snoozed ${advertiserName} for 30 days`, "info");
    onDismissAd?.();
    onClose();
  };

  const handleDownweight = async () => {
    adjustCategoryWeight(category, 0.5);
    await sendAdFeedback(adId, "downweight_category", category);
    addToast(`Preferences updated: seeing 50% less ${category}`, "info");
    onClose();
  };

  const handleIrrelevant = async () => {
    await sendAdFeedback(adId, "irrelevant", category);
    addToast("Thanks for the feedback. We've removed this from your feed.", "info");
    onDismissAd?.();
    onClose();
  };

  const handleHelpful = async () => {
    await sendAdFeedback(adId, "helpful", category);
    addToast("Thanks! We'll show more relevant spots like this.", "success");
    onClose();
  };

  const modalContent = (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-transparency-modal-title"
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.badgeIcon}>ⓘ</div>
            <div>
              <h3 id="ad-transparency-modal-title">Why Am I Seeing This Ad?</h3>
              <p className={styles.subtitle}>Explainable Advertising & Privacy Transparency</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close transparency dialog"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Ad Metadata Snippet */}
          <div className={styles.adSnippet}>
            <div className={styles.merchantAvatar}>{advertiserName[0] || "A"}</div>
            <div className={styles.merchantMeta}>
              <span className={styles.merchantName}>{advertiserName}</span>
              <span className={styles.headlineSnippet}>
                {headline || `Sponsored recommendation in ${category}`}
              </span>
            </div>
          </div>

          {/* Explainability Breakdown */}
          <div className={styles.factorsList}>
            {/* Factor 1: Topic & Preference Match */}
            <div className={styles.factorItem}>
              <span className={styles.factorIcon}>🎯</span>
              <div className={styles.factorBody}>
                <h4>
                  {isMatchedPreference ? "Direct Topic Interest" : "Category Discovery"}
                </h4>
                <p>
                  {isMatchedPreference
                    ? `Matched because your active interest profile includes "${category}".`
                    : `Discovered as an exploratory recommendation for the "${category}" community.`}
                </p>
              </div>
            </div>

            {/* Factor 2: Proximity Context */}
            <div className={styles.factorItem}>
              <span className={styles.factorIcon}>📍</span>
              <div className={styles.factorBody}>
                <h4>Coarse Proximity Relevance</h4>
                <p>
                  {distanceMiles != null && distanceMiles > 0
                    ? `This merchant is located within ~${distanceMiles.toFixed(1)} miles of your coarse neighborhood grid.`
                    : `Relevant to your coarse edge-detected metro baseline (${city}, ${region}).`}
                </p>
              </div>
            </div>

            {/* Factor 3: Auction Context */}
            <div className={styles.factorItem}>
              <span className={styles.factorIcon}>⚖️</span>
              <div className={styles.factorBody}>
                <h4>Fair Category Auction Placement</h4>
                <p>
                  {advertiserName} participated in our privacy-preserving category auction with a
                  winning bid and active budget pacemaker.
                </p>
              </div>
            </div>
          </div>

          {/* Cryptographic Zero-Knowledge Privacy Guarantee */}
          <div className={styles.privacyCallout}>
            <span style={{ fontSize: "1.2rem" }}>🛡️</span>
            <div>
              <h4>Zero-Knowledge Privacy Attestation</h4>
              <p>
                All targeting evaluations occurred 100% inside your browser&apos;s local memory.
                Your profile, device identity, and browsing history were never transmitted to{" "}
                <strong>{advertiserName}</strong> or any third-party broker.
              </p>
            </div>
          </div>

          {/* User Agency & Feedback Tuning Actions */}
          <div className={styles.actionsSection}>
            <span className={styles.actionTitle}>Curate Your Experience</span>

            <button
              type="button"
              className={`${styles.actionButton} ${styles.positive}`}
              onClick={handleHelpful}
            >
              <span className={styles.buttonLabel}>
                <span>👍</span>
                <span>This ad was relevant and interesting</span>
              </span>
              <span>→</span>
            </button>

            <button
              type="button"
              className={styles.actionButton}
              onClick={handleDownweight}
            >
              <span className={styles.buttonLabel}>
                <span>📉</span>
                <span>See 50% less from category: &ldquo;{category}&rdquo;</span>
              </span>
              <span>→</span>
            </button>

            <button
              type="button"
              className={`${styles.actionButton} ${styles.danger}`}
              onClick={handleSnooze}
            >
              <span className={styles.buttonLabel}>
                <span>💤</span>
                <span>Snooze {advertiserName} for 30 days</span>
              </span>
              <span>→</span>
            </button>

            <button
              type="button"
              className={styles.actionButton}
              onClick={handleIrrelevant}
            >
              <span className={styles.buttonLabel}>
                <span>✕</span>
                <span>Not relevant to me (hide card)</span>
              </span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
