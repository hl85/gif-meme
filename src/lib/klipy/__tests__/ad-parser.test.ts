import { describe, it, expect } from 'vitest';
import { parseKlipyData } from '../ad-parser';

function makeFileObject(baseUrl: string, w: number, h: number) {
  return {
    hd: {
      gif: { url: `${baseUrl}/hd.gif`, width: w, height: h, size: 5000 },
      webp: { url: `${baseUrl}/hd.webp`, width: w, height: h, size: 3000 },
      mp4: { url: `${baseUrl}/hd.mp4`, width: w, height: h, size: 2000 },
    },
    md: {
      gif: { url: `${baseUrl}/md.gif`, width: Math.round(w * 0.75), height: Math.round(h * 0.75), size: 3000 },
      webp: { url: `${baseUrl}/md.webp`, width: Math.round(w * 0.75), height: Math.round(h * 0.75), size: 2000 },
    },
    sm: {
      gif: { url: `${baseUrl}/sm.gif`, width: Math.round(w * 0.5), height: Math.round(h * 0.5), size: 1500 },
      webp: { url: `${baseUrl}/sm.webp`, width: Math.round(w * 0.5), height: Math.round(h * 0.5), size: 1000 },
    },
    xs: {
      gif: { url: `${baseUrl}/xs.gif`, width: Math.round(w * 0.25), height: Math.round(h * 0.25), size: 500 },
      webp: { url: `${baseUrl}/xs.webp`, width: Math.round(w * 0.25), height: Math.round(h * 0.25), size: 300 },
    },
  };
}

describe('parseKlipyData', () => {
  it('should parse nested Klipy file structure and separate ads', () => {
    const mockData = [
      {
        id: 4377637468312236,
        title: 'Good Night Love You',
        slug: 'good-night-love-you',
        type: 'gif',
        blur_preview: 'data:image/jpeg;base64,abc123',
        tags: [],
        file: makeFileObject('https://static.klipy.com/cat', 498, 498),
      },
      {
        is_ad: true,
        id: 'ad1',
        image_url: 'https://example.com/ad.png',
        click_url: 'https://example.com/click',
        impression_url: 'https://example.com/imp',
        width: 300,
        height: 250,
      },
      {
        id: 9876543210,
        title: 'Dancing Dog',
        slug: 'dancing-dog',
        type: 'gif',
        tags: ['funny'],
        file: makeFileObject('https://static.klipy.com/dog', 400, 300),
      },
    ];

    const result = parseKlipyData(mockData);

    expect(result.items).toHaveLength(2);
    expect(result.ads).toHaveLength(1);

    expect(result.items[0].id).toBe('4377637468312236');
    expect(result.items[0].title).toBe('Good Night Love You');
    expect(result.items[0].slug).toBe('good-night-love-you');
    expect(result.items[0].blur_preview).toBe('data:image/jpeg;base64,abc123');
    expect(result.items[0].url).toBe('https://static.klipy.com/cat/hd.webp');
    expect(result.items[0].preview_url).toBe('https://static.klipy.com/cat/sm.webp');
    expect(result.items[0].width).toBe(498);
    expect(result.items[0].height).toBe(498);

    expect(result.items[1].id).toBe('9876543210');
    expect(result.items[1].url).toBe('https://static.klipy.com/dog/hd.webp');
    expect(result.items[1].preview_url).toBe('https://static.klipy.com/dog/sm.webp');

    expect(result.ads[0].type).toBe('ad');
    expect(result.ads[0].id).toBe('ad1');
    expect(result.ads[0].click_url).toBe('https://example.com/click');
  });

  it('should fall back to smaller sizes when hd is missing', () => {
    const result = parseKlipyData([
      {
        id: 111,
        title: 'Partial',
        file: {
          md: {
            gif: { url: 'https://example.com/md.gif', width: 300, height: 200, size: 2000 },
          },
          xs: {
            webp: { url: 'https://example.com/xs.webp', width: 100, height: 67, size: 400 },
          },
        },
      },
    ]);

    expect(result.items[0].url).toBe('https://example.com/md.gif');
    expect(result.items[0].preview_url).toBe('https://example.com/xs.webp');
    expect(result.items[0].width).toBe(300);
  });

  it('should fall back to flat url fields for legacy/mock data', () => {
    const result = parseKlipyData([
      {
        id: 'gif1',
        title: 'Funny Cat',
        url: 'https://example.com/cat.gif',
        preview_url: 'https://example.com/cat_thumb.gif',
        width: 200,
        height: 200,
      },
    ]);

    expect(result.items[0].url).toBe('https://example.com/cat.gif');
    expect(result.items[0].preview_url).toBe('https://example.com/cat_thumb.gif');
    expect(result.items[0].width).toBe(200);
  });

  it('should handle empty or invalid data', () => {
    expect(parseKlipyData([])).toEqual({ items: [], ads: [] });
    expect(parseKlipyData(null as any)).toEqual({ items: [], ads: [] });
    expect(parseKlipyData(undefined as any)).toEqual({ items: [], ads: [] });
  });

  it('should convert numeric id to string', () => {
    const result = parseKlipyData([
      { id: 4377637468312236, title: 'Test', file: makeFileObject('https://x.com', 100, 100) },
    ]);
    expect(result.items[0].id).toBe('4377637468312236');
  });
});
