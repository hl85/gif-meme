"use client";

import { useEffect, useRef, useState } from 'react';
import { GifCard } from './GifCard';
import { AdSlot } from '@/components/ads/AdSlot';
import { copyToClipboard } from '@/lib/utils/clipboard';
import type { KlipyGif, KlipyAd } from '@/lib/klipy/types';

interface GifGridProps {
  gifs: KlipyGif[];
  ads: KlipyAd[];
  adFrequency?: number;
}

type CopiedTarget = {
  gifId: string;
  type: 'link' | 'gif';
};

const COPY_FEEDBACK_DURATION_MS = 1500;

function LinkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="gif-grid__share-icon">
      <path
        d="M6.75 9.25 9.25 6.75m-4.5 5.5-1.5 1.5a2.121 2.121 0 0 1-3-3l2.5-2.5a2.121 2.121 0 0 1 3 3l-.5.5m6.5-6.5 1.5-1.5a2.121 2.121 0 1 1 3 3l-2.5 2.5a2.121 2.121 0 0 1-3-3l.5-.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="gif-grid__share-icon">
      <path
        d="M2.25 3.25h11.5v9.5H2.25zM4.75 10.25l2-2 2.25 2.25 1.25-1.25 1.5 1.5M5.5 6a1 1 0 1 0 0-.001Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function GifGrid({ gifs, ads, adFrequency = 12 }: GifGridProps) {
  const [copiedTarget, setCopiedTarget] = useState<CopiedTarget | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  async function handleCopy(gif: KlipyGif, type: CopiedTarget['type']) {
    if (typeof window === 'undefined') {
      return;
    }

    const text =
      type === 'link'
        ? `/gif/${gif.id}`
        : gif.url;

    const didCopy = await copyToClipboard(text);
    if (!didCopy) {
      return;
    }

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    setCopiedTarget({ gifId: gif.id, type });
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setCopiedTarget(null);
      feedbackTimeoutRef.current = null;
    }, COPY_FEEDBACK_DURATION_MS);
  }

  return (
    <div className="gif-grid" data-testid="gif-grid">
      {gifs.length === 0 ? (
        <p className="gif-grid__empty" data-testid="gif-grid-empty">
          No GIFs found
        </p>
      ) : (
        gifs.map((gif, index) => (
          <div key={gif.id} className="gif-grid__cell">
            <div className="gif-grid__card-wrap">
              <GifCard gif={gif} />
              <div className="gif-grid__share-overlay">
                <span className="gif-grid__share-feedback" aria-live="polite">
                  {copiedTarget?.gifId === gif.id ? 'Copied!' : ''}
                </span>
                <div className="gif-grid__share-actions" role="group" aria-label={`Share ${gif.title}`}>
                  <button
                    type="button"
                    className={`gif-grid__share-btn${copiedTarget?.gifId === gif.id && copiedTarget.type === 'link' ? ' gif-grid__share-btn--active' : ''}`}
                    aria-label={`Copy link for ${gif.title}`}
                    onClick={() => handleCopy(gif, 'link')}
                  >
                    <LinkIcon />
                  </button>
                  <button
                    type="button"
                    className={`gif-grid__share-btn${copiedTarget?.gifId === gif.id && copiedTarget.type === 'gif' ? ' gif-grid__share-btn--active' : ''}`}
                    aria-label={`Copy GIF URL for ${gif.title}`}
                    onClick={() => handleCopy(gif, 'gif')}
                  >
                    <ImageIcon />
                  </button>
                </div>
              </div>
            </div>
            <AdSlot ads={ads} index={index} frequency={adFrequency} />
          </div>
        ))
      )}

      <style jsx>{`
        .gif-grid__card-wrap {
          position: relative;
        }

        .gif-grid__share-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-2);
          padding: var(--space-2);
          background: linear-gradient(to bottom, rgba(15, 15, 15, 0.62) 0%, rgba(15, 15, 15, 0.12) 42%, transparent 68%);
          opacity: 0;
          transition: opacity var(--transition-fast);
          pointer-events: none;
        }

        @media (hover: hover) and (pointer: fine) {
          .gif-grid__card-wrap:hover .gif-grid__share-overlay {
            opacity: 1;
          }

          .gif-grid__share-btn:hover {
            border-color: var(--accent);
            background: rgba(34, 197, 94, 0.24);
            transform: translateY(-1px);
          }
        }

        .gif-grid__card-wrap:focus-within .gif-grid__share-overlay {
          opacity: 1;
        }

        .gif-grid__share-actions {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          margin-inline-start: auto;
          pointer-events: auto;
        }

        .gif-grid__share-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-md);
          background: rgba(15, 15, 15, 0.78);
          color: #fff;
          transition: border-color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast);
        }

        .gif-grid__share-btn:focus-visible,
        .gif-grid__share-btn--active {
          border-color: var(--accent);
          background: rgba(34, 197, 94, 0.24);
          transform: translateY(-1px);
        }

        .gif-grid__share-icon {
          width: 14px;
          height: 14px;
        }

        .gif-grid__share-feedback {
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          padding-inline: var(--space-3);
          border-radius: var(--radius-pill);
          background: rgba(15, 15, 15, 0.78);
          color: #fff;
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
