"use client";

import { useEffect, useState } from "react";
import { Ad } from "@/types/ad";
import { OrganicPost } from "@/lib/mock-data";
import { calculateDistanceMiles } from "@/lib/utils/distance";
import { FeedCard } from "./FeedCard";
import { OrganicPostCard } from "./OrganicPostCard";
import { useUser } from "@/lib/UserContext";
import { rankSmartFeed } from "@/lib/services/smart-feed";
import { getLocalDiscoveryAds } from "@/lib/services/local-discovery";
import { getPublicSyndicatedPosts } from "@/lib/services/public-syndication";
import styles from "./Feed.module.css";

interface FeedProps {
  searchQuery?: string;
  activeTab?: string;
}

export function performABSplitTest(ads: Ad[], userId: string | null): Ad[] {
  let deviceId = userId;
  if (!deviceId && typeof window !== 'undefined') {
    deviceId = localStorage.getItem('adme_device_uid');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('adme_device_uid', deviceId);
    }
  }
  if (!deviceId) deviceId = 'anon-default';

  // Group all variations by campaign ID to select the winning variation for each campaign
  const campaignWinners: Record<string, string> = {}; // campaignId -> winning ad id
  const campaignGroups: Record<string, Ad[]> = {};
  
  ads.forEach(ad => {
    if (ad.campaignId) {
      campaignGroups[ad.campaignId] = campaignGroups[ad.campaignId] || [];
      campaignGroups[ad.campaignId].push(ad);
    }
  });

  Object.keys(campaignGroups).forEach(cid => {
    const variations = campaignGroups[cid];
    const str = `${deviceId}:${cid}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % variations.length;
    campaignWinners[cid] = variations[index].id;
  });

  // Filter the original ads array to keep un-grouped ads and only the winning variations
  return ads.filter(ad => {
    if (!ad.campaignId) return true;
    return campaignWinners[ad.campaignId] === ad.id;
  });
}

export function Feed({ searchQuery = '', activeTab = 'For You' }: FeedProps) {
  const [timeline, setTimeline] = useState<(Ad | OrganicPost)[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, preferences, reportedAds, skippedAds, location, locationState, adFrequency, deliveryChannels, t } = useUser();

  useEffect(() => {
    setLoading(true);
    
    const shuffleArray = <T,>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const loadTimeline = async () => {
      let filteredAds: Ad[] = [];

      // Try Supabase first for ads
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here') {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          
          let query = supabase
            .from('ads')
            .select('*');

          if (searchQuery.trim() !== '') {
            query = query.or(`headline.ilike.%${searchQuery}%,content_text.ilike.%${searchQuery}%,advertiser_name.ilike.%${searchQuery}%`);
          }

          // Fetch a larger global batch for Zero-Knowledge client-side filtering
          const { data, error } = await query.limit(100);
            
          if (data && !error && data.length > 0) {
            filteredAds = data.map((d: any) => ({
                id: d.id,
                category: d.category,
                formatType: d.format_type,
                advertiser: { name: d.advertiser_name, avatar: d.advertiser_avatar },
                content: { headline: d.headline, text: d.content_text, mediaUrl: d.media_url, mediaType: d.media_type, primaryColor: d.primary_color },
                cta: { label: d.cta_label, url: d.cta_url },
                metrics: { likes: d.likes, shares: d.shares },
                location: d.latitude != null && d.longitude != null ? { lat: d.latitude, lng: d.longitude } : undefined,
                isBoosted: d.is_boosted || false,
                campaignId: d.campaign_id,
                variationName: d.variation_name,
                dailyBudget: d.daily_budget,
                creditsSpentToday: d.credits_spent_today,
                ownerId: d.owner_id,
                maxCpcBid: d.max_cpc_bid,
                status: d.status || 'active'
            }));
          }
        } catch (e) {
          console.error("Failed to load ads from Supabase", e);
        }
      }

      // Filter out paused or archived campaigns
      filteredAds = filteredAds.filter((ad: Ad) => !ad.status || ad.status === 'active');

      // 1. Shuffle the global batch client-side
      filteredAds = shuffleArray(filteredAds);

      // 2. Zero-Knowledge Category Matcher
      if (activeTab === 'Local') {
        filteredAds = filteredAds.filter((ad: Ad) => ad.category === 'Local Eateries' || ad.category === 'Local' || !!ad.location);
      } else if (searchQuery.trim() !== '') {
        // When user explicitly searches, match across all categories
      } else if (preferences.length > 0) {
        filteredAds = filteredAds.filter((ad: Ad) => preferences.includes(ad.category));
      }
      // If preferences are empty and not searching, show full curated showcase across categories

      // 3. Advertiser Budget Pacemaker Pacing
      const elapsedFraction = (new Date().getHours() * 60 + new Date().getMinutes()) / 1440.0;
      filteredAds = filteredAds.filter((ad: Ad) => {
        const dailyBudget = ad.dailyBudget ?? 1000;
        const spentToday = ad.creditsSpentToday ?? 0;
        
        if (spentToday >= dailyBudget) return false;
        
        const spentFraction = spentToday / dailyBudget;
        if (spentFraction > elapsedFraction) {
          const pacingRate = Math.max(0.1, 1.0 - (spentFraction - elapsedFraction));
          return Math.random() <= pacingRate;
        }
        return true;
      });

      if (location) {
        filteredAds = filteredAds.map((ad: Ad) => {
          if (ad.location) {
            ad.distanceMiles = calculateDistanceMiles(
              location.lat, 
              location.lng, 
              ad.location.lat, 
              ad.location.lng
            );
          }
          return ad;
        });
        
        if (activeTab === 'Local') {
          filteredAds = filteredAds.filter((ad: Ad) => ad.distanceMiles !== undefined && ad.distanceMiles <= 25);
        }
      } else if (activeTab === 'Local') {
        if (locationState.privacyMode !== 'disabled' && locationState.coarseLocation?.city) {
          // Coarse Edge Baseline: Show local merchant deals without requiring GPS sensor
          filteredAds = filteredAds.filter((ad: Ad) => ad.category === 'Local Eateries' || !!ad.location);
        } else {
          // Location disabled
          filteredAds = [];
        }
      }

      // Sort: Boosted ads first, then by Max CPC Bid descending, then by closest distance (for Local) or default
      filteredAds.sort((a: Ad, b: Ad) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;

        const bidA = a.maxCpcBid ?? 15;
        const bidB = b.maxCpcBid ?? 15;
        if (bidA !== bidB) return bidB - bidA;

        if (activeTab === 'Local') {
          return (a.distanceMiles || 0) - (b.distanceMiles || 0);
        }
        return 0;
      });

      // Fetch Local Discovery spots to backfill and enrich local ecosystem (Cold Start Engine)
      try {
        const localDiscoveryAds = await getLocalDiscoveryAds(
          location || null,
          locationState?.coarseLocation || null,
          searchQuery || (preferences.length === 1 ? preferences[0] : undefined)
        );
        filteredAds = [...filteredAds, ...localDiscoveryAds];
      } catch (e) {
        console.warn("Local discovery fetch error:", e);
      }

      // Filter out duplicate variations via split testing
      filteredAds = performABSplitTest(filteredAds, user?.id || null);

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        filteredAds = filteredAds.filter(ad => 
          ad.content.headline.toLowerCase().includes(q) || 
          ad.content.text.toLowerCase().includes(q) ||
          ad.advertiser.name.toLowerCase().includes(q) ||
          (ad.placeDetails?.address && ad.placeDetails.address.toLowerCase().includes(q))
        );
      }

      // Zero-Knowledge Smart Ranking Pipeline:
      // Evaluates Taste Affinity, Time-of-Day match, Exponential Proximity decay, and assigns explainable badges
      filteredAds = rankSmartFeed(filteredAds, {
        preferences,
        userLocation: location,
        activeTab,
        savedAdIds: []
      });

      // Fetch public syndicated community posts (Marketplace & local finds)
      let filteredPosts: OrganicPost[] = [];
      try {
        const syndicatedPosts = await getPublicSyndicatedPosts(
          location || null,
          locationState?.coarseLocation || null,
          searchQuery || undefined
        );
        filteredPosts = [...syndicatedPosts];
      } catch (e) {
        console.warn("Public syndication load error:", e);
      }

      if (activeTab === 'Local') {
        filteredPosts = filteredPosts.filter(p => 
          p.category === 'Local Eateries' || 
          p.category === 'Specialty Coffee' ||
          p.syndication?.sourceType === 'marketplace' ||
          p.syndication?.sourceType === 'local_event' ||
          p.syndication?.sourceType === 'google_review'
        );
      } else if (searchQuery.trim() !== '') {
        // When searching, match across all categories
      } else if (preferences.length > 0) {
        filteredPosts = filteredPosts.filter(p => preferences.includes(p.category) || p.syndication !== undefined);
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        filteredPosts = filteredPosts.filter(post => 
          post.content.toLowerCase().includes(q) || 
          post.author.name.toLowerCase().includes(q) ||
          post.category.toLowerCase().includes(q) ||
          (post.syndication?.neighborhood && post.syndication.neighborhood.toLowerCase().includes(q)) ||
          (post.syndication?.venue && post.syndication.venue.toLowerCase().includes(q))
        );
      }

      // 4. Interleave Timeline Items (Harmonic Content + Ad Dispersion Heuristic)
      const interleaveTimeline: (Ad | OrganicPost)[] = [];
      let adIdx = 0;
      let postIdx = 0;
      const adBatchSize = adFrequency === 'low' ? 3 : (adFrequency === 'balanced' ? 2 : 1);

      while (adIdx < filteredAds.length || postIdx < filteredPosts.length) {
        // Insert a batch of category-dispersed ads
        for (let i = 0; i < adBatchSize && adIdx < filteredAds.length; i++) {
          interleaveTimeline.push(filteredAds[adIdx++]);
        }
        // Insert an organic/marketplace post
        if (postIdx < filteredPosts.length) {
          interleaveTimeline.push(filteredPosts[postIdx++]);
        }
      }

      setTimeline(interleaveTimeline);
      setLoading(false);
    };

    const timer = setTimeout(loadTimeline, 800);
    return () => clearTimeout(timer);
  }, [preferences.join(','), searchQuery, activeTab, location, locationState.privacyMode, locationState.coarseLocation?.city, adFrequency, deliveryChannels]);

  if (!deliveryChannels.feed) {
    return (
      <div className={styles.feed}>
        <div className={styles.empty}>
          📴 {t('feed_disabled')}
        </div>
      </div>
    );
  }

  // Filter out reported / skipped ads and enforce frequency cap for visible items
  const maxAds = adFrequency === 'low' ? 5 : (adFrequency === 'balanced' ? 14 : 25);
  let adCount = 0;
  
  const visibleItems = timeline.filter(item => {
    const isAdItem = (item as Ad).advertiser !== undefined;
    if (isAdItem) {
      const ad = item as Ad;
      if (reportedAds.includes(ad.id) || skippedAds.includes(ad.id)) return false;
      if (adCount >= maxAds) return false;
      adCount++;
      return true;
    }
    return true; // Keep all matching organic posts
  });

  return (
    <div className={styles.feed}>
      {visibleItems.length === 0 && !loading && (
        <div className={styles.empty}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎯</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '0.5rem' }}>
            {t('feed_empty')}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
            No verified active campaigns currently match your selected filters. Try broadening your categories or adjusting location preferences.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a 
              href="/studio/create" 
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', textDecoration: 'none', borderRadius: '0.5rem', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              + Create Campaign in Studio
            </a>
          </div>
        </div>
      )}

      {visibleItems.map((item) => {
        const isAdItem = (item as Ad).advertiser !== undefined;
        if (isAdItem) {
          return <FeedCard key={item.id} ad={item as Ad} />;
        } else {
          return <OrganicPostCard key={item.id} post={item as OrganicPost} />;
        }
      })}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.shimmer} />
          <div className={styles.shimmer} />
        </div>
      )}
    </div>
  );
}
