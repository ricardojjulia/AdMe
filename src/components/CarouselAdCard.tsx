"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Ad } from "@/types/ad";
import { Comments } from "./Comments";
import { useEngagementAnalytics } from "@/lib/hooks/useEngagementAnalytics";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import { LeadModal } from "./LeadModal";
import styles from "./CarouselAdCard.module.css";

interface CarouselAdCardProps {
  ad: Ad;
}

export function CarouselAdCard({ ad }: CarouselAdCardProps) {
  const { ref, logClick, logLike, isLiked } = useEngagementAnalytics(ad.id);
  const { toggleSavedAd, savedAds, reportAd, skipAd, t } = useUser();
  const { addToast } = useToast();
  const isSaved = savedAds.includes(ad.id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [likesCount, setLikesCount] = useState(ad.metrics.likes);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLeadOpen, setIsLeadOpen] = useState(false);

  useEffect(() => {
    let channel: any;
    async function setupSubscription() {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      channel = supabase
        .channel(`public:ads:${ad.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ads', filter: `id=eq.${ad.id}` }, (payload) => {
          if (payload.new && typeof payload.new.likes === 'number') {
            setLikesCount(payload.new.likes);
          }
        })
        .subscribe();
    }
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here') {
        setupSubscription();
    }
    
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [ad.id]);

  const handleReport = (reason: string) => {
    reportAd(ad.id, reason);
    setShowReportOptions(false);
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
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowReportOptions(!showReportOptions)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem', padding: '0 0.5rem' }}
            >
              ⚑
            </button>
            {showReportOptions && (
              <div style={{ position: 'absolute', right: 0, top: '100%', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', padding: '0.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', padding: '0.25rem 0.5rem', color: 'hsl(var(--muted-foreground))' }}>{t('report_ad')}</div>
                {[
                  { key: 'report_spam', label: 'Spam' },
                  { key: 'report_offensive', label: 'Offensive' },
                  { key: 'report_dangerous', label: 'Dangerous' },
                  { key: 'report_misleading', label: 'Misleading' }
                ].map(({ key, label }) => (
                  <button 
                    key={key}
                    onClick={() => handleReport(label)}
                    style={{ background: 'none', border: 'none', textAlign: 'left', padding: '0.5rem', cursor: 'pointer', borderRadius: '0.25rem', fontSize: '0.9rem', color: 'hsl(var(--foreground))' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'hsl(var(--muted))'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <h3>{ad.content.headline}</h3>
        <p>{ad.content.text}</p>
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
          <button onClick={handleSkip} type="button" className={styles.control} aria-label="Skip ad" style={{marginLeft: 'auto'}}>✕</button>
        </div>
        <div className={styles.metrics}>
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
    </article>
  );
}
