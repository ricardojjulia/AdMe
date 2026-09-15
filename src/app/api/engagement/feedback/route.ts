import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_ACTIONS = new Set([
  'snooze_advertiser',
  'downweight_category',
  'irrelevant',
  'helpful'
]);

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adId, action, category } = body;

    if (!adId || !action || !VALID_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: 'Invalid or missing feedback parameters' },
        { status: 400 }
      );
    }

    // Zero-Knowledge check: Reject non-UUID syndicated items gracefully
    if (!UUID_REGEX.test(adId)) {
      return NextResponse.json({
        success: true,
        syndicated: true,
        recorded: 'client-only'
      });
    }

    const hasSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here';

    if (hasSupabase) {
      try {
        const supabase = getSupabaseAdmin();
        // Insert completely anonymous engagement signal (zero user_id, zero IP telemetry)
        await supabase.from('engagements').insert({
          ad_id: adId,
          user_id: null,
          engagement_type: action
        });
      } catch (err) {
        console.warn('[Feedback Route] Failed to insert engagement signal:', err);
      }
    }

    return NextResponse.json({
      success: true,
      adId,
      action,
      category,
      privacy: 'zero-knowledge'
    });
  } catch (error) {
    console.error('[Feedback Route] Unhandled exception:', error);
    return NextResponse.json(
      { error: 'Internal server error processing feedback' },
      { status: 500 }
    );
  }
}
