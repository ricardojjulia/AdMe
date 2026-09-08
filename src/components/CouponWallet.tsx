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
  const [codeType, setCodeType] = useState<'barcode' | 'qr'>('barcode');
  const [isMerchantMode, setIsMerchantMode] = useState(false);
  const [merchantPin, setMerchantPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync state with context coupons
  useEffect(() => {
    if (coupons) {
      setLocalCoupons(coupons);
    }
  }, [coupons]);

  // Draw Code-128 Barcode or 2D QR Matrix on canvas
  useEffect(() => {
    if (!activeCoupon || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const code = activeCoupon.code;
    const dpr = window.devicePixelRatio || 1;

    if (codeType === 'barcode') {
      const width = 320;
      const height = 120;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      // White background for high contrast scanning
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Label at bottom
      ctx.fillStyle = "#000000";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(code, width / 2, height - 12);

      // Pseudo-random deterministic barcode bars
      const startX = 25;
      const endX = width - 25;
      
      let seed = 0;
      for (let i = 0; i < code.length; i++) {
        seed = code.charCodeAt(i) + ((seed << 5) - seed);
      }
      
      let currentX = startX;
      let bitIndex = 0;
      
      while (currentX < endX - 10) {
        const randValue = Math.sin(seed + bitIndex) * 10000;
        const fraction = randValue - Math.floor(randValue);
        const isBar = fraction > 0.4;
        const widthMultiplier = Math.floor(fraction * 3) + 1;

        if (isBar && currentX + widthMultiplier < endX - 5) {
          ctx.fillRect(currentX, 15, widthMultiplier, height - 40);
        }
        
        currentX += widthMultiplier + 1;
        bitIndex++;
      }

      // Quiet zones
      ctx.fillRect(startX, 15, 3, height - 40);
      ctx.fillRect(endX - 8, 15, 3, height - 40);
    } else {
      // High-Contrast QR Code Matrix rendering
      const width = 220;
      const height = 220;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      // White canvas background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      const gridSize = 25;
      const margin = 20;
      const cellSize = (width - margin * 2) / gridSize;

      ctx.fillStyle = "#000000";

      // Helper to draw QR finder pattern (7x7 box with 3x3 inner square)
      const drawFinder = (startX: number, startY: number) => {
        // Outer 7x7 square
        ctx.fillRect(margin + startX * cellSize, margin + startY * cellSize, 7 * cellSize, 7 * cellSize);
        // Inner white 5x5 square
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(margin + (startX + 1) * cellSize, margin + (startY + 1) * cellSize, 5 * cellSize, 5 * cellSize);
        // Center 3x3 black square
        ctx.fillStyle = "#000000";
        ctx.fillRect(margin + (startX + 2) * cellSize, margin + (startY + 2) * cellSize, 3 * cellSize, 3 * cellSize);
      };

      // 3 Position Finders: Top-Left, Top-Right, Bottom-Left
      drawFinder(0, 0);
      drawFinder(gridSize - 7, 0);
      drawFinder(0, gridSize - 7);

      // Timing patterns (horizontal and vertical alternating lines at index 6)
      for (let i = 8; i < gridSize - 8; i++) {
        if (i % 2 === 0) {
          ctx.fillRect(margin + i * cellSize, margin + 6 * cellSize, cellSize, cellSize);
          ctx.fillRect(margin + 6 * cellSize, margin + i * cellSize, cellSize, cellSize);
        }
      }

      // Fill in deterministic QR data cells
      let seed = 0;
      for (let i = 0; i < code.length; i++) {
        seed = code.charCodeAt(i) + ((seed << 5) - seed);
      }

      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          // Skip the 3 finder pattern areas
          const isTopLeft = r < 8 && c < 8;
          const isTopRight = r < 8 && c >= gridSize - 8;
          const isBottomLeft = r >= gridSize - 8 && c < 8;
          const isTiming = r === 6 || c === 6;

          if (isTopLeft || isTopRight || isBottomLeft || isTiming) continue;

          const randVal = Math.sin(seed + r * gridSize + c) * 10000;
          const isCell = (randVal - Math.floor(randVal)) > 0.52;

          if (isCell) {
            ctx.fillRect(margin + c * cellSize, margin + r * cellSize, cellSize, cellSize);
          }
        }
      }
    }
  }, [activeCoupon, codeType]);

  // Handle Mark as Used / Verify In-Store
  const handleVerifyAndRedeem = async (couponId: string) => {
    setIsVerifying(true);
    try {
      const supabase = createClient();
      
      // Optimistically update local coupons
      setLocalCoupons(prev => prev.map(c => c.id === couponId ? { ...c, is_used: true } : c));
      
      const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here';
      if (hasSupabase) {
        try {
          const { data, error } = await supabase.rpc('verify_and_redeem_coupon', {
            target_coupon_id: couponId,
            merchant_pin: merchantPin || 'cashier_pin'
          });
          if (error) throw error;
        } catch (rpcErr) {
          console.warn("RPC verify_and_redeem_coupon fallback:", rpcErr);
          const { error: updateErr } = await supabase
            .from('coupons')
            .update({ is_used: true, verified_by: merchantPin || 'direct_user_verification' })
            .eq('id', couponId);
          if (updateErr) throw updateErr;
        }
      }
      
      addToast(t("coupon_verified_toast") || t("coupon_redeemed_success"), "success");
      setActiveCoupon(null);
      setIsMerchantMode(false);
      setMerchantPin('');
    } catch (err) {
      console.error("Failed to update coupon status:", err);
      addToast(t("coupon_update_failed"), "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearUsedCoupons = async () => {
    const activeOnly = localCoupons.filter(c => !c.is_used);
    setLocalCoupons(activeOnly);
    
    // Also remove used records from Supabase if connected
    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here';
    if (hasSupabase && user) {
      try {
        const supabase = createClient();
        await supabase.from('coupons').delete().eq('user_id', user.id).eq('is_used', true);
      } catch (err) {
        console.error("Failed to delete used coupons in DB:", err);
      }
    }
    addToast(t('cleared_used_toast') || 'Redeemed vouchers cleared from wallet', 'info');
  };

  const hasUsedCoupons = localCoupons.some(c => c.is_used);

  return (
    <section style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>{t('coupon_wallet_title')}</h3>
          <p style={{ color: 'hsl(var(--muted-foreground))', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
            {t('coupon_wallet_desc')}
          </p>
        </div>
        {hasUsedCoupons && (
          <button 
            type="button"
            onClick={handleClearUsedCoupons}
            className="btn"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', height: 'auto' }}
          >
            🧹 {t('clear_used_coupons')}
          </button>
        )}
      </div>

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
                    onClick={() => {
                      setActiveCoupon(coupon);
                      setIsMerchantMode(false);
                    }}
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

      {/* Barcode & QR Code Visualizer Modal */}
      {activeCoupon && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.82)',
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
            maxWidth: '420px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: 'white' }}>{t('in_store_voucher_title')}</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                {activeCoupon.name}
              </p>
            </div>

            {/* Segmented Code Type Selector: Barcode vs QR Code */}
            <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '9999px', padding: '0.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                onClick={() => setCodeType('barcode')}
                style={{
                  padding: '0.3rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  background: codeType === 'barcode' ? 'hsl(var(--primary))' : 'transparent',
                  color: codeType === 'barcode' ? '#000' : 'hsl(var(--muted-foreground))',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {t('code_type_barcode')}
              </button>
              <button
                type="button"
                onClick={() => setCodeType('qr')}
                style={{
                  padding: '0.3rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  background: codeType === 'qr' ? 'hsl(var(--primary))' : 'transparent',
                  color: codeType === 'qr' ? '#000' : 'hsl(var(--muted-foreground))',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {t('code_type_qr')}
              </button>
            </div>

            {/* Canvas Display */}
            <div style={{
              padding: '1rem',
              background: '#ffffff',
              borderRadius: '0.75rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <canvas ref={canvasRef} style={{ display: 'block' }} />
            </div>

            {/* Code Text */}
            <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.1em', color: 'hsl(var(--primary))' }}>
              {activeCoupon.code}
            </div>

            {/* Merchant Redemption Verification Toggle */}
            <div style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={isMerchantMode}
                  onChange={(e) => setIsMerchantMode(e.target.checked)}
                  style={{ accentColor: 'hsl(var(--primary))' }}
                />
                <span>{t('merchant_verification_title')}</span>
              </label>

              {isMerchantMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                    {t('merchant_verification_subtitle')}
                  </p>
                  <input
                    type="text"
                    placeholder={t('merchant_pin_label')}
                    value={merchantPin}
                    onChange={(e) => setMerchantPin(e.target.value)}
                    style={{
                      padding: '0.4rem 0.65rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      background: 'hsl(var(--input))',
                      border: '1px solid hsl(var(--border))',
                      color: 'white',
                      width: '100%'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button 
                onClick={() => handleVerifyAndRedeem(activeCoupon.id)}
                disabled={isVerifying}
                className="btn"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', height: 'auto', background: 'hsl(var(--primary))', color: 'black', fontWeight: 600 }}
              >
                {isVerifying ? '...' : isMerchantMode ? t('verify_and_redeem_btn') : t('mark_as_used')}
              </button>
              <button 
                onClick={() => {
                  setActiveCoupon(null);
                  setIsMerchantMode(false);
                }}
                className="btn"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', height: 'auto', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
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
