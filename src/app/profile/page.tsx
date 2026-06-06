"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import { FeedCard } from "@/components/FeedCard";
import { Ad } from "@/types/ad";
import styles from "./page.module.css";

const ALL_CATEGORIES = [
  "Tech", "Local", "Travel", "Style", "Food", 
  "Design", "Outdoors", "Gaming", "Wellness", "Beauty", "Finance"
];

export default function ProfilePage() {
  const { user, preferences, togglePreference, savedAds } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Preferences' | 'Wallet'>('Preferences');
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
          <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1rem' }}>
            Your saved deals, coupons, and drops.
          </p>
          
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
    </main>
  );
}
