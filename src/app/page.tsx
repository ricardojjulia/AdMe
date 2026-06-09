"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Feed } from "@/components/Feed";
import { useUser } from "@/lib/UserContext";
import { GeofenceAlert } from "@/components/GeofenceAlert";
import styles from "./page.module.css";

const topFilters = ["Tech & SaaS", "Local Eateries", "Faith & Books", "Veteran-owned"];
const sideFilters = ["Design", "Outdoors", "Gaming", "Wellness", "Beauty", "Finance"];

export default function Home() {
  const { user, preferences, togglePreference, savedAds, switchRole, location, enableLocation, setLocation, locale, setLocale, t } = useUser();
  const [activeTab, setActiveTab] = useState('For You');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const spotlight = {
    badge: t('spotlight_badge'),
    brand: "Aurora Mobility",
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
            <p className={styles.brandTitle}>{t('app_name')}</p>
            <p className={styles.brandTagline}>
              {user ? t('welcome_message', { name: user.name }) : t('app_tagline')}
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
        </div>

        <div className={styles.actions}>
          <select
            className={styles.langSelector}
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            aria-label="Select Language"
          >
            <option value="en-US">English (US)</option>
            <option value="es-PR">Español (PR)</option>
          </select>
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
                {user?.role === 'consumer' ? t('switch_role_business') : t('switch_role_consumer')}
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
          <div className={styles.eyebrow}>{t('hero_eyebrow')}</div>
          <h1>{t('hero_title')}</h1>
          <p>{t('hero_description')}</p>

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
                  {t(filter)}
                </button>
              );
            })}
          </div>

          <div className={styles.insights}>
            {user?.role === 'business' ? (
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
                    <span className={styles.insightValue}>{user?.rewardsBalance.toLocaleString() || '0'}</span>
                    <span className={styles.insightLabel}>{t('points_balance', { points: user?.rewardsBalance.toLocaleString() || '0' })}</span>
                  </div>
                </Link>
                {user && user.currentStreak > 0 && (
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
          <button type="button" className={styles.cta}>{t('preview_offer')}</button>
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
            <div className={styles.pill}>
              {t('ad_frequency_balanced')}
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
                const isActive = preferences.includes(item);
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
              <span className={styles.sideMeta}>{t('brands_new_count')}</span>
            </div>
            <div className={styles.brandList}>
              {["Lumen", "UrbanEat", "Shift Studio", "Wayfinder", "Monocle"].map((brand) => (
                <div key={brand} className={styles.brandRow}>
                  <div className={styles.brandAvatar}>{brand[0]}</div>
                  <div>
                    <p className={styles.brandName}>{brand}</p>
                    <p className={styles.brandSubtext}>{t('fresh_drops')}</p>
                  </div>
                  <button type="button" className={styles.followButton}>{t('following')}</button>
                </div>
              ))}
            </div>
          </div>

          {/* Proximity Simulator Widget Card */}
          <div className={styles.sideCard}>
            <div className={styles.sideHeader}>
              <h4>📍 {t('proximity_simulator')}</h4>
              <span className={styles.sideMeta}>Local Mock</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', margin: '0 0 0.25rem 0', lineHeight: '1.3' }}>
                {t('proximity_desc')}
              </p>
              <button 
                type="button" 
                onClick={() => setLocation({ lat: 34.0196, lng: -118.4913 })}
                className="btn" 
                style={{ display: 'flex', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.85rem', background: location?.lat === 34.0196 ? 'hsl(var(--primary)/0.2)' : 'hsl(var(--muted))', color: location?.lat === 34.0196 ? 'hsl(var(--primary))' : 'white', border: location?.lat === 34.0196 ? '1px solid hsl(var(--primary))' : '1px solid transparent', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}
              >
                {t('at_valor_brews')}
              </button>
              <button 
                type="button" 
                onClick={() => setLocation({ lat: 34.0123, lng: -118.4921 })}
                className="btn" 
                style={{ display: 'flex', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.85rem', background: location?.lat === 34.0123 ? 'hsl(var(--primary)/0.2)' : 'hsl(var(--muted))', color: location?.lat === 34.0123 ? 'hsl(var(--primary))' : 'white', border: location?.lat === 34.0123 ? '1px solid hsl(var(--primary))' : '1px solid transparent', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}
              >
                {t('at_green_kitchen')}
              </button>
              <button 
                type="button" 
                onClick={() => setLocation({ lat: 34.0523, lng: -118.2438 })}
                className="btn" 
                style={{ display: 'flex', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.85rem', background: location?.lat === 34.0523 ? 'hsl(var(--primary)/0.2)' : 'hsl(var(--muted))', color: location?.lat === 34.0523 ? 'hsl(var(--primary))' : 'white', border: location?.lat === 34.0523 ? '1px solid hsl(var(--primary))' : '1px solid transparent', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}
              >
                {t('at_nomad_motors')}
              </button>
              <button 
                type="button" 
                onClick={() => setLocation({ lat: 37.7750, lng: -122.4195 })}
                className="btn" 
                style={{ display: 'flex', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.85rem', background: location?.lat === 37.7750 ? 'hsl(var(--primary)/0.2)' : 'hsl(var(--muted))', color: location?.lat === 37.7750 ? 'hsl(var(--primary))' : 'white', border: location?.lat === 37.7750 ? '1px solid hsl(var(--primary))' : '1px solid transparent', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}
              >
                {t('sf_downtown')}
              </button>
              {location && (
                <button 
                  type="button" 
                  onClick={() => setLocation(null)}
                  className="btn" 
                  style={{ padding: '0.5rem', fontSize: '0.85rem', background: 'hsl(var(--destructive)/0.2)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive)/0.4)', borderRadius: '0.5rem', cursor: 'pointer', marginTop: '0.25rem', fontWeight: 'bold' }}
                >
                  {t('clear_mock_location')}
                </button>
              )}
            </div>
          </div>
        </aside>
      </section>

      {/* Floating Geofence Alerts Trigger */}
      <GeofenceAlert />
    </div>
  );
}

