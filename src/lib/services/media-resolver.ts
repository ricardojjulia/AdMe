/**
 * Contextual Media Resolver & Anti-Repetition Photo Curation Service
 * Provides deep Wikimedia / Wikipedia image lookup and deterministic, 
 * diverse photography pools so adjacent feed cards never repeat identical photos.
 */

export function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Curated high-resolution photography pools per category and sub-cuisine
export const CATEGORY_PHOTO_POOLS: Record<string, string[]> = {
  'Specialty Coffee': [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800', // Artisan pourover cafe
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800', // Latte art on wooden table
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800', // Sunlit cafe interior
    'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&q=80&w=800', // Modern espresso bar
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&q=80&w=800', // Outdoor patio coffee
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80&w=800'  // Roasted beans & artisan cup
  ],
  'Local Eateries': [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800', // Modern dining hall
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800', // Warm ambient restaurant
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=800', // Bistro dining
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800', // Gourmet plates
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800', // Grill & BBQ
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800', // Artisan pizza oven
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800', // Fresh sushi bar
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=800'  // Craft Mexican tacos
  ],
  'Health & Dental': [
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800', // Dental suite
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800', // Modern clinic reception
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800', // Friendly doctor consultation
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800', // Pediatric / family healthcare
    'https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&q=80&w=800'  // Bright dental consultation
  ],
  'Vision & Care': [
    'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=800', // Designer eyewear collection
    'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800', // Modern optical shop
    'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&q=80&w=800', // Precision frames display
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800'  // Premium sunglasses and eyewear
  ],
  'Finance & Banking': [
    'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?auto=format&fit=crop&q=80&w=800', // Bank architecture
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800', // Modern financial district facade
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800', // Wealth advisory & financial planning
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800'  // Digital banking & customer support
  ],
  'Home & Living': [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800', // Green velvet sofa & living room
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800', // Modern Scandinavian interior
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800', // Minimalist chair & natural lighting
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800', // Warm textured living space
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800'  // Contemporary dining set & decor
  ],
  'Local Grocers': [
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=800', // Fresh produce supermarket aisle
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800', // Colorful farmers market crates
    'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&q=80&w=800', // Organic fruit display
    'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&q=80&w=800', // Fresh bakery & deli market
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=800'  // Gourmet neighborhood grocer
  ],
  'Wellness': [
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800', // Yoga studio with soft morning light
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800', // High-end fitness gym
    'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800', // Modern wellness & workout equipment
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=800'  // Meditation & mindful stretch space
  ],
  'Design': [
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'
  ]
};

// Known brand specific authentic imagery
export const BRAND_IMAGE_PRESETS: Record<string, string> = {
  'starbucks': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800',
  'publix': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=800',
  'whole foods': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
  'trader joe': 'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&q=80&w=800',
  'target': 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=800',
  'chase': 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?auto=format&fit=crop&q=80&w=800',
  'bank of america': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
  'wells fargo': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800'
};

export interface ResolvePlacePhotoParams {
  name: string;
  address?: string;
  category: string;
  typeTag?: string;
  cuisine?: string;
  brand?: string;
  wikidataId?: string;
  wikipediaTag?: string;
  directImage?: string;
}

/**
 * Attempts to retrieve an authentic Wikimedia Commons or Wikipedia image
 * for an entity with a wikidata ID or wikipedia article.
 */
export async function fetchWikimediaImage(
  wikidataId?: string, 
  wikipediaTag?: string
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second max latency budget

  try {
    // 1. Try Wikipedia pageimages if article tag is present (e.g. "en:Starbucks" or "Santa Monica Pier")
    if (wikipediaTag) {
      const title = wikipediaTag.replace(/^[a-z]{2}:/, '').trim();
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=800&titles=${encodeURIComponent(title)}`;
      const res = await fetch(wikiUrl, { 
        signal: controller.signal,
        headers: { 'User-Agent': 'AdMe-MediaResolver/1.0 (contact@adforme.io)' },
        next: { revalidate: 86400 } 
      });
      if (res.ok) {
        const data = await res.json();
        const pages = data.query?.pages;
        if (pages) {
          const firstKey = Object.keys(pages)[0];
          const thumb = pages[firstKey]?.thumbnail?.source;
          if (thumb) {
            clearTimeout(timeoutId);
            return thumb;
          }
        }
      }
    }

    // 2. Try Wikidata P18 image claim
    if (wikidataId && /^Q\d+$/.test(wikidataId)) {
      const wdUrl = `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikidataId}&property=P18&format=json`;
      const res = await fetch(wdUrl, { 
        signal: controller.signal,
        headers: { 'User-Agent': 'AdMe-MediaResolver/1.0 (contact@adforme.io)' },
        next: { revalidate: 86400 } 
      });
      if (res.ok) {
        const data = await res.json();
        const fileName = data.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
        if (fileName && typeof fileName === 'string') {
          clearTimeout(timeoutId);
          return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=800`;
        }
      }
    }
  } catch (e) {
    // Graceful fallback on network timeout or abort
  } finally {
    clearTimeout(timeoutId);
  }

  return null;
}

/**
 * Resolves the best possible contextual photograph for a venue:
 * 1. Explicit OpenStreetMap image (if specified).
 * 2. Wikimedia / Wikipedia lookup (if wikidata/wikipedia tag present).
 * 3. Known brand preset (if brand name matches).
 * 4. Deterministic contextual category photo pool (keyed by hash of name + address).
 */
export async function resolvePlacePhoto(params: ResolvePlacePhotoParams): Promise<string> {
  const { name, address = '', category, cuisine = '', brand = '', wikidataId, wikipediaTag, directImage } = params;

  // 1. Direct valid OSM image
  if (directImage && directImage.startsWith('http')) {
    return directImage;
  }

  // 2. Deep Wikimedia lookup
  if (wikidataId || wikipediaTag) {
    const wikiPhoto = await fetchWikimediaImage(wikidataId, wikipediaTag);
    if (wikiPhoto) {
      return wikiPhoto;
    }
  }

  // 3. Known brand preset
  const lowerName = name.toLowerCase();
  const lowerBrand = brand.toLowerCase();
  for (const [knownBrand, presetImg] of Object.entries(BRAND_IMAGE_PRESETS)) {
    if (lowerName.includes(knownBrand) || lowerBrand.includes(knownBrand)) {
      return presetImg;
    }
  }

  // 4. Sub-cuisine or specific food type selection
  const lowerCuisine = cuisine.toLowerCase();
  if (category === 'Local Eateries') {
    const eateriesPool = CATEGORY_PHOTO_POOLS['Local Eateries'];
    if (lowerCuisine.includes('pizza') || lowerName.includes('pizza')) {
      return eateriesPool[5]; // Artisan pizza
    }
    if (lowerCuisine.includes('sushi') || lowerCuisine.includes('japanese') || lowerName.includes('sushi')) {
      return eateriesPool[6]; // Fresh sushi bar
    }
    if (lowerCuisine.includes('mexican') || lowerCuisine.includes('taco') || lowerName.includes('taco')) {
      return eateriesPool[7]; // Craft tacos
    }
    if (lowerCuisine.includes('grill') || lowerCuisine.includes('bbq') || lowerName.includes('bbq')) {
      return eateriesPool[4]; // Grill & BBQ
    }
  }

  // 5. Deterministic selection from the category photo pool
  const pool = CATEGORY_PHOTO_POOLS[category] || CATEGORY_PHOTO_POOLS['Local Eateries'];
  const hash = hashStringToNumber(`${name}-${address}-${category}`);
  const selectedIndex = hash % pool.length;

  return pool[selectedIndex];
}
