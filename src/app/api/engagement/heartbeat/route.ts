import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SECRET_KEY = process.env.JWT_SECRET || 'adme_developer_secret_key_heartbeat_123';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    const { token, duration } = await request.json();
    if (!token || typeof duration !== 'number') {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const parts = token.split(':');
    if (parts.length !== 5) {
      return NextResponse.json({ error: 'Malformed token' }, { status: 400 });
    }

    const [adId, userId, timestampStr, engagementId, signature] = parts;
    const timestamp = Number(timestampStr);

    // Re-verify signature
    const rawData = `${adId}:${userId}:${timestampStr}:${engagementId}`;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(rawData)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Verify duration doesn't exceed elapsed time + 5s latency buffer
    const elapsedSeconds = (Date.now() - timestamp) / 1000;
    if (duration > elapsedSeconds + 5) {
      return NextResponse.json({ error: 'Dwell time anomaly detected' }, { status: 400 });
    }

    // Upsert the engagement log
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('engagements')
      .upsert({
        id: engagementId,
        user_id: userId,
        ad_id: adId,
        engagement_type: 'view',
        view_duration_seconds: duration
      });

    if (error) {
      console.error("Supabase heartbeat log error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
