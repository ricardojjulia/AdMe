"use client";

import { useCallback, useMemo, useState } from "react";
import styles from "./page.module.css";

const accountOptions = [
  {
    key: "individual",
    label: "Individual account",
    blurb: "Follow brands, collect perks, and tune your ad vibe.",
    highlights: ["Personalized feed controls", "Rewards tracking", "Privacy-forward defaults"],
  },
  {
    key: "business",
    label: "Business account",
    blurb: "Launch campaigns, review analytics, and collaborate.",
    highlights: ["Campaign cockpit", "Team roles & approvals", "Conversion-grade insights"],
  },
] as const;

export default function LoginPage() {
  const [type, setType] = useState<(typeof accountOptions)[number]["key"]>("individual");

  const activeOption = useMemo(
    () => accountOptions.find((option) => option.key === type) ?? accountOptions[0],
    [type],
  );

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = {
      type,
      company: formData.get("company")?.toString().trim() || undefined,
      email: formData.get("email")?.toString().trim() || "",
      password: formData.get("password")?.toString() || "",
    };

    // TODO: Replace with real auth call to your backend/identity provider
    console.log("Submitting auth payload", payload);
  }, [type]);

  const handleMagicLink = useCallback(() => {
    // TODO: Wire to magic-link flow (e.g., Supabase, Clerk, custom endpoint)
    console.log("Trigger magic link for account type", { type });
  }, [type]);

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <span className={styles.badge}>Welcome back</span>
        <h1>Choose how you sign in</h1>
        <p>
          Pick the experience tailored for you. AdMe keeps ads voluntary and relevant—whether you&apos;re
          enjoying the feed or running campaigns.
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.toggleRow}>
          {accountOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setType(option.key)}
              className={`${styles.toggle} ${type === option.key ? styles.active : ""}`}
            >
              <span className={styles.toggleLabel}>{option.label}</span>
              <span className={styles.toggleSub}>{option.blurb}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
              <div>
                <p className={styles.formEyebrow}>{activeOption.label}</p>
                <h3>Sign in with email</h3>
              </div>
              <span className={styles.pill}>Secure session</span>
            </div>

            {type === "business" && (
              <label className={styles.field}>
                <span>Company name</span>
                <input name="company" placeholder="e.g., Aurora Mobility" />
              </label>
            )}

            <label className={styles.field}>
              <span>Email</span>
              <input name="email" type="email" placeholder="you@example.com" />
            </label>

            <label className={styles.field}>
              <span>Password</span>
              <input name="password" type="password" placeholder="••••••••" />
            </label>

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryBtn}>
                Continue as {activeOption.label.toLowerCase()}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={handleMagicLink}>
                Use magic link
              </button>
            </div>
          </form>

          <div className={styles.aside}>
            <div className={styles.asideBadge}>What you get</div>
            <p className={styles.asideLead}>{activeOption.blurb}</p>
            <ul className={styles.highlightList}>
              {activeOption.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className={styles.helper}>
              <span className={styles.helperDot} aria-hidden />
              <div>
                <p className={styles.helperTitle}>Need to switch plans?</p>
                <p className={styles.helperCopy}>Your saved ads, campaigns, and analytics stay with your profile.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
