"use client";

import { useEffect, useState, useRef } from "react";
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
  lat: number;
  lng: number;
  primaryColor?: string;
}

interface ProximityMiniMapProps {
  userLocation: { lat: number; lng: number };
  targetLocation: { lat: number; lng: number };
  brandColor?: string;
}

export function ProximityMiniMap({ userLocation, targetLocation, brandColor = '#ffb703' }: ProximityMiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useUser();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let dashOffset = 0;
    let pulseRadius = 0;
    let pulseDirection = 1;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      // Draw glassmorphic grid background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw concentric radar lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      for (let r = 30; r < Math.max(width, height); r += 30) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Positions mapping:
      // User is at (40, height - 30) bottom-left
      // Hotspot is at (width - 40, 30) top-right
      const userX = 40;
      const userY = height - 35;
      const targetX = width - 40;
      const targetY = 30;

      // Update animated parameters
      dashOffset -= 0.6;
      pulseRadius += 0.25 * pulseDirection;
      if (pulseRadius > 14) {
        pulseRadius = 14;
        pulseDirection = -1;
      } else if (pulseRadius < 4) {
        pulseRadius = 4;
        pulseDirection = 1;
      }

      // 1. Draw route path line
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = dashOffset;
      ctx.beginPath();
      ctx.moveTo(userX, userY);
      
      // Draw a curved path representing a real road route
      const controlX = (userX + targetX) / 2 + 20;
      const controlY = (userY + targetY) / 2 + 20;
      ctx.quadraticCurveTo(controlX, controlY, targetX, targetY);
      ctx.stroke();
      ctx.restore();

      // 2. Draw user icon (Blue glowing dot)
      ctx.beginPath();
      ctx.arc(userX, userY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#40c9ff';
      ctx.fill();

      // Pulsing outer ring for user
      ctx.beginPath();
      ctx.arc(userX, userY, 10 + Math.sin(Date.now() / 150) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(64, 201, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Draw target hotspot (Brand colored pulsing beacon)
      ctx.beginPath();
      ctx.arc(targetX, targetY, 7, 0, Math.PI * 2);
      ctx.fillStyle = brandColor;
      ctx.fill();

      // Pulsing outer beacon for target
      ctx.beginPath();
      ctx.arc(targetX, targetY, 8 + pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `${brandColor}66`; // 40% opacity
      ctx.lineWidth = 2;
      ctx.stroke();

      // Concentric glow ring
      ctx.beginPath();
      ctx.arc(targetX, targetY, 18 + pulseRadius * 0.4, 0, Math.PI * 2);
      ctx.strokeStyle = `${brandColor}22`; // 13% opacity
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw 'YOU' label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('YOU', userX - 8, userY + 14);

      // Draw 'MERCHANT' label
      ctx.fillStyle = brandColor;
      ctx.font = 'bold 8px monospace';
      ctx.fillText('HOTSPOT', targetX - 20, targetY - 12);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [userLocation, targetLocation, brandColor]);

  return (
    <div style={{ marginTop: '0.65rem', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        width={230} 
        height={100} 
        style={{ 
          background: 'rgba(0, 0, 0, 0.25)', 
          borderRadius: '6px', 
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'block'
        }} 
      />
      <div style={{
        position: 'absolute',
        bottom: '6px',
        right: '6px',
        fontSize: '0.65rem',
        fontFamily: 'monospace',
        color: 'rgba(255, 255, 255, 0.4)',
        background: 'rgba(0, 0, 0, 0.6)',
        padding: '2px 5px',
        borderRadius: '3px',
        border: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        🧭 {t('compass_gps_active')}
      </div>
    </div>
  );
}

function getBearingDirection(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  
  const index = Math.floor(((brng + 22.5) % 360) / 45);
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[index];
}

function isTimeInInterval(current: string, start: string, end: string) {
  if (start <= end) {
    return current >= start && current <= end;
  } else {
    // Spans midnight (e.g. 22:00 to 08:00)
    return current >= start || current <= end;
  }
}

interface ScratchCardProps {
  onComplete: () => void;
  brandName: string;
}

export function ScratchCard({ onComplete, brandName }: ScratchCardProps) {
  const { locale, t } = useUser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scratchedPercent, setScratchedPercent] = useState(0);
  const [completeTriggered, setCompleteTriggered] = useState(false);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with silver scratch overlay
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#c0c0c0');
    grad.addColorStop(0.5, '#e0e0e0');
    grad.addColorStop(1, '#a0a0a0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillText(t('scratch_here'), canvas.width / 2, canvas.height / 2);
  }, [locale]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || completeTriggered) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getMousePos(e);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Calculate percent scratched
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let transparentCount = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentCount++;
    }
    const percent = Math.round((transparentCount / (pixels.length / 4)) * 100);
    setScratchedPercent(percent);

    if (percent >= 60 && !completeTriggered) {
      setCompleteTriggered(true);
      isDrawing.current = false;
      onComplete();
    }
  };

  return (
    <div style={{ position: 'relative', width: '230px', height: '50px', marginTop: '0.65rem', userSelect: 'none' }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(52, 211, 153, 0.15)',
        border: '1px dashed rgb(52, 211, 153)',
        borderRadius: '6px',
        color: 'rgb(52, 211, 153)',
        fontWeight: 'bold',
        fontSize: '0.8rem',
        boxSizing: 'border-box'
      }}>
        🎁 Code: FREE-{brandName.toUpperCase().replace(/\s+/g, '')}-VOUCHER
      </div>
      {!completeTriggered && (
        <canvas
          ref={canvasRef}
          width={230}
          height={50}
          onMouseDown={() => { isDrawing.current = true; }}
          onMouseMove={draw}
          onMouseUp={() => { isDrawing.current = false; }}
          onMouseLeave={() => { isDrawing.current = false; }}
          onTouchStart={() => { isDrawing.current = true; }}
          onTouchMove={draw}
          onTouchEnd={() => { isDrawing.current = false; }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            cursor: 'crosshair',
            borderRadius: '6px',
            touchAction: 'none'
          }}
        />
      )}
    </div>
  );
}

export function GeofenceAlert() {
  const { location, savedAds, coupons, deliveryChannels, quietHours, addReward, locale, t } = useUser();
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [dismissedAds, setDismissedAds] = useState<string[]>([]);
  const [claimedCoupons, setClaimedCoupons] = useState<Record<string, string>>({});

  useEffect(() => {
    // Clear alerts if geofenced channel is disabled
    if (!deliveryChannels.geofenced) {
      if (alerts.length > 0) {
        setAlerts([]);
      }
      return;
    }

    // Clear alerts if currently in quiet hours
    if (quietHours.enabled) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeString = `${hours}:${minutes}`;
      
      if (isTimeInInterval(currentTimeString, quietHours.start, quietHours.end)) {
        if (alerts.length > 0) {
          setAlerts([]);
        }
        return;
      }
    }

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
      console.log("[GeofenceAlert] Checking proximity. Location:", location, "SavedAds:", savedAds);
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
          const fetchPromise = supabase
            .from('ads')
            .select('*')
            .in('id', savedAds);
            
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Supabase query timeout")), 500)
          );

          const { data } = await Promise.race([fetchPromise, timeoutPromise]) as any;
          if (data) {
            adsDetails = data.map((ad: any) => ({
              id: ad.id,
              brandName: ad.advertiser_name,
              headline: ad.headline,
              lat: ad.latitude,
              lng: ad.longitude,
              primaryColor: ad.primary_color
            }));
            console.log("[GeofenceAlert] Loaded ads from Supabase:", adsDetails);
          }
        } catch (e) {
          console.warn("[GeofenceAlert] Supabase query failed or timed out, using fallback:", e);
        }
      }

      // Fallback/Local mock check
      if (adsDetails.length === 0) {
        const mockAdsPool = [
          { id: '10101010-1010-1010-1010-101010101010', brandName: 'Valor Brews', headline: 'Veteran-Owned Craft Coffee', lat: 34.0195, lng: -118.4912, primaryColor: '#ffb703' },
          { id: '30303030-3030-3030-3030-303030303030', brandName: 'The Green Kitchen', headline: 'Organic bowls $5 off', lat: 34.0122, lng: -118.4922, primaryColor: '#2e7d32' },
          { id: '40404040-4040-4040-4040-404040404040', brandName: 'Nomad Motors', headline: 'EVs starting at $34,900', lat: 34.0522, lng: -118.2437, primaryColor: '#1a73e8' },
          { id: '20202020-2020-2020-2020-202020202020', brandName: 'Beacon Publishing', headline: 'Discover New Hope', lat: 37.7749, lng: -122.4194, primaryColor: '#673ab7' }
        ];
        adsDetails = mockAdsPool.filter(ad => savedAds.includes(ad.id));
      }

      // Calculate distances
      const activeAlerts: ActiveAlert[] = [];
      console.log("[GeofenceAlert] Evaluating ads details:", adsDetails);
      
      adsDetails.forEach(ad => {
        if (ad.lat != null && ad.lng != null && !dismissedAds.includes(ad.id)) {
          const distance = calculateDistanceMiles(location.lat, location.lng, ad.lat, ad.lng);
          console.log(`[GeofenceAlert] Ad: ${ad.brandName}, Distance: ${distance.toFixed(4)} miles`);
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
              couponCode: matchingCoupon?.code,
              lat: ad.lat,
              lng: ad.lng,
              primaryColor: ad.primaryColor
            });
          }
        }
      });

      console.log("[GeofenceAlert] Active alerts generated:", activeAlerts);
      setAlerts(activeAlerts);
    }

    checkProximity();
  }, [location, savedAds, coupons, dismissedAds, deliveryChannels, quietHours]);

  const handleScratchComplete = async (alert: ActiveAlert) => {
    addReward(50, `Proximity Drop: ${alert.brandName}`);
    addToast(t("points_awarded_proximity"), 'success');
    
    const generatedCode = `FREE-${alert.brandName.toUpperCase().replace(/\s+/g, '')}-VOUCHER`;
    setClaimedCoupons(prev => ({ ...prev, [alert.adId]: generatedCode }));
    
    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here';
    if (hasSupabase) {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from('coupons').insert({
            user_id: session.user.id,
            code: generatedCode,
            name: `${alert.brandName} - Proximity Deal Voucher`,
            cost_points: 0,
            is_used: false
          });
        }
      } catch (e) {
        console.error("Failed to insert proximity coupon in Supabase:", e);
      }
    }
  };

  const handleDismiss = (adId: string) => {
    setDismissedAds(prev => [...prev, adId]);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast(t("copied_to_clipboard"), "success");
  };

  if (alerts.length === 0) return null;

  return (
    <div className={styles.alertContainer}>
      {alerts.map((alert) => {
        const bearing = location ? getBearingDirection(location.lat, location.lng, alert.lat, alert.lng) : "N";
        const codeToShow = alert.couponCode || claimedCoupons[alert.adId];
        return (
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
                  {t('proximity_deal_alert')}
                </div>
                <h4 style={{ margin: '0.15rem 0', fontSize: '0.95rem', fontWeight: 'bold' }}>{alert.brandName}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                  {alert.headline}
                </p>
                <div style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: 'white', fontWeight: '500' }}>
                  🏃 {t('proximity_distance_info', { distance: alert.distance, bearing })}
                </div>

                {location && (
                  <ProximityMiniMap 
                    userLocation={location}
                    targetLocation={{ lat: alert.lat, lng: alert.lng }}
                    brandColor={alert.primaryColor}
                  />
                )}

                {codeToShow ? (
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <code style={{ background: 'hsl(var(--muted))', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {codeToShow}
                    </code>
                    <button 
                      onClick={() => handleCopy(codeToShow)} 
                      className="btn" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      {t('copy_code')}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                      {t('proximity_drop_desc')}
                    </p>
                    <ScratchCard 
                      brandName={alert.brandName}
                      onComplete={() => handleScratchComplete(alert)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
