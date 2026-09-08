"use client";

import React, { useEffect } from "react";
import styles from "./TransparencyModal.module.css";

interface TransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransparencyModal({ isOpen, onClose }: TransparencyModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div 
        className={`${styles.modal} animate-fade-in`} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transparency-modal-title"
      >
        <button 
          className={styles.closeBtn} 
          onClick={onClose} 
          aria-label="Close modal"
        >
          ✕
        </button>

        <header className={styles.header}>
          <span className={styles.badge}>Fair Value Exchange</span>
          <h2 id="transparency-modal-title">How Does AdMe Make Money?</h2>
          <p className={styles.subtitle}>
            Traditional ad tech sells your data and hoards 100% of the profits. 
            AdMe is a double-sided attention marketplace built on radical transparency and voluntary engagement.
          </p>
        </header>

        {/* The 4 Streams */}
        <div className={styles.streamGrid}>
          <div className={styles.streamCard}>
            <div className={styles.streamIcon}>🪙</div>
            <h4 className={styles.streamTitle}>1. Campaign Ad Credits</h4>
            <span className={styles.streamRate}>$10, $50, $100 / Pack</span>
            <p className={styles.streamDesc}>
              Merchants purchase ad credits via Stripe to fund campaign deliveries. 
              Credits are deducted only when genuine, verified consumers engage.
            </p>
          </div>

          <div className={styles.streamCard}>
            <div className={styles.streamIcon}>💼</div>
            <h4 className={styles.streamTitle}>2. SaaS Subscriptions</h4>
            <span className={styles.streamRate}>$10, $25, $99 / Month</span>
            <p className={styles.streamDesc}>
              Businesses pay monthly recurring tiers for campaign cockpit tools, continuous A/B split testing, and priority proximity boosting.
            </p>
          </div>

          <div className={styles.streamCard}>
            <div className={styles.streamIcon}>🎯</div>
            <h4 className={styles.streamTitle}>3. Inbound Customer Leads</h4>
            <span className={styles.streamRate}>50 – 500 Credits / Lead</span>
            <p className={styles.streamDesc}>
              High-value advertisers pay for direct, consent-driven customer inquiries (demos, quotes, consultations) with zero middleman spam.
            </p>
          </div>

          <div className={styles.streamCard}>
            <div className={styles.streamIcon}>📍</div>
            <h4 className={styles.streamTitle}>4. Hyper-Local Foot Traffic</h4>
            <span className={styles.streamRate}>Cashier Verified Drops</span>
            <p className={styles.streamDesc}>
              Local merchants run proximity promotions and pay for physical in-store redemptions validated by staff PINs at checkout.
            </p>
          </div>
        </div>

        {/* Unit Economics Breakdown */}
        <div className={styles.tableSection}>
          <h3>📊 Unit Economics: What Happens to a $100 Merchant Spend?</h3>
          <table className={styles.economicsTable}>
            <thead>
              <tr>
                <th>Allocation</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Gross Revenue</strong></td>
                <td>Merchant buys 10,000 credits via Stripe</td>
                <td>$100.00</td>
              </tr>
              <tr>
                <td>Payment Processing</td>
                <td>Stripe standard processing fee (2.9% + $0.30)</td>
                <td>-$3.20</td>
              </tr>
              <tr>
                <td>Cloud Infrastructure</td>
                <td>Database, edge runtime & HMAC verification</td>
                <td>-$1.80</td>
              </tr>
              <tr>
                <td>User Cash Rewards Reserve</td>
                <td>Third-party gift cards & direct point rewards</td>
                <td>-$15.00</td>
              </tr>
              <tr>
                <td>Merchant Sponsored Deals</td>
                <td>Free coffee/meal discounts provided by partners</td>
                <td>$0.00</td>
              </tr>
              <tr className={styles.profitRow}>
                <td><strong>AdMe Operating Profit</strong></td>
                <td><strong>Retained platform gross contribution margin</strong></td>
                <td><strong>~$80.00 (80%)</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Privacy Guarantee */}
        <div className={styles.privacyBanner}>
          <div className={styles.privacyIcon}>🔒</div>
          <div>
            <strong>The Zero-Surveillance Promise:</strong> We never sell your personal profile, search history, or device location. 
            All proximity matching is computed on-device with coarse quantization (~1.1km grid, COUNCIL-2026-004) and never written to our database.
          </div>
        </div>

        <p className={styles.footerNote}>
          Documentation verified under <code>docs/BUSINESS_MODEL_AND_UNIT_ECONOMICS.md</code>.
        </p>
      </div>
    </div>
  );
}
