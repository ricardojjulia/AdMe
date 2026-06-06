"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Feed } from "@/components/Feed";
import { useUser } from "@/lib/UserContext";
import styles from "./page.module.css";

const spotlight = {
  badge: "Spotlight drop",
  brand: "Aurora Mobility",
  headline: "Test drive the all-electric Verge at your doorstep.",
  perks: ["Priority booking", "$200 accessory credit", "Concierge pickup"],
};

const topFilters = ["Tech & SaaS", "Local Eateries", "Faith & Books", "Auto under $40k", "Veteran-owned"];
const sideFilters = ["Home & Garden", "Wellness & Health", "Gaming", "Finance"];

export default function Home() {
  const { user, preferences, togglePreference, savedAds, switchRole, location, enableLocation } = useUser();
  const [activeTab, setActiveTab] = useState('For You');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (user && preferences.length === 0 && user.role !== 'business') {
      router.push('/onboarding');
    }
  }, [user, preferences, router]);

  const insights = [
    { label: "Live campaigns", value: "42", tone: "primary" },
    { label: "Rewards in queue", value: `$${user?.rewardsBalance || 0}`, tone: "secondary" },
    { label: "Saved offers", value: savedAds.length.toString(), tone: "muted" },
  ];

  const handleTabClick = async (tab: string) => {
    if (tab === 'Local' && !location) {
      try {
        await enableLocation();
      } catch (e) {
        console.error("Location permission denied", e);
        // still set tab so they can see empty state or whatever
      }
    }
    setActiveTab(tab);
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Image
              src="/ad.me.jpeg"
              alt="AdMe logo"
              fill
              priority
              sizes="64px"
              className={styles.logoImage}
            />
          </div>
          <div>
            <p className={styles.brandTitle}>AdMe</p>
            <p className={styles.brandTagline}>Voluntary, beautiful ads built for you</p>
          </div>
        </div>

        <div className={styles.search}>
          <span aria-hidden className={styles.searchIcon}>⌕</span>
          <input 
            placeholder="Search drops, perks, creators" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          {!user ? (
            <Link href="/login" className={styles.loginLink}>Log in</Link>
          ) : (
            <>
              <button 
                type="button" 
                className={styles.ctaGhost} 
                onClick={() => switchRole(user?.role === 'consumer' ? 'business' : 'consumer')}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Switch to {user?.role === 'consumer' ? 'Business' : 'Consumer'}
              </button>
              <button type="button" className={styles.iconButton} aria-label="Notifications">🔔</button>
              <Link href="/profile" className={styles.iconButton} aria-label="Saved" style={{ textDecoration: 'none' }}>★</Link>
              <Link href="/profile" className={styles.avatar} aria-hidden style={{ textDecoration: 'none' }}>{user.avatar}</Link>
            </>
          )}
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>Curated for you</div>
          <h1>Discover campaigns you actually asked to see.</h1>
          <p>
            Follow brands, toggle categories, and let the feed surprise you. Your attention is the currency—
            pick where you want to spend it.
          </p>

          <div className={styles.filterRow}>
            {topFilters.map((filter) => {
              const isActive = preferences.includes(filter);
              return (
                <button 
                  key={filter} 
                  type="button" 
                  className={`${styles.filterChip} ${isActive ? styles.active : ""}`}
                  onClick={() => togglePreference(filter)}
                  style={isActive ? { backgroundColor: 'var(--foreground)', color: 'var(--background)' } : {}}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          <div className={styles.insights}>
            {user?.role === 'business' ? (
              <Link href="/studio" style={{ textDecoration: 'none' }}>
                <div className={`${styles.insightCard} ${styles.primary} hover-lift`}>
                  <span className={styles.insightValue}>{user?.adCreditsBalance.toLocaleString() || '0'}</span>
                  <span className={styles.insightLabel}>Ad Credits</span>
                </div>
              </Link>
            ) : (
              <>
                <Link href="/rewards" style={{ textDecoration: 'none' }}>
                  <div className={`${styles.insightCard} ${styles.primary} hover-lift`}>
                    <span className={styles.insightValue}>{user?.rewardsBalance.toLocaleString() || '0'}</span>
                    <span className={styles.insightLabel}>Rewards in queue</span>
                  </div>
                </Link>
                {user && user.currentStreak > 0 && (
                  <div className={`${styles.insightCard} ${styles.secondary} hover-lift`}>
                    <span className={styles.insightValue}>🔥 {user.currentStreak}</span>
                    <span className={styles.insightLabel}>Day Streak</span>
                  </div>
                )}
              </>
            )}
            
            <div 
              className={`${styles.insightCard} ${styles.secondary} hover-lift`}
              onClick={() => switchRole(user?.role === 'consumer' ? 'business' : 'consumer')}
              style={{ cursor: 'pointer' }}
            >
              <span className={styles.insightValue}>⟲</span>
              <span className={styles.insightLabel}>Switch Role</span>
            </div>
          </div>
        </div>

        <div className={styles.heroCard}>
          <div className={styles.cardBadge}>{spotlight.badge}</div>
          <h3>{spotlight.brand}</h3>
          <p>{spotlight.headline}</p>
          <div className={styles.perks}>
            {spotlight.perks.map((perk) => (
              <span key={perk} className={styles.perkChip}>{perk}</span>
            ))}
          </div>
          <button type="button" className={styles.cta}>Preview offer</button>
        </div>
      </section>

      <section className={styles.layout}>
        <div className={styles.feedColumn}>
          <div className={styles.feedHeader}>
            <div className={styles.tabs}>
              <button 
                onClick={() => handleTabClick('For You')} 
                className={`${styles.tab} ${activeTab === 'For You' ? styles.active : ''}`}
              >
                For you
              </button>
              <button 
                onClick={() => handleTabClick('Local')} 
                className={`${styles.tab} ${activeTab === 'Local' ? styles.active : ''}`}
              >
                Local {location ? '📍' : ''}
              </button>
              <button 
                onClick={() => handleTabClick('Trending')} 
                className={`${styles.tab} ${activeTab === 'Trending' ? styles.active : ''}`}
              >
                Trending
              </button>
            </div>
            <div className={styles.pill}>Ad frequency: Balanced</div>
          </div>
          <Feed searchQuery={searchQuery} activeTab={activeTab} />
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideHeader}>
              <h4>Tune your vibe</h4>
              <span className={styles.sideMeta}>Realtime</span>
            </div>
            <div className={styles.sideGrid}>
              {sideFilters.map((item) => {
                const isActive = preferences.includes(item);
                return (
                  <button 
                    key={item} 
                    type="button" 
                    className={`${styles.sideChip} ${isActive ? styles.active : ""}`}
                    onClick={() => togglePreference(item)}
                    style={isActive ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', borderColor: 'var(--primary)' } : {}}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideHeader}>
              <h4>Brands you follow</h4>
              <span className={styles.sideMeta}>5 new</span>
            </div>
            <div className={styles.brandList}>
              {["Lumen", "UrbanEat", "Shift Studio", "Wayfinder", "Monocle"].map((brand) => (
                <div key={brand} className={styles.brandRow}>
                  <div className={styles.brandAvatar}>{brand[0]}</div>
                  <div>
                    <p className={styles.brandName}>{brand}</p>
                    <p className={styles.brandSubtext}>Fresh drops this week</p>
                  </div>
                  <button type="button" className={styles.followButton}>Following</button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
