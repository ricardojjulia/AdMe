"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Ad } from "@/types/ad";
import { Comments } from "./Comments";
import { ShareModal } from "./ShareModal";
import { useEngagementAnalytics } from "@/lib/hooks/useEngagementAnalytics";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import { LeadModal } from "./LeadModal";
import { ScratchCard, QuizCard } from "./InteractionUnits";
import styles from "./NativeAdCard.module.css";

interface NativeAdCardProps {
  ad: Ad;
}

export function NativeAdCard({ ad }: NativeAdCardProps) {
  const { ref, logClick, logLike, isLiked } = useEngagementAnalytics(ad.id);
  const { toggleSavedAd, savedAds, reportAd, skipAd, addReward, t } = useUser();
  const { addToast } = useToast();
  const [showReportOptions, setShowReportOptions] = useState(false);
  const isSaved = savedAds.includes(ad.id);
  const [likesCount, setLikesCount] = useState(ad.metrics.likes);
  const [sharesCount, setSharesCount] = useState(ad.metrics.shares || 0);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLeadOpen, setIsLeadOpen] = useState(false);

  const [activeInteraction, setActiveInteraction] = useState<boolean>(false);
  const [isInteractionCompleted, setIsInteractionCompleted] = useState<boolean>(false);
  const [showWhyThis, setShowWhyThis] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(`adme_interaction_completed_${ad.id}`);
      if (completed) {
        setIsInteractionCompleted(true);
      }
    }
  }, [ad.id]);

  const interactionType = ad.advertiser.name === "Valor Brews" || ad.advertiser.name === "The Green Kitchen" ? 'scratch' : 'quiz';

  const handleCompleteInteraction = () => {
    if (isInteractionCompleted) return;
    
    addReward(50, `Value-Exchange: ${ad.advertiser.name}`);
    localStorage.setItem(`adme_interaction_completed_${ad.id}`, 'true');
    setIsInteractionCompleted(true);
    addToast(t("reward_success_toast"), "success");
    
    setTimeout(() => {
      setActiveInteraction(false);
    }, 3500);
  };

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
        console.warn('Realtime subscription error in NativeAdCard:', e);
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

  const handleReport = (reason: string) => {
    reportAd(ad.id, reason);
    setShowReportOptions(false);
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
      {activeInteraction ? (
        <div className={styles.media} style={{ minHeight: '220px', display: 'block', height: 'auto', position: 'relative' }}>
          {interactionType === 'scratch' ? (
            <ScratchCard 
              rewardAmount={50} 
              brandName={ad.advertiser.name} 
              onComplete={handleCompleteInteraction} 
            />
          ) : (
            <QuizCard 
              rewardAmount={50} 
              brandName={ad.advertiser.name} 
              onComplete={handleCompleteInteraction} 
            />
          )}
          <button
            type="button"
            onClick={() => setActiveInteraction(false)}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              zIndex: 100
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div className={styles.media}>
          <Image
            src={ad.content.mediaUrl}
            alt={ad.content.headline}
            fill
            className={styles.mediaImg}
            unoptimized
          />
        </div>
      )}

      <div className={styles.content}>
        <div>
          <div className={styles.meta} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span className={styles.category} style={{ color: ad.content.primaryColor }}>
                {ad.category}
              </span>
              {ad.isLocalDiscovery ? (
                <span style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  color: 'white', 
                  padding: '0.15rem 0.5rem', 
                  borderRadius: '0.25rem', 
                  fontSize: '0.7rem', 
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  ✨ {t('local_spotlight') || "Local Spotlight"}
                </span>
              ) : (
                <span className={styles.sponsor}>
                  {ad.isBoosted && <span style={{ marginRight: '0.4rem', background: 'hsl(var(--primary)/0.2)', color: 'hsl(var(--primary))', padding: '0.1rem 0.3rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 'bold' }}>{t('featured')}</span>}
                  • {t('sponsored')} · {ad.advertiser.name}
                  {ad.distanceMiles !== undefined && ` • 📍 ${t('miles_away', { distance: ad.distanceMiles.toFixed(1) })}`}
                </span>
              )}
              {ad.smartScore && (
                <span style={{ 
                  background: 'hsl(var(--primary)/0.12)', 
                  border: '1px solid hsl(var(--primary)/0.35)', 
                  color: 'hsl(var(--primary))', 
                  borderRadius: '999px', 
                  fontSize: '0.7rem', 
                  padding: '0.15rem 0.5rem', 
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  ⚡ {ad.smartScore}% {t('smart_match') || "Match"} {ad.smartScoreReasons?.[0] ? `· ${ad.smartScoreReasons[0]}` : ''}
                </span>
              )}
              {ad.distanceMiles !== undefined && ad.isLocalDiscovery && (
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                  📍 {t('miles_away', { distance: ad.distanceMiles.toFixed(1) })}
                </span>
              )}
              {ad.placeDetails?.rating && (
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold' }}>
                  ★ {ad.placeDetails.rating.toFixed(1)} {ad.placeDetails.userRatingsTotal ? `(${ad.placeDetails.userRatingsTotal})` : ''}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowWhyThis(!showWhyThis)}
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  color: 'hsl(var(--muted-foreground))',
                  padding: '0.15rem 0.45rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
                title={t('why_this_ad_title') || "Zero-Knowledge Match"}
              >
                {t('why_this_ad') || "Why this? ✨"}
              </button>
            </div>

            {/* Value Exchange Interaction Badge */}
            {isInteractionCompleted ? (
              <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: 'rgb(110, 231, 183)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 'bold' }}>
                ✅ {t('reward_claimed')} (+50 pts)
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setActiveInteraction(true)}
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)/0.2) 0%, hsl(var(--accent)/0.2) 100%)',
                  border: '1px solid hsl(var(--primary)/0.4)',
                  borderRadius: '0.25rem',
                  color: 'hsl(var(--primary))',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '0.25rem 0.6rem',
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'hsl(var(--primary)/0.4)';
                }}
              >
                🎁 {t('scratch_card_title')} (+50 pts)
              </button>
            )}
          </div>

          {/* Zero-Knowledge Privacy & Smart Match Disclosure Drawer */}
          {showWhyThis && (
            <div style={{
              margin: '0.75rem 0',
              padding: '0.75rem 0.9rem',
              background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)',
              border: '1px solid hsl(var(--primary) / 0.5)',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              boxShadow: '0 8px 24px hsl(0 0% 0% / 0.35)',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <strong style={{ color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                  🛡️ {t('why_this_ad_title') || "Zero-Knowledge Match"} {ad.smartScore ? `· ${ad.smartScore}% Score` : ''}
                </strong>
                <button 
                  type="button" 
                  onClick={() => setShowWhyThis(false)}
                  style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem' }}
                >
                  ✕
                </button>
              </div>

              {ad.smartScoreReasons && ad.smartScoreReasons.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {ad.smartScoreReasons.map((reason, idx) => (
                    <span key={idx} style={{ fontSize: '0.7rem', background: 'hsl(var(--primary)/0.15)', color: 'hsl(var(--primary))', padding: '0.15rem 0.45rem', borderRadius: '0.25rem', fontWeight: 600 }}>
                      ⚡ {reason}
                    </span>
                  ))}
                </div>
              )}

              <p style={{ color: 'hsl(var(--foreground))', margin: '0 0 0.6rem 0', lineHeight: '1.4' }}>
                {ad.isLocalDiscovery 
                  ? (t('local_discovery_desc') || "Discovered for your local community based on proximity and high guest ratings. Not a paid ad.")
                  : (t('why_this_ad_desc', { category: ad.category }) || `Matched directly on your device based on your '${ad.category}' preference. AdMe never sells your profile, identity, or browsing history.`)}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--secondary))', fontWeight: 'bold' }}>
                  💎 {t('attention_dividend', { pts: 50 }) || "+50 pts Dividend"}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={handleSkip}
                    style={{
                      background: 'hsl(var(--muted))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--muted-foreground))',
                      fontSize: '0.75rem',
                      borderRadius: '0.35rem',
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    {t('see_less_of_this') || "See less of this"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWhyThis(false)}
                    style={{
                      background: 'hsl(var(--primary))',
                      border: 'none',
                      color: 'hsl(var(--primary-foreground))',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      borderRadius: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      cursor: 'pointer'
                    }}
                  >
                    {t('understood') || "Got it"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Claim This Spot Banner for Local Businesses (Cold Start Flywheel) */}
          {ad.isLocalDiscovery && !ad.claimed && (
            <div style={{
              margin: '0.75rem 0',
              padding: '0.65rem 0.85rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
              border: '1px dashed rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>
                <strong style={{ color: 'hsl(var(--foreground))' }}>🏪 {t('own_this_business') || "Own this business?"}</strong> {t('claim_incentive') || "Claim on Studio & get 500 bonus ad credits!"}
              </div>
              <Link
                href={ad.claimUrl || `/studio/create?claim=true&name=${encodeURIComponent(ad.advertiser.name)}&category=${encodeURIComponent(ad.category)}`}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  padding: '0.35rem 0.7rem',
                  borderRadius: '0.35rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('claim_this_spot') || "Claim Spot"} ➔
              </Link>
            </div>
          )}

          <h3 className={styles.headline}>{ad.content.headline}</h3>
          <p className={styles.text}>{ad.content.text}</p>
          {ad.placeDetails?.address && (
            <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              📍 {ad.placeDetails.address}
            </p>
          )}
          <div style={{ position: 'relative', marginTop: '0.5rem' }}>
            <button 
              onClick={() => setShowReportOptions(!showReportOptions)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem', padding: '0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              ⚑ {t('report_ad')}
            </button>
            {showReportOptions && (
              <div style={{ position: 'absolute', left: 0, bottom: '100%', marginBottom: '0.5rem', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', padding: '0.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
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

        <div className={styles.actions}>
          <div className={styles.metrics}>
            <button onClick={logLike} type="button" className={`${styles.control} ${isLiked ? 'heart-pop' : ''}`} style={{ color: isLiked ? 'hsl(var(--destructive))' : 'inherit' }}>
              {isLiked ? '♥' : '♡'} {likesCount}
            </button>
            <button onClick={() => setShowComments(!showComments)} type="button" className={styles.control} aria-label="Comment">💬</button>
            <button onClick={() => setIsShareOpen(true)} type="button" className={styles.control} aria-label="Share">↗ {sharesCount > 0 ? sharesCount : ''}</button>
            <button 
              onClick={() => toggleSavedAd(ad.id)} 
              type="button" 
              className={`${styles.control} ${isSaved ? styles.saved : ''}`}
            >
              ★ {isSaved ? t('saved') : t('save')}
            </button>
            <button 
              onClick={() => setIsLeadOpen(true)} 
              type="button" 
              className={styles.control}
              style={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
            >
              ✉ {t('contact')}
            </button>
            <button onClick={handleSkip} type="button" className={styles.control} aria-label="Skip ad" style={{marginLeft: 'auto'}}>✕</button>
          </div>
          <a
            href={ad.cta.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={logClick}
            className={styles.cta}
            style={{ backgroundColor: ad.content.primaryColor }}
          >
            {ad.cta.label}
          </a>
        </div>
      </div>
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
    </article>
  );
}
