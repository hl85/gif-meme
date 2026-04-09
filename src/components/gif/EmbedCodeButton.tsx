'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { copyToClipboard } from '@/lib/utils/clipboard';

interface EmbedCodeButtonProps {
  embedUrl: string;
}

const COPY_RESET_DELAY_MS = 2000;

export function EmbedCodeButton({ embedUrl }: EmbedCodeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const resetTimeoutRef = useRef<number | null>(null);

  const iframeCode = useMemo(
    () => `<iframe src="${embedUrl}" width="480" height="360" frameBorder="0"></iframe>`,
    [embedUrl]
  );

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

  async function handleCopyCode() {
    const copied = await copyToClipboard(iframeCode);
    setCopyState(copied ? 'copied' : 'error');
    scheduleReset();
  }

  return (
    <div className="gif-detail__embed">
      <button
        type="button"
        className="gif-detail__embed-btn"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">⌘</span>
        <span>Embed</span>
      </button>

      {isOpen && (
        <div className="gif-detail__embed-popup" role="dialog" aria-label="Embed code popup">
          <p className="gif-detail__embed-label">iframe code</p>
          <pre className="gif-detail__embed-code">
            <code>{iframeCode}</code>
          </pre>
          <div className="gif-detail__embed-actions">
            <button
              type="button"
              className="gif-detail__embed-copy-btn"
              onClick={handleCopyCode}
            >
              {copyState === 'copied'
                ? 'Copied'
                : copyState === 'error'
                  ? 'Copy failed'
                  : 'Copy Code'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
