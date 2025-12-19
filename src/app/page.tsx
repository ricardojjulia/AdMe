import Image from "next/image";

import Link from "next/link";
import { Feed } from "@/components/Feed";
import styles from "./page.module.css";

const filters = ["Tech drops", "Local gems", "Travel inspo", "Style", "Food" ];

const insights = [
  { label: "Live campaigns", value: "42", tone: "primary" },
  { label: "Rewards in queue", value: "$186", tone: "secondary" },
  { label: "Saved offers", value: "12", tone: "muted" },
];

const spotlight = {
  badge: "Spotlight drop",
  brand: "Aurora Mobility",
  headline: "Test drive the all-electric Verge at your doorstep.",
  perks: ["Priority booking", "$200 accessory credit", "Concierge pickup"],
};

export default function Home() {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Image
              src="/ad.me.jpeg"
              alt="AdMe logo"
              fill
              priority
              sizes="64px"
              className={styles.logoImage}
            />
          </div>
          <div>
            <p className={styles.brandTitle}>AdMe</p>
            <p className={styles.brandTagline}>Voluntary, beautiful ads built for you</p>
          </div>
        </div>

        <div className={styles.search}>
          <span aria-hidden className={styles.searchIcon}>⌕</span>
          <input placeholder="Search drops, perks, creators" />
        </div>

        <div className={styles.actions}>
          <Link href="/login" className={styles.loginLink}>Log in</Link>
          <button type="button" className={styles.iconButton} aria-label="Notifications">🔔</button>
          <button type="button" className={styles.iconButton} aria-label="Saved">★</button>
          <div className={styles.avatar} aria-hidden>RJ</div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>Curated for you</div>
          <h1>Discover campaigns you actually asked to see.</h1>
          <p>
            Follow brands, toggle categories, and let the feed surprise you. Your attention is the currency—
            pick where you want to spend it.
          </p>

          <div className={styles.filterRow}>
            {filters.map((filter) => (
              <button key={filter} type="button" className={styles.filterChip}>
                {filter}
              </button>
            ))}
          </div>

          <div className={styles.insights}>
            {insights.map((insight) => (
              <div key={insight.label} className={`${styles.insightCard} ${styles[insight.tone]}`}>
                <span className={styles.insightValue}>{insight.value}</span>
                <span className={styles.insightLabel}>{insight.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.heroCtas}>
            <Link href="/login" className={styles.ctaOutline}>Log in</Link>
            <Link href="/signup" className={styles.ctaGhost}>Create account</Link>
          </div>
        </div>

        <div className={styles.heroCard}>
          <div className={styles.cardBadge}>{spotlight.badge}</div>
          <h3>{spotlight.brand}</h3>
          <p>{spotlight.headline}</p>
          <div className={styles.perks}>
            {spotlight.perks.map((perk) => (
              <span key={perk} className={styles.perkChip}>{perk}</span>
            ))}
          </div>
          <button type="button" className={styles.cta}>Preview offer</button>
        </div>
      </section>

      <section className={styles.layout}>
        <div className={styles.feedColumn}>
          <div className={styles.feedHeader}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${styles.active}`}>For you</button>
              <button className={styles.tab}>Local</button>
              <button className={styles.tab}>Trending</button>
            </div>
            <div className={styles.pill}>Ad frequency: Balanced</div>
          </div>
          <Feed />
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideHeader}>
              <h4>Tune your vibe</h4>
              <span className={styles.sideMeta}>Realtime</span>
            </div>
            <div className={styles.sideGrid}>
              {["Design", "Outdoors", "Gaming", "Wellness", "Beauty", "Finance"].map((item) => (
                <button key={item} type="button" className={styles.sideChip}>{item}</button>
              ))}
            </div>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideHeader}>
              <h4>Brands you follow</h4>
              <span className={styles.sideMeta}>5 new</span>
            </div>
            <div className={styles.brandList}>
              {["Lumen", "UrbanEat", "Shift Studio", "Wayfinder", "Monocle"].map((brand) => (
                <div key={brand} className={styles.brandRow}>
                  <div className={styles.brandAvatar}>{brand[0]}</div>
                  <div>
                    <p className={styles.brandName}>{brand}</p>
                    <p className={styles.brandSubtext}>Fresh drops this week</p>
                  </div>
                  <button type="button" className={styles.followButton}>Following</button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
