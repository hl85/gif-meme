import { describe, it, expect } from 'vitest';
import { parseKlipyData } from '../ad-parser';

describe('parseKlipyData', () => {
  it('should separate ads from items', () => {
    const mockData = [
      {
        id: 'gif1',
        title: 'Funny Cat',
        url: 'https://example.com/cat.gif',
        width: 200,
        height: 200,
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
        id: 'gif2',
        name: 'Dancing Dog',
        media_url: 'https://example.com/dog.gif',
        width: 200,
        height: 200,
      },
    ];

    const result = parseKlipyData(mockData);

    expect(result.items).toHaveLength(2);
    expect(result.ads).toHaveLength(1);

    expect(result.items[0].id).toBe('gif1');
    expect(result.items[0].title).toBe('Funny Cat');
    expect(result.items[0].url).toBe('https://example.com/cat.gif');

    expect(result.items[1].id).toBe('gif2');
    expect(result.items[1].title).toBe('Dancing Dog');
    expect(result.items[1].url).toBe('https://example.com/dog.gif');

    expect(result.ads[0].type).toBe('ad');
    expect(result.ads[0].id).toBe('ad1');
    expect(result.ads[0].click_url).toBe('https://example.com/click');
  });

  it('should handle empty or invalid data', () => {
    expect(parseKlipyData([])).toEqual({ items: [], ads: [] });
    expect(parseKlipyData(null as any)).toEqual({ items: [], ads: [] });
    expect(parseKlipyData(undefined as any)).toEqual({ items: [], ads: [] });
  });
});
