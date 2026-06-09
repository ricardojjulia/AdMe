"use client";

import { useState } from "react";
import { Ad } from "@/types/ad";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import styles from "./LeadModal.module.css";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: Ad;
}

export function LeadModal({ isOpen, onClose, ad }: LeadModalProps) {
  const { user, submitLead, locale, t } = useUser();
  const { addToast } = useToast();
  const [message, setMessage] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await submitLead(ad.id, message, contactInfo);
      addToast(t("inquiry_sent_success"), "success");
      setMessage("");
      setContactInfo("");
      onClose();
    } catch (err) {
      console.error(err);
      addToast(t("inquiry_sent_failed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        style={{ '--primary-color': ad.content.primaryColor } as React.CSSProperties}
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">✕</button>
        
        <header className={styles.header}>
          <h3>{t('inquire_title')}</h3>
          <p className={styles.advertiser}>{t('campaign_by', { name: ad.advertiser.name })}</p>
        </header>

        <div className={styles.privacyAlert}>
          🔒 <span>{t('privacy_guarantee', { name: user?.name || t('anonymous') })}</span>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>{t('msg_to_business')}</span>
            <textarea 
              rows={4}
              required
              placeholder={t('msg_placeholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>{t('callback_info')}</span>
            <input 
              type="text"
              placeholder={t('callback_placeholder')}
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
            />
          </label>

          <button 
            type="submit" 
            className="btn styles.submitBtn" 
            disabled={isSubmitting || !message.trim()}
            style={{ backgroundColor: ad.content.primaryColor, color: 'black', fontWeight: 'bold' }}
          >
            {isSubmitting ? t('sending') : t('submit_inquiry')}
          </button>
        </form>
      </div>
    </div>
  );
}
