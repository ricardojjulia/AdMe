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

  it('strictly adheres to zero-mock policy by returning empty array when no live syndication source is connected', async () => {
    const posts = await getPublicSyndicatedPosts();
    expect(posts).toEqual([]);
  });

  it('strictly returns empty array for category filters when no live external source is connected', async () => {
    const coffeePosts = await getPublicSyndicatedPosts(null, 'Specialty Coffee');
    expect(coffeePosts).toEqual([]);
  });
});
