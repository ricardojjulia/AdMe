"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import styles from "./page.module.css";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const fallbackMode = searchParams.get("mode") || "credits";
  const fallbackVal = searchParams.get("val");

  const { buyCredits, upgradeSubscription } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyCheckout() {
      if (!sessionId) {
        setLoading(false);
        setError("No checkout session found.");
        return;
      }

      try {
        const response = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (!isMounted) return;

        if (response.ok && data.success) {
          setVerificationData(data);

          // Update local UserContext balances
          if (data.mode === 'credits' && data.creditsAdded) {
            buyCredits(data.creditsAdded);
          } else if (data.mode === 'subscription' && data.plan) {
            await upgradeSubscription(data.plan);
          } else if (fallbackMode === 'credits' && fallbackVal) {
            buyCredits(Number(fallbackVal) * 100);
          } else if (fallbackMode === 'subscription' && fallbackVal) {
            await upgradeSubscription(fallbackVal);
          }

          setLoading(false);
        } else {
          setError(data.error || "Failed to verify transaction with Stripe.");
          setLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Verification error:", err);
        setError("Network error while verifying checkout.");
        setLoading(false);
      }
    }

    verifyCheckout();

    return () => {
      isMounted = false;
    };
  }, [sessionId, fallbackMode, fallbackVal, buyCredits, upgradeSubscription]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}></div>
        <h2 className={styles.title}>Securing Your Payment...</h2>
        <p className={styles.subtitle}>
          Connecting directly to Stripe to verify your transaction and credit your merchant balance.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.iconWrapper} style={{ borderColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive))' }}>
          ⚠️
        </div>
        <h2 className={styles.title}>Verification Pending</h2>
        <p className={styles.subtitle}>{error}</p>
        <div className={styles.actions}>
          <Link href="/checkout" className={styles.secondaryBtn}>
            Back to Billing
          </Link>
          <Link href="/studio" className={styles.primaryBtn}>
            Go to Studio
          </Link>
        </div>
      </div>
    );
  }

  const isCredits = verificationData?.mode === 'credits' || fallbackMode === 'credits';
  const creditsAmount = verificationData?.creditsAdded || (Number(fallbackVal || 10) * 100);
  const planName = (verificationData?.plan || fallbackVal || 'Starter').toUpperCase();

  return (
    <div className={`container ${styles.container} animate-fade-in`}>
      <div className={styles.iconWrapper}>
        ✓
      </div>
      <h1 className={styles.title}>Payment Confirmed!</h1>
      <p className={styles.subtitle}>
        Your payment has been cryptographically verified through Stripe. Your merchant account balance is updated and ready for campaigns.
      </p>

      <div className={styles.detailsCard}>
        <div className={styles.detailRow}>
          <span className={styles.label}>Transaction Status</span>
          <span className={styles.highlightValue}>Verified & Completed</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Purchase Type</span>
          <span className={styles.value}>{isCredits ? "Ad Delivery Credits" : "Monthly Merchant Tier"}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Fulfillment Details</span>
          <span className={styles.highlightValue}>
            {isCredits ? `+${creditsAmount.toLocaleString()} Credits Added ★` : `${planName} Plan Active`}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Stripe Reference</span>
          <span className={styles.value} style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
            {sessionId?.substring(0, 24)}...
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <Link href="/studio" className={styles.primaryBtn}>
          Launch Campaigns in Studio →
        </Link>
        <Link href="/checkout" className={styles.secondaryBtn}>
          Top Up More
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.loadingSpinner}></div>
        <h2 className={styles.title}>Loading Checkout Confirmation...</h2>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
