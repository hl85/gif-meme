'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="error-page">
      <div className="terminal-box">
        <div className="terminal-header">
          <span className="terminal-dot terminal-dot--red"></span>
          <span className="terminal-dot terminal-dot--yellow"></span>
          <span className="terminal-dot terminal-dot--green"></span>
          <span className="terminal-title">system_error.log</span>
        </div>
        <div className="terminal-content">
          <p className="terminal-prompt">$ status --check</p>
          <p className="terminal-error">CRITICAL: An unexpected error occurred.</p>
          <p className="terminal-text">Message: {error.message || 'Unknown error'}</p>
          {error.digest && <p className="terminal-text">Digest: {error.digest}</p>}
          <div className="terminal-actions">
            <button
              onClick={() => reset()}
              className="terminal-btn terminal-btn--primary"
            >
              Try Again
            </button>
            <a href="/" className="terminal-btn">
              Return Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
