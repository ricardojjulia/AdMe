import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET_KEY = process.env.JWT_SECRET || 'adme_developer_secret_key_heartbeat_123';

export async function POST(request: Request) {
  try {
    const { adId, userId } = await request.json();
    if (!adId || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const timestamp = Date.now();
    const engagementId = crypto.randomUUID();
    const rawData = `${adId}:${userId}:${timestamp}:${engagementId}`;
    const signature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(rawData)
      .digest('hex');

    const token = `${rawData}:${signature}`;

    return NextResponse.json({ token, engagementId });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
