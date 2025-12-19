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

export function generateMockAds(count: number = 10): Ad[] {
    return Array.from({ length: count }).map((_, i) => {
        const template = CONTENT_TEMPLATES[Math.floor(Math.random() * CONTENT_TEMPLATES.length)];
        const advertiser = ADVERTISERS[Math.floor(Math.random() * ADVERTISERS.length)];
        const ctaUrl = advertiser.url ?? "https://adme.app";

        return {
            id: `ad-${Date.now()}-${i}`,
            advertiser: {
                name: advertiser.name,
                avatar: advertiser.avatar,
            },
            content: {
                headline: template.headline,
                text: template.text,
                mediaUrl: `https://picsum.photos/seed/${Math.random()}/800/1000`,
                mediaType: 'image',
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
        };
    });
}
