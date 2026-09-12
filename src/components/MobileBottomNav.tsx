"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import styles from "./MobileBottomNav.module.css";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, coupons, t } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If user is inside onboarding, don't show the bottom nav dock
  if (pathname === "/onboarding") {
    return null;
  }

  const isFeedActive = pathname === "/";
  const isRewardsActive = pathname === "/rewards";
  const isProfileActive = pathname === "/profile";
  const isStudioActive = pathname?.startsWith("/studio");

  const handleVibesClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      const vibeEl = document.getElementById("vibe-filter-section");
      if (vibeEl) {
        vibeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      router.push("/#vibe-filter-section");
    }
  };

  const activeCouponCount = coupons?.length || 0;

  return (
    <nav className={styles.dock} aria-label="Mobile Navigation">
      {/* Feed Tab */}
      <Link 
        href="/" 
        className={`${styles.item} ${isFeedActive ? styles.active : ""}`}
        aria-label={t("nav_feed") || "Feed"}
      >
        <div className={styles.iconWrap}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <span className={styles.label}>{t("nav_feed") || "Feed"}</span>
        {isFeedActive && <span className={styles.activeIndicator} />}
      </Link>

      {/* Vibes / Discover Tab */}
      <button 
        type="button"
        onClick={handleVibesClick}
        className={styles.item}
        aria-label={t("nav_explore") || "Vibes"}
      >
        <div className={styles.iconWrap}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <span className={styles.label}>{t("nav_explore") || "Vibes"}</span>
      </button>

      {/* Rewards Tab */}
      <Link 
        href="/rewards" 
        className={`${styles.item} ${isRewardsActive ? styles.active : ""}`}
        aria-label={t("nav_rewards") || "Rewards"}
      >
        <div className={styles.iconWrap}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 12 20 22 4 22 4 12" />
            <rect width="20" height="5" x="2" y="7" />
            <line x1="12" x2="12" y1="22" y2="7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
          {mounted && user && user.rewardsBalance > 0 && (
            <span className={styles.badge}>
              {user.rewardsBalance > 999 ? `${Math.floor(user.rewardsBalance / 1000)}k` : user.rewardsBalance}
            </span>
          )}
        </div>
        <span className={styles.label}>{t("nav_rewards") || "Rewards"}</span>
        {isRewardsActive && <span className={styles.activeIndicator} />}
      </Link>

      {/* Wallet / Vouchers Tab */}
      <Link 
        href="/rewards#wallet" 
        className={styles.item}
        aria-label={t("nav_wallet") || "Wallet"}
      >
        <div className={styles.iconWrap}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
          {mounted && activeCouponCount > 0 && (
            <span className={styles.streakBadge}>{activeCouponCount}</span>
          )}
        </div>
        <span className={styles.label}>{t("nav_wallet") || "Wallet"}</span>
      </Link>

      {/* Profile or Studio Tab */}
      {mounted && user?.role === "business" ? (
        <Link 
          href="/studio" 
          className={`${styles.item} ${isStudioActive ? styles.active : ""}`}
          aria-label={t("nav_studio") || "Studio"}
        >
          <div className={styles.iconWrap}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <span className={styles.label}>{t("nav_studio") || "Studio"}</span>
          {isStudioActive && <span className={styles.activeIndicator} />}
        </Link>
      ) : (
        <Link 
          href="/profile" 
          className={`${styles.item} ${isProfileActive ? styles.active : ""}`}
          aria-label={t("nav_profile") || "Profile"}
        >
          <div className={styles.iconWrap}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span className={styles.label}>{t("nav_profile") || "Profile"}</span>
          {isProfileActive && <span className={styles.activeIndicator} />}
        </Link>
      )}
    </nav>
  );
}
