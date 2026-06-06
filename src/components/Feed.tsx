"use client";

import { useEffect, useState } from "react";
import { Ad } from "@/types/ad";
import { generateMockAds } from "@/lib/mock-data";
import { calculateDistanceMiles } from "@/lib/utils/distance";
import { FeedCard } from "./FeedCard";
import { useUser } from "@/lib/UserContext";
import styles from "./Feed.module.css";

interface FeedProps {
  searchQuery?: string;
  activeTab?: string;
}

export function Feed({ searchQuery = '', activeTab = 'For You' }: FeedProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const { preferences, reportedAds, skippedAds, location } = useUser();

  useEffect(() => {
    setLoading(true);
    
    const loadAds = async () => {
      // Try Supabase first
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here') {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const filterCategories = activeTab === 'Local' ? ['Local'] : (preferences.length > 0 ? preferences : ['none']);
          
          let query = supabase
            .from('ads')
            .select('*')
            .in('category', filterCategories);

          if (searchQuery.trim() !== '') {
            query = query.or(`headline.ilike.%${searchQuery}%,content_text.ilike.%${searchQuery}%,advertiser_name.ilike.%${searchQuery}%`);
          }

          const { data, error } = await query.limit(10);
            
          if (data && !error && data.length > 0) {
            let mappedAds: Ad[] = data.map((d: any) => ({
                id: d.id,
                category: d.category,
                formatType: d.format_type,
                advertiser: { name: d.advertiser_name, avatar: d.advertiser_avatar },
                content: { headline: d.headline, text: d.content_text, mediaUrl: d.media_url, mediaType: d.media_type, primaryColor: d.primary_color },
                cta: { label: d.cta_label, url: d.cta_url },
                metrics: { likes: d.likes, shares: d.shares },
                location: d.latitude != null && d.longitude != null ? { lat: d.latitude, lng: d.longitude } : undefined,
                isBoosted: d.is_boosted || false
            }));

            if (location) {
              mappedAds = mappedAds.map((ad: Ad) => {
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
                mappedAds = mappedAds.filter((ad: Ad) => ad.distanceMiles !== undefined && ad.distanceMiles <= 25);
              }
            }

            // Sort: Boosted ads first, then by closest distance (for Local) or default
            mappedAds.sort((a: Ad, b: Ad) => {
              if (a.isBoosted && !b.isBoosted) return -1;
              if (!a.isBoosted && b.isBoosted) return 1;
              if (activeTab === 'Local') {
                return (a.distanceMiles || 0) - (b.distanceMiles || 0);
              }
              return 0;
            });

            setAds(mappedAds);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to load from Supabase", e);
        }
      }

      // Fallback to mock data
      const pool = generateMockAds(100, location || undefined).map((ad, idx) => ({
        ...ad,
        isBoosted: idx % 5 === 0 // 20% of ads boosted
      }));
      let filtered = pool;
      
      if (activeTab === 'Local') {
        filtered = filtered.filter(ad => ad.category === 'Local');
      } else {
        filtered = filtered.filter(ad => preferences.includes(ad.category));
      }
      
      // Calculate distances if location is available
      if (location) {
        filtered = filtered.map(ad => {
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
          filtered = filtered.filter(ad => ad.distanceMiles !== undefined && ad.distanceMiles <= 25);
        }
      }

      // Sort fallback: Boosted ads first, then closest
      filtered.sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        if (activeTab === 'Local') {
          return (a.distanceMiles || 0) - (b.distanceMiles || 0);
        }
        return 0;
      });
      
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(ad => 
          ad.content.headline.toLowerCase().includes(q) || 
          ad.content.text.toLowerCase().includes(q) ||
          ad.advertiser.name.toLowerCase().includes(q)
        );
      }

      setAds(filtered.slice(0, 10));
      setLoading(false);
    };

    const timer = setTimeout(loadAds, 800);
    return () => clearTimeout(timer);
  }, [preferences.join(','), searchQuery, activeTab, location]);

  return (
    <div className={styles.feed}>
      {ads.length === 0 && !loading && (
        <div className={styles.empty}>
          No campaigns found for your vibe. Try tuning your preferences!
        </div>
      )}

      {ads.filter(ad => !reportedAds.includes(ad.id) && !skippedAds.includes(ad.id)).map((ad) => (
        <FeedCard key={ad.id} ad={ad} />
      ))}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.shimmer} />
          <div className={styles.shimmer} />
        </div>
      )}
    </div>
  );
}
