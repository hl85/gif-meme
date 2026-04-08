"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { SearchInput } from "@/components/search/SearchInput";

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/browse", label: "browse" },
  { href: "/upload", label: "upload" },
  { href: "/trending", label: "trending" },
  { href: "/favorites", label: "favorites" },
];

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand" aria-label="GIF Meme home">
          <span className="site-header__brand-icon" aria-hidden="true">▶</span>
          <span className="site-header__brand-name">gif-meme</span>
        </Link>

        <div className="site-header__search">
          <SearchInput placeholder="search..." />
        </div>

        <nav
          className={`site-header__nav${menuOpen ? " site-header__nav--open" : ""}`}
          aria-label="Primary navigation"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="site-header__nav-link"
              onClick={() => setMenuOpen(false)}
            >
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

        <button
          className="site-header__mobile-toggle"
          data-testid="mobile-menu-toggle"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div className="site-header__mobile-nav" aria-hidden="false">
          <div className="site-header__mobile-search">
            <SearchInput placeholder="search..." />
          </div>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="site-header__mobile-nav-link"
              onClick={() => setMenuOpen(false)}
            >
              <span className="site-header__bracket">[</span>
              {label}
              <span className="site-header__bracket">]</span>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
