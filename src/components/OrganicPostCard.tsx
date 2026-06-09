"use client";

import { useState } from "react";
import { OrganicPost } from "@/lib/mock-data";
import { useUser } from "@/lib/UserContext";
import styles from "./OrganicPostCard.module.css";

interface OrganicPostCardProps {
  post: OrganicPost;
}

export function OrganicPostCard({ post }: OrganicPostCardProps) {
  const { t } = useUser();
  const [likes, setLikes] = useState(post.likes);
  const [hasLiked, setHasLiked] = useState(false);

  const handleLike = () => {
    if (hasLiked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setHasLiked(!hasLiked);
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
            <span className={styles.timestamp}>{t('social_update')}</span>
          </div>
        </div>
        <span className={styles.categoryBadge}>
          🏷️ {post.category}
        </span>
      </header>

      <div className={styles.body}>
        <p className={styles.content}>{post.content}</p>
        
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

        <button className={styles.actionBtn} aria-label="Comment on post">
          <span className={styles.icon}>💬</span>
          <span>{t('comment')}</span>
        </button>

        <button className={styles.actionBtn} aria-label="Share post">
          <span className={styles.icon}>📤</span>
          <span>{t('share')}</span>
        </button>
      </footer>
    </article>
  );
}
