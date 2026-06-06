"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { calculateDistanceMiles } from "@/lib/utils/distance";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/ToastContext";
import styles from "./GeofenceAlert.module.css";

interface ActiveAlert {
  adId: string;
  brandName: string;
  headline: string;
  distance: number;
  couponCode?: string;
}

export function GeofenceAlert() {
  const { location, savedAds, coupons } = useUser();
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [dismissedAds, setDismissedAds] = useState<string[]>([]);

  useEffect(() => {
    // Clear dismissed list if location is cleared
    if (!location) {
      if (dismissedAds.length > 0) {
        setDismissedAds([]);
      }
      if (alerts.length > 0) {
        setAlerts([]);
      }
      return;
    }

    async function checkProximity() {
      if (!location) return;
      if (savedAds.length === 0) {
        if (alerts.length > 0) {
          setAlerts([]);
        }
        return;
      }

      let adsDetails: any[] = [];
      const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here';
      
      if (hasSupabase) {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from('ads')
            .select('*')
            .in('id', savedAds);
          if (data) {
            adsDetails = data.map(ad => ({
              id: ad.id,
              brandName: ad.advertiser_name,
              headline: ad.headline,
              lat: ad.latitude,
              lng: ad.longitude
            }));
          }
        } catch (e) {
          console.error("Failed to query ads for geofencing", e);
        }
      }

      // Fallback/Local mock check
      if (adsDetails.length === 0) {
        const mockAdsPool = [
          { id: '10101010-1010-1010-1010-101010101010', brandName: 'Valor Brews', headline: 'Veteran-Owned Craft Coffee', lat: 34.0195, lng: -118.4912 },
          { id: '30303030-3030-3030-3030-303030303030', brandName: 'The Green Kitchen', headline: 'Organic bowls $5 off', lat: 34.0122, lng: -118.4922 },
          { id: '40404040-4040-4040-4040-404040404040', brandName: 'Nomad Motors', headline: 'EVs starting at $34,900', lat: 34.0522, lng: -118.2437 },
          { id: '20202020-2020-2020-2020-202020202020', brandName: 'Beacon Publishing', headline: 'Discover New Hope', lat: 37.7749, lng: -122.4194 }
        ];
        adsDetails = mockAdsPool.filter(ad => savedAds.includes(ad.id));
      }

      // Calculate distances
      const activeAlerts: ActiveAlert[] = [];
      
      adsDetails.forEach(ad => {
        if (ad.lat != null && ad.lng != null && !dismissedAds.includes(ad.id)) {
          const distance = calculateDistanceMiles(location.lat, location.lng, ad.lat, ad.lng);
          // Trigger alert if within 0.25 miles (approx 1320 feet)
          if (distance <= 0.25) {
            // Check if user has a coupon redeemed for this brand
            const matchingCoupon = coupons.find(c => 
              c.name.toLowerCase().includes(ad.brandName.toLowerCase()) || 
              ad.brandName.toLowerCase().includes(c.name.toLowerCase())
            );

            activeAlerts.push({
              adId: ad.id,
              brandName: ad.brandName,
              headline: ad.headline,
              distance: parseFloat(distance.toFixed(2)),
              couponCode: matchingCoupon?.code
            });
          }
        }
      });

      setAlerts(activeAlerts);
    }

    checkProximity();
  }, [location, savedAds, coupons, dismissedAds]);

  const handleDismiss = (adId: string) => {
    setDismissedAds(prev => [...prev, adId]);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast("Voucher code copied to clipboard!", "success");
  };

  if (alerts.length === 0) return null;

  return (
    <div className={styles.alertContainer}>
      {alerts.map((alert) => (
        <div key={alert.adId} className={`${styles.alertCard} glass`}>
          <button 
            className={styles.closeBtn} 
            onClick={() => handleDismiss(alert.adId)}
            aria-label="Dismiss alert"
          >
            ✕
          </button>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Proximity Deal Alert
              </div>
              <h4 style={{ margin: '0.15rem 0', fontSize: '0.95rem', fontWeight: 'bold' }}>{alert.brandName}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                {alert.headline}
              </p>
              <div style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: 'white', fontWeight: '500' }}>
                🏃 Just {alert.distance} miles away from you!
              </div>

              {alert.couponCode ? (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <code style={{ background: 'hsl(var(--muted))', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {alert.couponCode}
                  </code>
                  <button 
                    onClick={() => handleCopy(alert.couponCode!)} 
                    className="btn" 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    Copy Code
                  </button>
                </div>
              ) : (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                  💡 Redeem points in the Rewards Hub to unlock a coffee voucher code!
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
