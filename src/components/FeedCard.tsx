"use client";

import Image from "next/image";
import { Ad } from "@/types/ad";
import styles from "./FeedCard.module.css";

interface FeedCardProps {
  ad: Ad;
}

export function FeedCard({ ad }: FeedCardProps) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.identity}>
          <div className={styles.avatar}>
            <Image
              src={ad.advertiser.avatar}
              alt={ad.advertiser.name}
              fill
              className={styles.avatarImg}
              unoptimized
            />
          </div>
          <div>
            <p className={styles.name}>{ad.advertiser.name}</p>
            <p className={styles.meta}>Sponsored · {ad.metrics.shares.toLocaleString()} sharing</p>
          </div>
        </div>
        <button type="button" className={styles.follow}>Follow</button>
      </header>

      <div className={styles.body}>
        <h3>{ad.content.headline}</h3>
        <p>{ad.content.text}</p>
        <div className={styles.badges}>
          <span className={styles.badge}>Just in</span>
          <span className={styles.badgeAccent}>{ad.cta.label}</span>
        </div>
      </div>

      <div className={styles.media} style={{ borderColor: ad.content.primaryColor }}>
        <Image
          src={ad.content.mediaUrl}
          alt="Ad creative"
          fill
          className={styles.mediaImg}
          unoptimized
          priority
        />
        <div className={styles.overlay}>
          <span className={styles.overlayTag}>Immersive drop</span>
          <a
            href={ad.cta.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.overlayCta}
            style={{ backgroundColor: ad.content.primaryColor }}
          >
            {ad.cta.label} →
          </a>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.controls}>
          <button type="button" className={styles.control} aria-label="Appreciate ad">♡</button>
          <button type="button" className={styles.control} aria-label="Comment">💬</button>
          <button type="button" className={styles.control} aria-label="Share">↗</button>
        </div>
        <div className={styles.metrics}>
          <span>{ad.metrics.likes.toLocaleString()} loves</span>
          <span>·</span>
          <span>{ad.metrics.shares.toLocaleString()} saves</span>
        </div>
      </footer>
    </article>
  );
}
