export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <span className="site-footer__copy">
          © {year} GifMeme
        </span>
        <span className="site-footer__sep" aria-hidden="true">·</span>
        <span className="site-footer__tagline">gifs for every occasion</span>
      </div>
    </footer>
  );
}
