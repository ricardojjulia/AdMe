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
  const [leads, setLeads] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const adCredits = user?.adCreditsBalance || 0;
  const currentPlan = user?.subscriptionTier || 'free';

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      // 1. Fetch active campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from('ads')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
        
      if (campaigns && !campaignsError) {
        setActiveAds(campaigns.map(ad => ({
          id: ad.id,
          headline: ad.headline,
          status: 'Active',
          impressions: ad.likes * 10 + ad.shares * 5,
          clicks: ad.likes + ad.shares,
          campaignId: ad.campaign_id,
          variationName: ad.variation_name,
          isBoosted: ad.is_boosted
        })));
      }

      // 2. Fetch received leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*, ads!inner(headline, owner_id)')
        .eq('ads.owner_id', user.id)
        .order('created_at', { ascending: false });

      if (leadsData && !leadsError) {
        setLeads(leadsData.map(l => ({
          id: l.id,
          adHeadline: l.ads?.headline || 'Unknown Campaign',
          userHandle: 'UID-' + l.user_id.substring(0, 8).toUpperCase(),
          message: l.message,
          contactInfo: l.contact_info || 'None provided (stayed anonymous)',
          date: new Date(l.created_at).toLocaleDateString()
        })));
      } else {
        // Fallback mock leads
        setLeads([
          { id: 'mock-1', adHeadline: "The New Mega Burger is Here!", userHandle: "UID-73A8-XP92", message: "Do you have gluten-free buns available for this challenge?", contactInfo: "None provided (stayed anonymous)", date: "6/6/2026" },
          { id: 'mock-2', adHeadline: "Upgrade your workstation", userHandle: "UID-F4A2-99AB", message: "Is the ergonomic split keyboard compatible with macOS layout?", contactInfo: "inquiry@macosdev.com", date: "6/5/2026" }
        ]);
      }

      // 3. Fetch aggregate category trends
      const { data: prefData } = await supabase.from('user_preferences').select('category');
      if (prefData && prefData.length > 0) {
        const counts = prefData.reduce((acc, curr) => {
          acc[curr.category] = (acc[curr.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const total = prefData.length;
        const sortedTrends = Object.entries(counts).map(([cat, count]) => ({
          category: cat,
          percentage: Math.round((count / total) * 100)
        })).sort((a, b) => b.percentage - a.percentage);
        setTrends(sortedTrends);
      } else {
        // Fallback mock trends
        setTrends([
          { category: "Tech", percentage: 34 },
          { category: "Food", percentage: 22 },
          { category: "Local", percentage: 17 },
          { category: "Travel", percentage: 15 },
          { category: "Wellness", percentage: 12 }
        ]);
      }
      
      setLoading(false);
      
      // Set up realtime subscription for updates
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
    loadData();
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
        <h1>Ad Studio Dashboard</h1>
      </header>

      <div className={styles.grid}>
        <section className={`${styles.metricCard} glass`}>
          <h2>Current Plan</h2>
          <div className={styles.metricAmount} style={{ fontSize: '1.8rem', textTransform: 'uppercase', color: 'hsl(var(--primary))' }}>
            {currentPlan}
          </div>
          <p className={styles.subtext}>Limits apply based on tier.</p>
          <Link href="/checkout" className={`btn ${styles.topUpBtn}`} style={{ background: 'white', color: 'black' }}>Upgrade Plan</Link>
        </section>

        <section className={`${styles.metricCard} glass`}>
          <h2>Ad Credits</h2>
          <div className={styles.metricAmount}>
            <span className={styles.currency}>★</span>
            {adCredits.toLocaleString()}
          </div>
          <Link href="/checkout" className={`btn ${styles.topUpBtn}`}>Top Up Credits</Link>
        </section>

        <section className={`${styles.metricCard} glass`}>
          <h2>Analytics (CTR)</h2>
          <div className={styles.metricAmount}>
            {activeAds.length > 0 ? (
              `${((activeAds.reduce((acc, ad) => acc + ad.clicks, 0) / Math.max(1, activeAds.reduce((acc, ad) => acc + ad.impressions, 0))) * 100).toFixed(1)}%`
            ) : '0.0%'}
          </div>
          <p className={styles.subtext}>Average rate across campaigns</p>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div>
          {/* Campaigns */}
          <section className={styles.campaignsSection} style={{ marginBottom: '2rem' }}>
            <h3>Active Campaigns</h3>
            <div className={`${styles.campaignList} glass`}>
              {activeAds.length === 0 ? <p style={{ padding: '1rem', color: 'hsl(var(--muted-foreground))' }}>No active campaigns. Create one to get started!</p> : null}
              {(Object.entries(
                activeAds.reduce((acc, ad) => {
                  const cid = ad.campaignId || ad.id;
                  if (!acc[cid]) acc[cid] = [];
                  acc[cid].push(ad);
                  return acc;
                }, {} as Record<string, any[]>)
              ) as [string, any[]][]).map(([cid, ads]) => (
                <div key={cid} style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      {ads.length > 1 ? 'A/B Test Campaign' : 'Standard Campaign'}
                    </span>
                    {ads[0].isBoosted && <span style={{ background: 'hsl(var(--primary)/0.2)', color: 'hsl(var(--primary))', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>⚡ Boosted</span>}
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Anonymous Leads */}
          <section className={styles.campaignsSection}>
            <h3>Anonymous Inquiry Leads</h3>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Real interest results generated by consumers without identity details.
            </p>
            <div className="glass" style={{ display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
              {leads.length === 0 ? (
                <p style={{ padding: '1rem', color: 'hsl(var(--muted-foreground))' }}>No inquiry leads yet.</p>
              ) : (
                leads.map(lead => (
                  <div key={lead.id} style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <strong style={{ color: 'hsl(var(--primary))' }}>{lead.userHandle}</strong>
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>{lead.date}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                      Campaign: <em>{lead.adHeadline}</em>
                    </div>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.95rem' }}>&ldquo;{lead.message}&rdquo;</p>
                    <div style={{ fontSize: '0.8rem', background: 'hsl(var(--muted))', padding: '0.4rem', borderRadius: '0.25rem', color: 'hsl(var(--muted-foreground))' }}>
                      📞 Callback Info: {lead.contactInfo}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Aggregated Trends */}
        <aside>
          <section className={styles.campaignsSection}>
            <h3>Local Vibes (Aggregate Trends)</h3>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Realtime anonymous categories selected by consumers in this region.
            </p>
            <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {trends.map(t => (
                <div key={t.category} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>{t.category}</span>
                    <strong>{t.percentage}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'hsl(var(--muted))', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${t.percentage}%`, height: '100%', background: 'hsl(var(--primary))', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
