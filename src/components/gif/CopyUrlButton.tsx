'use client';

interface CopyUrlButtonProps {
  url: string;
}

export function CopyUrlButton({ url }: CopyUrlButtonProps) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('input');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  }

  return (
    <button
      className="gif-detail__copy-btn"
      onClick={handleCopy}
      aria-label="Copy link to this GIF"
    >
      <span aria-hidden="true">⎘</span>
      <span>Copy URL</span>
    </button>
  );
}
