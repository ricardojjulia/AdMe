import { Ad } from "@/types/ad";
import { calculateDistanceMiles } from "@/lib/utils/distance";

export interface LocalDiscoverySpot {
  name: string;
  category: string;
  headline: string;
  description: string;
  mediaUrl: string;
  avatarUrl: string;
  address: string;
  rating: number;
  reviewsCount: number;
  lat: number;
  lng: number;
  websiteUrl: string;
  primaryColor: string;
  ctaLabel: string;
}

// Curated authentic regional seeds (Puerto Rico, Miami, Austin, NYC, LA)
const REGIONAL_SEEDS: LocalDiscoverySpot[] = [
  // Puerto Rico / San Juan Metro
  {
    name: "Café Cuatro Sombras",
    category: "Specialty Coffee",
    headline: "Artisanal Single-Estate Yauco Roast",
    description: "Shade-grown coffee hand-picked from the high mountains of Yauco. Freshly roasted daily in historic Old San Juan with house-made guava croissants.",
    mediaUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800",
    avatarUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=200",
    address: "259 Calle de la Cruz, San Juan, 00901",
    rating: 4.8,
    reviewsCount: 384,
    lat: 18.4655,
    lng: -66.1167,
    websiteUrl: "https://cuatrosombrasonline.com",
    primaryColor: "#d97706",
    ctaLabel: "View Coffee Menu"
  },
  {
    name: "Lote 23 Gastropark",
    category: "Local Eateries",
    headline: "Culinary Hub with 12 Local Chef Kiosks",
    description: "Vibrant open-air gastronomy park featuring artisan craft cocktails, wood-fired mofongo, vegan creations, and live island music.",
    mediaUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    address: "1552 Ave Ponce de León, Santurce, San Juan, 00909",
    rating: 4.7,
    reviewsCount: 512,
    lat: 18.4485,
    lng: -66.0642,
    websiteUrl: "https://lote23.com",
    primaryColor: "#059669",
    ctaLabel: "Explore Kiosks"
  },
  {
    name: "Hacienda San Pedro Specialty Roasters",
    category: "Specialty Coffee",
    headline: "Centennial Coffee Farm Heritage",
    description: "Four generations of Jayuya highland coffee craftsmanship. Pour-overs, velvety flat whites, and artisanal sweet pastries in Santurce.",
    mediaUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    address: "318 Ave de Diego, Santurce, San Juan, 00909",
    rating: 4.9,
    reviewsCount: 420,
    lat: 18.4492,
    lng: -66.0694,
    websiteUrl: "https://cafehaciendasanpedro.com",
    primaryColor: "#b45309",
    ctaLabel: "Order Pour-Over"
  },
  {
    name: "Bakehouse Santurce",
    category: "Local Eateries",
    headline: "Slow-Fermented Sourdough & Patisserie",
    description: "Naturally leavened loaves baked at dawn every morning. Organic sourdough, almond croissants, and seasonal fruit tartlets.",
    mediaUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    address: "Calle Cerra 612, Santurce, San Juan, 00907",
    rating: 4.8,
    reviewsCount: 195,
    lat: 18.4520,
    lng: -66.0770,
    websiteUrl: "https://bakehousesanturce.com",
    primaryColor: "#16a34a",
    ctaLabel: "See Today's Bakes"
  },
  {
    name: "Librería Laberinto",
    category: "Faith & Books",
    headline: "Independent Caribbean & World Literature",
    description: "A beloved cultural sanctuary in Old San Juan. Rare Caribbean poetry, history, philosophy, and curated bilingual works.",
    mediaUrl: "https://images.unsplash.com/photo-1507842229452-9b2f6efd5c07?auto=format&fit=crop&q=80&w=800",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    address: "251 Calle de la Cruz, Old San Juan, 00901",
    rating: 4.9,
    reviewsCount: 230,
    lat: 18.4651,
    lng: -66.1165,
    websiteUrl: "https://librerialaberintopr.com",
    primaryColor: "#0284c7",
    ctaLabel: "Browse Collection"
  },
  {
    name: "Ocean Park Surf & Paddle Lab",
    category: "Outdoors",
    headline: "Coastal Kitesurfing & Wing-Foil Rentals",
    description: "Located right on Ocean Park beach. Premium board rentals, certified instructors, and sunrise paddleboard sessions.",
    mediaUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=800",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    address: "Calle Santa Ana, Ocean Park, San Juan, 00911",
    rating: 4.8,
    reviewsCount: 160,
    lat: 18.4525,
    lng: -66.0505,
    websiteUrl: "https://oceanparksurfpr.com",
    primaryColor: "#06b6d4",
    ctaLabel: "Book Board"
  },
  {
    name: "Santurce Design Co-Op",
    category: "Design",
    headline: "Independent Local Makers & Artisans",
    description: "A curated collective of Puerto Rican ceramicists, industrial designers, and apparel makers showcasing sustainable local craftsmanship.",
    mediaUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    address: "Calle Loíza 1804, Santurce, San Juan, 00911",
    rating: 4.9,
    reviewsCount: 145,
    lat: 18.4508,
    lng: -66.0585,
    websiteUrl: "https://santurcedesign.com",
    primaryColor: "#8b5cf6",
    ctaLabel: "Support Makers"
  },
  {
    name: "Zenith Flow Wellness Sanctuary",
    category: "Wellness",
    headline: "Rooftop Infrared Sauna & Breathwork",
    description: "Recover and recharge with cold plunge pools, infrared therapy, sound baths, and oceanfront open-air yoga.",
    mediaUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    address: "Ave Ashford 1054, Condado, San Juan, 00907",
    rating: 4.9,
    reviewsCount: 110,
    lat: 18.4580,
    lng: -66.0750,
    websiteUrl: "https://zenithflowpr.com",
    primaryColor: "#10b981",
    ctaLabel: "Reserve Session"
  }
];

/**
 * Converts a LocalDiscoverySpot into a full AdMe Ad object.
 * Flags it as `isLocalDiscovery: true`, `claimed: false`, with the claim funnel URL.
 */
export function spotToAd(spot: LocalDiscoverySpot, userLocation?: { lat: number; lng: number } | null): Ad {
  let distance: number | undefined;
  if (userLocation) {
    distance = calculateDistanceMiles(userLocation.lat, userLocation.lng, spot.lat, spot.lng);
  }

  const claimParams = new URLSearchParams({
    claim: 'true',
    name: spot.name,
    category: spot.category,
    address: spot.address,
    mediaUrl: spot.mediaUrl
  });

  return {
    id: `local-discovery-${spot.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    category: spot.category,
    formatType: 'native',
    advertiser: {
      name: spot.name,
      avatar: spot.avatarUrl
    },
    content: {
      headline: spot.headline,
      text: spot.description,
      mediaUrl: spot.mediaUrl,
      mediaType: 'image',
      primaryColor: spot.primaryColor
    },
    cta: {
      label: spot.ctaLabel,
      url: spot.websiteUrl
    },
    metrics: {
      likes: spot.reviewsCount * 3,
      shares: Math.floor(spot.reviewsCount * 0.8)
    },
    location: {
      lat: spot.lat,
      lng: spot.lng
    },
    distanceMiles: distance,
    isBoosted: spot.rating >= 4.8,
    isLocalDiscovery: true,
    claimed: false,
    placeDetails: {
      address: spot.address,
      rating: spot.rating,
      userRatingsTotal: spot.reviewsCount,
      openNow: true
    },
    claimUrl: `/studio/create?${claimParams.toString()}`,
    status: 'active'
  };
}

/**
 * Fetches Local Discovery spots for the user's location.
 * First queries `/api/places/nearby` if available; otherwise dynamically adapts
 * the rich regional seed catalog to the user's coordinates.
 */
export async function getLocalDiscoveryAds(
  userLocation?: { lat: number; lng: number } | null,
  categoryFilter?: string
): Promise<Ad[]> {
  // 1. Try server Google Places API route if coordinates exist
  if (userLocation && typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/places/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}${categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        if (data.places && data.places.length > 0) {
          return data.places.map((p: any) => spotToAd(p, userLocation));
        }
      }
    } catch (e) {
      console.warn("Google Places API proxy unavailable, using localized seeds", e);
    }
  }

  // 2. Synthesize & adapt seed spots around the user's real location
  return REGIONAL_SEEDS.map((seed, idx) => {
    let spot = { ...seed };
    if (userLocation) {
      // Offset realistically around user's current city/neighborhood (within 0.3 - 3.5 miles)
      const angle = (idx * (2 * Math.PI / REGIONAL_SEEDS.length)) + 0.3;
      const radiusDeg = 0.008 + (idx % 4) * 0.007; // ~0.5 to 2.5 miles
      spot.lat = userLocation.lat + Math.sin(angle) * radiusDeg;
      spot.lng = userLocation.lng + Math.cos(angle) * radiusDeg;
    }
    return spotToAd(spot, userLocation);
  });
}
