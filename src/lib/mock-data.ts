import { Ad } from '@/types/ad';

const ADVERTISERS = [
    { name: 'TechGear Pro', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=TechGear', url: 'https://techgear.pro' },
    { name: 'EcoLife', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=EcoLife', url: 'https://ecolife.com' },
    { name: 'Urban Eat', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=UrbanEat', url: 'https://urbaneat.app' },
    { name: 'StreamFlix', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=StreamFlix', url: 'https://streamflix.tv' },
    { name: 'TravelGo', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=TravelGo', url: 'https://travelgo.co' },
];

const CONTENT_TEMPLATES = [
    { headline: "Future of Work", text: "Experience the next-gen desk setup and claim early adopter pricing for members only." },
    { headline: "Go Green Today", text: "Swap everyday essentials for low-impact alternatives. Delivered in refillable packaging." },
    { headline: "Yum 🍔", text: "Craving something delicious? Get 50% off your first order and schedule drop-off tonight." },
    { headline: "Movie Night?", text: "Stream award winners before anyone else. Unlock a 30-day premium trial with zero ads." },
    { headline: "Escape Reality", text: "Book a long weekend in Lisbon with flight + stay bundles. Flexible dates and upgrades." }
];

const CTA_LABELS = ["Shop Now", "Learn More", "Sign Up", "Book Now", "Watch Trailer"];
const COLORS = ["#40c9ff", "#f4a261", "#9f7aea", "#34d399", "#f87171"];
const CATEGORIES = ["Tech & SaaS", "Local Eateries", "Faith & Books", "Auto under $40k", "Veteran-owned", "Home & Garden", "Wellness & Health", "Gaming", "Finance"];

const STATIC_MOCK_ADS: Ad[] = [
  {
    id: '10101010-1010-1010-1010-101010101010',
    category: 'Veteran-owned',
    formatType: 'native',
    advertiser: {
      name: 'Valor Brews',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=ValorBrews'
    },
    content: {
      headline: 'Veteran-Owned Craft Coffee',
      text: 'Get fresh, locally-roasted craft coffee delivered right to your door. Veterans get 15% off.',
      mediaUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#8B4513'
    },
    cta: {
      label: 'Shop Now',
      url: 'https://valor.brew'
    },
    metrics: { likes: 1240, shares: 320 },
    location: { lat: 34.0195, lng: -118.4912 }
  },
  {
    id: '30303030-3030-3030-3030-303030303030',
    category: 'Local Eateries',
    formatType: 'native',
    advertiser: {
      name: 'The Green Kitchen',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=GreenKitchen'
    },
    content: {
      headline: 'Organic bowls $5 off',
      text: 'Clean eating made simple. Try our new avocado and quinoa protein bowl with organic dressing.',
      mediaUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#2e7d32'
    },
    cta: {
      label: 'Order Now',
      url: 'https://greenkitchen.menu'
    },
    metrics: { likes: 980, shares: 145 },
    location: { lat: 34.0122, lng: -118.4922 }
  },
  {
    id: '40404040-4040-4040-4040-404040404040',
    category: 'Auto under $40k',
    formatType: 'native',
    advertiser: {
      name: 'Nomad Motors',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=NomadMotors'
    },
    content: {
      headline: 'EVs starting at $34,900',
      text: 'Go electric without breaking the bank. The new Nomad EV features 300mi range and autopilot.',
      mediaUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#1a73e8'
    },
    cta: {
      label: 'Explore',
      url: 'https://nomadmotors.ev'
    },
    metrics: { likes: 3420, shares: 890 },
    location: { lat: 34.0522, lng: -118.2437 }
  },
  {
    id: '20202020-2020-2020-2020-202020202020',
    category: 'Faith & Books',
    formatType: 'native',
    advertiser: {
      name: 'Beacon Publishing',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=BeaconPublishing'
    },
    content: {
      headline: 'Discover New Hope',
      text: 'A collection of stories about resilience, hope, and community. Get the bestseller softcover today.',
      mediaUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      primaryColor: '#673ab7'
    },
    cta: {
      label: 'Buy Book',
      url: 'https://beaconpublishing.shop'
    },
    metrics: { likes: 450, shares: 98 },
    location: { lat: 37.7749, lng: -122.4194 }
  }
];

export function generateMockAds(count: number = 10, userLocation?: { lat: number; lng: number }): Ad[] {
    const staticAds = STATIC_MOCK_ADS.map(ad => ({ ...ad }));
    const randomCount = Math.max(0, count - staticAds.length);

    const randomAds = Array.from({ length: randomCount }).map((_, i) => {
        const template = CONTENT_TEMPLATES[Math.floor(Math.random() * CONTENT_TEMPLATES.length)];
        const advertiser = ADVERTISERS[Math.floor(Math.random() * ADVERTISERS.length)];
        const ctaUrl = advertiser.url ?? "https://adme.app";
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const formatRand = Math.random();
        const formatType = formatRand > 0.66 ? 'social' : formatRand > 0.33 ? 'native' : 'carousel';

        // Generate a random nearby location if user location is provided
        let location;
        if (userLocation) {
            // Random offset roughly between 0 and ~50 miles (1 degree is ~69 miles)
            const latOffset = (Math.random() - 0.5) * 1.5; 
            const lngOffset = (Math.random() - 0.5) * 1.5;
            location = {
                lat: userLocation.lat + latOffset,
                lng: userLocation.lng + lngOffset
            };
        }

        return {
            id: `ad-${Date.now()}-${i}`,
            category,
            formatType: formatType as 'social' | 'native' | 'carousel',
            advertiser: {
                name: advertiser.name,
                avatar: advertiser.avatar,
            },
            content: {
                headline: template.headline,
                text: template.text,
                mediaUrl: `https://picsum.photos/seed/${Math.random()}/800/1000`,
                carouselMediaUrls: formatType === 'carousel' ? [
                    `https://picsum.photos/seed/${Math.random()}/800/1000`,
                    `https://picsum.photos/seed/${Math.random()}/800/1000`,
                    `https://picsum.photos/seed/${Math.random()}/800/1000`
                ] : undefined,
                mediaType: 'image' as 'image' | 'video',
                primaryColor: COLORS[Math.floor(Math.random() * COLORS.length)],
            },
            cta: {
                label: CTA_LABELS[Math.floor(Math.random() * CTA_LABELS.length)],
                url: ctaUrl,
            },
            metrics: {
                likes: Math.floor(Math.random() * 9000) + 240,
                shares: Math.floor(Math.random() * 1200) + 40,
            },
            location,
        } as Ad;
    });

    return [...staticAds, ...randomAds];
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
    content: "Super proud of our local veteran-owned grocery today. They just sponsored the school sports day and set up free fruit stalls. That's real community spirit in action.",
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

