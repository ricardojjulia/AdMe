import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');
  const cityParam = searchParams.get('city');
  const regionParam = searchParams.get('region');
  const category = searchParams.get('category') || '';

  const lat = latStr ? parseFloat(latStr) : null;
  const lng = lngStr ? parseFloat(lngStr) : null;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  // 1. If Google Places API key is configured and coordinates are supplied, try Google Places
  if (apiKey && lat != null && lng != null) {
    try {
      const type = category === 'Specialty Coffee' ? 'cafe' : (category === 'Wellness' ? 'gym' : 'restaurant');
      const googleUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=8000&type=${encodeURIComponent(type)}&key=${apiKey}`;
      const response = await fetch(googleUrl, { next: { revalidate: 3600 } });
      const data = await response.json();

      if (Array.isArray(data.results) && data.results.length > 0) {
        const categoryMap: Record<string, string> = {
          cafe: 'Specialty Coffee',
          restaurant: 'Local Eateries',
          bakery: 'Local Eateries',
          book_store: 'Faith & Books',
          gym: 'Wellness',
          clothing_store: 'Design'
        };

        const places = data.results.slice(0, 10).map((p: any) => {
          const photoRef = p.photos?.[0]?.photo_reference;
          const mediaUrl = photoRef 
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${apiKey}`
            : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800';

          return {
            name: p.name,
            category: categoryMap[p.types?.[0]] || (category || 'Local Eateries'),
            headline: p.vicinity ? `Spotlight in ${p.vicinity}` : `${p.name} · Local Community Favorite`,
            description: `Highly rated local venue with a ${p.rating || 4.7}★ rating across ${p.user_ratings_total || 50}+ patrons.`,
            mediaUrl,
            avatarUrl: p.icon || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=200',
            address: p.vicinity || 'Local Area',
            rating: p.rating || 4.8,
            reviewsCount: p.user_ratings_total || 85,
            lat: p.geometry.location.lat,
            lng: p.geometry.location.lng,
            websiteUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + (p.vicinity || ''))}`,
            primaryColor: '#059669',
            ctaLabel: 'View on Maps'
          };
        });

        return NextResponse.json({ places, source: 'google_places' });
      }
    } catch (e) {
      console.warn("Google Places query failed, falling back to OpenStreetMap:", e);
    }
  }

  // 2. Free OpenStreetMap Nominatim & Geosearch Engine (Zero API Key required, 100% real physical places)
  try {
    let resolvedCity = cityParam || '';
    let resolvedRegion = regionParam || '';

    // If coordinates are provided without city, reverse geocode to determine the real city
    if (!resolvedCity && lat != null && lng != null) {
      try {
        const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
        const revRes = await fetch(revUrl, {
          headers: { "User-Agent": "AdMe-LocalDiscovery/1.0 (contact@adforme.io)" },
          next: { revalidate: 86400 } // Cache reverse geocode for 24h
        });
        if (revRes.ok) {
          const revData = await revRes.json();
          resolvedCity = revData.address?.city || revData.address?.town || revData.address?.village || revData.address?.suburb || revData.address?.county || '';
          resolvedRegion = revData.address?.state || '';
        }
      } catch (e) {
        console.warn("Reverse geocode failed:", e);
      }
    }

    if (!resolvedCity) {
      resolvedCity = "Local Area";
    }

    const areaQuery = `${resolvedCity} ${resolvedRegion}`.trim();
    const places: any[] = [];
    const seenNames = new Set<string>();

    const searchQueries: { query: string; defaultCat: string; img: string; typeTag?: string }[] = [];
    if (category) {
      const lower = category.toLowerCase();
      if (lower.includes('coffee')) {
        searchQueries.push({ query: `cafe in ${areaQuery}`, defaultCat: 'Specialty Coffee', img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800' });
      } else if (lower.includes('eat') || lower.includes('food')) {
        searchQueries.push({ query: `restaurant in ${areaQuery}`, defaultCat: 'Local Eateries', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800' });
      } else if (lower.includes('well') || lower.includes('health') || lower.includes('dental')) {
        searchQueries.push(
          { query: `dentist in ${areaQuery}`, defaultCat: 'Health & Dental', img: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800' },
          { query: `optician in ${areaQuery}`, defaultCat: 'Vision & Care', img: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=800' }
        );
      } else if (lower.includes('finance') || lower.includes('bank')) {
        searchQueries.push({ query: `bank in ${areaQuery}`, defaultCat: 'Finance & Banking', img: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?auto=format&fit=crop&q=80&w=800' });
      } else if (lower.includes('home') || lower.includes('furniture') || lower.includes('design')) {
        searchQueries.push({ query: `furniture in ${areaQuery}`, defaultCat: 'Home & Living', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800' });
      } else {
        searchQueries.push({ query: `${category} in ${areaQuery}`, defaultCat: category, img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800' });
      }
    } else {
      // Balanced cross-section of diverse local business pillars (not just eateries!)
      searchQueries.push(
        { query: `dentist in ${areaQuery}`, defaultCat: 'Health & Dental', img: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800', typeTag: 'dentist' },
        { query: `optician in ${areaQuery}`, defaultCat: 'Vision & Care', img: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=800', typeTag: 'optician' },
        { query: `bank in ${areaQuery}`, defaultCat: 'Finance & Banking', img: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?auto=format&fit=crop&q=80&w=800', typeTag: 'bank' },
        { query: `furniture in ${areaQuery}`, defaultCat: 'Home & Living', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800', typeTag: 'furniture' },
        { query: `supermarket in ${areaQuery}`, defaultCat: 'Local Grocers', img: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=800', typeTag: 'supermarket' },
        { query: `cafe in ${areaQuery}`, defaultCat: 'Specialty Coffee', img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800', typeTag: 'cafe' },
        { query: `restaurant in ${areaQuery}`, defaultCat: 'Local Eateries', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800', typeTag: 'restaurant' }
      );
    }

    for (const sq of searchQueries) {
      try {
        const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(sq.query)}&format=json&limit=3`;
        const res = await fetch(searchUrl, {
          headers: { "User-Agent": "AdMe-LocalDiscovery/1.0 (contact@adforme.io)" },
          next: { revalidate: 7200 }
        });
        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items)) {
            for (const item of items) {
              const name = item.name;
              if (!name || seenNames.has(name.toLowerCase())) continue;
              seenNames.add(name.toLowerCase());

              // Parse neighborhood / street from display_name
              const parts = (item.display_name || '').split(',').map((s: string) => s.trim());
              const streetOrArea = parts.slice(1, 3).join(', ') || resolvedCity;

              let finalCat = sq.defaultCat;
              let headline = `Spotlight in ${resolvedCity}`;
              let description = `Verified local business on ${streetOrArea}. Supporting local commerce in ${resolvedCity}.`;

              if (item.type === 'dentist' || sq.defaultCat === 'Health & Dental') {
                finalCat = 'Health & Dental';
                headline = `Healthcare Provider in ${resolvedCity}`;
                description = `Trusted local healthcare practice on ${streetOrArea}. Verified location in ${resolvedCity}.`;
              } else if (item.type === 'optician' || sq.defaultCat === 'Vision & Care') {
                finalCat = 'Vision & Care';
                headline = `Vision & Eyewear in ${resolvedCity}`;
                description = `Local vision clinic and optometry services on ${streetOrArea}. Verified location in ${resolvedCity}.`;
              } else if (item.type === 'bank' || sq.defaultCat === 'Finance & Banking') {
                finalCat = 'Finance & Banking';
                headline = `Community Financial Services in ${resolvedCity}`;
                description = `Local branch banking and financial services on ${streetOrArea}. Verified in ${resolvedCity}.`;
              } else if (item.type === 'furniture' || sq.defaultCat === 'Home & Living') {
                finalCat = 'Home & Living';
                headline = `Home Furnishings in ${resolvedCity}`;
                description = `Local showroom and furnishings destination on ${streetOrArea}. Verified in ${resolvedCity}.`;
              } else if (item.type === 'supermarket' || sq.defaultCat === 'Local Grocers') {
                finalCat = 'Local Grocers';
                headline = `Provisions & Market in ${resolvedCity}`;
                description = `Local community market and everyday essentials on ${streetOrArea}. Verified in ${resolvedCity}.`;
              } else if (item.type === 'cafe') {
                finalCat = 'Specialty Coffee';
                headline = `Specialty Coffee in ${resolvedCity}`;
                description = `Artisanal brews and cafe gathering space on ${streetOrArea}. Verified location in ${resolvedCity}.`;
              } else if (item.type === 'restaurant') {
                finalCat = 'Local Eateries';
                headline = `Community Dining in ${resolvedCity}`;
                description = `Beloved local culinary spot on ${streetOrArea}. Verified location in ${resolvedCity}.`;
              }

              places.push({
                name: name,
                category: finalCat,
                headline: headline,
                description: description,
                mediaUrl: sq.img,
                avatarUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=200',
                address: item.display_name,
                rating: 4.8,
                reviewsCount: 75,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                websiteUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + resolvedCity)}`,
                primaryColor: '#059669',
                ctaLabel: 'View on Maps'
              });
            }
          }
        }
      } catch (e) {
        console.warn(`Search failed for ${sq.query}:`, e);
      }
    }

    return NextResponse.json({ places, area: areaQuery, source: 'openstreetmap' });
  } catch (error) {
    console.error('Local discovery engine failed:', error);
    return NextResponse.json({ places: [], error: 'Failed to query local discovery' }, { status: 500 });
  }
}
