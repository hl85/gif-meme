import { KlipyGif, KlipyAd } from './types';

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
      items.push({
        id: item.id || '',
        title: item.title || item.name || '',
        url: item.url || item.media_url || '',
        preview_url: item.preview_url || item.thumb_url || item.url || '',
        width: item.width || 0,
        height: item.height || 0,
        source: item.source || 'klipy',
      });
    }
  }

  return { items, ads };
}
