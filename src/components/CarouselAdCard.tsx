"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Ad } from "@/types/ad";
import { Comments } from "./Comments";
import { ShareModal } from "./ShareModal";
import { useEngagementAnalytics } from "@/lib/hooks/useEngagementAnalytics";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import { LeadModal } from "./LeadModal";
import { ReportModal } from "./ReportModal";
import { AdTransparencyModal } from "./AdTransparencyModal";
import { IntentResonanceBadge } from "./IntentResonanceBadge";
import { IntentMode, IntentResonanceInfo } from "@/lib/services/intent-tuner";
import styles from "./CarouselAdCard.module.css";

interface CarouselAdCardProps {
  ad: Ad;
  intentMatch?: IntentResonanceInfo;
  intent?: IntentMode;
}

export function CarouselAdCard({ ad, intentMatch, intent = 'all' }: CarouselAdCardProps) {
  const { ref, logClick, logLike, isLiked } = useEngagementAnalytics(ad.id);
  const { toggleSavedAd, savedAds, reportAd, skipAd, claimedVouchers, claimAdVoucher, t } = useUser();
  const { addToast } = useToast();
  const isSaved = savedAds.includes(ad.id);
  const isVoucherClaimed = claimedVouchers.includes(ad.id);
  const [isClaimingVoucher, setIsClaimingVoucher] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isTransparencyOpen, setIsTransparencyOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(ad.metrics.likes);
  const [sharesCount, setSharesCount] = useState(ad.metrics.shares || 0);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLeadOpen, setIsLeadOpen] = useState(false);

  useEffect(() => {
    let channel: any;
    let supabaseInstance: any;
    async function setupSubscription() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        supabaseInstance = createClient();
        
        const uniqueChannelId = `public:ads:${ad.id}:${Math.random().toString(36).substring(2, 9)}`;
        channel = supabaseInstance
          .channel(uniqueChannelId)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ads', filter: `id=eq.${ad.id}` }, (payload: any) => {
            if (payload.new && typeof payload.new.likes === 'number') {
              setLikesCount(payload.new.likes);
            }
          })
          .subscribe();
      } catch (e) {
        console.warn('Realtime subscription error in CarouselAdCard:', e);
      }
    }
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here') {
      setupSubscription();
    }
    
    return () => {
      if (channel && supabaseInstance) {
        supabaseInstance.removeChannel(channel);
      }
    };
  }, [ad.id]);

  const handleClaimVoucher = async () => {
    if (isVoucherClaimed || isClaimingVoucher) return;
    setIsClaimingVoucher(true);
    try {
      const { code } = await claimAdVoucher(ad);
      addToast(`🎟️ Voucher ${code} saved to your Wallet! (+25 pts)`, "success");
    } catch {
      addToast("Failed to save voucher", "error");
    } finally {
      setIsClaimingVoucher(false);
    }
  };

  const images = ad.content.carouselMediaUrls || [ad.content.mediaUrl];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleMouseEnter = () => {
    document.documentElement.style.setProperty('--dynamic-glow-color', ad.content.primaryColor);
  };

  const handleMouseLeave = () => {
    document.documentElement.style.removeProperty('--dynamic-glow-color');
  };

  const handleSkip = () => {
    setIsSkipping(true);
    addToast(t("ad_skipped_toast"), "info");
    setTimeout(() => {
      skipAd(ad.id);
    }, 400);
  };

  return (
    <article 
      ref={ref} 
      className={`${styles.card} hover-lift animate-fade-in ${isSkipping ? 'skip-out' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <header className={styles.header}>
        <div className={styles.identity}>
          <div className={styles.avatar}>
            <Image src={ad.advertiser.avatar} alt={ad.advertiser.name} fill className={styles.avatarImg} unoptimized />
          </div>
          <div>
            <p className={styles.name}>{ad.advertiser.name}</p>
            <p className={styles.meta}>
              {ad.isBoosted && <span style={{ marginRight: '0.4rem', background: 'hsl(var(--primary)/0.2)', color: 'hsl(var(--primary))', padding: '0.1rem 0.3rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 'bold' }}>{t('featured')}</span>}
              {t('sponsored')} · {ad.category}
              {ad.distanceMiles !== undefined && ` · 📍 ${t('miles_away', { distance: ad.distanceMiles.toFixed(1) })}`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {intentMatch && (
            <IntentResonanceBadge
              labelKey={intentMatch.labelKey}
              defaultText={intentMatch.defaultText}
              intent={intent}
            />
          )}
          <button 
            type="button" 
            onClick={() => setIsTransparencyOpen(true)}
            aria-label="Why am I seeing this ad?"
            style={{
              background: 'hsl(var(--card) / 0.8)',
              border: '1px solid hsl(var(--border) / 0.7)',
              borderRadius: '999px',
              padding: '0.2rem 0.55rem',
              fontSize: '0.72rem',
              color: 'hsl(var(--muted-foreground))',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: 500
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>ⓘ</span>
            <span>Why this ad?</span>
          </button>
          <div style={{ position: 'relative' }}>
            <button 
              type="button"
              onClick={() => setIsReportOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem', padding: '0 0.5rem' }}
              title="Report ad"
            >
              ⚑
            </button>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <h3>{ad.content.headline}</h3>
        <p>{ad.content.text}</p>
        <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isVoucherClaimed ? (
            <a
              href="/rewards"
              style={{
                fontSize: '0.75rem',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '0.2rem 0.55rem',
                borderRadius: '0.25rem',
                fontWeight: 'bold',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              🎟️ Saved to Wallet
            </a>
          ) : (
            <button
              type="button"
              onClick={handleClaimVoucher}
              disabled={isClaimingVoucher}
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)/0.15) 0%, hsl(var(--accent)/0.15) 100%)',
                border: '1px solid hsl(var(--primary)/0.4)',
                borderRadius: '0.25rem',
                color: 'hsl(var(--primary))',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.2rem 0.55rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.15s ease'
              }}
              title="Save promo deal directly to your Coupon Wallet"
            >
              🎟️ {isClaimingVoucher ? "Claiming..." : "Claim Deal (+25 pts)"}
            </button>
          )}
        </div>
      </div>

      <div className={styles.carouselContainer} style={{ borderColor: ad.content.primaryColor }}>
        <div className={styles.carouselTrack} style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {images.map((url, idx) => (
            <div key={idx} className={styles.carouselSlide}>
              <Image src={url} alt={`Slide ${idx}`} fill className={styles.mediaImg} unoptimized />
            </div>
          ))}
        </div>
        
        {images.length > 1 && (
          <>
            <button onClick={prevImage} className={`${styles.navButton} ${styles.prevButton}`}>‹</button>
            <button onClick={nextImage} className={`${styles.navButton} ${styles.nextButton}`}>›</button>
            <div className={styles.dots}>
              {images.map((_, idx) => (
                <div key={idx} className={`${styles.dot} ${idx === currentIndex ? styles.activeDot : ''}`} />
              ))}
            </div>
          </>
        )}

        <div className={styles.overlay}>
          <a
            href={ad.cta.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={logClick}
            className={styles.overlayCta}
            style={{ backgroundColor: ad.content.primaryColor }}
          >
            {ad.cta.label} →
          </a>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.controls}>
          <button onClick={logLike} type="button" className={`${styles.control} ${isLiked ? 'heart-pop' : ''}`} style={{ color: isLiked ? 'hsl(var(--destructive))' : 'inherit' }}>
            {isLiked ? '♥' : '♡'} {likesCount}
          </button>
          <button onClick={() => setShowComments(!showComments)} type="button" className={styles.control} aria-label="Comment">💬</button>
          <button onClick={() => setIsShareOpen(true)} type="button" className={styles.control} aria-label="Share">↗</button>
          <button onClick={handleSkip} type="button" className={styles.control} aria-label="Skip ad" style={{marginLeft: 'auto'}}>✕</button>
        </div>
        <div className={styles.metrics}>
          <span>{t('shares_count', { count: sharesCount })}</span>
          <span style={{ margin: '0 0.5rem', color: 'hsl(var(--border))' }}>·</span>
          <button 
            type="button" 
            onClick={() => toggleSavedAd(ad.id)}
            style={{ background: 'none', border: 'none', color: isSaved ? 'var(--primary)' : 'inherit', cursor: 'pointer', fontSize: 'inherit' }}
          >
            {isSaved ? `★ ${t('saved')}` : `☆ ${t('save')}`}
          </button>
          <span style={{ margin: '0 0.5rem', color: 'hsl(var(--border))' }}>·</span>
          <button 
            type="button" 
            onClick={() => setIsLeadOpen(true)}
            style={{ background: 'none', border: 'none', color: 'hsl(var(--primary))', cursor: 'pointer', fontSize: 'inherit', fontWeight: 'bold' }}
          >
            ✉ {t('contact')}
          </button>
        </div>
      </footer>
      {showComments && <Comments adId={ad.id} />}
      <LeadModal isOpen={isLeadOpen} onClose={() => setIsLeadOpen(false)} ad={ad} />
      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={ad.content.headline}
        text={ad.content.text}
        url={typeof window !== 'undefined' ? `${window.location.origin}/?ad=${ad.id}` : ''}
        onShareSuccess={() => setSharesCount(prev => prev + 1)}
      />
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        itemId={ad.id}
        headline={ad.content.headline}
        contentText={ad.content.text}
        itemType="ad"
      />
      <AdTransparencyModal
        isOpen={isTransparencyOpen}
        onClose={() => setIsTransparencyOpen(false)}
        adId={ad.id}
        advertiserName={ad.advertiser.name}
        category={ad.category}
        headline={ad.content.headline}
        distanceMiles={ad.distanceMiles}
        onDismissAd={handleSkip}
      />
    </article>
  );
}
