// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  CARRIED_GIF_DATA_KEY,
  carryGifData,
  getCarriedGifData,
} from '../carry-gif-data';
import type { KlipyGif } from '@/lib/klipy/types';

const mockGif: KlipyGif = {
  id: 'gif-1',
  title: 'Funny Cat',
  url: 'https://example.com/cat.gif',
  preview_url: 'https://example.com/cat-preview.gif',
  width: 400,
  height: 300,
  source: 'https://example.com/source',
};

describe('carry-gif-data', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('stores gif data in sessionStorage', () => {
    carryGifData(mockGif);

    expect(window.sessionStorage.getItem(CARRIED_GIF_DATA_KEY)).toBe(JSON.stringify(mockGif));
  });

  it('returns carried gif data and clears storage', () => {
    carryGifData(mockGif);

    expect(getCarriedGifData()).toEqual(mockGif);
    expect(window.sessionStorage.getItem(CARRIED_GIF_DATA_KEY)).toBeNull();
  });

  it('returns null for invalid stored data and still clears storage', () => {
    window.sessionStorage.setItem(CARRIED_GIF_DATA_KEY, '{invalid-json');

    expect(getCarriedGifData()).toBeNull();
    expect(window.sessionStorage.getItem(CARRIED_GIF_DATA_KEY)).toBeNull();
  });
});
