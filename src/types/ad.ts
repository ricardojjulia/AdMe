export interface Ad {
    id: string;
    advertiser: {
        name: string;
        avatar: string;
    };
    content: {
        headline: string;
        text: string;
        mediaUrl: string; // Placeholder for image/video URL
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
}
