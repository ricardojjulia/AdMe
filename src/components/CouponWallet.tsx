"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import { createClient } from "@/lib/supabase/client";

interface Coupon {
  id: string;
  code: string;
  name: string;
  cost_points: number;
  is_used: boolean;
  created_at: string;
}

export function CouponWallet() {
  const { coupons, user, locale, t } = useUser();
  const { addToast } = useToast();
  const [localCoupons, setLocalCoupons] = useState<Coupon[]>([]);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync state with context coupons
  useEffect(() => {
    if (coupons) {
      setLocalCoupons(coupons);
    }
  }, [coupons]);

  // Draw Code-128 barcode on canvas
  useEffect(() => {
    if (!activeCoupon || !barcodeCanvasRef.current) return;
    const canvas = barcodeCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const code = activeCoupon.code;
    const dpr = window.devicePixelRatio || 1;
    const width = 320;
    const height = 120;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Render Background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    // Render text label at bottom
    ctx.fillStyle = "black";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText(code, width / 2, height - 12);

    // Simple deterministic barcode generation (simulate Code 128)
    ctx.fillStyle = "black";
    const startX = 25;
    const endX = width - 25;
    const barW = endX - startX;
    
    // Create a pseudo-random pattern based on coupon code characters
    let seed = 0;
    for (let i = 0; i < code.length; i++) {
      seed = code.charCodeAt(i) + ((seed << 5) - seed);
    }
    
    let currentX = startX;
    let bitIndex = 0;
    
    // Generate barcode bars
    while (currentX < endX - 10) {
      // Deterministic pseudo-random width (1 to 4 pixels)
      const randValue = Math.sin(seed + bitIndex) * 10000;
      const fraction = randValue - Math.floor(randValue);
      const isBar = fraction > 0.4;
      const widthMultiplier = Math.floor(fraction * 3) + 1; // 1 to 3px width

      if (isBar && currentX + widthMultiplier < endX - 5) {
        ctx.fillRect(currentX, 15, widthMultiplier, height - 40);
      }
      
      currentX += widthMultiplier + 1; // space after bar
      bitIndex++;
    }

    // Add quiet zones (thick start/stop lines at boundaries)
    ctx.fillRect(startX, 15, 3, height - 40);
    ctx.fillRect(endX - 8, 15, 3, height - 40);

  }, [activeCoupon]);

  // Handle Mark as Used
  const handleUseCoupon = async (couponId: string) => {
    try {
      const supabase = createClient();
      
      // Update locally first
      setLocalCoupons(prev => prev.map(c => c.id === couponId ? { ...c, is_used: true } : c));
      
      // Check if remote supabase is enabled
      const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here';
      if (hasSupabase) {
        const { error } = await supabase
          .from('coupons')
          .update({ is_used: true })
          .eq('id', couponId);
        if (error) throw error;
      }
      
      addToast(t("coupon_redeemed_success"), "success");
      setActiveCoupon(null);
    } catch (err) {
      console.error("Failed to update coupon status:", err);
      addToast(t("coupon_update_failed"), "error");
    }
  };

  return (
    <section style={{ marginTop: '2rem' }}>
      <h3>{t('coupon_wallet_title')}</h3>
      <p style={{ color: 'hsl(var(--muted-foreground))', margin: '-0.5rem 0 1rem 0' }}>
        {t('coupon_wallet_desc')}
      </p>

      {localCoupons.length === 0 ? (
        <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius)', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎫</div>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            {t('coupon_wallet_empty')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {localCoupons.map((coupon) => (
            <div 
              key={coupon.id} 
              className="glass" 
              style={{ 
                padding: '1.25rem', 
                borderRadius: 'var(--radius)', 
                border: coupon.is_used ? '1px solid rgba(255,255,255,0.05)' : '1px solid hsl(var(--primary)/0.3)',
                background: coupon.is_used ? 'rgba(255,255,255,0.01)' : 'rgba(27, 246, 147, 0.03)',
                opacity: coupon.is_used ? 0.6 : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {coupon.is_used && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '-28px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  transform: 'rotate(45deg)',
                  padding: '2px 30px',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  {t('coupon_used_badge')}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'white' }}>{coupon.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                    {t('redeemed_on', { date: new Date(coupon.created_at).toLocaleDateString() })}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.95rem', letterSpacing: '0.05em', color: 'white' }}>
                  {coupon.code}
                </span>
                
                {!coupon.is_used && (
                  <button 
                    onClick={() => setActiveCoupon(coupon)}
                    className="btn"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: 'auto' }}
                  >
                    {t('view_barcode')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Barcode Visualizer Modal */}
      {activeCoupon && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass" style={{
            padding: '2rem',
            borderRadius: 'var(--radius)',
            maxWidth: '400px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: 'white' }}>{t('in_store_voucher_title')}</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                {activeCoupon.name}
              </p>
            </div>

            {/* Barcode Canvas */}
            <div style={{
              padding: '1rem',
              background: 'white',
              borderRadius: '0.5rem',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <canvas ref={barcodeCanvasRef} style={{ display: 'block' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button 
                onClick={() => handleUseCoupon(activeCoupon.id)}
                className="btn"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', height: 'auto', background: 'hsl(var(--primary))', color: 'black' }}
              >
                {t('mark_as_used')}
              </button>
              <button 
                onClick={() => setActiveCoupon(null)}
                className="btn"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', height: 'auto', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                {t('close_wallet')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
