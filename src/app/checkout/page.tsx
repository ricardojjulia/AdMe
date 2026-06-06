"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import styles from "./page.module.css";
import Link from "next/link";
import { useToast } from "@/lib/ToastContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { buyCredits, upgradeSubscription, user } = useUser();
  const { addToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'credits' | 'subscription'>('credits');
  const [selectedPack, setSelectedPack] = useState(10); // $10
  const [selectedSub, setSelectedSub] = useState('starter'); // 'starter', 'growth', 'scale'

  const creditPacks = [
    { price: 10, credits: 1000, label: "Starter" },
    { price: 50, credits: 5000, label: "Growth" },
    { price: 100, credits: 10000, label: "Scale", popular: true },
  ];

  const subPlans = [
    { id: 'starter', name: "Starter Plan", price: 10, perks: ["1 active campaign", "Basic targeting", "Standard support"] },
    { id: 'growth', name: "Growth Plan", price: 25, perks: ["5 active campaigns", "A/B split testing", "Proximity boosting", "Priority support"], popular: true },
    { id: 'scale', name: "Scale Plan", price: 99, perks: ["Unlimited campaigns", "Advanced geographical targeting", "Continuous A/B variants", "Dedicated account manager"] },
  ];

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutMode,
          selectedPack,
          selectedSub,
          userId: user?.id
        })
      });
      const data = await response.json();

      if (data.success) {
        addToast("Connecting to Stripe...", "info");
        setTimeout(async () => {
          if (checkoutMode === 'credits') {
            buyCredits(selectedPack * 100);
            addToast(`Successfully topped up ${selectedPack * 100} credits!`, "success");
          } else {
            await upgradeSubscription(selectedSub);
            addToast(`Successfully upgraded to the ${selectedSub.toUpperCase()} Plan!`, "success");
          }
          setIsProcessing(false);
          router.push('/studio');
        }, 1500);
      } else {
        addToast(data.error || "Payment session error.", "error");
        setIsProcessing(false);
      }
    } catch (e) {
      console.error(e);
      addToast("Payment gateway connection error.", "error");
      setIsProcessing(false);
    }
  };

  const getSummaryLabel = () => {
    if (checkoutMode === 'credits') {
      return `Ad Credits (${selectedPack * 100} ★)`;
    } else {
      const sub = subPlans.find(s => s.id === selectedSub);
      return `${sub?.name} (Monthly)`;
    }
  };

  const getSummaryPrice = () => {
    if (checkoutMode === 'credits') {
      return selectedPack;
    } else {
      const sub = subPlans.find(s => s.id === selectedSub);
      return sub?.price || 0;
    }
  };

  return (
    <main className={`container ${styles.shell} animate-fade-in`}>
      <header className={styles.header}>
        <Link href="/studio" className={styles.backBtn}>← Back to Studio</Link>
        <h1>Billing & Top Up</h1>
        <p className={styles.subtitle}>Privacy-first, consent-based business growth.</p>
      </header>

      {/* Mode Selector */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'hsl(var(--card))', padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', maxWidth: '400px' }}>
        <button
          onClick={() => setCheckoutMode('credits')}
          className="btn"
          style={{
            flex: 1,
            background: checkoutMode === 'credits' ? 'hsl(var(--primary))' : 'transparent',
            color: checkoutMode === 'credits' ? 'black' : 'white',
            fontWeight: 'bold',
          }}
        >
          Buy Credits
        </button>
        <button
          onClick={() => setCheckoutMode('subscription')}
          className="btn"
          style={{
            flex: 1,
            background: checkoutMode === 'subscription' ? 'hsl(var(--primary))' : 'transparent',
            color: checkoutMode === 'subscription' ? 'black' : 'white',
            fontWeight: 'bold',
          }}
        >
          Subscribe Tier
        </button>
      </div>

      <div className={styles.grid}>
        {checkoutMode === 'credits' ? (
          creditPacks.map(pack => (
            <div 
              key={pack.price} 
              className={`${styles.packCard} glass hover-lift ${selectedPack === pack.price ? styles.selected : ''}`}
              onClick={() => setSelectedPack(pack.price)}
              style={{ cursor: 'pointer' }}
            >
              {pack.popular && <div className={styles.badge}>Most Popular</div>}
              <div className={styles.packHeader}>{pack.label}</div>
              <div className={styles.packPrice}>${pack.price}</div>
              <div className={styles.packCredits}>{pack.credits.toLocaleString()} ★</div>
            </div>
          ))
        ) : (
          subPlans.map(plan => (
            <div 
              key={plan.id} 
              className={`${styles.packCard} glass hover-lift ${selectedSub === plan.id ? styles.selected : ''}`}
              onClick={() => setSelectedSub(plan.id)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', minHeight: '260px' }}
            >
              <div>
                {plan.popular && <div className={styles.badge}>Best Value</div>}
                <div className={styles.packHeader} style={{ fontSize: '1.2rem' }}>{plan.name}</div>
                <div className={styles.packPrice} style={{ fontSize: '2rem', margin: '0.5rem 0' }}>${plan.price}<span style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>/mo</span></div>
                <ul style={{ paddingLeft: '1.2rem', textAlign: 'left', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', margin: '0.75rem 0 0' }}>
                  {plan.perks.map(perk => (
                    <li key={perk} style={{ marginBottom: '0.25rem' }}>{perk}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={`${styles.checkoutArea} glass`} style={{ marginTop: '2rem' }}>
        <div className={styles.summary}>
          <h3>Order Summary</h3>
          <div className={styles.summaryRow}>
            <span>{getSummaryLabel()}</span>
            <span>${getSummaryPrice()}.00</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Total Due</span>
            <span>${getSummaryPrice()}.00</span>
          </div>
        </div>

        <button 
          className={`btn ${styles.payBtn}`}
          onClick={handleCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing Payment...' : `Pay $${getSummaryPrice()}.00 (Mock Stripe)`}
        </button>
        <p className={styles.mockNotice}>This is a simulated checkout flow for development purposes.</p>
      </div>
    </main>
  );
}
