import { KlipyGif, KlipyAd, KlipyFileVariant } from './types';

/**
 * Extract a file variant from the nested Klipy `file` object.
 * Tries sizes in order of preference: preferred → fallbacks.
 * Within each size, prefers webp → gif → mp4.
 */
function extractFileVariant(
  file: Record<string, Record<string, KlipyFileVariant>> | undefined,
  sizes: string[]
): KlipyFileVariant | null {
  if (!file) return null;
  const formats = ['webp', 'gif', 'mp4'];
  for (const size of sizes) {
    const bucket = file[size];
    if (!bucket) continue;
    for (const fmt of formats) {
      const variant = bucket[fmt];
      if (variant?.url) return variant;
    }
  }
  return null;
}

export function parseKlipyData(data: any[]): { items: KlipyGif[]; ads: KlipyAd[] } {
  const items: KlipyGif[] = [];
  const ads: KlipyAd[] = [];

  if (!Array.isArray(data)) {
    return { items, ads };
  }

  for (const item of data) {
    if (item.is_ad || item.ad_type || item.click_url || item.impression_url) {
      ads.push({
        type: 'ad',
        id: item.id || `ad-${Math.random().toString(36).substring(7)}`,
        image_url: item.image_url || item.url || '',
        click_url: item.click_url || '',
        impression_url: item.impression_url || '',
        width: item.width || 0,
        height: item.height || 0,
      });
    } else {
      // Extract from nested file structure (real Klipy API)
      const mainVariant = extractFileVariant(item.file, ['hd', 'md', 'sm', 'xs']);
      const previewVariant = extractFileVariant(item.file, ['sm', 'xs', 'md']);

      // Fallback to flat fields for backward compatibility / mock data
      const url = mainVariant?.url || item.url || item.media_url || '';
      const previewUrl = previewVariant?.url || item.preview_url || item.thumb_url || url;
      const width = mainVariant?.width || item.width || 0;
      const height = mainVariant?.height || item.height || 0;

      items.push({
        id: String(item.id || ''),
        title: item.title || item.name || '',
        slug: item.slug,
        url,
        preview_url: previewUrl,
        blur_preview: item.blur_preview,
        width,
        height,
        source: item.source || 'klipy',
      });
    }
  }

  return { items, ads };
}
