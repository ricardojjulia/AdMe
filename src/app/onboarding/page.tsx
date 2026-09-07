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
  const { preferences, togglePreference, addReward, t } = useUser();
  const [step, setStep] = useState(1);
  const router = useRouter();

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  useEffect(() => {
    if (step === 3) {
      if (typeof window !== 'undefined') {
        const hasBonus = localStorage.getItem('adme_welcome_bonus_awarded');
        if (!hasBonus) {
          addReward(100, "Welcome Bonus");
          localStorage.setItem('adme_welcome_bonus_awarded', 'true');
        }
      }
      const timer = setTimeout(() => {
        router.push("/");
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [step, router, addReward]);

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass animate-fade-in`}>
        
        {step === 1 && (
          <div className={`${styles.step} animate-fade-in`}>
            <div className={styles.iconWrapper}>✨</div>
            <h1 className={styles.title}>{t('onboarding_welcome_title')}</h1>
            <p className={styles.subtitle}>
              {t('onboarding_welcome_sub')}
            </p>
            <button className="btn w-full hover-lift" onClick={nextStep}>{t('onboarding_lets_go')}</button>
          </div>
        )}

        {step === 2 && (
          <div className={`${styles.step} animate-fade-in`}>
            <h1 className={styles.title}>{t('onboarding_vibes_title')}</h1>
            <p className={styles.subtitle}>
              {t('onboarding_vibes_sub')}
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
                    {t(category)}
                  </button>
                );
              })}
            </div>
            <button 
              className="btn w-full hover-lift" 
              onClick={nextStep}
              disabled={preferences.length === 0}
            >
              {t('onboarding_continue')}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className={`${styles.step} animate-fade-in`}>
            <div className={styles.loader}></div>
            <h1 className={styles.title}>{t('onboarding_generating_title')}</h1>
            <p className={styles.subtitle}>
              {t('onboarding_generating_sub')}
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

