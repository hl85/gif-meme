'use client';

import type { KlipyGif } from '@/lib/klipy/types';

export const CARRIED_GIF_DATA_KEY = 'gifmeme-carried-gif';

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function isKlipyGif(value: unknown): value is KlipyGif {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const gif = value as Partial<KlipyGif>;

  return (
    typeof gif.id === 'string' &&
    typeof gif.title === 'string' &&
    typeof gif.url === 'string' &&
    typeof gif.preview_url === 'string' &&
    typeof gif.width === 'number' &&
    typeof gif.height === 'number' &&
    typeof gif.source === 'string'
  );
}

export function carryGifData(gif: KlipyGif) {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(CARRIED_GIF_DATA_KEY, JSON.stringify(gif));
  } catch {
  }
}

export function getCarriedGifData(): KlipyGif | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(CARRIED_GIF_DATA_KEY);

  if (!rawValue) {
    return null;
  }

  window.sessionStorage.removeItem(CARRIED_GIF_DATA_KEY);

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;
    return isKlipyGif(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}
