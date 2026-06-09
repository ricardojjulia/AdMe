"use client";

import { useEffect, useState } from "react";
import { Ad } from "@/types/ad";
import { generateMockAds, generateMockOrganicPosts, OrganicPost } from "@/lib/mock-data";
import { calculateDistanceMiles } from "@/lib/utils/distance";
import { FeedCard } from "./FeedCard";
import { OrganicPostCard } from "./OrganicPostCard";
import { useUser } from "@/lib/UserContext";
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
  const { user, preferences, reportedAds, skippedAds, location, adFrequency, deliveryChannels, t } = useUser();

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
                maxCpcBid: d.max_cpc_bid
            }));
          }
        } catch (e) {
          console.error("Failed to load ads from Supabase", e);
        }
      }

      // Fallback to mock ads if remote failed/empty
      if (filteredAds.length === 0) {
        filteredAds = generateMockAds(100, location || undefined).map((ad, idx) => {
          const isStatic = idx < 4;
          const isVariation = !isStatic && (idx % 6 === 0 || idx % 6 === 1);
          const campaignId = isStatic ? ad.id : (isVariation ? `mock-campaign-${Math.floor(idx / 6)}` : undefined);
          return {
            ...ad,
            isBoosted: isStatic ? ad.isBoosted : (idx % 5 === 0),
            campaignId: campaignId,
            variationName: isVariation ? (idx % 2 === 0 ? 'A' : 'B') : undefined,
            dailyBudget: isStatic ? (idx === 1 ? 1000 : 1200) : 1000,
            creditsSpentToday: isStatic ? 0 : Math.floor(Math.random() * 400),
            ownerId: isStatic ? '00000000-0000-0000-0000-000000000001' : `mock-owner-${idx}`,
            maxCpcBid: isStatic ? (idx === 0 ? 20 : idx === 1 ? 15 : idx === 2 ? 35 : 45) : 15 + Math.floor(Math.random() * 20)
          };
        });
      }

      // 1. Shuffle the global batch client-side
      filteredAds = shuffleArray(filteredAds);

      // 2. Zero-Knowledge Category Matcher
      if (activeTab === 'Local') {
        filteredAds = filteredAds.filter((ad: Ad) => ad.category === 'Local');
      } else {
        filteredAds = filteredAds.filter((ad: Ad) => preferences.includes(ad.category));
      }

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

      // Filter out duplicate variations via split testing
      filteredAds = performABSplitTest(filteredAds, user?.id || null);

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        filteredAds = filteredAds.filter(ad => 
          ad.content.headline.toLowerCase().includes(q) || 
          ad.content.text.toLowerCase().includes(q) ||
          ad.advertiser.name.toLowerCase().includes(q)
        );
      }

      // Now generate and filter Organic Posts
      let filteredPosts = generateMockOrganicPosts();
      if (activeTab === 'Local') {
        filteredPosts = filteredPosts.filter(p => p.category === 'Local Eateries');
      } else {
        filteredPosts = filteredPosts.filter(p => preferences.includes(p.category));
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        filteredPosts = filteredPosts.filter(post => 
          post.content.toLowerCase().includes(q) || 
          post.author.name.toLowerCase().includes(q)
        );
      }

      // 4. Interleave Timeline Items (Contextual Injection)
      const interleaveTimeline: (Ad | OrganicPost)[] = [];
      const usedAdIds = new Set<string>();
      const adSpacing = adFrequency === 'low' ? 5 : (adFrequency === 'balanced' ? 3 : 2);

      filteredPosts.forEach((post) => {
        interleaveTimeline.push(post);

        // Try to contextually place a matching ad directly adjacent
        const matchingAd = filteredAds.find(ad => ad.category === post.category && !usedAdIds.has(ad.id));
        if (matchingAd) {
          interleaveTimeline.push(matchingAd);
          usedAdIds.add(matchingAd.id);
        } else {
          // Fallback to standard spacing
          const unusedAds = filteredAds.filter(ad => !usedAdIds.has(ad.id));
          if (unusedAds.length > 0 && interleaveTimeline.length % adSpacing === 0) {
            interleaveTimeline.push(unusedAds[0]);
            usedAdIds.add(unusedAds[0].id);
          }
        }
      });

      // Append remaining unused ads
      const remainingUnused = filteredAds.filter(ad => !usedAdIds.has(ad.id));
      remainingUnused.forEach(ad => {
        interleaveTimeline.push(ad);
      });

      setTimeline(interleaveTimeline);
      setLoading(false);
    };

    const timer = setTimeout(loadTimeline, 800);
    return () => clearTimeout(timer);
  }, [preferences.join(','), searchQuery, activeTab, location, adFrequency, deliveryChannels]);

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
  const maxAds = adFrequency === 'low' ? 3 : (adFrequency === 'balanced' ? 6 : 10);
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
          {t('feed_empty')}
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
