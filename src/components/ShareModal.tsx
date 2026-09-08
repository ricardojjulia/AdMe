"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import styles from "./ShareModal.module.css";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text?: string;
  url?: string;
  onShareSuccess?: () => void;
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  text = "",
  url,
  onShareSuccess
}: ShareModalProps) {
  const { addReward, t } = useUser();
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(url || "");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(url || window.location.href);
    }
  }, [url]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRewardAndSuccess = () => {
    addReward(3, "Shared Ad");
    addToast(t("share_copied_toast") || "Link copied to clipboard! +3 points earned", "success");
    if (onShareSuccess) {
      onShareSuccess();
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      handleRewardAndSuccess();
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy URL:", err);
      addToast("Could not copy link to clipboard", "error");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url: shareUrl
        });
        handleRewardAndSuccess();
        onClose();
      } catch (err: any) {
        // User cancelled share or abort
        if (err?.name !== "AbortError") {
          console.error("Native share error:", err);
        }
      }
    }
  };

  const shareText = encodeURIComponent(`${title}\n${text ? text + "\n" : ""}`);
  const encodedUrl = encodeURIComponent(shareUrl);

  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${shareText}%0A%0A${encodedUrl}`;

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <header className={styles.header}>
          <h3>{t("share_title") || "Share"}</h3>
          <p className={styles.subtitle}>{t("share_subtitle") || "Share with friends & earn reward points"}</p>
        </header>

        <div className={styles.previewBox}>
          <div className={styles.previewTitle}>{title}</div>
          {text && <div className={styles.previewText}>{text}</div>}
        </div>

        <div className={styles.rewardNotice}>
          <span>✨</span>
          <span>{t("share_reward_notice") || "Earn +3 points every time you share an offer!"}</span>
        </div>

        <div className={styles.copyGroup}>
          <label className={styles.copyLabel}>{t("share_link_label") || "Share Link"}</label>
          <div className={styles.copyRow}>
            <input
              type="text"
              readOnly
              value={shareUrl}
              className={styles.urlInput}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`${styles.copyBtn} ${copied ? styles.copied : ""}`}
            >
              {copied ? (
                <>✓ {t("copied") || "Copied!"}</>
              ) : (
                <>📋 {t("copy_link") || "Copy Link"}</>
              )}
            </button>
          </div>
        </div>

        <div className={styles.shareGrid}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleRewardAndSuccess}
            className={styles.shareOption}
          >
            <span className={styles.shareIcon}>💬</span>
            <span>WhatsApp</span>
          </a>

          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleRewardAndSuccess}
            className={styles.shareOption}
          >
            <span className={styles.shareIcon}>𝕏</span>
            <span>X (Twitter)</span>
          </a>

          <a
            href={emailUrl}
            onClick={handleRewardAndSuccess}
            className={styles.shareOption}
          >
            <span className={styles.shareIcon}>✉️</span>
            <span>Email</span>
          </a>
        </div>

        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className={styles.nativeShareBtn}
          >
            <span>📱</span>
            <span>{t("more_share_options") || "More options (Native Share)..."}</span>
          </button>
        )}
      </div>
    </div>
  );
}
