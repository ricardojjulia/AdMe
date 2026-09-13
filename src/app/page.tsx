"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Feed } from "@/components/Feed";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import { GeofenceAlert } from "@/components/GeofenceAlert";
import { LocationBadge } from "@/components/location/LocationBadge";
import { TransparencyModal } from "@/components/TransparencyModal";
import styles from "./page.module.css";

const topFilters = [
  "Tech & SaaS",
  "Local Eateries",
  "Faith & Books",
  "Veteran-owned",
  "Specialty Coffee",
  "Design",
  "Outdoors",
  "Gaming",
  "Wellness",
  "Beauty",
  "Finance"
];
const sideFilters = ["Design", "Outdoors", "Gaming", "Wellness", "Beauty", "Finance"];

export default function Home() {
  const { user, preferences, togglePreference, savedAds, switchRole, location, enableLocation, setLocation, locale, setLocale, t } = useUser();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('For You');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTransparency, setShowTransparency] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const spotlight = {
    badge: t('spotlight_badge'),
    brand: "AdMe Zero-Knowledge Protocol",
    headline: t('spotlight_headline'),
    perks: [
      t('spotlight_perk_1'),
      t('spotlight_perk_2'),
      t('spotlight_perk_3')
    ],
  };

  useEffect(() => {
    if (user && preferences.length === 0 && user.role !== 'business') {
      router.push('/onboarding');
    }
  }, [user, preferences, router]);

  const handleTabClick = async (tab: string) => {
    if (tab === 'Local' && !location) {
      try {
        await enableLocation();
      } catch (e) {
        console.error("Location permission denied", e);
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
            <p className={styles.brandTitle}>{t('app_name')}</p>
            <p className={styles.brandTagline}>
              {mounted && user ? t('welcome_message', { name: user.name }) : t('app_tagline')}
            </p>
          </div>
        </div>

        <div className={styles.search}>
          <span aria-hidden className={styles.searchIcon}>⌕</span>
          <input 
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className={`${styles.searchKbd} ${styles.desktopOnly}`}>⌘K</span>
        </div>

        <div className={styles.actions}>
          <select
            className={styles.langSelector}
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            aria-label="Select Language"
            title="Select Language"
          >
            <option value="en-US">🌐 English (US)</option>
            <option value="es-PR">🌐 Español (PR)</option>
          </select>
          {!mounted ? (
            <div style={{ width: "90px", height: "36px" }} />
          ) : !user ? (
            <Link href="/login" className={styles.loginLink}>Log in</Link>
          ) : (
            <>
              {/* Role / Mode Switcher Pill */}
              <button 
                type="button" 
                className={`${styles.roleToggleBtn} ${styles.desktopOnly}`} 
                onClick={() => {
                  const nextRole = user?.role === 'consumer' ? 'business' : 'consumer';
                  switchRole(nextRole);
                  addToast(
                    nextRole === 'business' 
                      ? "Switched to Business Studio mode" 
                      : "Switched to Consumer Feed mode",
                    "info"
                  );
                }}
                title={user?.role === 'consumer' ? "Switch to Business Studio mode" : "Switch to Consumer Feed mode"}
              >
                <span className={user?.role === 'business' ? styles.roleDotBusiness : styles.roleDotConsumer} />
                <span className={styles.roleText}>
                  {user?.role === 'business' ? (t('nav_mode_business') || "Business Studio") : (t('nav_mode_consumer') || "Consumer Feed")}
                </span>
                <span className={styles.roleSwitchHint}>
                  ⇄ {t('nav_switch_to') || "Switch"}
                </span>
              </button>

              {/* Notifications Button with Text & Badge */}
              <button 
                type="button" 
                className={`${styles.navActionButton} ${styles.desktopOnly}`} 
                onClick={() => addToast("No new alerts. You're all caught up!", "info")}
                title="View Notifications & Announcements" 
                aria-label="Notifications"
              >
                <span className={styles.navActionIcon}>🔔</span>
                <span className={styles.navActionLabel}>{t('nav_alerts') || "Alerts"}</span>
                <span className={styles.navBadgePulse}>1</span>
              </button>

              {/* Saved Ads with Text & Count Badge */}
              <Link 
                href="/profile" 
                className={`${styles.navActionButton} ${styles.desktopOnly}`} 
                title="View your Saved Ads & Offers" 
                aria-label="Saved Bookmarks"
              >
                <span className={styles.navActionIcon} style={{ color: 'hsl(var(--secondary))' }}>★</span>
                <span className={styles.navActionLabel}>{t('saved') || "Saved"}</span>
                {savedAds.length > 0 && (
                  <span className={styles.navBadgeCount}>{savedAds.length}</span>
                )}
              </Link>

              {/* Account Pill with Avatar & Name */}
              <Link 
                href="/profile" 
                className={styles.accountPill} 
                title="Account Settings & Privacy" 
                aria-label="Account Settings"
              >
                <div className={styles.avatarMini}>{user.avatar}</div>
                <div className={styles.accountInfo}>
                  <span className={styles.accountName}>{user.name.split(' ')[0]}</span>
                  <span className={styles.accountRole}>{user.role === 'business' ? 'Studio' : 'Member'}</span>
                </div>
              </Link>
            </>
          )}
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>{t('hero_eyebrow')}</div>
          <h1>{t('hero_title')}</h1>
          <p>{t('hero_description')}</p>

          <div className={styles.filterRow} id="vibe-filter-section">
            {topFilters.map((filter) => {
              const isActive = mounted && preferences.includes(filter);
              return (
                <button 
                  key={filter} 
                  type="button" 
                  className={`${styles.filterChip} ${isActive ? styles.active : ""}`}
                  onClick={() => togglePreference(filter)}
                  style={isActive ? { backgroundColor: 'var(--foreground)', color: 'var(--background)' } : {}}
                >
                  {t(filter) || filter}
                </button>
              );
            })}
          </div>

          <div className={styles.insights}>
            {mounted && user?.role === 'business' ? (
              <Link href="/studio" style={{ textDecoration: 'none' }}>
                <div className={`${styles.insightCard} ${styles.primary} hover-lift`}>
                  <span className={styles.insightValue}>{user?.adCreditsBalance.toLocaleString() || '0'}</span>
                  <span className={styles.insightLabel}>{t('ad_credits', { credits: user?.adCreditsBalance.toLocaleString() || '0' })}</span>
                </div>
              </Link>
            ) : (
              <>
                <Link href="/rewards" style={{ textDecoration: 'none' }}>
                  <div className={`${styles.insightCard} ${styles.primary} hover-lift`}>
                    <span className={styles.insightValue}>{mounted && user ? user.rewardsBalance.toLocaleString() : '0'}</span>
                    <span className={styles.insightLabel}>{t('points_balance', { points: mounted && user ? user.rewardsBalance.toLocaleString() : '0' })}</span>
                  </div>
                </Link>
                {mounted && user && user.currentStreak > 0 && (
                  <div className={`${styles.insightCard} ${styles.secondary} hover-lift`}>
                    <span className={styles.insightValue}>🔥 {user.currentStreak}</span>
                    <span className={styles.insightLabel}>{t('day_streak')}</span>
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
              <span className={styles.insightLabel}>{t('switch_role')}</span>
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
          <button 
            type="button" 
            className={styles.cta}
            onClick={() => {
              const el = document.getElementById('feed-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t('preview_offer')}
          </button>
        </div>
      </section>

      <section id="feed-section" className={styles.layout}>
        <div className={styles.feedColumn}>
          <div className={styles.feedHeader}>
            <div className={styles.tabs}>
              <button 
                onClick={() => handleTabClick('For You')} 
                className={`${styles.tab} ${activeTab === 'For You' ? styles.active : ''}`}
              >
                {t('tab_for_you')}
              </button>
              <button 
                onClick={() => handleTabClick('Local')} 
                className={`${styles.tab} ${activeTab === 'Local' ? styles.active : ''}`}
              >
                {t('tab_local')} {location ? '📍' : ''}
              </button>
              <button 
                onClick={() => handleTabClick('Trending')} 
                className={`${styles.tab} ${activeTab === 'Trending' ? styles.active : ''}`}
              >
                {t('tab_trending')}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <LocationBadge />
              <div className={styles.pill}>
                {t('ad_frequency_balanced')}
              </div>
            </div>
          </div>
          <Feed searchQuery={searchQuery} activeTab={activeTab} />
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideHeader}>
              <h4>{t('tune_vibe')}</h4>
              <span className={styles.sideMeta}>{t('realtime')}</span>
            </div>
            <div className={styles.sideGrid}>
              {sideFilters.map((item) => {
                const isActive = mounted && preferences.includes(item);
                return (
                  <button 
                    key={item} 
                    type="button" 
                    className={`${styles.sideChip} ${isActive ? styles.active : ""}`}
                    onClick={() => togglePreference(item)}
                    style={isActive ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', borderColor: 'var(--primary)' } : {}}
                  >
                    {t(item)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideHeader}>
              <h4>{t('brands_follow')}</h4>
              <span className={styles.sideMeta}>Verified</span>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', margin: '0 0 0.75rem 0', lineHeight: '1.4' }}>
                Follow verified merchants as you discover them in your feed.
              </p>
              <a 
                href="/studio/create"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.35rem', 
                  fontSize: '0.82rem', 
                  color: 'hsl(var(--primary))', 
                  textDecoration: 'none', 
                  fontWeight: 600 
                }}
              >
                + Register as a Merchant →
              </a>
            </div>
          </div>

          {/* Transparency & Economics Card */}
          <div className={`${styles.sideCard} glass hover-lift`} style={{ borderColor: 'hsl(var(--primary) / 0.35)', background: 'radial-gradient(circle at top right, hsl(var(--primary) / 0.08) 0%, hsl(var(--card)) 100%)' }}>
            <div className={styles.sideHeader}>
              <h4>⚖️ How AdMe Makes Money</h4>
              <span className={styles.sideMeta} style={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}>100% Open</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', margin: '0.5rem 0 0.75rem 0', lineHeight: '1.4' }}>
              No hidden data tracking. No selling profiles. Discover how our consent-based attention marketplace operates.
            </p>
            <button 
              type="button" 
              onClick={() => setShowTransparency(true)}
              className="btn" 
              style={{ 
                width: '100%', 
                padding: '0.55rem', 
                fontSize: '0.85rem', 
                background: 'hsl(var(--primary) / 0.15)', 
                color: 'hsl(var(--primary))', 
                border: '1px solid hsl(var(--primary) / 0.3)', 
                borderRadius: '0.5rem', 
                cursor: 'pointer', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <span>View Business Model & Economics</span>
              <span>→</span>
            </button>
          </div>
        </aside>
      </section>

      {/* Floating Geofence Alerts Trigger */}
      <GeofenceAlert />

      {/* Business Model Transparency Modal */}
      <TransparencyModal 
        isOpen={showTransparency} 
        onClose={() => setShowTransparency(false)} 
      />
    </div>
  );
}

