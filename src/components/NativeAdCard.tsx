"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Ad } from "@/types/ad";
import { Comments } from "./Comments";
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
  const [isSkipping, setIsSkipping] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLeadOpen, setIsLeadOpen] = useState(false);

  const [activeInteraction, setActiveInteraction] = useState<boolean>(false);
  const [isInteractionCompleted, setIsInteractionCompleted] = useState<boolean>(false);

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
    addToast("Successfully completed! +50 points added to your balance.", "success");
    
    setTimeout(() => {
      setActiveInteraction(false);
    }, 3500);
  };

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

  const handleMouseEnter = () => {
    document.documentElement.style.setProperty('--dynamic-glow-color', ad.content.primaryColor);
  };

  const handleMouseLeave = () => {
    document.documentElement.style.removeProperty('--dynamic-glow-color');
  };

  const handleSkip = () => {
    setIsSkipping(true);
    addToast("Ad skipped. We'll show less of this.", "info");
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
            <div>
              <span className={styles.category} style={{ color: ad.content.primaryColor }}>
                {ad.category}
              </span>
              <span className={styles.sponsor}>
                {ad.isBoosted && <span style={{ marginRight: '0.4rem', background: 'hsl(var(--primary)/0.2)', color: 'hsl(var(--primary))', padding: '0.1rem 0.3rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 'bold' }}>Featured</span>}
                • Sponsored by {ad.advertiser.name}
                {ad.distanceMiles !== undefined && ` • 📍 ${ad.distanceMiles.toFixed(1)} mi away`}
              </span>
            </div>

            {/* Value Exchange Interaction Badge */}
            {isInteractionCompleted ? (
              <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: 'rgb(110, 231, 183)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 'bold' }}>
                ✅ Reward Claimed (+50 pts)
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
                  padding: '0.2rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
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
          <h3 className={styles.headline}>{ad.content.headline}</h3>
          <p className={styles.text}>{ad.content.text}</p>
          <div style={{ position: 'relative', marginTop: '0.5rem' }}>
            <button 
              onClick={() => setShowReportOptions(!showReportOptions)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem', padding: '0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              ⚑ Report Ad
            </button>
            {showReportOptions && (
              <div style={{ position: 'absolute', left: 0, bottom: '100%', marginBottom: '0.5rem', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', padding: '0.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', padding: '0.25rem 0.5rem', color: 'hsl(var(--muted-foreground))' }}>Report Ad</div>
                {['Spam', 'Offensive', 'Dangerous', 'Misleading'].map(reason => (
                  <button 
                    key={reason}
                    onClick={() => handleReport(reason)}
                    style={{ background: 'none', border: 'none', textAlign: 'left', padding: '0.5rem', cursor: 'pointer', borderRadius: '0.25rem', fontSize: '0.9rem', color: 'hsl(var(--foreground))' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'hsl(var(--muted))'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                  >
                    {reason}
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
            <button 
              onClick={() => toggleSavedAd(ad.id)} 
              type="button" 
              className={`${styles.control} ${isSaved ? styles.saved : ''}`}
            >
              ★ {isSaved ? "Saved" : "Save"}
            </button>
            <button 
              onClick={() => setIsLeadOpen(true)} 
              type="button" 
              className={styles.control}
              style={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
            >
              ✉ Contact
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
    </article>
  );
}
