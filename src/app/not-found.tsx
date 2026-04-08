import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="error-page">
      <div className="terminal-box">
        <div className="terminal-header">
          <span className="terminal-dot terminal-dot--red"></span>
          <span className="terminal-dot terminal-dot--yellow"></span>
          <span className="terminal-dot terminal-dot--green"></span>
          <span className="terminal-title">404_not_found.sh</span>
        </div>
        <div className="terminal-content">
          <p className="terminal-prompt">$ locate page</p>
          <p className="terminal-error">ERROR: Page not found.</p>
          <p className="terminal-text">The requested resource could not be located on this server.</p>
          <div className="terminal-actions">
            <Link href="/" className="terminal-btn terminal-btn--primary">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
