import React from 'react';
import { KlipyAd as KlipyAdType } from '@/lib/klipy/types';
import { KlipyAd } from './KlipyAd';

interface AdSlotProps {
  ads: KlipyAdType[];
  index: number;
  frequency?: number;
  className?: string;
}

export function AdSlot({ ads, index, frequency = 12, className = '' }: AdSlotProps) {
  if (!ads || ads.length === 0) {
    return null;
  }

  if ((index + 1) % frequency !== 0) {
    return null;
  }

  const adIndex = Math.floor(index / frequency) % ads.length;
  const ad = ads[adIndex];

  if (!ad) {
    return null;
  }

  return (
    <div className={`ad-slot ${className}`} data-testid="ad-slot">
      <KlipyAd ad={ad} />
    </div>
  );
}
