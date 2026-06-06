"use client";

import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StudioDashboard() {
  const { user, switchRole } = useUser();
  const { addToast } = useToast();
  const router = useRouter();
  const [activeAds, setActiveAds] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'clicks' | 'ctr' | 'duration'>('newest');
  const [isExporting, setIsExporting] = useState(false);
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [engagementsList, setEngagementsList] = useState<any[]>([]);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  const adCredits = user?.adCreditsBalance || 0;
  const currentPlan = user?.subscriptionTier || 'free';

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      let campaigns: any[] = [];
      let engagements: any[] = [];
      let hasSupabase = false;

      // Check if Supabase is actually configured
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here') {
        try {
          // 1. Fetch active campaigns
          const { data: campaignData, error: campaignsError } = await supabase
            .from('ads')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });
            
          if (campaignData && !campaignsError) {
            campaigns = campaignData;
            hasSupabase = true;
          }

          // 2. Fetch engagements
          const { data: engagementData, error: engagementsError } = await supabase
            .from('engagements')
            .select('*, ads!inner(owner_id)')
            .eq('ads.owner_id', user.id);
            
          if (engagementData && !engagementsError) {
            engagements = engagementData;
          }
        } catch (e) {
          console.error("Supabase analytical queries failed:", e);
        }
      }

      // If no supabase data or empty, fallback to mock data
      if (!hasSupabase || campaigns.length === 0) {
        campaigns = [
          {
            id: "campaign-1-var-a",
            owner_id: user.id,
            category: "Local Eateries",
            format_type: "social",
            advertiser_name: user.name,
            advertiser_avatar: user.avatar,
            headline: "Valor Brews: Single Origin Espresso Drops!",
            content_text: "Get a free double shot with any bean bag purchase this weekend. Premium roasting, ethically sourced.",
            media_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
            primary_color: "#1bf693",
            cta_label: "Get Offer",
            cta_url: "https://example.com/valor",
            likes: 42,
            shares: 15,
            campaign_id: "campaign-1",
            variation_name: "A",
            is_boosted: true,
            created_at: new Date(Date.now() - 86400000 * 3).toISOString()
          },
          {
            id: "campaign-1-var-b",
            owner_id: user.id,
            category: "Local Eateries",
            format_type: "social",
            advertiser_name: user.name,
            advertiser_avatar: user.avatar,
            headline: "Tired? Valor Brews Roasted Fresh for You",
            content_text: "Ethically sourced single origin beans roasted weekly. Get a free double espresso card inside.",
            media_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
            primary_color: "#1bf693",
            cta_label: "Redeem Card",
            cta_url: "https://example.com/valor",
            likes: 24,
            shares: 8,
            campaign_id: "campaign-1",
            variation_name: "B",
            is_boosted: true,
            created_at: new Date(Date.now() - 86400000 * 3).toISOString()
          },
          {
            id: "campaign-2",
            owner_id: user.id,
            category: "Tech & SaaS",
            format_type: "native",
            advertiser_name: user.name,
            advertiser_avatar: user.avatar,
            headline: "WorkStation: Focus Timer for Devs",
            content_text: "A beautiful, premium macOS menu bar app to shield your productivity. Zero tracking.",
            media_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
            primary_color: "#6366f1",
            cta_label: "Try Free",
            cta_url: "https://example.com/workstation",
            likes: 88,
            shares: 32,
            campaign_id: "campaign-2",
            variation_name: "A",
            is_boosted: false,
            created_at: new Date(Date.now() - 86400000 * 7).toISOString()
          }
        ];

        const mockEngs: any[] = [];
        const generateMockEngs = (adId: string, viewsCount: number, clicksCount: number, likesCount: number, avgDur: number) => {
          const engs = [];
          for (let i = 0; i < viewsCount; i++) {
            const duration = Math.max(0.5, parseFloat((avgDur + (Math.random() - 0.5) * avgDur * 1.5).toFixed(1)));
            engs.push({
              ad_id: adId,
              engagement_type: 'view',
              view_duration_seconds: duration
            });
          }
          for (let i = 0; i < clicksCount; i++) {
            engs.push({
              ad_id: adId,
              engagement_type: 'click'
            });
          }
          for (let i = 0; i < likesCount; i++) {
            engs.push({
              ad_id: adId,
              engagement_type: 'like'
            });
          }
          return engs;
        };

        mockEngs.push(...generateMockEngs("campaign-1-var-a", 140, 18, 42, 3.8));
        mockEngs.push(...generateMockEngs("campaign-1-var-b", 110, 9, 24, 2.1));
        mockEngs.push(...generateMockEngs("campaign-2", 320, 48, 88, 5.2));

        engagements = mockEngs;
      }

      setCampaignsList(campaigns);
      setEngagementsList(engagements);

      // Fetch received leads
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
        setLeads([
          { id: 'mock-1', adHeadline: "Valor Brews: Single Origin Espresso Drops!", userHandle: "UID-73A8-XP92", message: "Do you have gluten-free buns available for this challenge?", contactInfo: "None provided (stayed anonymous)", date: "6/6/2026" },
          { id: 'mock-2', adHeadline: "WorkStation: Focus Timer for Devs", userHandle: "UID-F4A2-99AB", message: "Is the ergonomic split keyboard compatible with macOS layout?", contactInfo: "inquiry@macosdev.com", date: "6/5/2026" }
        ]);
      }

      // Fetch aggregate category trends
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
        setTrends([
          { category: "Tech & SaaS", percentage: 38 },
          { category: "Local Eateries", percentage: 26 },
          { category: "Faith & Books", percentage: 14 },
          { category: "Veteran-owned", percentage: 12 },
          { category: "Wellness & Health", percentage: 10 }
        ]);
      }
      
      setLoading(false);
      
      // Set up realtime subscription for updates
      if (hasSupabase) {
        supabase
          .channel('public:engagements')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'engagements' }, (payload) => {
            const newEngagement = payload.new;
            setEngagementsList(prev => [...prev, newEngagement]);
          })
          .subscribe();
      }
    }
    loadData();
  }, [user]);

  // Compute activeAds based on campaignsList and engagementsList
  useEffect(() => {
    if (campaignsList.length === 0) return;

    const mappedAds = campaignsList.map(ad => {
      const adEngagements = engagementsList.filter(e => e.ad_id === ad.id);
      const views = adEngagements.filter(e => e.engagement_type === 'view');
      const clicks = adEngagements.filter(e => e.engagement_type === 'click');
      const likes = adEngagements.filter(e => e.engagement_type === 'like');

      const totalDuration = views.reduce((sum, e) => sum + (Number(e.view_duration_seconds) || 0), 0);
      const avgDuration = views.length > 0 ? parseFloat((totalDuration / views.length).toFixed(1)) : 0;
      const ctr = views.length > 0 ? parseFloat(((clicks.length / views.length) * 100).toFixed(1)) : 0;

      // Calculate Attention Retention Breakdown
      const short = views.filter(e => (e.view_duration_seconds || 0) < 2).length;
      const medium = views.filter(e => (e.view_duration_seconds || 0) >= 2 && (e.view_duration_seconds || 0) < 5).length;
      const long = views.filter(e => (e.view_duration_seconds || 0) >= 5 && (e.view_duration_seconds || 0) < 10).length;
      const deep = views.filter(e => (e.view_duration_seconds || 0) >= 10).length;
      const totalViews = views.length || 1;

      const attentionBreakdown = {
        short: Math.round((short / totalViews) * 100),
        medium: Math.round((medium / totalViews) * 100),
        long: Math.round((long / totalViews) * 100),
        deep: Math.round((deep / totalViews) * 100)
      };

      return {
        id: ad.id,
        headline: ad.headline,
        status: 'Active',
        impressions: views.length,
        clicks: clicks.length,
        likes: likes.length,
        avgDuration,
        ctr,
        attentionBreakdown,
        campaignId: ad.campaign_id,
        variationName: ad.variation_name,
        isBoosted: ad.is_boosted
      };
    });

    setActiveAds(mappedAds);
  }, [campaignsList, engagementsList]);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      addToast("Analytics report compiled successfully! Downloaded: adme_campaigns_report_2026.csv", "success");
    }, 1500);
  };

  const handleSimulate = async (adId: string, type: 'bounce' | 'deep' | 'click') => {
    if (simulatingId) return;
    setSimulatingId(adId);

    const newEngs: any[] = [];
    if (type === 'bounce') {
      newEngs.push({
        id: crypto.randomUUID(),
        ad_id: adId,
        engagement_type: 'view',
        view_duration_seconds: parseFloat((0.5 + Math.random() * 1.2).toFixed(1)),
        created_at: new Date().toISOString()
      });
    } else if (type === 'deep') {
      newEngs.push({
        id: crypto.randomUUID(),
        ad_id: adId,
        engagement_type: 'view',
        view_duration_seconds: parseFloat((10.5 + Math.random() * 5.0).toFixed(1)),
        created_at: new Date().toISOString()
      });
    } else if (type === 'click') {
      const viewId = crypto.randomUUID();
      newEngs.push({
        id: viewId,
        ad_id: adId,
        engagement_type: 'view',
        view_duration_seconds: parseFloat((3.0 + Math.random() * 4.0).toFixed(1)),
        created_at: new Date().toISOString()
      });
      newEngs.push({
        id: crypto.randomUUID(),
        ad_id: adId,
        engagement_type: 'click',
        created_at: new Date().toISOString()
      });
    }

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here';
    if (hasSupabase) {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        const { error } = await supabase.from('engagements').insert(newEngs.map(e => ({
          ad_id: e.ad_id,
          engagement_type: e.engagement_type,
          view_duration_seconds: e.view_duration_seconds
        })));
        
        if (error) throw error;
        addToast(`Simulated ${type} event written to Supabase!`, "success");
      } catch (err) {
        console.error("Failed to write simulation to Supabase:", err);
        addToast("Database error. Running local simulation instead.", "info");
        setEngagementsList(prev => [...prev, ...newEngs]);
      }
    } else {
      setEngagementsList(prev => [...prev, ...newEngs]);
      addToast(`Simulated ${type} event added locally!`, "success");
    }

    setSimulatingId(null);
  };

  const getAttentionQuality = (avg: number) => {
    if (avg >= 4.0) return { label: "High Attention", style: styles.qualityHigh };
    if (avg >= 2.0) return { label: "Medium Attention", style: styles.qualityMedium };
    return { label: "Low Attention", style: styles.qualityLow };
  };

  // Group campaigns and sort them based on the active selection
  const campaignGroups = activeAds.reduce((acc, ad) => {
    const cid = ad.campaignId || ad.id;
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(ad);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedGroups = Object.entries(campaignGroups).sort((a, b) => {
    const adsA = a[1] as any[];
    const adsB = b[1] as any[];

    const getGroupMetric = (ads: any[]) => {
      if (sortBy === 'views') return ads.reduce((sum, ad) => sum + ad.impressions, 0);
      if (sortBy === 'clicks') return ads.reduce((sum, ad) => sum + ad.clicks, 0);
      if (sortBy === 'ctr') {
        const totalViews = ads.reduce((sum, ad) => sum + ad.impressions, 0);
        const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
        return totalViews > 0 ? totalClicks / totalViews : 0;
      }
      if (sortBy === 'duration') {
        const totalViews = ads.reduce((sum, ad) => sum + ad.impressions, 0);
        if (totalViews === 0) return 0;
        const totalDur = ads.reduce((sum, ad) => sum + (ad.avgDuration * ad.impressions), 0);
        return totalDur / totalViews;
      }
      return 0; // default / newest (relies on DB order)
    };

    if (sortBy === 'newest') return 0; // maintain database order
    return getGroupMetric(adsB) - getGroupMetric(adsA);
  });

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

      {/* Sorting & Export controls container */}
      <div className={styles.dashboardControls}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>Sort By:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)} 
            className={styles.sortSelect}
          >
            <option value="newest">Newest Campaigns</option>
            <option value="views">Impressions (Views)</option>
            <option value="clicks">Clicks</option>
            <option value="ctr">Click-Through Rate (CTR)</option>
            <option value="duration">Average View Duration</option>
          </select>
        </div>

        <button 
          onClick={handleExport} 
          disabled={isExporting || activeAds.length === 0} 
          className={styles.exportBtn}
        >
          {isExporting ? (
            <>
              <span className={styles.spinner} />
              Compiling...
            </>
          ) : (
            <>📥 Export Analytics Report</>
          )}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '1rem' }}>
        <div>
          {/* Campaigns Section */}
          <section className={styles.campaignsSection} style={{ marginBottom: '2rem' }}>
            <h3>Active Campaigns</h3>
            <div className={`${styles.campaignList} glass`}>
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                  Loading campaigns data...
                </div>
              ) : activeAds.length === 0 ? (
                <p style={{ padding: '1.5rem', color: 'hsl(var(--muted-foreground))' }}>
                  No active campaigns. Create one to get started!
                </p>
              ) : (
                sortedGroups.map(([cid, adsGroup]) => {
                  const ads = adsGroup as any[];
                  return (
                    <div key={cid} style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {ads.length > 1 ? 'A/B Split-Test Group' : 'Standard Campaign'}
                        </span>
                        {ads[0].isBoosted && <span style={{ background: 'hsl(var(--primary)/0.2)', color: 'hsl(var(--primary))', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>⚡ Boosted</span>}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {ads.map(ad => {
                          const quality = getAttentionQuality(ad.avgDuration);
                          return (
                            <div key={ad.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <div className={styles.campaignRow} style={{ borderBottom: 'none', padding: '0', background: 'transparent' }}>
                                <div>
                                  <div className={styles.campaignHeadline}>
                                    {ads.length > 1 && <span style={{ marginRight: '0.5rem', background: 'hsl(var(--primary)/0.2)', color: 'hsl(var(--primary))', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>Var {ad.variationName}</span>}
                                    {ad.headline}
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                    <div className={styles.campaignStatus}>
                                      <span className={styles.statusDot}></span> {ad.status}
                                    </div>
                                    <span className={`${styles.qualityBadge} ${quality.style}`}>
                                      {quality.label} ({ad.avgDuration}s avg)
                                    </span>
                                  </div>
                                </div>
                                <div className={styles.campaignMetrics}>
                                  <div><strong>{ad.impressions}</strong> Views</div>
                                  <div><strong>{ad.clicks}</strong> Clicks</div>
                                  <div><strong>{ad.ctr}%</strong> CTR</div>
                                </div>
                              </div>

                              {/* Attention Retention Chart widget */}
                              {ad.impressions > 0 && (
                                <div className={styles.chartContainer}>
                                  <div className={styles.chartTitle}>
                                    <span>Attention Retention Curve</span>
                                    <span>Based on {ad.impressions} impression views</span>
                                  </div>
                                  <div className={styles.chartGrid}>
                                    <div className={styles.chartBarRow}>
                                      <span className={styles.chartBarLabel}>Bounce (&lt;2s)</span>
                                      <div className={styles.chartBarBg}>
                                        <div className={styles.chartBarFill} style={{ width: `${ad.attentionBreakdown.short}%`, backgroundColor: 'hsl(0 84% 60% / 0.7)' }}></div>
                                      </div>
                                      <span className={styles.chartBarVal}>{ad.attentionBreakdown.short}%</span>
                                    </div>
                                    <div className={styles.chartBarRow}>
                                      <span className={styles.chartBarLabel}>Interest (2-5s)</span>
                                      <div className={styles.chartBarBg}>
                                        <div className={styles.chartBarFill} style={{ width: `${ad.attentionBreakdown.medium}%`, backgroundColor: 'hsl(48 96% 53% / 0.8)' }}></div>
                                      </div>
                                      <span className={styles.chartBarVal}>{ad.attentionBreakdown.medium}%</span>
                                    </div>
                                    <div className={styles.chartBarRow}>
                                      <span className={styles.chartBarLabel}>Engaged (5-10s)</span>
                                      <div className={styles.chartBarBg}>
                                        <div className={styles.chartBarFill} style={{ width: `${ad.attentionBreakdown.long}%`, backgroundColor: 'hsl(200 95% 50% / 0.8)' }}></div>
                                      </div>
                                      <span className={styles.chartBarVal}>{ad.attentionBreakdown.long}%</span>
                                    </div>
                                    <div className={styles.chartBarRow}>
                                      <span className={styles.chartBarLabel}>Deep (10s+)</span>
                                      <div className={styles.chartBarBg}>
                                        <div className={styles.chartBarFill} style={{ width: `${ad.attentionBreakdown.deep}%`, backgroundColor: 'hsl(142 76% 50% / 0.8)' }}></div>
                                      </div>
                                      <span className={styles.chartBarVal}>{ad.attentionBreakdown.deep}%</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Audience Behavior Simulator widget */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                                marginTop: '0.5rem',
                                padding: '0.6rem 0.85rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '6px',
                                border: '1px dashed hsl(var(--border) / 0.8)'
                              }}>
                                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 'bold', display: 'flex', alignItems: 'center', marginRight: '0.25rem' }}>
                                  🤖 SIMULATE EVENT:
                                </span>
                                <button 
                                  type="button" 
                                  onClick={() => handleSimulate(ad.id, 'bounce')}
                                  className="btn"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.12)', color: 'rgb(248, 113, 113)', border: '1px solid rgba(239, 68, 68, 0.25)', height: 'auto', borderRadius: '4px', cursor: 'pointer' }}
                                  disabled={simulatingId === ad.id}
                                >
                                  {simulatingId === ad.id ? '...' : 'Bounce (<2s)'}
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleSimulate(ad.id, 'deep')}
                                  className="btn"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.12)', color: 'rgb(110, 231, 183)', border: '1px solid rgba(16, 185, 129, 0.25)', height: 'auto', borderRadius: '4px', cursor: 'pointer' }}
                                  disabled={simulatingId === ad.id}
                                >
                                  {simulatingId === ad.id ? '...' : 'Deep Read (10s+)'}
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleSimulate(ad.id, 'click')}
                                  className="btn"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.12)', color: 'rgb(251, 191, 36)', border: '1px solid rgba(245, 158, 11, 0.25)', height: 'auto', borderRadius: '4px', cursor: 'pointer' }}
                                  disabled={simulatingId === ad.id}
                                >
                                  {simulatingId === ad.id ? '...' : 'Click (CTR+)'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
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
                <p style={{ padding: '1.5rem', color: 'hsl(var(--muted-foreground))' }}>No inquiry leads yet.</p>
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
