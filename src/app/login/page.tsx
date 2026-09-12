"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import { loginWithEmail, loginWithMagicLink } from "./actions";
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
  const router = useRouter();
  const { sessionMode, exitDemoMode, refreshUser } = useUser();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [type, setType] = useState<(typeof accountOptions)[number]["key"]>("individual");

  const activeOption = useMemo(
    () => accountOptions.find((option) => option.key === type) ?? accountOptions[0],
    [type],
  );

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData(event.currentTarget);
    formData.append("type", type);
    formData.append("authMode", authMode);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Synchronize client-side supabase session if possible
      if (email && password) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          await supabase.auth.signInWithPassword({ email, password });
        } catch {
          // Ignore client sync errors; server action will set cookies
        }
      }

      const result = await loginWithEmail(formData);

      if (result?.error) {
        setErrorMsg(result.error);
        setLoading(false);
      } else if (result?.redirectTo) {
        if (refreshUser) {
          await refreshUser();
        }
        router.push(result.redirectTo);
        // Leave loading true during page transition to prevent button flicker
        return;
      } else if (typeof result?.success === "string") {
        setSuccessMsg(result.success);
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Login submission error:", err);
      setErrorMsg(err?.message || "Connection error. Please try again.");
      setLoading(false);
    }
  }, [type, authMode, router, refreshUser]);

  const handleMagicLink = useCallback(async () => {
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
    if (!emailInput || !emailInput.value) {
      setErrorMsg("Please enter an email address for the magic link.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("email", emailInput.value);
    formData.append("type", type);

    try {
      const result = await loginWithMagicLink(formData);

      if (result?.error) {
        setErrorMsg(result.error);
      } else if (result?.success) {
        setSuccessMsg(result.success);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to send magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [type]);

  return (
    <div className={styles.shell}>
      {sessionMode === "demo" && (
        <div style={{
          background: "hsl(var(--primary) / 0.15)",
          border: "1px solid hsl(var(--primary) / 0.3)",
          color: "hsl(var(--foreground))",
          padding: "0.75rem 1.25rem",
          borderRadius: "0.75rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.9rem"
        }}>
          <span>🎮 <strong>Demo Persona Active</strong>: You are previewing with simulated personas. Signing in below activates your authentic session.</span>
          <Link href="/" style={{ color: "hsl(var(--primary))", textDecoration: "underline", fontWeight: 600 }}>Return to Feed</Link>
        </div>
      )}

      <div className={styles.header}>
        <span className={styles.badge}>{authMode === "signin" ? "Welcome back" : "Get started"}</span>
        <h1>{authMode === "signin" ? "Sign in to AdMe" : "Create your account"}</h1>
        <p>
          AdMe keeps ads voluntary, privacy-first, and high-value—whether you&apos;re
          curating your personal feed or launching local campaigns.
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
            {/* Auth Mode Toggle Tabs (Sign In vs Sign Up) */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              background: "hsl(var(--muted) / 0.3)",
              padding: "0.25rem",
              borderRadius: "0.5rem",
              marginBottom: "1.25rem"
            }}>
              <button
                type="button"
                onClick={() => { setAuthMode("signin"); setErrorMsg(""); setSuccessMsg(""); }}
                style={{
                  padding: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  borderRadius: "0.375rem",
                  border: "none",
                  cursor: "pointer",
                  background: authMode === "signin" ? "hsl(var(--card))" : "transparent",
                  color: authMode === "signin" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: authMode === "signin" ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                  transition: "all 0.2s"
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("signup"); setErrorMsg(""); setSuccessMsg(""); }}
                style={{
                  padding: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  borderRadius: "0.375rem",
                  border: "none",
                  cursor: "pointer",
                  background: authMode === "signup" ? "hsl(var(--card))" : "transparent",
                  color: authMode === "signup" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: authMode === "signup" ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                  transition: "all 0.2s"
                }}
              >
                Create Account
              </button>
            </div>

            <div className={styles.formHeader}>
              <div>
                <p className={styles.formEyebrow}>{activeOption.label}</p>
                <h3>{authMode === "signin" ? "Sign in with email" : "Register with email"}</h3>
              </div>
              <span className={styles.pill}>Secure session</span>
            </div>

            {errorMsg && <div style={{ color: 'hsl(var(--destructive))', fontSize: '0.9rem', marginBottom: '1rem', padding: '0.5rem', background: 'hsl(var(--destructive)/0.1)', borderRadius: 'var(--radius)' }}>{errorMsg}</div>}
            {successMsg && <div style={{ color: 'hsl(var(--primary))', fontSize: '0.9rem', marginBottom: '1rem', padding: '0.5rem', background: 'hsl(var(--primary)/0.1)', borderRadius: 'var(--radius)' }}>{successMsg}</div>}

            {type === "business" && authMode === "signup" && (
              <label className={styles.field}>
                <span>Company name *</span>
                <input name="company" placeholder="e.g., Aurora Mobility" required />
              </label>
            )}

            <label className={styles.field}>
              <span>Email address</span>
              <input name="email" type="email" placeholder="you@example.com" required />
            </label>

            <label className={styles.field}>
              <span>Password (minimum 6 characters)</span>
              <input name="password" type="password" placeholder="••••••••" required minLength={6} />
            </label>

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryBtn} disabled={loading}>
                {loading ? "Processing..." : authMode === "signin" ? `Sign in as ${activeOption.label.toLowerCase()}` : `Create ${activeOption.label.toLowerCase()}`}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={handleMagicLink} disabled={loading}>
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
                <p className={styles.helperTitle}>Zero PII Guarantee</p>
                <p className={styles.helperCopy}>Your real name and browsing habits are never shared with advertisers or third parties.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

