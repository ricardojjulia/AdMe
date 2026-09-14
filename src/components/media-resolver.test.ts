import { describe, it, expect } from 'vitest';
import { 
  hashStringToNumber, 
  CATEGORY_PHOTO_POOLS, 
  BRAND_IMAGE_PRESETS, 
  resolvePlacePhoto 
} from '@/lib/services/media-resolver';

describe('Media Resolver & Anti-Repetition Photo Pools', () => {
  it('should generate stable deterministic hashes for string inputs', () => {
    const hash1 = hashStringToNumber('Starbucks - Santa Monica');
    const hash2 = hashStringToNumber('Starbucks - Santa Monica');
    const hash3 = hashStringToNumber('Philz Coffee - Santa Monica');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toBeGreaterThanOrEqual(0);
  });

  it('should ensure distinct adjacent places in the same category receive different photos', async () => {
    const photo1 = await resolvePlacePhoto({
      name: 'Blue Bottle Coffee',
      address: '123 Main St, Santa Monica',
      category: 'Specialty Coffee'
    });

    const photo2 = await resolvePlacePhoto({
      name: 'Sightglass Coffee Roasters',
      address: '456 Ocean Ave, Santa Monica',
      category: 'Specialty Coffee'
    });

    const photo3 = await resolvePlacePhoto({
      name: 'Dunkin Donuts',
      address: '789 Wilshire Blvd, Santa Monica',
      category: 'Specialty Coffee'
    });

    expect(photo1).toBeTruthy();
    expect(photo2).toBeTruthy();
    expect(photo3).toBeTruthy();
    // Verify that at least two of the three distinct places get distinct photos
    const uniquePhotos = new Set([photo1, photo2, photo3]);
    expect(uniquePhotos.size).toBeGreaterThanOrEqual(2);
  });

  it('should resolve known brand presets when matched', async () => {
    const starbucksPhoto = await resolvePlacePhoto({
      name: 'Starbucks Coffee',
      category: 'Specialty Coffee',
      brand: 'Starbucks'
    });

    expect(starbucksPhoto).toBe(BRAND_IMAGE_PRESETS['starbucks']);

    const publixPhoto = await resolvePlacePhoto({
      name: 'Publix Super Market at Wiregrass',
      category: 'Local Grocers',
      brand: 'Publix'
    });

    expect(publixPhoto).toBe(BRAND_IMAGE_PRESETS['publix']);
  });

  it('should resolve sub-cuisine specific photography for eateries', async () => {
    const pizzaPhoto = await resolvePlacePhoto({
      name: 'Joe & Sal Pizzeria',
      category: 'Local Eateries',
      cuisine: 'pizza'
    });

    const sushiPhoto = await resolvePlacePhoto({
      name: 'Kabuki Japanese Restaurant',
      category: 'Local Eateries',
      cuisine: 'sushi'
    });

    const tacoPhoto = await resolvePlacePhoto({
      name: 'Taqueria El Sol',
      category: 'Local Eateries',
      cuisine: 'mexican;tacos'
    });

    expect(pizzaPhoto).toContain('photo-1513104890138-7c749659a591'); // Artisan pizza
    expect(sushiPhoto).toContain('photo-1579871494447-9811cf80d66c'); // Fresh sushi
    expect(tacoPhoto).toContain('photo-1565299585323-38d6b0865b47'); // Craft tacos
  });

  it('should prioritize direct valid OSM image if provided', async () => {
    const directUrl = 'https://upload.wikimedia.org/wikipedia/commons/test_photo.jpg';
    const photo = await resolvePlacePhoto({
      name: 'Historic Cafe',
      category: 'Specialty Coffee',
      directImage: directUrl
    });

    expect(photo).toBe(directUrl);
  });

  it('should gracefully handle empty or unknown categories with fallback pool', async () => {
    const fallbackPhoto = await resolvePlacePhoto({
      name: 'Random Mystery Spot',
      category: 'Unknown Custom Category'
    });

    expect(fallbackPhoto).toBeTruthy();
    expect(fallbackPhoto.startsWith('https://images.unsplash.com/')).toBe(true);
  });
});
