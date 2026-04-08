"use client";

import Link from "next/link";
import { useTheme } from "./ThemeProvider";

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/browse", label: "browse" },
  { href: "/upload", label: "upload" },
  { href: "/trending", label: "trending" },
];

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand" aria-label="GIF Meme home">
          <span className="site-header__brand-icon" aria-hidden="true">▶</span>
          <span className="site-header__brand-name">gif-meme</span>
        </Link>

        <nav className="site-header__nav" aria-label="Primary navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="site-header__nav-link">
              <span className="site-header__bracket">[</span>
              {label}
              <span className="site-header__bracket">]</span>
            </Link>
          ))}
        </nav>

        <button
          className="site-header__theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "◑" : "◐"}
        </button>
      </div>
    </header>
  );
}
