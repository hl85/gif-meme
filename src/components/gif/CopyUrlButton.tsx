'use client';

import { useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '@/lib/utils/clipboard';

interface CopyUrlButtonProps {
  url: string;
  label?: string;
  ariaLabel?: string;
}

const COPY_RESET_DELAY_MS = 2000;

export function CopyUrlButton({
  url,
  label = 'Copy URL',
  ariaLabel = 'Copy URL',
}: CopyUrlButtonProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  function scheduleReset() {
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
    }

    resetTimeoutRef.current = window.setTimeout(() => {
      setCopyState('idle');
      resetTimeoutRef.current = null;
    }, COPY_RESET_DELAY_MS);
  }

  async function handleCopy() {
    const copied = await copyToClipboard(url);
    setCopyState(copied ? 'copied' : 'error');
    scheduleReset();
  }

  return (
    <button
      type="button"
      className="gif-detail__copy-btn"
      onClick={handleCopy}
      aria-label={ariaLabel}
    >
      <span aria-hidden="true">⎘</span>
      <span>
        {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : label}
      </span>
    </button>
  );
}
