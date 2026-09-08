import { NextRequest, NextResponse } from 'next/server';
import { extractCoarseLocationFromHeaders } from '@/lib/location/edge';

export const dynamic = 'force-dynamic';

/**
 * Returns coarse edge location metadata with zero database persistence.
 * Conforms to COUNCIL-2026-004 data minimization mandates.
 */
export async function GET(req: NextRequest) {
  const coarseLocation = extractCoarseLocationFromHeaders(req.headers);

  return NextResponse.json(coarseLocation, {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
    },
  });
}
