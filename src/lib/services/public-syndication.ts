import { OrganicPost } from "@/lib/mock-data";

export interface PublicSyndicationItem {
  id: string;
  sourceType: 'marketplace' | 'google_review' | 'local_event' | 'open_data';
  sourceName: string;
  sourceUrl: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  content: string;
  category: string;
  mediaUrl?: string;
  price?: string;
  condition?: string;
  rating?: number;
  eventDate?: string;
  venue?: string;
  neighborhood?: string;
  likes: number;
}

/**
 * Converts a PublicSyndicationItem into a standardized OrganicPost with safe attribution.
 */
export function syndicationItemToOrganicPost(item: PublicSyndicationItem): OrganicPost {
  return {
    id: item.id,
    author: {
      name: item.authorName,
      avatar: item.authorAvatar
    },
    content: item.content,
    category: item.category,
    likes: item.likes,
    createdAt: "Just now",
    mediaUrl: item.mediaUrl,
    syndication: {
      sourceType: item.sourceType,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      price: item.price,
      condition: item.condition,
      rating: item.rating,
      eventDate: item.eventDate,
      venue: item.venue,
      neighborhood: item.neighborhood,
      disclaimer: "Non-commercial community curation · 0% commission · Full credit to original source"
    }
  };
}

export async function getPublicSyndicatedPosts(
  userLocation?: { lat: number; lng: number } | null,
  coarseOrCategory?: { city?: string; region?: string } | string | null,
  categoryFilter?: string
): Promise<OrganicPost[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  let coarseLocation: { city?: string; region?: string } | null = null;
  let resolvedCategory = categoryFilter;

  if (typeof coarseOrCategory === 'string') {
    resolvedCategory = coarseOrCategory;
  } else if (coarseOrCategory) {
    coarseLocation = coarseOrCategory;
  }

  if (!userLocation && !coarseLocation?.city) {
    return [];
  }

  const city = coarseLocation?.city || '';
  const region = coarseLocation?.region || '';

  try {
    const query = new URLSearchParams();
    if (city) query.set('city', city);
    if (region) query.set('region', region);
    if (resolvedCategory && resolvedCategory.trim() !== '') {
      query.set('category', resolvedCategory.trim());
    }

    const res = await fetch(`/api/marketplace/nearby?${query.toString()}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) return [];

    return data.items.map((item: any) =>
      syndicationItemToOrganicPost({
        id: item.id,
        sourceType: 'marketplace',
        sourceName: item.sourceName || 'Facebook Marketplace',
        sourceUrl: item.sourceUrl,
        authorName: item.authorName,
        authorAvatar: item.authorAvatar,
        title: item.title,
        content: `${item.title}: ${item.content}`,
        category: item.category || 'Marketplace',
        mediaUrl: item.mediaUrl,
        price: item.price,
        condition: item.condition,
        neighborhood: item.neighborhood,
        likes: item.likes || 15
      })
    );
  } catch (e) {
    console.warn('Failed to load public syndicated posts:', e);
    return [];
  }
}


