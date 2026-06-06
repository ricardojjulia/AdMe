"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import styles from "./page.module.css";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const { buyCredits } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPack, setSelectedPack] = useState(10); // $10

  const handleCheckout = () => {
    setIsProcessing(true);
    // Simulate Stripe processing delay
    setTimeout(() => {
      // Add credits: $1 = 100 credits
      buyCredits(selectedPack * 100);
      setIsProcessing(false);
      router.push('/studio');
    }, 2000);
  };

  const packs = [
    { price: 10, credits: 1000, label: "Starter" },
    { price: 50, credits: 5000, label: "Growth" },
    { price: 100, credits: 10000, label: "Scale", popular: true },
  ];

  return (
    <main className={`container ${styles.shell} animate-fade-in`}>
      <header className={styles.header}>
        <Link href="/studio" className={styles.backBtn}>← Back to Studio</Link>
        <h1>Top Up Ad Credits</h1>
        <p className={styles.subtitle}>Pay only for real human attention. No bots.</p>
      </header>

      <div className={styles.grid}>
        {packs.map(pack => (
          <div 
            key={pack.price} 
            className={`${styles.packCard} glass hover-lift ${selectedPack === pack.price ? styles.selected : ''}`}
            onClick={() => setSelectedPack(pack.price)}
          >
            {pack.popular && <div className={styles.badge}>Most Popular</div>}
            <div className={styles.packHeader}>{pack.label}</div>
            <div className={styles.packPrice}>${pack.price}</div>
            <div className={styles.packCredits}>{pack.credits.toLocaleString()} ★</div>
          </div>
        ))}
      </div>

      <div className={`${styles.checkoutArea} glass`}>
        <div className={styles.summary}>
          <h3>Order Summary</h3>
          <div className={styles.summaryRow}>
            <span>Ad Credits ({selectedPack * 100} ★)</span>
            <span>${selectedPack}.00</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Total</span>
            <span>${selectedPack}.00</span>
          </div>
        </div>

        <button 
          className={`btn ${styles.payBtn}`}
          onClick={handleCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing Payment...' : `Pay $${selectedPack}.00 (Mock Stripe)`}
        </button>
        <p className={styles.mockNotice}>This is a simulated checkout flow for development purposes.</p>
      </div>
    </main>
  );
}
