import { describe, it, expect } from 'vitest';
import { mergeCategoryCards } from '../merge';
import type { KlipyGif } from '@/lib/klipy/types';

describe('mergeCategoryCards', () => {
  it('returns original gifs when no cards', () => {
    const gifs: KlipyGif[] = [
      { id: '1', title: 'Gif 1', url: 'url1', preview_url: 'preview1', width: 300, height: 300, source: '' },
      { id: '2', title: 'Gif 2', url: 'url2', preview_url: 'preview2', width: 300, height: 300, source: '' },
    ];
    const result = mergeCategoryCards(gifs, []);
    expect(result).toEqual(gifs);
  });

  it('inserts cards at correct positions', () => {
    const gifs: KlipyGif[] = [
      { id: '1', title: 'Gif 1', url: 'url1', preview_url: 'preview1', width: 300, height: 300, source: '' },
      { id: '2', title: 'Gif 2', url: 'url2', preview_url: 'preview2', width: 300, height: 300, source: '' },
      { id: '3', title: 'Gif 3', url: 'url3', preview_url: 'preview3', width: 300, height: 300, source: '' },
    ];
    const cards = [
      { id: 'card1', position: 1, imageUrl: 'image1.jpg', imageName: 'Card 1' },
      { id: 'card2', position: 3, imageUrl: 'image2.jpg', imageName: 'Card 2' },
    ];
    const result = mergeCategoryCards(gifs, cards);
    
    expect(result.length).toBe(5);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('card-card1');
    expect(result[2].id).toBe('2');
    expect(result[3].id).toBe('card-card2');
    expect(result[4].id).toBe('3');
    
    // Check card conversion
    expect(result[1]).toEqual({
      id: 'card-card1',
      url: 'image1.jpg',
      preview_url: 'image1.jpg',
      title: 'Card 1',
      width: 300,
      height: 300,
      source: '',
    });
  });

  it('appends card when position exceeds gifs length', () => {
    const gifs: KlipyGif[] = [
      { id: '1', title: 'Gif 1', url: 'url1', preview_url: 'preview1', width: 300, height: 300, source: '' },
      { id: '2', title: 'Gif 2', url: 'url2', preview_url: 'preview2', width: 300, height: 300, source: '' },
    ];
    const cards = [
      { id: 'card1', position: 10, imageUrl: 'image.jpg', imageName: 'Card at end' },
    ];
    const result = mergeCategoryCards(gifs, cards);
    
    expect(result.length).toBe(3);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
    expect(result[2].id).toBe('card-card1');
  });
});
