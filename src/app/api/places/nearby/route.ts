import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const category = searchParams.get('category') || 'restaurant';

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    // Graceful indicator to fallback to local discovery seeds
    return NextResponse.json({ places: [], note: 'Google Places API key not configured; using local discovery seeds.' });
  }

  try {
    // Query Google Places API (Nearby Search)
    const googleUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${encodeURIComponent(category)}&key=${apiKey}`;
    const response = await fetch(googleUrl, { next: { revalidate: 3600 } }); // Cache 1 hour
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ places: [] });
    }

    const categoryMap: Record<string, string> = {
      cafe: 'Specialty Coffee',
      restaurant: 'Local Eateries',
      bakery: 'Local Eateries',
      book_store: 'Faith & Books',
      gym: 'Wellness',
      clothing_store: 'Design'
    };

    const places = data.results.slice(0, 8).map((p: any) => {
      const photoRef = p.photos?.[0]?.photo_reference;
      const mediaUrl = photoRef 
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${apiKey}`
        : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800';

      return {
        name: p.name,
        category: categoryMap[p.types?.[0]] || 'Local Eateries',
        headline: p.vicinity ? `Spotlight in ${p.vicinity}` : `${p.name} · Local Community Favorite`,
        description: `Highly rated local venue with a ${p.rating || 4.7}★ rating across ${p.user_ratings_total || 50}+ patrons.`,
        mediaUrl,
        avatarUrl: p.icon || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=200',
        address: p.vicinity || 'Local District',
        rating: p.rating || 4.7,
        reviewsCount: p.user_ratings_total || 85,
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
        websiteUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=${p.place_id}`,
        primaryColor: '#059669',
        ctaLabel: 'View on Maps'
      };
    });

    return NextResponse.json({ places });
  } catch (error) {
    console.error('Google Places fetch failed:', error);
    return NextResponse.json({ places: [], error: 'Failed to query Google Places' }, { status: 500 });
  }
}
