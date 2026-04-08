'use client';

import React, { useEffect, useRef } from 'react';
import { KlipyAd as KlipyAdType } from '@/lib/klipy/types';
import { trackImpression, trackClick } from '@/lib/klipy/ad-tracker';

interface KlipyAdProps {
  ad: KlipyAdType;
  className?: string;
}

export function KlipyAd({ ad, className = '' }: KlipyAdProps) {
  const adRef = useRef<HTMLAnchorElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting) {
          if (!timerRef.current) {
            timerRef.current = setTimeout(() => {
              trackImpression(ad.impression_url);
            }, 1000);
          }
        } else {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      {
        threshold: 0.5,
      }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      observer.disconnect();
    };
  }, [ad.impression_url]);

  const handleClick = () => {
    trackClick(ad.click_url);
  };

  return (
    <a
      ref={adRef}
      href={ad.click_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`block relative overflow-hidden rounded-md border border-green-500/30 bg-black/50 hover:border-green-400 transition-colors ${className}`}
      data-testid="klipy-ad"
    >
      <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded-bl-md z-10 font-mono uppercase tracking-wider">
        Ad
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ad.image_url}
        alt="Advertisement"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </a>
  );
}
