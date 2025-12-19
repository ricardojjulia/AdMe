"use client";

import { useEffect, useState } from "react";
import { Ad } from "@/types/ad";
import { generateMockAds } from "@/lib/mock-data";
import { FeedCard } from "./FeedCard";
import styles from "./Feed.module.css";

export function Feed() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAds(generateMockAds(6));
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.feed}>
      {ads.map((ad) => (
        <FeedCard key={ad.id} ad={ad} />
      ))}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.shimmer} />
          <div className={styles.shimmer} />
        </div>
      )}
    </div>
  );
}
