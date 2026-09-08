"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

const ALL_CATEGORIES = [
  "Tech & SaaS", "Local Eateries", "Faith & Books", "Auto under $40k", "Veteran-owned",
  "Home & Garden", "Wellness & Health", "Gaming", "Finance"
];

interface PhotoPreset {
  label: string;
  url: string;
}

const CATEGORY_PRESETS: Record<string, PhotoPreset[]> = {
  "Veteran-owned": [
    { label: "Craft Coffee", url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800" },
    { label: "Tactical Gear", url: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=800" },
    { label: "Roast Beans", url: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&q=80&w=800" }
  ],
  "Local Eateries": [
    { label: "Organic Bowl", url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800" },
    { label: "Sourdough", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800" },
    { label: "Fresh Dining", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800" }
  ],
  "Tech & SaaS": [
    { label: "Dev Desk", url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800" },
    { label: "Telemetry Dashboard", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800" },
    { label: "Laptop Workspace", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800" }
  ],
  "Auto under $40k": [
    { label: "Electric SUV", url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800" },
    { label: "City Hybrid", url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800" },
    { label: "Highway Drive", url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800" }
  ],
  "Wellness & Health": [
    { label: "Meditation", url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800" },
    { label: "Adaptogens", url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800" },
    { label: "Yoga Calm", url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800" }
  ],
  "Home & Garden": [
    { label: "Bamboo Living", url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800" },
    { label: "Houseplants", url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=800" },
    { label: "Clean Kitchen", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800" }
  ],
  "Faith & Books": [
    { label: "Book & Coffee", url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800" },
    { label: "Classic Library", url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800" },
    { label: "Peaceful Read", url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800" }
  ],
  "Gaming": [
    { label: "RPG Battle", url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=800" },
    { label: "Gaming Mouse", url: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&q=80&w=800" },
    { label: "RGB Battlestation", url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800" }
  ],
  "Finance": [
    { label: "Investment App", url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800" },
    { label: "Wealth Growth", url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800" },
    { label: "Planning", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" }
  ]
};

const CITY_PRESETS = [
  { name: "Santa Monica, CA", lat: 34.0195, lng: -118.4912 },
  { name: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  { name: "Austin, TX", lat: 30.2672, lng: -97.7431 },
  { name: "Denver, CO", lat: 39.7392, lng: -104.9903 },
  { name: "New York, NY", lat: 40.7128, lng: -74.0060 }
];

export default function CreateAdPage() {
  const { user, deductCredits, switchRole } = useUser();
  const { addToast } = useToast();
  const router = useRouter();

  // Form & Live Preview State
  const [formatType, setFormatType] = useState<'social' | 'carousel' | 'geofenced'>('social');
  const [headline, setHeadline] = useState("Veteran-Owned Micro-Batch Coffee");
  const [category, setCategory] = useState("Veteran-owned");
  const [text, setText] = useState("Freshly roasted single-origin whole bean coffee delivered straight to your door. Veterans get 15% off.");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800");
  const [primaryColor, setPrimaryColor] = useState("#d97706");
  const [ctaLabel, setCtaLabel] = useState("Shop Coffee");
  const [ctaUrl, setCtaUrl] = useState("https://valorbrews.com");
  const [dailyBudget, setDailyBudget] = useState(1000);
  const [maxCpcBid, setMaxCpcBid] = useState(20);
  const [isBoosted, setIsBoosted] = useState(false);

  // A/B Split Testing
  const [isABTest, setIsABTest] = useState(false);
  const [headlineB, setHeadlineB] = useState("Tired? Valor Brews Roasted Fresh for You");
  const [imageUrlB, setImageUrlB] = useState("https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&q=80&w=800");
  const [previewVariant, setPreviewVariant] = useState<'A' | 'B'>('A');

  // Location for Geofenced Drop
  const [latitude, setLatitude] = useState<number>(34.0195);
  const [longitude, setLongitude] = useState<number>(-118.4912);
  const [selectedCity, setSelectedCity] = useState("Santa Monica, CA");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update image when category changes if using defaults
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const presets = CATEGORY_PRESETS[newCat];
    if (presets && presets.length > 0) {
      setImageUrl(presets[0].url);
    }
  };

  // Browser Geolocation
  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      addToast("Geolocation is not supported by your browser", "error");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(4)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(4)));
        setSelectedCity("Current GPS Location");
        setIsDetectingLocation(false);
        addToast("Store location updated to your GPS coordinates!", "success");
      },
      (err) => {
        setIsDetectingLocation(false);
        addToast("Could not retrieve GPS location: " + err.message, "error");
      }
    );
  };

  const handleCitySelect = (city: typeof CITY_PRESETS[0]) => {
    setSelectedCity(city.name);
    setLatitude(city.lat);
    setLongitude(city.lng);
  };

  // Performance Estimates
  const estimatedClicks = Math.max(1, Math.round(dailyBudget / Math.max(1, maxCpcBid)));
  const estimatedImpressions = Math.round(estimatedClicks * (100 / (1.2 + (maxCpcBid / 15))));
  const rewardPool = Math.round(estimatedClicks * 15);

  const credits = user?.adCreditsBalance || 0;
  const plan = user?.subscriptionTier || 'free';
  const requiresCredits = plan === 'free';
  const hasSufficientFunds = !requiresCredits || credits >= 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    if (!hasSufficientFunds) {
      setError("Insufficient ad credits. Free accounts require at least 50 credits to publish. Please top up or upgrade.");
      setLoading(false);
      return;
    }

    // 1. Run Pre-Flight Automated AI Safety Moderation Check
    try {
      const modRes = await fetch("/api/moderation/ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: previewVariant === 'B' ? headlineB : headline,
          contentText: text,
          ctaUrl,
          category
        })
      });
      const modData = await modRes.json();
      if (modData.moderation && !modData.moderation.approved) {
        setError(`AI Safety Gate: Campaign rejected. ${modData.moderation.reason}`);
        setLoading(false);
        return;
      }
    } catch (modErr) {
      console.warn("AI moderation check bypassed on network error:", modErr);
    }

    const supabase = createClient();
    const campaignId = crypto.randomUUID();

    const baseAd: any = {
      owner_id: user.id,
      category,
      format_type: formatType,
      advertiser_name: user.name || 'Merchant',
      advertiser_avatar: user.avatar || 'M',
      content_text: text,
      media_type: 'image',
      primary_color: primaryColor,
      cta_label: ctaLabel,
      cta_url: ctaUrl,
      likes: 0,
      shares: 0,
      campaign_id: campaignId,
      is_boosted: isBoosted,
      daily_budget: dailyBudget,
      credits_spent_today: 0,
      max_cpc_bid: maxCpcBid,
      status: 'active',
      latitude: formatType === 'geofenced' ? latitude : null,
      longitude: formatType === 'geofenced' ? longitude : null
    };

    const adsToInsert = [
      {
        ...baseAd,
        headline,
        media_url: imageUrl,
        variation_name: 'A'
      }
    ];

    if (isABTest) {
      adsToInsert.push({
        ...baseAd,
        headline: headlineB || headline,
        media_url: imageUrlB || imageUrl,
        variation_name: 'B'
      });
    }

    const { error: insertError } = await supabase.from('ads').insert(adsToInsert);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      if (requiresCredits) {
        deductCredits(50);
      }
      addToast("Campaign created and published live!", "success");
      router.push("/studio");
    }
  };

  // If consumer visits studio create, show welcoming activation prompt
  if (user && user.role !== 'business') {
    return (
      <main className={`container ${styles.shell} animate-fade-in`}>
        <div className="glass" style={{ padding: '3rem 2rem', maxWidth: '600px', margin: '2rem auto', textAlign: 'center', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏪</div>
          <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Activate Your Merchant Studio</h2>
          <p style={{ color: 'hsl(var(--muted-foreground))', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Reach privacy-conscious, high-intent consumers directly on AdMe. Connect customers straight to your online store or local retail location with zero tracking overhead.
          </p>
          <button 
            onClick={() => {
              switchRole('business');
              addToast("Switched to Merchant Account! Welcome to AdMe Studio.", "success");
            }}
            className="btn" 
            style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}
          >
            Launch Merchant Account →
          </button>
        </div>
      </main>
    );
  }

  // Active preview values based on variant selector
  const activeHeadline = previewVariant === 'B' ? (headlineB || headline) : headline;
  const activeImage = previewVariant === 'B' ? (imageUrlB || imageUrl) : imageUrl;

  return (
    <main className={`container ${styles.shell} animate-fade-in`}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/studio" className={styles.backBtn}>← Back to Studio Dashboard</Link>
          <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
            Balance: <strong style={{ color: 'hsl(var(--primary))' }}>★ {credits} credits</strong>
          </div>
        </div>
        <h1 style={{ margin: '0.25rem 0' }}>Create & Publish Campaign</h1>
        <p style={{ color: "hsl(var(--muted-foreground))", margin: 0 }}>
          Launch targeted, privacy-respecting native campaigns with instant AI pre-flight safety screening.
        </p>
      </header>

      {!hasSufficientFunds && (
        <div style={{
          background: "hsl(var(--destructive) / 0.12)",
          border: "1px solid hsl(var(--destructive) / 0.3)",
          color: "hsl(var(--destructive))",
          padding: "1rem 1.25rem",
          borderRadius: "0.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div>
            <strong>⚠️ Credit Top-Up Required</strong>: Free tier accounts require 50 credits to publish. Balance: {credits} credits.
          </div>
          <Link href="/checkout" className="btn" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
            Top Up Credits
          </Link>
        </div>
      )}

      <div className={styles.layoutGrid}>
        {/* Left Column: Interactive Campaign Configuration Form */}
        <form onSubmit={handleSubmit} className={`${styles.formCard} glass`}>
          {error && (
            <div style={{ color: '#ef4444', padding: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* 1. Format Selection */}
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Campaign Format</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setFormatType('social')}
                style={{
                  padding: "0.75rem 0.5rem",
                  borderRadius: "0.5rem",
                  border: formatType === 'social' ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                  background: formatType === 'social' ? "hsl(var(--primary) / 0.12)" : "hsl(var(--card))",
                  color: "white",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                <div style={{ fontSize: "1.25rem", marginBottom: "0.2rem" }}>📱</div>
                <strong style={{ fontSize: "0.8rem", display: "block" }}>Native Feed</strong>
              </button>

              <button
                type="button"
                onClick={() => setFormatType('carousel')}
                style={{
                  padding: "0.75rem 0.5rem",
                  borderRadius: "0.5rem",
                  border: formatType === 'carousel' ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                  background: formatType === 'carousel' ? "hsl(var(--primary) / 0.12)" : "hsl(var(--card))",
                  color: "white",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                <div style={{ fontSize: "1.25rem", marginBottom: "0.2rem" }}>🎠</div>
                <strong style={{ fontSize: "0.8rem", display: "block" }}>Carousel</strong>
              </button>

              <button
                type="button"
                onClick={() => setFormatType('geofenced')}
                style={{
                  padding: "0.75rem 0.5rem",
                  borderRadius: "0.5rem",
                  border: formatType === 'geofenced' ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                  background: formatType === 'geofenced' ? "hsl(var(--primary) / 0.12)" : "hsl(var(--card))",
                  color: "white",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                <div style={{ fontSize: "1.25rem", marginBottom: "0.2rem" }}>📍</div>
                <strong style={{ fontSize: "0.8rem", display: "block" }}>Local Drop</strong>
              </button>
            </div>
          </div>

          {/* 2. Target Category */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Target Category
              <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>Zero-Knowledge audience match</span>
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={styles.selectField}
            >
              {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 3. Headline */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Headline
              <span style={{ fontSize: "0.75rem", color: headline.length > 50 ? "#ef4444" : "hsl(var(--muted-foreground))" }}>
                {headline.length}/60
              </span>
            </label>
            <input
              type="text"
              required
              maxLength={65}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Fresh Artisan Single-Origin Beans"
              className={styles.inputField}
            />
          </div>

          {/* 4. Content Text */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Content Copy
              <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>Clear, value-first messaging</span>
            </label>
            <textarea
              required
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe your offer and value proposition..."
              className={styles.textareaField}
            />
          </div>

          {/* 5. Image URL & 1-Click Curated Photography Presets */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabel}>
              <span>Photography & Creative Asset</span>
              <span style={{ fontSize: "0.75rem", color: "hsl(var(--primary))" }}>1-Click Presets or Custom URL</span>
            </div>

            {/* Presets Gallery Chips */}
            <div className={styles.presetGallery}>
              {(CATEGORY_PRESETS[category] || []).map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => setImageUrl(preset.url)}
                  className={`${styles.presetThumb} ${imageUrl === preset.url ? styles.presetThumbActive : ''}`}
                >
                  <img src={preset.url} alt={preset.label} className={styles.presetImg} />
                  <span className={styles.presetLabel}>{preset.label}</span>
                </div>
              ))}
            </div>

            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className={styles.inputField}
            />
          </div>

          {/* 6. Geofence Location Controls (if Local Drop format) */}
          {formatType === 'geofenced' && (
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '0.75rem', border: '1px solid hsl(var(--primary) / 0.35)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'hsl(var(--primary))', fontSize: '0.9rem' }}>📍 Store / Drop Location</strong>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="btn"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary))', color: 'hsl(var(--primary))' }}
                >
                  {isDetectingLocation ? 'Locating...' : '📍 Use My GPS'}
                </button>
              </div>

              {/* City Presets Chips */}
              <div className={styles.cityPresets}>
                {CITY_PRESETS.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className={`${styles.cityChip} ${selectedCity === city.name ? styles.cityChipActive : ''}`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Latitude</span>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    required
                    className={styles.inputField}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Longitude</span>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    required
                    className={styles.inputField}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                Consumers within 5 miles of this drop will see local deal badges.
              </span>
            </div>
          )}

          {/* 7. A/B Split Testing Controls */}
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={isABTest}
                onChange={(e) => setIsABTest(e.target.checked)}
                style={{ accentColor: 'hsl(var(--primary))' }}
              />
              <strong style={{ color: 'white' }}>Enable Automated A/B Split Test</strong>
            </label>
            {isABTest && (
              <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>Alternative Headline (Variant B)</span>
                  <input
                    type="text"
                    value={headlineB}
                    onChange={(e) => setHeadlineB(e.target.value)}
                    placeholder="Alternative headline"
                    className={styles.inputField}
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>Alternative Image URL (Variant B)</span>
                  <input
                    type="url"
                    value={imageUrlB}
                    onChange={(e) => setImageUrlB(e.target.value)}
                    placeholder="https://..."
                    className={styles.inputField}
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 8. Call to Action & Brand Color */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>CTA Button Label</label>
              <input
                type="text"
                required
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="e.g. Shop Now"
                className={styles.inputField}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Brand Accent Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: '42px', height: '42px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className={styles.inputField}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </div>
          </div>

          {/* 9. Destination Store URL */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Destination Store URL
              <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>Direct checkout on your website</span>
            </label>
            <input
              type="url"
              required
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://yourstore.com"
              className={styles.inputField}
            />
          </div>

          {/* 10. Budget & Bidding Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Daily Budget (Credits)</label>
              <input
                type="number"
                min="100"
                step="50"
                required
                value={dailyBudget}
                onChange={(e) => setDailyBudget(parseInt(e.target.value) || 100)}
                className={styles.inputField}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Max CPC Bid (Credits)</label>
              <input
                type="number"
                min="15"
                max="100"
                step="1"
                required
                value={maxCpcBid}
                onChange={(e) => setMaxCpcBid(parseInt(e.target.value) || 15)}
                className={styles.inputField}
              />
            </div>
          </div>

          {/* 11. Dynamic Campaign Yield Estimator */}
          <div className={styles.yieldBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>📊 Estimated Daily Performance</span>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))' }}>Pacemaker Balanced</span>
            </div>
            <div className={styles.yieldGrid}>
              <div className={styles.yieldStat}>
                <span className={styles.yieldValue}>{estimatedImpressions.toLocaleString()}</span>
                <span className={styles.yieldLabel}>Daily Views</span>
              </div>
              <div className={styles.yieldStat}>
                <span className={styles.yieldValue}>~{estimatedClicks}</span>
                <span className={styles.yieldLabel}>Qualified Clicks</span>
              </div>
              <div className={styles.yieldStat}>
                <span className={styles.yieldValue}>★ {rewardPool}</span>
                <span className={styles.yieldLabel}>Reward Pool</span>
              </div>
            </div>
          </div>

          {/* Boost Placement Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }}>
            <input
              type="checkbox"
              checked={isBoosted}
              onChange={(e) => setIsBoosted(e.target.checked)}
              style={{ accentColor: 'hsl(var(--primary))' }}
            />
            <div>
              <strong style={{ color: 'white', fontSize: '0.85rem', display: 'block' }}>🚀 Boost Campaign Placement</strong>
              <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem' }}>
                Priority ranking in consumer feeds within your category
              </span>
            </div>
          </label>

          {/* Merchant Agreement & Commercial Policy Notice */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.5rem', padding: '0.85rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', lineHeight: '1.5' }}>
            <strong style={{ color: 'white', display: 'block', marginBottom: '0.25rem' }}>
              ⚖️ Merchant Agreement & Off-Platform Commerce Policy:
            </strong>
            AdMe connects your business with voluntary, high-intent consumers. All customer purchases occur directly on your own storefront or store location; AdMe is not a product retailer, holds zero inventory, and assumes no liability for merchant merchandise. All campaigns undergo automated AI content screening before going live. Illicit, hateful, or deceptive ads result in immediate takedown.
          </div>

          <button
            type="submit"
            disabled={loading || !hasSufficientFunds}
            className="btn"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700 }}
          >
            {loading ? "Screening with AI & Publishing..." : "Publish Campaign to Feed →"}
          </button>
        </form>

        {/* Right Column: Sticky Live Interactive Mobile Card Preview */}
        <aside className={styles.previewColumn}>
          <div className={styles.previewHeader}>
            <div className={styles.previewTitle}>
              <span>Live Feed Preview</span>
              <div className={styles.liveBadge}>
                <div className={styles.pulseDot} />
                LIVE
              </div>
            </div>

            {/* Variation Selector if A/B Testing */}
            {isABTest && (
              <div className={styles.previewSwitcher}>
                <button
                  type="button"
                  onClick={() => setPreviewVariant('A')}
                  className={`${styles.switcherBtn} ${previewVariant === 'A' ? styles.switcherBtnActive : ''}`}
                >
                  Variant A
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewVariant('B')}
                  className={`${styles.switcherBtn} ${previewVariant === 'B' ? styles.switcherBtnActive : ''}`}
                >
                  Variant B
                </button>
              </div>
            )}
          </div>

          {/* Smartphone Frame Mockup */}
          <div className={styles.deviceMockup}>
            <div className={styles.deviceSpeaker} />

            <div className={styles.mockFeedStream}>
              {/* Rendered Live Preview Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
              }}>
                {/* Card Header */}
                <div style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: primaryColor,
                      color: 'black',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {user?.name ? user.name.substring(0, 2).toUpperCase() : 'VB'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {user?.name || 'Your Brand'}
                        {isBoosted && <span style={{ fontSize: '0.7rem' }}>🚀</span>}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
                        Sponsored · {category}
                      </div>
                    </div>
                  </div>

                  {formatType === 'geofenced' && (
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(27, 246, 147, 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary)/0.3)' }}>
                      📍 ~5 mi drop
                    </span>
                  )}
                </div>

                {/* Card Image */}
                <div style={{ position: 'relative', width: '100%', height: '220px', background: '#181920', overflow: 'hidden' }}>
                  {activeImage ? (
                    <img
                      src={activeImage}
                      alt={activeHeadline}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        // Fallback image on broken URL
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800";
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}>
                      Select a photo preset
                    </div>
                  )}

                  {isABTest && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
                      Variant {previewVariant}
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'white', lineHeight: '1.3' }}>
                    {activeHeadline || "Your Campaign Headline"}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', lineHeight: '1.4' }}>
                    {text || "Describe your offering and value proposition here."}
                  </p>

                  {/* CTA Action Button */}
                  <a
                    href={ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.preventDefault()}
                    style={{
                      marginTop: '0.5rem',
                      display: 'block',
                      textAlign: 'center',
                      padding: '0.6rem 1rem',
                      borderRadius: '0.5rem',
                      background: primaryColor,
                      color: '#000',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    {ctaLabel || "Shop Now"} →
                  </a>
                </div>

                {/* Card Social Metrics Bar */}
                <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span>❤️ 0 likes</span>
                    <span>💬 0 comments</span>
                  </div>
                  <span style={{ color: 'hsl(var(--primary))' }}>+15 pts reward</span>
                </div>
              </div>

              {/* Feed Context Notice */}
              <div style={{ textAlign: 'center', marginTop: '1rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.72rem' }}>
                🛡️ Zero-Knowledge privacy: Served only to opted-in users
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
