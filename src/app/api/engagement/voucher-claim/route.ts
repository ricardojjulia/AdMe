import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adId, merchantName, offerName, code } = body;

    if (!adId || !code) {
      return NextResponse.json(
        { error: 'Invalid or missing voucher claim parameters' },
        { status: 400 }
      );
    }

    // Zero-Knowledge check: Handle mock or syndicated items gracefully
    if (!UUID_REGEX.test(adId)) {
      return NextResponse.json({
        success: true,
        syndicated: true,
        code,
        recorded: 'client-only'
      });
    }

    const hasSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here';

    if (hasSupabase) {
      try {
        const supabase = getSupabaseAdmin();
        // Insert completely anonymous conversion signal (zero user_id, zero IP telemetry)
        await supabase.from('engagements').insert({
          ad_id: adId,
          user_id: null,
          engagement_type: 'voucher_claim'
        });
      } catch (err) {
        console.warn('[Voucher Claim Route] Failed to insert engagement signal:', err);
      }
    }

    return NextResponse.json({
      success: true,
      adId,
      merchantName: merchantName || 'Local Partner',
      offerName: offerName || 'Community Voucher',
      code,
      privacy: 'zero-knowledge'
    });
  } catch (error) {
    console.error('[Voucher Claim Route] Unhandled exception:', error);
    return NextResponse.json(
      { error: 'Internal server error processing voucher claim' },
      { status: 500 }
    );
  }
}
