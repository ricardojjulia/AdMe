// scripts/seed-production-ads.ts
// Seeds the production Supabase Cloud and local database with pristine, curated campaigns

import { createClient } from '@supabase/supabase-js';
import { STATIC_MOCK_ADS } from '../src/lib/mock-data';

const CLOUD_URL = 'https://jmtwkiizirfussizdjmh.supabase.co';
const CLOUD_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptdHdraWl6aXJmdXNzaXpkam1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDQ0MjksImV4cCI6MjA5NjUyMDQyOX0.3U9I9dK9Es8Sz6q5CVEGHrCQ-LM3_sX802PriQmNeZ4';

async function seedDatabase(url: string, anonKey: string, label: string) {
  console.log(`\n--- Seeding ${label} (${url}) ---`);
  const supabase = createClient(url, anonKey);

  // Authenticate as Valor Brews (Business Owner)
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'valor@adme.demo',
    password: 'password123'
  });

  if (authErr) {
    console.error(`Authentication failed on ${label}:`, authErr.message);
    return false;
  }

  const ownerId = authData.user.id;
  console.log(`Authenticated as business owner: ${ownerId}`);

  // Map STATIC_MOCK_ADS to database columns
  const dbRows = STATIC_MOCK_ADS.map(ad => ({
    id: ad.id,
    category: ad.category,
    format_type: ad.formatType,
    advertiser_name: ad.advertiser.name,
    advertiser_avatar: ad.advertiser.avatar,
    headline: ad.content.headline,
    content_text: ad.content.text,
    media_url: ad.content.mediaUrl,
    media_type: ad.content.mediaType,
    primary_color: ad.content.primaryColor,
    cta_label: ad.cta.label,
    cta_url: ad.cta.url,
    likes: ad.metrics.likes,
    shares: ad.metrics.shares,
    latitude: ad.location?.lat,
    longitude: ad.location?.lng,
    owner_id: ownerId,
    is_boosted: ad.isBoosted || false,
    max_cpc_bid: ad.maxCpcBid || 20,
    status: 'active'
  }));

  console.log(`Upserting ${dbRows.length} pristine campaigns...`);
  const { data: upserted, error: upsertErr } = await supabase
    .from('ads')
    .upsert(dbRows, { onConflict: 'id' })
    .select('id, advertiser_name, headline');

  if (upsertErr) {
    console.error(`Failed to upsert campaigns on ${label}:`, upsertErr);
    return false;
  }

  console.log(`Successfully upserted ${upserted?.length || 0} campaigns on ${label}!`);
  for (const item of (upserted || [])) {
    console.log(`  ✓ [${item.advertiser_name}] ${item.headline}`);
  }

  return true;
}

async function main() {
  // 1. Seed Supabase Cloud
  await seedDatabase(CLOUD_URL, CLOUD_ANON, 'Supabase Cloud (Vercel Backend)');

  // 2. Seed Local Database if running
  const localUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:53321';
  const localKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
  if (localUrl.includes('127.0.0.1') || localUrl.includes('localhost')) {
    try {
      await seedDatabase(localUrl, localKey, 'Local Supabase');
    } catch (e: any) {
      console.warn('Local seed skipped:', e.message);
    }
  }

  console.log('\nSeeding complete! Both environments now feature clean, curated campaigns.');
}

main().catch(err => {
  console.error('Fatal error in seed script:', err);
  process.exit(1);
});
