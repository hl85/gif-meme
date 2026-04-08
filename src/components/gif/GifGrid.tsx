import { GifCard } from './GifCard';
import { AdSlot } from '@/components/ads/AdSlot';
import type { KlipyGif, KlipyAd } from '@/lib/klipy/types';

interface GifGridProps {
  gifs: KlipyGif[];
  ads: KlipyAd[];
  onGifClick?: (gif: KlipyGif) => void;
  adFrequency?: number;
}

export function GifGrid({ gifs, ads, onGifClick, adFrequency = 12 }: GifGridProps) {
  return (
    <div className="gif-grid" data-testid="gif-grid">
      {gifs.length === 0 ? (
        <p className="gif-grid__empty" data-testid="gif-grid-empty">
          No GIFs found
        </p>
      ) : (
        gifs.map((gif, index) => (
          <div key={gif.id} className="gif-grid__cell">
            <GifCard gif={gif} onClick={onGifClick} />
            <AdSlot ads={ads} index={index} frequency={adFrequency} />
          </div>
        ))
      )}
    </div>
  );
}
