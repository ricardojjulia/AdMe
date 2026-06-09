"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import { FeedCard } from "@/components/FeedCard";
import { Ad } from "@/types/ad";
import styles from "./page.module.css";

const ALL_CATEGORIES = [
  "Tech & SaaS", "Local Eateries", "Faith & Books", "Auto under $40k", "Veteran-owned",
  "Home & Garden", "Wellness & Health", "Gaming", "Finance"
];

export default function ProfilePage() {
  const { user, preferences, togglePreference, savedAds, coupons, adFrequency, deliveryChannels, quietHours, updateAdControlSettings, locale, setLocale, t } = useUser();
  const { addToast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Preferences' | 'Wallet' | 'Controls'>('Preferences');
  const [walletAds, setWalletAds] = useState<Ad[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);

  const handleExportData = () => {
    if (!user) return;
    const dataPackage = {
      anonymousUID: user.id,
      role: user.role,
      rewardsBalance: user.rewardsBalance,
      subscriptionTier: user.subscriptionTier || 'free',
      currentStreak: user.currentStreak,
      preferences: preferences,
      savedAdsCount: savedAds.length,
      vouchers: coupons.map(c => ({ name: c.name, code: c.code, date: c.created_at })),
      exportedAt: new Date().toISOString(),
      platform: "AdMe Privacy-First Ledger"
    };

    const blob = new Blob([JSON.stringify(dataPackage, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `adme_anonymous_profile_${user.id.substring(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast(t('export_success_toast'), "success");
  };

  const handleForgetMe = async () => {
    if (!user) return;
    if (!confirm(t('forget_me_confirm'))) {
      return;
    }

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here';
    if (hasSupabase && !localStorage.getItem('adme_demo_persona_id')) {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { error } = await supabase.from('users').delete().eq('id', session.user.id);
          if (error) throw error;
          await supabase.auth.signOut();
        }
      } catch (e) {
        console.error("Failed to purge Supabase data:", e);
      }
    }

    localStorage.clear();
    addToast(t('purge_success_toast'), "success");
    
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    async function fetchSavedAds() {
      if (activeTab === 'Wallet' && savedAds.length > 0) {
        setLoadingWallet(true);
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        const { data } = await supabase
          .from('ads')
          .select('*')
          .in('id', savedAds);
          
        if (data) {
          // Map data to Ad type
          const formattedAds = data.map(ad => ({
            id: ad.id,
            ownerId: ad.owner_id,
            category: ad.category,
            formatType: ad.format_type as 'social' | 'native' | 'carousel',
            advertiser: {
              name: ad.advertiser_name,
              avatar: ad.advertiser_avatar
            },
            content: {
              headline: ad.headline,
              text: ad.content_text,
              mediaUrl: ad.media_url,
              mediaType: ad.media_type as 'image' | 'video',
              primaryColor: ad.primary_color
            },
            cta: {
              label: ad.cta_label,
              url: ad.cta_url
            },
            metrics: {
              likes: ad.likes,
              shares: ad.shares
            },
            createdAt: ad.created_at
          }));
          setWalletAds(formattedAds);
        }
        setLoadingWallet(false);
      }
    }
    fetchSavedAds();
  }, [activeTab, savedAds]);

  if (!user) return null;

  return (
    <main className={`container ${styles.shell} animate-fade-in`}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/" className={styles.backBtn}>← {t('back_to_feed')}</Link>
        </div>
        <h1 className={styles.title}>{t('profile_title')}</h1>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{user.avatar}</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{user.name}</h2>
            <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
              🔥 {user.currentStreak} {t('day_streak')} • ★ {savedAds.length} {t('saved')}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'Preferences' ? styles.active : ''}`}
          onClick={() => setActiveTab('Preferences')}
        >
          {t('tab_preferences')}
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'Wallet' ? styles.active : ''}`}
          onClick={() => setActiveTab('Wallet')}
        >
          {t('tab_wallet')}
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'Controls' ? styles.active : ''}`}
          onClick={() => setActiveTab('Controls')}
        >
          {t('tab_controls')}
        </button>
      </div>

      {activeTab === 'Preferences' && (
        <section className={`${styles.section} animate-fade-in`}>
          <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1rem' }}>
            {t('preferences_desc')}
          </p>
          <div className={styles.preferencesGrid}>
            {ALL_CATEGORIES.map((cat) => {
              const isActive = preferences.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => togglePreference(cat)}
                  className={`${styles.prefChip} ${isActive ? styles.active : ''} hover-lift`}
                >
                  {t(cat)}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'Wallet' && (
        <section className={`${styles.section} animate-fade-in`}>
          {/* Active Coupons Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>{t('active_vouchers')}</h3>
            {coupons.length === 0 ? (
              <div style={{ padding: '1.5rem', background: 'hsl(var(--muted)/0.3)', border: '1px dashed hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', textAlign: 'center' }}>
                🎟️ {t('no_active_coupons')}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--primary)/0.3)', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('coupon_tag')}</div>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{coupon.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                      <code style={{ background: 'hsl(var(--muted))', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.85rem', fontWeight: 'bold' }}>{coupon.code}</code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(coupon.code);
                          addToast(t('copied_toast'), "success");
                        }}
                        style={{ background: 'none', border: 'none', color: 'hsl(var(--primary))', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                      >
                        {t('copy')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h3 style={{ marginBottom: '0.75rem' }}>{t('saved_offers')}</h3>
          {savedAds.length === 0 ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
              <h3>{t('wallet_empty_title')}</h3>
              <p>{t('wallet_empty_desc')}</p>
              <Link href="/" className="btn" style={{ marginTop: '1rem' }}>{t('explore_feed')}</Link>
            </div>
          ) : loadingWallet ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>{t('loading_wallet')}</div>
          ) : (
            <div className={styles.walletGrid}>
              {walletAds.map((ad) => (
                <FeedCard key={ad.id} ad={ad} />
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'Controls' && (
        <section className={`${styles.section} animate-fade-in`}>
          <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1rem' }}>
            {t('controls_desc')}
          </p>
          
          <div className={styles.controlGrid}>
            {/* Ad Frequency */}
            <div className={styles.controlCard}>
              <div>
                <h3 className={styles.controlGroupTitle}>{t('ad_frequency_title')}</h3>
                <p className={styles.controlGroupDesc}>{t('ad_frequency_desc')}</p>
              </div>
              <div className={styles.freqSelector}>
                <button 
                  type="button" 
                  className={`${styles.freqBtn} ${adFrequency === 'low' ? styles.active : ''}`}
                  onClick={() => updateAdControlSettings({ adFrequency: 'low' })}
                >
                  {t('low')}
                </button>
                <button 
                  type="button" 
                  className={`${styles.freqBtn} ${adFrequency === 'balanced' ? styles.active : ''}`}
                  onClick={() => updateAdControlSettings({ adFrequency: 'balanced' })}
                >
                  {t('balanced')}
                </button>
                <button 
                  type="button" 
                  className={`${styles.freqBtn} ${adFrequency === 'high' ? styles.active : ''}`}
                  onClick={() => updateAdControlSettings({ adFrequency: 'high' })}
                >
                  {t('high')}
                </button>
              </div>
              <div className={styles.freqExplain}>
                {adFrequency === 'low' && t('low_explain')}
                {adFrequency === 'balanced' && t('balanced_explain')}
                {adFrequency === 'high' && t('high_explain')}
              </div>
            </div>

            {/* Delivery Channels */}
            <div className={styles.controlCard}>
              <div>
                <h3 className={styles.controlGroupTitle}>{t('delivery_channels_title')}</h3>
                <p className={styles.controlGroupDesc}>{t('delivery_channels_desc')}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className={styles.channelRow}>
                  <div className={styles.channelLabel}>
                    <span className={styles.channelName}>{t('feed_placements')}</span>
                    <span className={styles.channelDesc}>{t('feed_placements_desc')}</span>
                  </div>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={deliveryChannels.feed} 
                      onChange={(e) => updateAdControlSettings({ 
                        deliveryChannels: { ...deliveryChannels, feed: e.target.checked } 
                      })} 
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.channelRow}>
                  <div className={styles.channelLabel}>
                    <span className={styles.channelName}>📍 {t('geofenced_alerts')}</span>
                    <span className={styles.channelDesc}>{t('geofenced_alerts_desc')}</span>
                  </div>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={deliveryChannels.geofenced} 
                      onChange={(e) => updateAdControlSettings({ 
                        deliveryChannels: { ...deliveryChannels, geofenced: e.target.checked } 
                      })} 
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.channelRow}>
                  <div className={styles.channelLabel}>
                    <span className={styles.channelName}>{t('push_notifications')}</span>
                    <span className={styles.channelDesc}>{t('push_notifications_desc')}</span>
                  </div>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={deliveryChannels.push} 
                      onChange={(e) => updateAdControlSettings({ 
                        deliveryChannels: { ...deliveryChannels, push: e.target.checked } 
                      })} 
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Quiet Hours */}
            <div className={styles.controlCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 className={styles.controlGroupTitle}>{t('quiet_hours_title')}</h3>
                  <p className={styles.controlGroupDesc}>{t('quiet_hours_desc')}</p>
                </div>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={quietHours.enabled} 
                    onChange={(e) => updateAdControlSettings({ 
                      quietHours: { ...quietHours, enabled: e.target.checked } 
                    })} 
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              {quietHours.enabled && (
                <div className={styles.timeInputRow}>
                  <div className={styles.timeField}>
                    <label>{t('start_mute')}</label>
                    <input 
                      type="time" 
                      className={styles.timeInput}
                      value={quietHours.start} 
                      onChange={(e) => updateAdControlSettings({ 
                        quietHours: { ...quietHours, start: e.target.value } 
                      })} 
                    />
                  </div>
                  <div className={styles.timeField}>
                    <label>{t('end_mute')}</label>
                    <input 
                      type="time" 
                      className={styles.timeInput}
                      value={quietHours.end} 
                      onChange={(e) => updateAdControlSettings({ 
                        quietHours: { ...quietHours, end: e.target.value } 
                      })} 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Language Preference */}
            <div className={styles.controlCard}>
              <div>
                <h3 className={styles.controlGroupTitle}>{t('lang_pref_title')}</h3>
                <p className={styles.controlGroupDesc}>{t('lang_pref_desc')}</p>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'calc(var(--radius) - 0.2rem)',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  aria-label="Language Preference"
                >
                  <option value="en-US">English (US)</option>
                  <option value="es-PR">Español (PR)</option>
                </select>
              </div>
            </div>

            {/* Delivery Timeline Visualizer Card */}
            <div className={styles.controlCard} style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <FeedDensityVisualizer 
                adFrequency={adFrequency}
                quietHours={quietHours}
              />
            </div>

            {/* Privacy & Consent Ledger Card */}
            <div className={styles.controlCard} style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <div>
                <h3 className={styles.controlGroupTitle}>🛡️ {t('privacy_ledger_title')}</h3>
                <p className={styles.controlGroupDesc}>
                  {t('privacy_ledger_desc')}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'hsl(var(--muted)/0.2)', padding: '1rem', borderRadius: '6px', border: '1px solid hsl(var(--border)/0.5)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{t('anonymous_uid')}</span>
                  <code style={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}>{user.id}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{t('shared_preferences')}</span>
                  <span style={{ color: 'white' }}>{preferences.length > 0 ? preferences.join(', ') : 'None'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{t('saved_wallet_offers')}</span>
                  <span style={{ color: 'white' }}>{savedAds.length} offers</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{t('voucher_coupons')}</span>
                  <span style={{ color: 'white' }}>{coupons.length} vouchers</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="btn"
                  style={{ flexGrow: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                >
                  📥 {t('export_data_btn')}
                </button>
                
                <button
                  type="button"
                  onClick={handleForgetMe}
                  className="btn"
                  style={{ flexGrow: 1, padding: '0.6rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.15)', color: 'rgb(248, 113, 113)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                >
                  ⚠️ {t('forget_me_btn')}
                </button>
              </div>
            </div>

          </div>
        </section>
      )}
    </main>
  );
}

function isHourInInterval(hour: number, start: string, end: string) {
  const currentStr = `${String(hour).padStart(2, '0')}:00`;
  if (start <= end) {
    return currentStr >= start && currentStr <= end;
  } else {
    return currentStr >= start || currentStr <= end;
  }
}

interface VisualizerProps {
  adFrequency: 'low' | 'balanced' | 'high';
  quietHours: { enabled: boolean; start: string; end: string };
}

export function FeedDensityVisualizer({ adFrequency, quietHours }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [simHour, setSimHour] = useState(new Date().getHours());
  const { t } = useUser();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += w / 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Determine target heights
    const maxVal = adFrequency === 'low' ? 30 : (adFrequency === 'balanced' ? 60 : 90);

    // Draw timeline graph
    ctx.beginPath();
    ctx.moveTo(0, h);

    const points: { x: number; y: number; isMuted: boolean }[] = [];

    for (let hour = 0; hour <= 24; hour++) {
      const x = (hour / 24) * w;
      const isMuted = quietHours.enabled && isHourInInterval(hour % 24, quietHours.start, quietHours.end);
      const val = isMuted ? 0 : maxVal + Math.sin(hour * 0.8) * 8; // add a subtle wave effect
      const y = h - (val / 100) * (h - 20) - 5;
      points.push({ x, y, isMuted });
    }

    // Draw shaded area
    ctx.fillStyle = 'rgba(52, 211, 153, 0.08)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    points.forEach(p => {
      ctx.lineTo(p.x, p.isMuted ? h : p.y);
    });
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = 'rgb(52, 211, 153)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.isMuted ? h : p.y);
      else ctx.lineTo(p.x, p.isMuted ? h : p.y);
    });
    ctx.stroke();

    // Draw quiet hours shaded blocks in red
    if (quietHours.enabled) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.lineWidth = 1;
      
      let startX: number | null = null;
      for (let hour = 0; hour <= 24; hour++) {
        const isMuted = isHourInInterval(hour % 24, quietHours.start, quietHours.end);
        const x = (hour / 24) * w;
        if (isMuted) {
          if (startX === null) startX = x;
        } else {
          if (startX !== null) {
            ctx.fillRect(startX, 0, x - startX, h);
            ctx.beginPath();
            ctx.moveTo(startX, 0); ctx.lineTo(startX, h);
            ctx.moveTo(x, 0); ctx.lineTo(x, h);
            ctx.stroke();
            startX = null;
          }
        }
      }
      if (startX !== null) {
        ctx.fillRect(startX, 0, w - startX, h);
        ctx.stroke();
      }
    }

    // Draw current slider time line marker
    const markerX = (simHour / 24) * w;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(markerX, 0);
    ctx.lineTo(markerX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw simulated point dot
    const isCurrentMuted = quietHours.enabled && isHourInInterval(simHour, quietHours.start, quietHours.end);
    const currentVal = isCurrentMuted ? 0 : maxVal + Math.sin(simHour * 0.8) * 8;
    const markerY = h - (currentVal / 100) * (h - 20) - 5;
    ctx.fillStyle = isCurrentMuted ? 'rgb(239, 68, 68)' : 'rgb(52, 211, 153)';
    ctx.beginPath();
    ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
    ctx.fill();

  }, [simHour, adFrequency, quietHours]);

  const isCurrentMuted = quietHours.enabled && isHourInInterval(simHour, quietHours.start, quietHours.end);
  const statusLabel = isCurrentMuted ? t('visualizer_muted_status') : t('visualizer_active_status');
  const exposureLevel = adFrequency === 'low' ? t('low_ads') : (adFrequency === 'balanced' ? t('balanced_ads') : t('high_ads'));
  const availabilityPct = isCurrentMuted ? 0 : (adFrequency === 'low' ? 30 : (adFrequency === 'balanced' ? 60 : 90));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold' }}>{t('visualizer_title')}</h3>
        <span style={{ fontSize: '0.8rem', color: isCurrentMuted ? 'rgb(248, 113, 113)' : 'rgb(52, 211, 153)', fontWeight: 'bold' }}>
          {statusLabel}
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={100} 
          style={{ 
            width: '100%', 
            height: '100px',
            background: 'rgba(0, 0, 0, 0.2)', 
            borderRadius: '6px', 
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'block' 
          }} 
        />
        <div style={{ position: 'absolute', top: '4px', left: '6px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>Density %</div>
        <div style={{ position: 'absolute', bottom: '2px', left: '6px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>00:00</div>
        <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>12:00</div>
        <div style={{ position: 'absolute', bottom: '2px', right: '6px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>24:00</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
          <span>{t('simulated_time_slider')}</span>
          <span style={{ fontWeight: 'bold', color: 'white' }}>{String(simHour).padStart(2, '0')}:00</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="23" 
          value={simHour} 
          onChange={(e) => setSimHour(parseInt(e.target.value))}
          style={{ 
            width: '100%', 
            height: '6px', 
            borderRadius: '3px',
            background: 'rgba(255,255,255,0.1)',
            outline: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
        <div className="glass" style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>{t('estimated_daily_ads')}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', marginTop: '0.15rem' }}>{exposureLevel}</div>
        </div>
        <div className="glass" style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>{t('time_availability')}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isCurrentMuted ? 'rgb(248, 113, 113)' : 'rgb(52, 211, 153)', marginTop: '0.15rem' }}>
            {availabilityPct}% {t('delivery')}
          </div>
        </div>
      </div>
    </div>
  );
}
