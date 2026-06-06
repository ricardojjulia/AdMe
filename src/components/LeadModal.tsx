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
  const { user, submitLead } = useUser();
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
      addToast("Inquiry sent anonymously!", "success");
      setMessage("");
      setContactInfo("");
      onClose();
    } catch (err) {
      console.error(err);
      addToast("Failed to submit inquiry. Please try again.", "error");
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
          <h3>Inquire about offer</h3>
          <p className={styles.advertiser}>Campaign by {ad.advertiser.name}</p>
        </header>

        <div className={styles.privacyAlert}>
          🔒 **Privacy Guarantee**: Your query will be sent anonymously under user handle <span className={styles.uid}>{user?.name || "Anonymous"}</span>. The business will not see your email, phone, or name unless you write them below.
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Message to business</span>
            <textarea 
              rows={4}
              required
              placeholder="Hi, I'm interested in this offer. Could you share more details?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Callback info (optional)</span>
            <input 
              type="text"
              placeholder="e.g. Email/Phone (only if you want a direct reply)"
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
            {isSubmitting ? "Sending..." : "Submit Inquiry"}
          </button>
        </form>
      </div>
    </div>
  );
}
