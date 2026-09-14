"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import styles from "./ReportModal.module.css";

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  headline?: string;
  contentText?: string;
  itemType?: "ad" | "marketplace" | "post" | "event";
  onReportSuccess?: () => void;
}

interface ReportOption {
  key: string;
  icon: string;
  title: string;
  description: string;
}

const REPORT_REASONS: ReportOption[] = [
  {
    key: "Offensive or Inappropriate",
    icon: "🚩",
    title: "Offensive or Inappropriate",
    description: "Contains vulgarity, hate speech, explicit content, or harassment.",
  },
  {
    key: "Scam or Fraudulent",
    icon: "🚨",
    title: "Scam or Fraudulent",
    description: "Deceptive offer, unrealistic price, phishing, or counterfeit goods.",
  },
  {
    key: "Misleading / False Claims",
    icon: "⚠️",
    title: "Misleading / False Claims",
    description: "Inaccurate description, hidden terms, or fabricated guarantees.",
  },
  {
    key: "Spam or Duplicate",
    icon: "📢",
    title: "Spam or Duplicate",
    description: "Excessive repetitive posting, irrelevant ads, or automated bot spam.",
  },
  {
    key: "Dangerous or Illegal",
    icon: "🛑",
    title: "Dangerous or Illegal",
    description: "Promotes prohibited weapons, hazardous substances, or illegal services.",
  },
];

export function ReportModal({
  isOpen,
  onClose,
  itemId,
  headline,
  contentText,
  itemType = "ad",
  onReportSuccess,
}: ReportModalProps) {
  const { reportAd, t } = useUser();
  const { addToast } = useToast();
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0].key);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await reportAd(itemId, selectedReason, {
        headline: headline || "Reported Feed Item",
        contentText: contentText || "",
        notes: notes.trim(),
      });

      addToast(
        t("report_submitted_toast") ||
          "Report submitted. This item has been removed from your feed and sent to AI safety arbitration.",
        "info"
      );

      if (onReportSuccess) {
        onReportSuccess();
      }

      onClose();
    } catch (err) {
      console.error("Error submitting report:", err);
      addToast("Failed to submit report. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemTypeName =
    itemType === "marketplace"
      ? "Marketplace Listing"
      : itemType === "event"
      ? "Community Event"
      : "Advertisement";

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <h3 className={styles.title}>
              <span>⚑</span> Report {itemTypeName}
            </h3>
            <p className={styles.subtitle}>
              Help keep the AdMe community safe, authentic, and respectful.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Close modal"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {/* Context snippet of what is being reported */}
            <div className={styles.itemContext}>
              <div className={styles.itemHeadline}>
                {headline || "Selected Item"}
              </div>
              {contentText && (
                <div className={styles.itemSnippet}>{contentText}</div>
              )}
            </div>

            {/* Violation Category Selector */}
            <div>
              <div className={styles.sectionLabel}>
                Why are you reporting this content?
              </div>
              <div className={styles.reasonGrid} role="radiogroup">
                {REPORT_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason.key;
                  return (
                    <button
                      key={reason.key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedReason(reason.key)}
                      className={`${styles.reasonOption} ${
                        isSelected ? styles.reasonOptionSelected : ""
                      }`}
                    >
                      <span className={styles.reasonIcon}>{reason.icon}</span>
                      <div className={styles.reasonInfo}>
                        <span className={styles.reasonTitle}>{reason.title}</span>
                        <span className={styles.reasonDesc}>
                          {reason.description}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "1rem",
                          color: isSelected ? "#ef4444" : "hsl(var(--muted))",
                        }}
                      >
                        {isSelected ? "●" : "○"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label
                htmlFor="report-notes"
                className={styles.sectionLabel}
                style={{ display: "block" }}
              >
                Additional Details (Optional)
              </label>
              <textarea
                id="report-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide any additional context or specific concerns..."
                className={styles.notesInput}
                maxLength={500}
              />
            </div>

            {/* Policy & Reassurance Notice */}
            <div className={styles.policyNotice}>
              <span>🛡️</span>
              <div>
                <strong>Zero-Tolerance Community Shield:</strong> Reporting this item
                removes it from your feed immediately. Our automated Gemini safety
                pipeline will inspect the listing for policy violations and merchant
                enforcement.
              </div>
            </div>
          </div>

          <footer className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.submitBtn}
            >
              <span>⚑</span>
              <span>{isSubmitting ? "Submitting..." : "Submit Report"}</span>
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  );
}
