"use client";

import { useState, useEffect } from "react";
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
  const { user, preferences, togglePreference, savedAds, coupons, adFrequency, deliveryChannels, quietHours, updateAdControlSettings } = useUser();
  const { addToast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Preferences' | 'Wallet' | 'Controls'>('Preferences');
  const [walletAds, setWalletAds] = useState<Ad[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);

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
          <Link href="/" className={styles.backBtn}>← Back to Feed</Link>
        </div>
        <h1 className={styles.title}>Your Profile</h1>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{user.avatar}</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{user.name}</h2>
            <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
              🔥 {user.currentStreak} Day Streak • ★ {savedAds.length} Saved
            </div>
          </div>
        </div>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'Preferences' ? styles.active : ''}`}
          onClick={() => setActiveTab('Preferences')}
        >
          Preferences
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'Wallet' ? styles.active : ''}`}
          onClick={() => setActiveTab('Wallet')}
        >
          Ad Wallet
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'Controls' ? styles.active : ''}`}
          onClick={() => setActiveTab('Controls')}
        >
          Ad Controls
        </button>
      </div>

      {activeTab === 'Preferences' && (
        <section className={`${styles.section} animate-fade-in`}>
          <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1rem' }}>
            Tune your algorithm. Select the categories you want to see in your feed.
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
                  {cat}
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
            <h3 style={{ marginBottom: '0.75rem' }}>Your Active Vouchers & Coupons</h3>
            {coupons.length === 0 ? (
              <div style={{ padding: '1.5rem', background: 'hsl(var(--muted)/0.3)', border: '1px dashed hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', textAlign: 'center' }}>
                🎟️ No active coupons yet. Go to the Rewards Hub to redeem your points!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--primary)/0.3)', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', fontWeight: 'bold', textTransform: 'uppercase' }}>Voucher</div>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{coupon.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                      <code style={{ background: 'hsl(var(--muted))', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.85rem', fontWeight: 'bold' }}>{coupon.code}</code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(coupon.code);
                          addToast("Coupon code copied!", "success");
                        }}
                        style={{ background: 'none', border: 'none', color: 'hsl(var(--primary))', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h3 style={{ marginBottom: '0.75rem' }}>Saved Offers & Drops</h3>
          {savedAds.length === 0 ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
              <h3>Your wallet is empty</h3>
              <p>Save ads in the feed by clicking the ★ icon.</p>
              <Link href="/" className="btn" style={{ marginTop: '1rem' }}>Explore Feed</Link>
            </div>
          ) : loadingWallet ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>Loading your wallet...</div>
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
            Customize your ad delivery settings, quiet hours, and channel notifications.
          </p>
          
          <div className={styles.controlGrid}>
            {/* Ad Frequency */}
            <div className={styles.controlCard}>
              <div>
                <h3 className={styles.controlGroupTitle}>Ad Insertion Frequency</h3>
                <p className={styles.controlGroupDesc}>Control how often sponsored drops and native campaigns populate your feed.</p>
              </div>
              <div className={styles.freqSelector}>
                <button 
                  type="button" 
                  className={`${styles.freqBtn} ${adFrequency === 'low' ? styles.active : ''}`}
                  onClick={() => updateAdControlSettings({ adFrequency: 'low' })}
                >
                  Low
                </button>
                <button 
                  type="button" 
                  className={`${styles.freqBtn} ${adFrequency === 'balanced' ? styles.active : ''}`}
                  onClick={() => updateAdControlSettings({ adFrequency: 'balanced' })}
                >
                  Balanced
                </button>
                <button 
                  type="button" 
                  className={`${styles.freqBtn} ${adFrequency === 'high' ? styles.active : ''}`}
                  onClick={() => updateAdControlSettings({ adFrequency: 'high' })}
                >
                  High
                </button>
              </div>
              <div className={styles.freqExplain}>
                {adFrequency === 'low' && "🐢 Low: Fewer ad insertions. Focuses only on highly matched preferences."}
                {adFrequency === 'balanced' && "⚖️ Balanced: Standard delivery cadence."}
                {adFrequency === 'high' && "🚀 High: Max drops. Optimized to build rewards fast."}
              </div>
            </div>

            {/* Delivery Channels */}
            <div className={styles.controlCard}>
              <div>
                <h3 className={styles.controlGroupTitle}>Delivery Channels</h3>
                <p className={styles.controlGroupDesc}>Enable or disable direct ad placements by channel.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className={styles.channelRow}>
                  <div className={styles.channelLabel}>
                    <span className={styles.channelName}>Feed-based Placements</span>
                    <span className={styles.channelDesc}>Display native cards directly in your content feed.</span>
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
                    <span className={styles.channelName}>📍 Geofenced Alerts</span>
                    <span className={styles.channelDesc}>Receive proximity card pop-ups when walking near saved locations.</span>
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
                    <span className={styles.channelName}>Push Notifications</span>
                    <span className={styles.channelDesc}>Simulated push delivery for real-time campaign alerts.</span>
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
                  <h3 className={styles.controlGroupTitle}>Quiet Hours</h3>
                  <p className={styles.controlGroupDesc}>Temporarily mute proximity triggers during specific times.</p>
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
                    <label>Start Mute</label>
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
                    <label>End Mute</label>
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
          </div>
        </section>
      )}
    </main>
  );
}
