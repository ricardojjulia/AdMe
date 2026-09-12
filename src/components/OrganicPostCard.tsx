"use client";

import { useState } from "react";
import { OrganicPost } from "@/lib/mock-data";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import { Comments } from "./Comments";
import { ShareModal } from "./ShareModal";
import styles from "./OrganicPostCard.module.css";

interface OrganicPostCardProps {
  post: OrganicPost;
}

export function OrganicPostCard({ post }: OrganicPostCardProps) {
  const { t } = useUser();
  const { addToast } = useToast();
  const [likes, setLikes] = useState(post.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [shares, setShares] = useState(post.likes ? Math.floor(post.likes / 4) : 12);
  const [showComments, setShowComments] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  if (isHidden) return null;

  const handleLike = () => {
    if (hasLiked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setHasLiked(!hasLiked);
  };

  const handleHide = () => {
    setIsHidden(true);
    addToast(t("listing_hidden_toast") || "Listing hidden from your feed.", "info");
  };

  return (
    <article className={`${styles.card} glass`}>
      <header className={styles.header}>
        <div className={styles.authorSection}>
          <div className={styles.avatar}>
            {post.author.avatar}
          </div>
          <div className={styles.authorMeta}>
            <span className={styles.authorName}>{post.author.name}</span>
            <span className={styles.timestamp}>
              {post.syndication ? post.syndication.sourceName : t('social_update')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {post.syndication?.sourceType === 'marketplace' && (
            <span className={`${styles.syndicationPill} ${styles.pillMarketplace}`}>
              🛒 {t('marketplace_find') || "Marketplace Find"}
            </span>
          )}
          {post.syndication?.sourceType === 'google_review' && (
            <span className={`${styles.syndicationPill} ${styles.pillReview}`}>
              📍 {t('google_review_spotlight') || "Google Review Spotlight"}
            </span>
          )}
          {post.syndication?.sourceType === 'local_event' && (
            <span className={`${styles.syndicationPill} ${styles.pillEvent}`}>
              🎟️ {t('community_event') || "Community Event"}
            </span>
          )}
          <span className={styles.categoryBadge}>
            🏷️ {post.category}
          </span>
        </div>
      </header>

      <div className={styles.body}>
        <p className={styles.content}>{post.content}</p>

        {/* Public Syndication Rich Data Ribbon */}
        {post.syndication && (
          <div className={styles.syndicationDetails}>
            {post.syndication.sourceType === 'marketplace' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {post.syndication.price && <span className={styles.priceTag}>{post.syndication.price}</span>}
                  {post.syndication.condition && <span className={styles.conditionBadge}>{post.syndication.condition}</span>}
                  {post.syndication.neighborhood && <span className={styles.metaItem}>📍 {post.syndication.neighborhood}</span>}
                </div>
                <a
                  href={post.syndication.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.outboundBtn} ${styles.outboundMarketplace}`}
                >
                  {t('view_on_marketplace') || "View on Marketplace"} ↗
                </a>
              </>
            )}

            {post.syndication.sourceType === 'google_review' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {post.syndication.rating && (
                    <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.95rem' }}>
                      ★ {post.syndication.rating.toFixed(1)}
                    </span>
                  )}
                  {post.syndication.neighborhood && <span className={styles.metaItem}>📍 {post.syndication.neighborhood}</span>}
                </div>
                <a
                  href={post.syndication.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.outboundBtn} ${styles.outboundReview}`}
                >
                  {t('read_on_google_maps') || "Read on Google Maps"} ↗
                </a>
              </>
            )}

            {post.syndication.sourceType === 'local_event' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {post.syndication.eventDate && (
                    <span style={{ fontWeight: 'bold', color: '#a78bfa', fontSize: '0.85rem' }}>
                      📅 {post.syndication.eventDate}
                    </span>
                  )}
                  {post.syndication.venue && <span className={styles.metaItem}>📍 {post.syndication.venue}</span>}
                  {post.syndication.price && <span className={styles.conditionBadge}>{post.syndication.price}</span>}
                </div>
                <a
                  href={post.syndication.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.outboundBtn} ${styles.outboundEvent}`}
                >
                  {t('event_details') || "Event Details"} ↗
                </a>
              </>
            )}
          </div>
        )}
        
        {post.mediaUrl && (
          <div className={styles.mediaWrapper}>
            <img 
              src={post.mediaUrl} 
              alt="Social content photo" 
              className={styles.media}
              loading="lazy"
            />
          </div>
        )}

        {post.syndication && (
          <div className={styles.disclaimerBar}>
            <span>🛡️ {t('fair_use_disclaimer') || "Non-commercial community curation · 0% commission · Full credit to original source"}</span>
            <button type="button" onClick={handleHide} className={styles.hideBtn}>
              {t('hide_listing') || "Hide"}
            </button>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <button 
          onClick={handleLike} 
          className={`${styles.actionBtn} ${hasLiked ? styles.activeLike : ""}`}
          aria-label="Like post"
        >
          <span className={styles.icon}>{hasLiked ? "❤️" : "🤍"}</span>
          <span>{likes}</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className={styles.actionBtn} 
          aria-label="Comment on post"
        >
          <span className={styles.icon}>💬</span>
          <span>{t('comment')}</span>
        </button>

        <button 
          onClick={() => setIsShareOpen(true)}
          className={styles.actionBtn} 
          aria-label="Share post"
        >
          <span className={styles.icon}>📤</span>
          <span>{t('share')} {shares > 0 ? `(${shares})` : ''}</span>
        </button>
      </footer>
      {showComments && <Comments adId={post.id} />}
      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={`Post by ${post.author.name}`}
        text={post.content}
        url={typeof window !== 'undefined' ? `${window.location.origin}/?post=${post.id}` : ''}
        onShareSuccess={() => setShares(prev => prev + 1)}
      />
    </article>
  );
}
