"use client";

import { useState, useEffect } from "react";
import { useUser, DEMO_PERSONAS } from "@/lib/UserContext";
import styles from "./DemoPanel.module.css";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export function DemoPanel() {
  const { user, selectPersona } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const storedId = localStorage.getItem("adme_demo_persona_id");
    setActivePersonaId(storedId);
  }, [user]);

  if (!mounted) return null;

  const handlePersonaSelect = (persona: typeof DEMO_PERSONAS[0]) => {
    localStorage.setItem("adme_demo_persona_id", persona.id);
    setIsOpen(false);
    
    // Redirect based on role
    if (persona.role === "business") {
      window.location.href = "/studio";
    } else {
      window.location.href = "/";
    }
  };

  const handleClear = async () => {
    setActivePersonaId(null);
    setIsOpen(false);
    await selectPersona(null);
  };

  const consumers = DEMO_PERSONAS.filter((p) => p.role === "consumer");
  const businesses = DEMO_PERSONAS.filter((p) => p.role === "business");

  const activePersona = DEMO_PERSONAS.find((p) => p.id === activePersonaId);

  return (
    <div className={styles.container}>
      {/* Floating Toggle Button */}
      <button
        type="button"
        className={`${styles.toggleButton} ${isOpen ? styles.active : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Demo Switcher"
      >
        <span className={styles.toggleIcon}>🎭</span>
        <span className={styles.toggleText}>
          {activePersona ? activePersona.name.split(" ")[0] : "Demo Panel"}
        </span>
        {activePersona && <span className={styles.glowingDot} />}
      </button>

      {/* Panel Drawer */}
      {isOpen && (
        <div className={`${styles.panel} glass`}>
          <div className={styles.header}>
            <div>
              <h3>Demo Persona Switcher</h3>
              <p className={styles.subtitle}>Select a mock session context</p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className={styles.scrollArea}>
            {/* Active Persona Status */}
            {activePersona ? (
              <div className={styles.activeStatusCard}>
                <div className={styles.activeLabel}>Current Active Session:</div>
                <div className={styles.activeUserRow}>
                  <div className={`${styles.avatar} ${activePersona.role === "business" ? styles.businessAvatar : styles.consumerAvatar}`}>
                    {activePersona.avatar}
                  </div>
                  <div className={styles.activeUserInfo}>
                    <span className={styles.activeUserName}>{activePersona.name}</span>
                    <span className={styles.activeUserRole}>
                      {activePersona.role === "business"
                        ? `Business • ${activePersona.subscriptionTier?.toUpperCase()} Tier`
                        : "Consumer User"}
                    </span>
                  </div>
                </div>
                
                {/* Mode controls */}
                <div className={styles.quickNavs}>
                  <Link href="/" className={`${styles.navLink} ${pathname === "/" ? styles.navActive : ""}`}>
                    Feed View
                  </Link>
                  <Link href="/studio" className={`${styles.navLink} ${pathname.startsWith("/studio") ? styles.navActive : ""}`}>
                    Ad Studio
                  </Link>
                  <button type="button" className={styles.clearBtn} onClick={handleClear}>
                    Exit Demo Mode
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.emptyStatus}>
                <p>Using default/live session. Select a persona below to begin override.</p>
              </div>
            )}

            {/* Consumer Section */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Consumers (Feed & Rewards)</h4>
              <div className={styles.personaList}>
                {consumers.map((persona) => {
                  const isActive = activePersonaId === persona.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      className={`${styles.personaCard} ${isActive ? styles.activeCard : ""}`}
                      onClick={() => handlePersonaSelect(persona)}
                    >
                      <div className={`${styles.cardAvatar} ${styles.consumerAvatar}`}>
                        {persona.avatar}
                      </div>
                      <div className={styles.cardDetails}>
                        <div className={styles.cardHeader}>
                          <span className={styles.cardName}>{persona.name}</span>
                          <span className={styles.cardPoints}>🪙 {persona.rewardsBalance} pts</span>
                        </div>
                        <div className={styles.cardPreferences}>
                          {persona.preferences.map((pref) => (
                            <span key={pref} className={styles.prefTag}>
                              {pref}
                            </span>
                          ))}
                        </div>
                        <div className={styles.cardStreak}>
                          🔥 {persona.currentStreak} Day Streak
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Business Section */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Businesses (Ad Creation & Analytics)</h4>
              <div className={styles.personaList}>
                {businesses.map((persona) => {
                  const isActive = activePersonaId === persona.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      className={`${styles.personaCard} ${isActive ? styles.activeCard : ""}`}
                      onClick={() => handlePersonaSelect(persona)}
                    >
                      <div className={`${styles.cardAvatar} ${styles.businessAvatar}`}>
                        {persona.avatar}
                      </div>
                      <div className={styles.cardDetails}>
                        <div className={styles.cardHeader}>
                          <span className={styles.cardName}>{persona.name}</span>
                          <span className={styles.cardCredits}>⚡ {persona.adCreditsBalance.toLocaleString()} cr</span>
                        </div>
                        <div className={styles.cardPreferences}>
                          <span className={styles.tierTag}>
                            {persona.subscriptionTier?.toUpperCase()} PLAN
                          </span>
                        </div>
                        <div className={styles.cardStreak}>
                          Active Campaigns: {persona.id === '00000000-0000-0000-0000-000000000001' ? '4' : '1'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
