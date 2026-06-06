"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import { createClient } from "@/lib/supabase/client";
import styles from "../page.module.css";

const ALL_CATEGORIES = [
  "Tech", "Local", "Travel", "Style", "Food", 
  "Design", "Outdoors", "Gaming", "Wellness", "Beauty", "Finance"
];

export default function CreateAdPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isABTest, setIsABTest] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!user) {
      setError("You must be logged in.");
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

    const supabase = createClient();
    
    // Generate a UUID for the campaign
    const campaignId = crypto.randomUUID();

    const baseAd = {
      owner_id: user.id,
      category,
      format_type: 'social',
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
      is_boosted: isBoosted
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
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
        {error && <div style={{ color: 'hsl(var(--destructive))', padding: '1rem', background: 'hsl(var(--destructive)/0.1)', borderRadius: 'var(--radius)' }}>{error}</div>}
        
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Headline</span>
          <input name="headline" required placeholder="Catchy title for your ad" style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Category</span>
          <select name="category" required style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }}>
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Content Text</span>
          <textarea name="text" required rows={3} placeholder="Describe your offer..." style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white', resize: 'vertical' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Image URL</span>
          <input name="imageUrl" type="url" required placeholder="https://..." style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }} />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem', padding: '1rem', background: 'hsl(var(--card))', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }}>
          <input type="checkbox" checked={isABTest} onChange={(e) => setIsABTest(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
          <strong>Run A/B Test</strong>
          <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>(Test a second variation)</span>
        </label>
 
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem', padding: '1rem', background: 'hsl(var(--card))', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }}>
          <input type="checkbox" name="isBoosted" style={{ transform: 'scale(1.2)' }} />
          <strong>Boost Proximity Placement</strong>
          <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>(Pay to rank first in nearby local searches)</span>
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

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Destination URL</span>
          <input name="ctaUrl" type="url" required placeholder="https://..." style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: 'none', color: 'white' }} />
        </label>

        <button type="submit" disabled={loading} className="btn" style={{ marginTop: '1rem' }}>
          {loading ? "Publishing..." : "Publish Campaign"}
        </button>
      </form>
    </main>
  );
}
