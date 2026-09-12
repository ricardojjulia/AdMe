import { describe, it, expect } from 'vitest';
import { getPublicSyndicatedPosts, syndicationItemToOrganicPost } from '@/lib/services/public-syndication';

describe('Public Community Syndication Engine', () => {
  it('syndicates local marketplace listings with price, condition, and safe attribution', () => {
    const item = {
      id: 'syn-test-1',
      sourceType: 'marketplace' as const,
      sourceName: 'Local Marketplace',
      sourceUrl: 'https://facebook.com/marketplace',
      authorName: 'Carlos R.',
      authorAvatar: 'CR',
      title: 'Restored Mid-Century Teak Credenza',
      content: 'Solid teak credenza with sliding tambour doors.',
      category: 'Design',
      price: '$160',
      condition: 'Excellent',
      neighborhood: 'Santurce Art District',
      likes: 42
    };

    const post = syndicationItemToOrganicPost(item);

    expect(post.syndication).toBeDefined();
    expect(post.syndication?.sourceType).toBe('marketplace');
    expect(post.syndication?.price).toBe('$160');
    expect(post.syndication?.condition).toBe('Excellent');
    expect(post.syndication?.neighborhood).toBe('Santurce Art District');
    expect(post.syndication?.disclaimer).toContain('Non-commercial community curation');
  });

  it('syndicates Google reviews and local community events', async () => {
    const posts = await getPublicSyndicatedPosts();
    expect(posts.length).toBeGreaterThan(0);

    const reviewPost = posts.find(p => p.syndication?.sourceType === 'google_review');
    expect(reviewPost).toBeDefined();
    expect(reviewPost?.syndication?.rating).toBeGreaterThanOrEqual(4.5);

    const eventPost = posts.find(p => p.syndication?.sourceType === 'local_event');
    expect(eventPost).toBeDefined();
    expect(eventPost?.syndication?.eventDate).toBeDefined();
    expect(eventPost?.syndication?.venue).toBeDefined();
  });

  it('filters syndicated posts by category when requested', async () => {
    const coffeePosts = await getPublicSyndicatedPosts(null, 'Specialty Coffee');
    expect(coffeePosts.length).toBeGreaterThan(0);
    coffeePosts.forEach(p => {
      expect(p.category.toLowerCase()).toContain('coffee');
    });
  });
});
