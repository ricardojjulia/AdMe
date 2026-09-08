import { Ad } from '@/types/ad';

export const STATIC_MOCK_ADS: Ad[] = [
  // 1. Veteran-owned (2 ads)
  {
    id: '10101010-1010-1010-1010-101010101010',
    category: 'Veteran-owned',
    formatType: 'native',
    advertiser: {
      name: 'Valor Brews',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Veteran-Owned Craft Coffee',
      text: 'Support our team. Freshly roasted micro-batches delivered straight to your door. Veterans get 15% off every bag.',
      mediaUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#d97706'
    },
    cta: {
      label: 'Shop Coffee',
      url: 'https://valorbrews.com'
    },
    metrics: { likes: 1420, shares: 380 },
    location: { lat: 34.0195, lng: -118.4912 },
    isBoosted: true,
    maxCpcBid: 25,
    status: 'active'
  },
  {
    id: '10101010-1010-1010-1010-101010101020',
    category: 'Veteran-owned',
    formatType: 'social',
    advertiser: {
      name: 'Forward March Supply',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Rugged Expedition Gear',
      text: 'Engineered by combat veterans. Field-tested modular packs and weatherproof outdoor essentials built to last a lifetime.',
      mediaUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#059669'
    },
    cta: {
      label: 'Gear Up',
      url: 'https://forwardmarch.shop'
    },
    metrics: { likes: 940, shares: 210 },
    location: { lat: 34.0250, lng: -118.4800 },
    isBoosted: false,
    maxCpcBid: 20,
    status: 'active'
  },

  // 2. Local Eateries (2 ads)
  {
    id: '30303030-3030-3030-3030-303030303030',
    category: 'Local Eateries',
    formatType: 'social',
    advertiser: {
      name: 'The Green Kitchen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'California Harvest Bowls $5 Off',
      text: 'Clean eating made simple. Avocado, roasted sweet potato, and organic quinoa protein bowls with citrus tahini dressing.',
      mediaUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#16a34a'
    },
    cta: {
      label: 'Order Bowl',
      url: 'https://greenkitchensm.com'
    },
    metrics: { likes: 1280, shares: 310 },
    location: { lat: 34.0122, lng: -118.4922 },
    isBoosted: true,
    maxCpcBid: 30,
    status: 'active'
  },
  {
    id: '30303030-3030-3030-3030-303030303040',
    category: 'Local Eateries',
    formatType: 'native',
    advertiser: {
      name: 'Artisan Sourdough Co.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Wild Yeast Bread & Pastries',
      text: 'Naturally fermented 36-hour sourdough loaves and flaky morning croissants baked daily in our stone deck oven.',
      mediaUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#b45309'
    },
    cta: {
      label: 'View Bakery Menu',
      url: 'https://artisansourdough.local'
    },
    metrics: { likes: 820, shares: 140 },
    location: { lat: 34.0180, lng: -118.4950 },
    isBoosted: false,
    maxCpcBid: 18,
    status: 'active'
  },

  // 3. Faith & Books (2 ads)
  {
    id: '20202020-2020-2020-2020-202020202020',
    category: 'Faith & Books',
    formatType: 'native',
    advertiser: {
      name: 'Beacon Publishing',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Discover New Hope',
      text: 'An uplifting collection of real stories exploring resilience, community, and faith. Available in hardcover and audiobook.',
      mediaUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#7c3aed'
    },
    cta: {
      label: 'Explore Book',
      url: 'https://beaconpublishing.shop'
    },
    metrics: { likes: 650, shares: 120 },
    location: { lat: 37.7749, lng: -122.4194 },
    isBoosted: false,
    maxCpcBid: 15,
    status: 'active'
  },
  {
    id: '20202020-2020-2020-2020-202020202030',
    category: 'Faith & Books',
    formatType: 'social',
    advertiser: {
      name: 'Lumina Literary Press',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Classics for Mindful Living',
      text: 'Curated philosophical essays, poetry editions, and journals designed for quiet reflection and morning focus.',
      mediaUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#4f46e5'
    },
    cta: {
      label: 'Browse Library',
      url: 'https://luminalit.org'
    },
    metrics: { likes: 490, shares: 85 },
    location: { lat: 37.7800, lng: -122.4100 },
    isBoosted: false,
    maxCpcBid: 16,
    status: 'active'
  },

  // 4. Tech & SaaS (2 ads)
  {
    id: '50505050-5050-5050-5050-505050505010',
    category: 'Tech & SaaS',
    formatType: 'native',
    advertiser: {
      name: 'DevSync Pro',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Instant Cloud Dev Environments',
      text: 'Spin up isolated staging sandboxes with live hot-reloading and end-to-end telemetry. Designed for high-velocity software teams.',
      mediaUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#2563eb'
    },
    cta: {
      label: 'Start Free Trial',
      url: 'https://devsync.io'
    },
    metrics: { likes: 2150, shares: 620 },
    location: { lat: 37.7749, lng: -122.4194 },
    isBoosted: true,
    maxCpcBid: 35,
    status: 'active'
  },
  {
    id: '50505050-5050-5050-5050-505050505020',
    category: 'Tech & SaaS',
    formatType: 'social',
    advertiser: {
      name: 'CloudScale AI',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Automated Database Observability',
      text: 'Real-time query profiling, slow-query regression alerts, and automated index tuning for PostgreSQL and Next.js applications.',
      mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#0284c7'
    },
    cta: {
      label: 'View Live Demo',
      url: 'https://cloudscale.tech'
    },
    metrics: { likes: 1680, shares: 430 },
    location: { lat: 37.7850, lng: -122.4050 },
    isBoosted: false,
    maxCpcBid: 28,
    status: 'active'
  },

  // 5. Auto under $40k (2 ads)
  {
    id: '40404040-4040-4040-4040-404040404040',
    category: 'Auto under $40k',
    formatType: 'carousel',
    advertiser: {
      name: 'Nomad Motors',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Nomad Voyager EV from $34,900',
      text: '300-mile highway range, dual-motor all-weather AWD, and fast-charge to 80% in 22 minutes. Schedule a home test drive.',
      mediaUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800',
      carouselMediaUrls: [
        'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'
      ],
      mediaType: 'image',
      primaryColor: '#0ea5e9'
    },
    cta: {
      label: 'Explore EV',
      url: 'https://nomadmotors.ev'
    },
    metrics: { likes: 3540, shares: 920 },
    location: { lat: 34.0522, lng: -118.2437 },
    isBoosted: false,
    maxCpcBid: 40,
    status: 'active'
  },
  {
    id: '40404040-4040-4040-4040-404040404050',
    category: 'Auto under $40k',
    formatType: 'native',
    advertiser: {
      name: 'Metro Hybrid 2026',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: '54 MPG Compact City Hybrid at $24,500',
      text: 'Regenerative braking, smart lane guidance, and 10-year battery warranty. Enjoy premium efficiency without the luxury price tag.',
      mediaUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#14b8a6'
    },
    cta: {
      label: 'Build & Price',
      url: 'https://metrohybrid.auto'
    },
    metrics: { likes: 1910, shares: 360 },
    location: { lat: 34.0600, lng: -118.2500 },
    isBoosted: false,
    maxCpcBid: 25,
    status: 'active'
  },

  // 6. Wellness & Health (2 ads)
  {
    id: '60606060-6060-6060-6060-606060606010',
    category: 'Wellness & Health',
    formatType: 'native',
    advertiser: {
      name: 'Aura Mindfulness',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Guided Breathwork & Circadian Sleep',
      text: 'Science-backed soundscapes and personalized breathing exercises tailored to calm your nervous system in 10 minutes.',
      mediaUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#8b5cf6'
    },
    cta: {
      label: 'Try 7 Days Free',
      url: 'https://auramind.app'
    },
    metrics: { likes: 2400, shares: 580 },
    location: { lat: 34.0195, lng: -118.4912 },
    isBoosted: true,
    maxCpcBid: 26,
    status: 'active'
  },
  {
    id: '60606060-6060-6060-6060-606060606020',
    category: 'Wellness & Health',
    formatType: 'social',
    advertiser: {
      name: 'Pure Botanicals',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Cold-Pressed Herbal Adaptogens',
      text: '100% organic lion\'s mane, ashwagandha, and clean daily multivitamins. Third-party verified for purity and potency.',
      mediaUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#10b981'
    },
    cta: {
      label: 'Shop Formulas',
      url: 'https://purebotanicals.wellness'
    },
    metrics: { likes: 1120, shares: 190 },
    location: { lat: 34.0220, lng: -118.4850 },
    isBoosted: false,
    maxCpcBid: 22,
    status: 'active'
  },

  // 7. Home & Garden (2 ads)
  {
    id: '70707070-7070-7070-7070-707070707010',
    category: 'Home & Garden',
    formatType: 'native',
    advertiser: {
      name: 'Terra Living Co.',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Zero-Waste Home Essentials',
      text: 'Plastic-free bamboo kitchenware, natural beeswax wraps, and botanical cleaning refills delivered in compostable packaging.',
      mediaUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#84cc16'
    },
    cta: {
      label: 'Shop Sustainable',
      url: 'https://terraliving.co'
    },
    metrics: { likes: 1540, shares: 320 },
    location: { lat: 34.0150, lng: -118.4900 },
    isBoosted: false,
    maxCpcBid: 20,
    status: 'active'
  },
  {
    id: '70707070-7070-7070-7070-707070707020',
    category: 'Home & Garden',
    formatType: 'carousel',
    advertiser: {
      name: 'Bloom & Branch Nursery',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Living Houseplants for Clean Air',
      text: 'Thriving monstera, fiddle-leaf figs, and ceramic self-watering planters shipped with guaranteed safe arrival.',
      mediaUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=800',
      carouselMediaUrls: [
        'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&q=80&w=800'
      ],
      mediaType: 'image',
      primaryColor: '#22c55e'
    },
    cta: {
      label: 'Find Your Plant',
      url: 'https://bloombranch.green'
    },
    metrics: { likes: 1320, shares: 280 },
    location: { lat: 34.0280, lng: -118.4750 },
    isBoosted: false,
    maxCpcBid: 19,
    status: 'active'
  },

  // 8. Gaming (2 ads)
  {
    id: '80808080-8080-8080-8080-808080808010',
    category: 'Gaming',
    formatType: 'social',
    advertiser: {
      name: 'Aether Forge Studios',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Chronicles of Sol: Tactical RPG',
      text: 'Immerse yourself in turn-based tactical combat, deep branching lore, and player-driven guild warfare. Wishlist on PC and console today.',
      mediaUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#ec4899'
    },
    cta: {
      label: 'Wishlist Now',
      url: 'https://aetherforge.games'
    },
    metrics: { likes: 4200, shares: 1100 },
    location: { lat: 37.7749, lng: -122.4194 },
    isBoosted: true,
    maxCpcBid: 32,
    status: 'active'
  },
  {
    id: '80808080-8080-8080-8080-808080808020',
    category: 'Gaming',
    formatType: 'native',
    advertiser: {
      name: 'GuildCraft Hardware',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Precision Ultra-Light Gaming Mice',
      text: '8000Hz polling rate, optical micro-switches, and 49-gram magnesium alloy chassis for peak competitive aim.',
      mediaUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#f43f5e'
    },
    cta: {
      label: 'Shop Gear',
      url: 'https://guildcraft.gg'
    },
    metrics: { likes: 2890, shares: 640 },
    location: { lat: 37.7820, lng: -122.4150 },
    isBoosted: false,
    maxCpcBid: 24,
    status: 'active'
  },

  // 9. Finance (2 ads)
  {
    id: '90909090-9090-9090-9090-909090909010',
    category: 'Finance',
    formatType: 'native',
    advertiser: {
      name: 'ClearPath Financial',
      avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'Automate Wealth with Low-Fee Indexing',
      text: 'Automated dollar-cost averaging into globally diversified index portfolios. Transparent, fiduciary, and commission-free.',
      mediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#06b6d4'
    },
    cta: {
      label: 'Start Investing',
      url: 'https://clearpath.finance'
    },
    metrics: { likes: 1840, shares: 410 },
    location: { lat: 37.7749, lng: -122.4194 },
    isBoosted: true,
    maxCpcBid: 38,
    status: 'active'
  },
  {
    id: '90909090-9090-9090-9090-909090909020',
    category: 'Finance',
    formatType: 'social',
    advertiser: {
      name: 'Harbor Trust Bank',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    },
    content: {
      headline: 'High-Yield FDIC Savings at 5.15% APY',
      text: 'Earn 10x the national average on your emergency reserve fund. Zero maintenance fees, no lockup periods, instant ACH transfers.',
      mediaUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#3b82f6'
    },
    cta: {
      label: 'Open Account',
      url: 'https://harbortrust.bank'
    },
    metrics: { likes: 1470, shares: 290 },
    location: { lat: 37.7900, lng: -122.4000 },
    isBoosted: false,
    maxCpcBid: 30,
    status: 'active'
  }
];

export function generateMockAds(count: number = 18, userLocation?: { lat: number; lng: number }): Ad[] {
  const baseAds = STATIC_MOCK_ADS.map(ad => ({ ...ad }));
  
  if (count <= baseAds.length) {
    return baseAds.slice(0, count).map(ad => {
      if (userLocation && ad.location) {
        // Subtle realistic local offset within ~5 miles
        const latOffset = (Math.random() - 0.5) * 0.08;
        const lngOffset = (Math.random() - 0.5) * 0.08;
        return {
          ...ad,
          location: {
            lat: userLocation.lat + latOffset,
            lng: userLocation.lng + lngOffset
          }
        };
      }
      return ad;
    });
  }

  // Generate clean A/B variations for extra items beyond the base catalog
  const variations: Ad[] = [];
  const extraCount = count - baseAds.length;

  for (let i = 0; i < extraCount; i++) {
    const parent = baseAds[i % baseAds.length];
    const isVariationB = (i % 2 === 1);
    
    let location = parent.location;
    if (userLocation) {
      const latOffset = (Math.random() - 0.5) * 0.12;
      const lngOffset = (Math.random() - 0.5) * 0.12;
      location = {
        lat: userLocation.lat + latOffset,
        lng: userLocation.lng + lngOffset
      };
    }

    variations.push({
      ...parent,
      id: `${parent.id.slice(0, -4)}${String(1000 + i)}`,
      campaignId: parent.id,
      variationName: isVariationB ? 'B' : 'A',
      content: {
        ...parent.content,
        headline: isVariationB ? `${parent.content.headline} · Member Special` : parent.content.headline,
        text: isVariationB ? `Special offer for AdMe community members. ${parent.content.text}` : parent.content.text
      },
      metrics: {
        likes: parent.metrics.likes + Math.floor(Math.random() * 200),
        shares: parent.metrics.shares + Math.floor(Math.random() * 50)
      },
      location
    });
  }

  return [...baseAds, ...variations];
}

export interface OrganicPost {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  category: string;
  likes: number;
  createdAt: string;
  mediaUrl?: string;
}

const MOCK_ORGANIC_TEMPLATES = [
  {
    author: "Alex Rivers",
    avatar: "A",
    content: "Just spent 3 hours refactoring our database queries. Found a query with a nested O(n^2) map that was slowing down page loads. Down to 42ms now! #coding #developer",
    category: "Tech & SaaS",
    likes: 312
  },
  {
    author: "Jordan Lee",
    avatar: "J",
    content: "Finally tried the fresh sourdough at the little bakery down the lane. Still warm from the oven! Supporting local family-owned shops is always worth the walk.",
    category: "Local Eateries",
    likes: 85,
    mediaUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=800"
  },
  {
    author: "Taylor Brooks",
    avatar: "TB",
    content: "Just finished reading 'The Great Resilience'. Truly life-affirming. The chapters on community-building in rural towns hit home. Highly recommend for your weekend reading list.",
    category: "Faith & Books",
    likes: 64
  },
  {
    author: "Morgan Chen",
    avatar: "MC",
    content: "Been research testing some electric cars under $40k. Surprised at how many affordable options are coming out with 250+ miles range now. Range anxiety is officially dead.",
    category: "Auto under $40k",
    likes: 189
  },
  {
    author: "Sam Miller",
    avatar: "SM",
    content: "Super proud of our local veteran-owned coffee shop today. They just sponsored the school sports day and set up free coffee stations. That's real community spirit in action.",
    category: "Veteran-owned",
    likes: 245
  },
  {
    author: "Dana Moss",
    avatar: "DM",
    content: "Planted some organic heirloom tomatoes in the backyard garden bed today. Hopefully, they sprout before the summer heat. Garden therapy is the best therapy.",
    category: "Home & Garden",
    likes: 120,
    mediaUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=800"
  },
  {
    author: "Casey Winters",
    avatar: "CW",
    content: "Started morning meditation and a 5k jog at dawn. Amazing how much more focused and calm you feel during the workday. Small steps, big rewards. #wellness #dailygoals",
    category: "Wellness & Health",
    likes: 172
  },
  {
    author: "Riley Knight",
    avatar: "RK",
    content: "Streamed the championship matches last night! That final boss raid strategy was insane. Can't wait to try that setup with my guild tonight.",
    category: "Gaming",
    likes: 420
  },
  {
    author: "Skyler Banks",
    avatar: "SB",
    content: "Highly recommend setting up automated monthly allocations into your index funds. It takes the emotional swings out of investing and builds long-term health. Keep it simple.",
    category: "Finance",
    likes: 215
  }
];

export function generateMockOrganicPosts(): OrganicPost[] {
  return MOCK_ORGANIC_TEMPLATES.map((item, idx) => ({
    id: `post-${idx}`,
    author: {
      name: item.author,
      avatar: item.avatar
    },
    content: item.content,
    category: item.category,
    likes: item.likes,
    createdAt: new Date(Date.now() - idx * 3600000).toISOString(),
    mediaUrl: item.mediaUrl
  }));
}
