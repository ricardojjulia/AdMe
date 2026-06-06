export interface Ad {
    id: string;
    category: string;
    formatType: 'social' | 'native' | 'carousel';
    advertiser: {
        name: string;
        avatar: string;
    };
    content: {
        headline: string;
        text: string;
        mediaUrl: string; // Placeholder for image/video URL
        carouselMediaUrls?: string[]; // Multiple images for carousel format
        mediaType: 'image' | 'video';
        primaryColor: string; // Hex code for dynamic styling
    };
    cta: {
        label: string;
        url: string;
    };
    metrics: {
        likes: number;
        shares: number;
    };
    location?: {
        lat: number;
        lng: number;
    };
    distanceMiles?: number;
}
