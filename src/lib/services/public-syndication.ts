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

/**
 * Fetches public syndicated community posts (Marketplace, Google Reviews, Local Events).
 * Purely non-commercial fair use to enrich the user's localized feed with zero ad monetization.
 * Strict policy: Returns [] when no real, verified live feed or external API is available.
 * Zero made-up, demo, or synthetic data.
 */
export async function getPublicSyndicatedPosts(
  userLocation?: { lat: number; lng: number } | null,
  categoryFilter?: string
): Promise<OrganicPost[]> {
  // If no external live RSS/syndication API endpoint is connected, return empty array.
  return [];
}


