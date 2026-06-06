"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import styles from "./page.module.css";

const ALL_CATEGORIES = [
  "Tech & SaaS", "Local Eateries", "Faith & Books", "Auto under $40k", "Veteran-owned",
  "Home & Garden", "Wellness & Health", "Gaming", "Finance"
];

export default function OnboardingPage() {
  const { preferences, togglePreference } = useUser();
  const [step, setStep] = useState(1);
  const router = useRouter();

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass animate-fade-in`}>
        
        {step === 1 && (
          <div className={`${styles.step} animate-fade-in`}>
            <div className={styles.iconWrapper}>✨</div>
            <h1 className={styles.title}>Welcome to a new era of ads.</h1>
            <p className={styles.subtitle}>
              Your attention is valuable. We believe you should be rewarded for it.
            </p>
            <button className="btn w-full hover-lift" onClick={nextStep}>Let's go</button>
          </div>
        )}

        {step === 2 && (
          <div className={`${styles.step} animate-fade-in`}>
            <h1 className={styles.title}>What are your vibes?</h1>
            <p className={styles.subtitle}>
              Tell us what you actually want to see.
            </p>
            <div className={styles.grid}>
              {ALL_CATEGORIES.map((category) => {
                const isActive = preferences.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    className={`${styles.chip} ${isActive ? styles.active : ""}`}
                    onClick={() => togglePreference(category)}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
            <button 
              className="btn w-full hover-lift" 
              onClick={nextStep}
              disabled={preferences.length === 0}
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className={`${styles.step} animate-fade-in`}>
            <div className={styles.loader}></div>
            <h1 className={styles.title}>Generating your feed...</h1>
            <p className={styles.subtitle}>
              We're curating campaigns that match your vibe.
            </p>
          </div>
        )}

        <div className={styles.progress}>
            <div className={`${styles.dot} ${step >= 1 ? styles.dotActive : ''}`}></div>
            <div className={`${styles.dot} ${step >= 2 ? styles.dotActive : ''}`}></div>
            <div className={`${styles.dot} ${step >= 3 ? styles.dotActive : ''}`}></div>
        </div>

      </div>
    </div>
  );
}
