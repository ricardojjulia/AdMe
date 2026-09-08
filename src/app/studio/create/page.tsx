"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import { createClient } from "@/lib/supabase/client";
import styles from "../page.module.css";

const ALL_CATEGORIES = [
  "Tech & SaaS", "Local Eateries", "Faith & Books", "Auto under $40k", "Veteran-owned",
  "Home & Garden", "Wellness & Health", "Gaming", "Finance"
];

export default function CreateAdPage() {
  const { user, deductCredits } = useUser();
  const { addToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formatType, setFormatType] = useState<'social' | 'carousel' | 'geofenced'>('social');
  const [error, setError] = useState("");
  const [isABTest, setIsABTest] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'business') {
      router.push('/');
    }
  }, [user, router]);

  const credits = user?.adCreditsBalance || 0;
  const plan = user?.subscriptionTier || 'free';
  const requiresCredits = plan === 'free';
  const hasSufficientFunds = !requiresCredits || credits >= 50;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    if (!hasSufficientFunds) {
      setError("Insufficient ad credits. Free tier accounts require at least 50 credits to publish. Please top up or upgrade.");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const headline = formData.get("headline") as string;
    const category = formData.get("category") as string;
    const text = formData.get("text") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const primaryColor = formData.get("primaryColor") as string;
    const ctaLabel = formData.get("ctaLabel") as string;
    const ctaUrl = formData.get("ctaUrl") as string;
    const isBoosted = formData.get("isBoosted") === "on";
    const dailyBudget = parseInt(formData.get("dailyBudget") as string) || 1000;
    const maxCpcBid = parseInt(formData.get("maxCpcBid") as string) || 15;

    // 1. Run Pre-Flight Automated AI Safety Moderation Check
    try {
      const modRes = await fetch("/api/moderation/ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
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

    // Location coordinates for geofenced drops
    const lat = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null;
    const lng = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null;

    const supabase = createClient();
    const campaignId = crypto.randomUUID();

    const baseAd: any = {
      owner_id: user.id,
      category,
      format_type: formatType,
      advertiser_name: user.name,
      advertiser_avatar: user.avatar,
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
      latitude: lat,
      longitude: lng
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
      const headlineB = formData.get("headlineB") as string;
      const imageUrlB = formData.get("imageUrlB") as string;
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
      addToast("Campaign created and active!", "success");
      router.push("/studio");
    }
  };

  return (
    <main className={`container ${styles.shell} animate-fade-in`}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/studio" className={styles.backBtn}>← Back to Studio</Link>
        </div>
        <h1>Create New Campaign</h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>Launch targeted, privacy-respecting campaigns to high-intent consumers.</p>
      </header>

      {!hasSufficientFunds && (
        <div style={{
          background: "hsl(var(--destructive) / 0.15)",
          border: "1px solid hsl(var(--destructive) / 0.3)",
          color: "hsl(var(--destructive))",
          padding: "1rem 1.25rem",
          borderRadius: "0.75rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <strong>⚠️ Funding Required</strong>: Free tier accounts require 50 credits to publish. Your balance: {credits} credits.
          </div>
          <Link href="/checkout" className="btn" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
            Top Up Credits
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px' }}>
        {error && <div style={{ color: 'hsl(var(--destructive))', padding: '1rem', background: 'hsl(var(--destructive)/0.1)', borderRadius: 'var(--radius)' }}>{error}</div>}
        
        {/* Campaign Format Type Selector */}
        <div>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Campaign Format</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setFormatType('social')}
              style={{
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: formatType === 'social' ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                background: formatType === 'social' ? "hsl(var(--primary) / 0.1)" : "hsl(var(--card))",
                color: "white",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>📱</div>
              <strong style={{ fontSize: "0.85rem" }}>Native Feed</strong>
            </button>

            <button
              type="button"
              onClick={() => setFormatType('carousel')}
              style={{
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: formatType === 'carousel' ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                background: formatType === 'carousel' ? "hsl(var(--primary) / 0.1)" : "hsl(var(--card))",
                color: "white",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>🎠</div>
              <strong style={{ fontSize: "0.85rem" }}>Carousel</strong>
            </button>

            <button
              type="button"
              onClick={() => setFormatType('geofenced')}
              style={{
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: formatType === 'geofenced' ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                background: formatType === 'geofenced' ? "hsl(var(--primary) / 0.1)" : "hsl(var(--card))",
                color: "white",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>📍</div>
              <strong style={{ fontSize: "0.85rem" }}>Geofenced Drop</strong>
            </button>
          </div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Headline</span>
          <input name="headline" required placeholder="Catchy title for your ad" style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Target Category</span>
          <select name="category" required style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }}>
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Content Text</span>
          <textarea name="text" required rows={3} placeholder="Describe your offer..." style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white', resize: 'vertical' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Image URL (Primary Slide)</span>
          <input name="imageUrl" type="url" required placeholder="https://images.unsplash.com/..." style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }} />
        </label>

        {/* Geofence Location Fields */}
        {formatType === 'geofenced' && (
          <div style={{ padding: '1rem', background: 'hsl(var(--card))', borderRadius: '0.5rem', border: '1px solid hsl(var(--primary) / 0.4)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <strong style={{ color: 'hsl(var(--primary))' }}>📍 Proximity Coordinates (Store / Drop Location)</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem' }}>Latitude</span>
                <input name="latitude" type="number" step="any" defaultValue="34.0196" required style={{ padding: '0.5rem', borderRadius: '0.375rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem' }}>Longitude</span>
                <input name="longitude" type="number" step="any" defaultValue="-118.4913" required style={{ padding: '0.5rem', borderRadius: '0.375rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }} />
              </label>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>Defaults to Santa Monica demo hub. Walkers within 5 miles will trigger proximity alerts.</span>
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '1rem', background: 'hsl(var(--card))', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }}>
          <input type="checkbox" checked={isABTest} onChange={(e) => setIsABTest(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
          <strong>Run A/B Test</strong>
          <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>(Test a second headline/image variant)</span>
        </label>
 
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '1rem', background: 'hsl(var(--card))', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }}>
          <input type="checkbox" name="isBoosted" style={{ transform: 'scale(1.2)' }} />
          <strong>Boost Placement</strong>
          <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>(Priority ranking in consumer feeds)</span>
        </label>

        {isABTest && (
          <div style={{ padding: '1rem', background: 'hsl(var(--card))', borderRadius: '0.5rem', border: '1px solid hsl(var(--primary) / 0.5)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: 'hsl(var(--primary))' }}>Variation B</h3>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span>Headline (Variation B)</span>
              <input name="headlineB" placeholder="Alternative headline" style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span>Image URL (Variation B)</span>
              <input name="imageUrlB" type="url" placeholder="Alternative image URL" style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }} />
            </label>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span>Primary Brand Color</span>
            <input name="primaryColor" type="color" defaultValue="#1bf693" style={{ width: '100%', height: '50px', padding: '0', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span>CTA Label</span>
            <input name="ctaLabel" required placeholder="e.g. Shop Now" style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }} />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span>Daily Budget (Credits)</span>
            <input name="dailyBudget" type="number" min="100" defaultValue="1000" required placeholder="1000" style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span>Max CPC Bid (Credits)</span>
            <input name="maxCpcBid" type="number" min="15" max="100" defaultValue="15" required placeholder="15" style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }} />
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Destination Store URL</span>
          <input name="ctaUrl" type="url" required placeholder="https://..." style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }} />
        </label>

        {/* Merchant Commercial & Safety Agreement Box */}
        <div style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius)',
          padding: '1rem',
          fontSize: '0.8rem',
          color: 'hsl(var(--muted-foreground))',
          lineHeight: '1.5'
        }}>
          <strong style={{ color: 'hsl(var(--foreground))', display: 'block', marginBottom: '0.35rem' }}>
            ⚖️ Merchant Agreement & Off-Platform Commerce Policy:
          </strong>
          AdMe connects your business with voluntary, high-intent consumers. All customer purchases occur directly on your own storefront or store location; AdMe is not a product retailer, holds zero inventory, and assumes no liability for merchant merchandise. All campaigns are vetted via automated AI content safety. Illicit, illegal, hateful, or misleading campaigns result in immediate ad takedown and permanent account termination.
        </div>

        <button type="submit" disabled={loading || !hasSufficientFunds} className="btn" style={{ marginTop: '0.25rem' }}>
          {loading ? "Screening & Publishing..." : "Publish Campaign"}
        </button>
      </form>
    </main>
  );
}

