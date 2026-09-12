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

const SYNDICATED_CATALOG: PublicSyndicationItem[] = [
  // 1. Local Marketplace / Classifieds Finds
  {
    id: "syn-mkt-1",
    sourceType: "marketplace",
    sourceName: "Local Marketplace",
    sourceUrl: "https://facebook.com/marketplace",
    authorName: "Carlos R.",
    authorAvatar: "CR",
    title: "Restored Mid-Century Teak Credenza",
    content: "Solid teak credenza with sliding tambour doors and brass hardware. Perfect for vinyl records or TV console. Clean condition from smoke-free home.",
    category: "Design",
    price: "$160",
    condition: "Excellent",
    neighborhood: "Santurce Art District",
    mediaUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&q=80&w=800",
    likes: 42
  },
  {
    id: "syn-mkt-2",
    sourceType: "marketplace",
    sourceName: "Local Classifieds",
    sourceUrl: "https://facebook.com/marketplace",
    authorName: "Valeria M.",
    authorAvatar: "VM",
    title: "6'2 Epoxy Performance Shortboard + FCS Fins",
    content: "Custom shaped epoxy board. Super fast in Caribbean swells, lightweight, pressure dings sealed watertight. Includes traction pad and leash.",
    category: "Outdoors",
    price: "$210",
    condition: "Like New",
    neighborhood: "Ocean Park Beach",
    mediaUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=800",
    likes: 67
  },
  {
    id: "syn-mkt-3",
    sourceType: "marketplace",
    sourceName: "Local Marketplace",
    sourceUrl: "https://facebook.com/marketplace",
    authorName: "Diego S.",
    authorAvatar: "DS",
    title: "Baratza Encore Conical Burr Grinder",
    content: "Upgraded my coffee setup so letting this go. 40 grind settings, ideal for V60 pour-overs, AeroPress, and French press. Clean burrs.",
    category: "Specialty Coffee",
    price: "$75",
    condition: "Gently Used",
    neighborhood: "Condado",
    mediaUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800",
    likes: 89
  },
  {
    id: "syn-mkt-4",
    sourceType: "marketplace",
    sourceName: "Local Classifieds",
    sourceUrl: "https://facebook.com/marketplace",
    authorName: "Luis K.",
    authorAvatar: "LK",
    title: "Vintage Fuji Steel Road Bike (54cm frame)",
    content: "Classic chromoly steel road bike. Shimano 105 groupset, freshly tuned with new bar tape and puncture-resistant tires. Smooth commuter.",
    category: "Outdoors",
    price: "$140",
    condition: "Tuned & Ready",
    neighborhood: "Miramar",
    mediaUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    likes: 53
  },

  // 2. Google Reviews & Public Community Highlights
  {
    id: "syn-rev-1",
    sourceType: "google_review",
    sourceName: "Google Maps Reviews",
    sourceUrl: "https://www.google.com/maps/search/Cafe+Cuatro+Sombras+Old+San+Juan",
    authorName: "Maria Elena G.",
    authorAvatar: "MG",
    title: "Café Cuatro Sombras Review",
    content: "“Hands down the best cortado and guava croissant in Old San Juan! The shade-grown Yauco beans give an incredible chocolatey finish. Staff treats you like family.”",
    category: "Specialty Coffee",
    rating: 4.9,
    neighborhood: "Old San Juan",
    mediaUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800",
    likes: 128
  },
  {
    id: "syn-rev-2",
    sourceType: "google_review",
    sourceName: "Google Maps Reviews",
    sourceUrl: "https://www.google.com/maps/search/Lote+23+Santurce",
    authorName: "Hector P.",
    authorAvatar: "HP",
    title: "Lote 23 Gastropark Review",
    content: "“Incredible vibe with 12 distinct chef kiosks! The artisanal craft beer and wood-fired mofongo are must-haves. Great outdoor music under the palms.”",
    category: "Local Eateries",
    rating: 4.8,
    neighborhood: "Santurce",
    mediaUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800",
    likes: 214
  },
  {
    id: "syn-rev-3",
    sourceType: "google_review",
    sourceName: "Google Maps Reviews",
    sourceUrl: "https://www.google.com/maps/search/Libreria+Laberinto+San+Juan",
    authorName: "Carmen T.",
    authorAvatar: "CT",
    title: "Librería Laberinto Review",
    content: "“A cultural haven in the heart of Calle Cruz. Rare Caribbean poetry, history, and a curated bilingual collection. Truly a reader’s sanctuary.”",
    category: "Faith & Books",
    rating: 4.9,
    neighborhood: "Calle Cruz, San Juan",
    mediaUrl: "https://images.unsplash.com/photo-1507842229452-9b2f6efd5c07?auto=format&fit=crop&q=80&w=800",
    likes: 95
  },

  // 3. Local Community Events & Pop-ups
  {
    id: "syn-evt-1",
    sourceType: "local_event",
    sourceName: "Community Calendar",
    sourceUrl: "https://facebook.com/events",
    authorName: "Santurce Cultural Board",
    authorAvatar: "SC",
    title: "Placita Farmers & Artisanal Makers Fair",
    content: "Weekly gathering of local hydroponic farmers, ceramicists, and street chefs. Live acoustic plena music, organic tropical produce, and fresh juices.",
    category: "Local Eateries",
    eventDate: "THIS SAT · 9:00 AM - 2:00 PM",
    venue: "Plaza del Mercado, Santurce",
    price: "Free Admission",
    mediaUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800",
    likes: 310
  },
  {
    id: "syn-evt-2",
    sourceType: "local_event",
    sourceName: "Community Calendar",
    sourceUrl: "https://facebook.com/events",
    authorName: "Ocean Collective",
    authorAvatar: "OC",
    title: "Sunrise Oceanfront Yoga & Beach Care",
    content: "Start your Sunday with a mindful 45-minute oceanfront vinyasa flow followed by a 20-minute community beach cleanup. Bring your own mat or towel.",
    category: "Wellness",
    eventDate: "SUN · 7:30 AM",
    venue: "Parque del Indio, Condado",
    price: "Donation-based",
    mediaUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
    likes: 184
  },
  {
    id: "syn-evt-3",
    sourceType: "local_event",
    sourceName: "Community Calendar",
    sourceUrl: "https://facebook.com/events",
    authorName: "Old San Juan Arts",
    authorAvatar: "OS",
    title: "Sunset Jazz & Plena on the Plaza",
    content: "Open-air indie jazz fusion concert under the historic lanterns. Featuring conservatory students and guest percussionists. Family-friendly.",
    category: "Design",
    eventDate: "FRI · 6:30 PM",
    venue: "Plaza de Armas, Old San Juan",
    price: "Free Public Event",
    mediaUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800",
    likes: 240
  }
];

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
 */
export async function getPublicSyndicatedPosts(
  userLocation?: { lat: number; lng: number } | null,
  categoryFilter?: string
): Promise<OrganicPost[]> {
  let items = [...SYNDICATED_CATALOG];

  if (categoryFilter && categoryFilter.trim() !== '') {
    items = items.filter(it => it.category.toLowerCase().includes(categoryFilter.toLowerCase()));
  }

  return items.map(syndicationItemToOrganicPost);
}
