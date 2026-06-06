"use client";

import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StudioDashboard() {
  const { user, switchRole } = useUser();
  const router = useRouter();
  const [activeAds, setActiveAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const adCredits = user?.adCreditsBalance || 0;

  useEffect(() => {
    async function loadAds() {
      if (!user) return;
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
        
      if (data && !error) {
        setActiveAds(data.map(ad => ({
          id: ad.id,
          headline: ad.headline,
          status: 'Active',
          impressions: ad.likes * 10 + ad.shares * 5, // mock impressions
          clicks: ad.likes + ad.shares, // mock clicks
          campaignId: ad.campaign_id,
          variationName: ad.variation_name
        })));
      }
      setLoading(false);
      
      // Set up realtime subscription
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here') {
        supabase
          .channel('public:engagements')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'engagements' }, (payload) => {
            const newEngagement = payload.new;
            setActiveAds(prevAds => prevAds.map(ad => {
              if (ad.id === newEngagement.ad_id) {
                if (newEngagement.engagement_type === 'view') {
                  return { ...ad, impressions: ad.impressions + 1 };
                }
                if (newEngagement.engagement_type === 'click') {
                  return { ...ad, clicks: ad.clicks + 1 };
                }
              }
              return ad;
            }));
          })
          .subscribe();
      }
    }
    loadAds();
  }, [user]);

  return (
    <main className={`container ${styles.shell} animate-fade-in`}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/" className={styles.backBtn}>← Back to Feed</Link>
          <div className={styles.actions}>
            <button 
              className="btn" 
              style={{ background: 'transparent', border: '1px solid hsl(var(--border))' }}
              onClick={() => { switchRole('consumer'); router.push('/'); }}
            >
              Switch to Consumer
            </button>
            <Link href="/studio/create" className="btn">
              Create Ad
            </Link>
          </div>
        </div>
        <h1>Ad Studio</h1>
      </header>

      <div className={styles.grid}>
        <section className={`${styles.metricCard} glass`}>
          <h2>Ad Credits</h2>
          <div className={styles.metricAmount}>
            <span className={styles.currency}>★</span>
            {adCredits.toLocaleString()}
          </div>
          <Link href="/checkout" className={`btn ${styles.topUpBtn}`}>Top Up Credits</Link>
        </section>

        <section className={`${styles.metricCard} glass`}>
          <h2>Total Impressions</h2>
          <div className={styles.metricAmount}>
            {activeAds.reduce((acc, ad) => acc + ad.impressions, 0).toLocaleString()}
          </div>
          <p className={styles.subtext}>Across {activeAds.length} active campaigns</p>
        </section>

        <section className={`${styles.metricCard} glass`}>
          <h2>Total Clicks</h2>
          <div className={styles.metricAmount}>
            {activeAds.reduce((acc, ad) => acc + ad.clicks, 0).toLocaleString()}
          </div>
          <p className={styles.subtext}>Averaging ~10% CTR</p>
        </section>
      </div>

      <section className={styles.campaignsSection}>
        <h3>Active Campaigns</h3>
        <div className={`${styles.campaignList} glass`}>
          {(Object.entries(
            activeAds.reduce((acc, ad) => {
              const cid = ad.campaignId || ad.id; // fallback to id if no campaign_id
              if (!acc[cid]) acc[cid] = [];
              acc[cid].push(ad);
              return acc;
            }, {} as Record<string, any[]>)
          ) as [string, any[]][]).map(([cid, ads]) => (
            <div key={cid} style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}>
              <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                {ads.length > 1 ? 'A/B Test Campaign' : 'Standard Campaign'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ads.map(ad => (
                  <div key={ad.id} className={styles.campaignRow} style={{ borderBottom: 'none', padding: '0.5rem 0', background: 'transparent' }}>
                    <div>
                      <div className={styles.campaignHeadline}>
                        {ads.length > 1 && <span style={{ marginRight: '0.5rem', background: 'hsl(var(--primary)/0.2)', color: 'hsl(var(--primary))', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>Var {ad.variationName}</span>}
                        {ad.headline}
                      </div>
                      <div className={styles.campaignStatus}>
                        <span className={styles.statusDot}></span> {ad.status}
                      </div>
                    </div>
                    <div className={styles.campaignMetrics}>
                      <div><strong>{ad.impressions}</strong> Views</div>
                      <div><strong>{ad.clicks}</strong> Clicks</div>
                      {ad.impressions > 0 && ads.length > 1 && (
                        <div style={{ color: 'hsl(var(--primary))' }}><strong>{((ad.clicks / ad.impressions) * 100).toFixed(1)}%</strong> CTR</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
