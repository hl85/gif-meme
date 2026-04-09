# GifMeme Design System

## Overview

GifMeme uses a terminal-leaning UI style with compact spacing, monospaced interface text, bracketed navigation labels, and high-contrast accent states.

Source of truth in code:

- Tokens: `src/styles/tokens.css`
- Global UI primitives and component classes: `src/app/globals.css`
- App font setup: `src/app/layout.tsx`
- Theme runtime logic: `src/components/layout/ThemeProvider.tsx`
- Key UI components: `src/components/gif/GifGrid.tsx`, `src/components/gif/GifCard.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/categories/page.tsx`

Note: there is no `tailwind.config.*` file in this repository. The active visual tokens are CSS custom properties in `src/styles/tokens.css`, consumed from `src/app/globals.css` and component-level styles.

## Color Tokens

### Core palette (light)

Defined in `src/styles/tokens.css`:

- `--bg-base: #f9f9f8`
- `--bg-surface: #ffffff`
- `--border-default: #e5e5e5`
- `--text-primary: #1a1a1a`
- `--text-muted: #888888`
- `--text-faint: #aaaaaa`
- `--accent: #22c55e`
- `--color-heading: #3ddc84`

### Status and semantic colors

Defined in `src/styles/tokens.css`:

- Status text: `--status-1..6` = `#16a34a`, `#22c55e`, `#ca8a04`, `#ea580c`, `#dc2626`, `#991b1b`
- Status backgrounds: `--status-1-bg..6-bg` = `#dcfce7`, `#f0fdf4`, `#fef9c3`, `#fff7ed`, `#fef2f2`, `#fdf2f2`
- Category tags:
  - `--tag-community: #8b5cf6`
  - `--tag-permissive: #3b82f6`
  - `--tag-vendor-a: #0ea5e9`
  - `--tag-vendor-b: #f59e0b`

### Component-specific hard-coded colors

From `src/app/globals.css` and `src/components/gif/GifGrid.tsx`:

- Admin badge text: `#0f0f0f` on `var(--accent)` (`.admin-layout__label`)
- Gif card title text: `#fff` (`.gif-card__title`)
- Gif card overlay gradient: `rgba(0, 0, 0, 0.6)` to transparent (`.gif-card__overlay`)
- Share overlay dark layers: `rgba(15, 15, 15, 0.62)`, `rgba(15, 15, 15, 0.12)`, `rgba(15, 15, 15, 0.78)` (`GifGrid.tsx` style jsx)
- Share active fill: `rgba(34, 197, 94, 0.24)` (`GifGrid.tsx` style jsx)
- Terminal error panel palette:
  - Backgrounds: `#1a1a1a`, `#333`
  - Borders: `#333`, `#444`, `#666`
  - Text: `#d1d1d1`, `#999`, `#ccc`, `#fff`
  - Dots: `#ff5f56`, `#ffbd2e`, `#27c93f`
- Terminal primary button text: `#000`

## Typography

### Font families

- Root app font is Inter via Next Font in `src/app/layout.tsx`:
  - `Inter({ variable: "--font-inter", display: "swap" })`
- Token mapping in `src/styles/tokens.css`:
  - `--font-sans: var(--font-inter, 'Inter', system-ui, sans-serif)`
  - `--font-mono: ui-monospace, 'Fira Code', monospace`

### Usage pattern

From `src/app/globals.css`:

- `body` uses `var(--font-sans)` for base reading text
- Navigation, labels, controls, tables, badges, chart labels, and most UI chrome use `var(--font-mono)`
- Headings are bold with compact line-height, with hero headings also in mono for the terminal feel (`.home-page__heading`, `.favorites-page__title`)

## Component Patterns

### GifGrid

References: `src/components/gif/GifGrid.tsx`, `src/app/globals.css`

- Responsive grid: 2 columns default, 3 at `min-width: 480px`, 4 at `min-width: 768px`
- Gap scale: `var(--space-3)` then `var(--space-4)` on larger screens
- Hover/focus interaction pattern:
  - Hidden overlay revealed on hover or `:focus-within`
  - Compact icon action buttons with bordered dark chips
  - Accent border and accent-tinted background on active state
- Empty state pattern: centered mono text with faint color and large vertical padding

### GifCard

References: `src/components/gif/GifCard.tsx`, `src/app/globals.css`

- Square card ratio (`aspect-ratio: 1`), clipped media, subtle border
- Surface background token `var(--bg-surface)` with border token `var(--border-default)`
- Hover state uses accent border only, no heavy shadows
- Metadata/title is shown in bottom overlay gradient with mono text

### Admin layout and dashboard

References: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/categories/page.tsx`, `src/app/globals.css`

- Admin shell keeps same token set as public UI
- Label chip pattern for admin identity (`.admin-layout__label`)
- Data-dense structure:
  - Stat card grid: `repeat(auto-fit, minmax(200px, 1fr))`
  - Compact mono tables with thin separators
  - Inline bars and bar charts using accent and tag colors
- Controls reuse one button language (`.admin-range-nav__btn`, `.admin-main-nav__link`): thin border, mono text, accent on hover/active

### Spacing and layout rhythm

References: `src/styles/tokens.css`, `src/app/globals.css`, `src/components/layout/Shell.tsx`

- 4px-based spacing scale:
  - `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-6: 24px`, `--space-8: 32px`, `--space-12: 48px`
- Container max width: `--content-max-width: 1100px`
- Page paddings:
  - Mobile: `--page-padding-mobile: 24px`
  - Desktop: `--page-padding-desktop: 48px`
- Repeated structural rhythm:
  - Sections separated by `var(--space-6)` or `var(--space-8)`
  - Borders used as separators instead of shadows

### Decorative language

References: `src/components/layout/Header.tsx`, `src/app/globals.css`

- Bracket-wrapped nav labels: `[browse]`, `[upload]`, etc.
- Mono-first UI voice, including search placeholders and button labels
- Terminal-styled error surface (`.terminal-box`, `.terminal-header`, `.terminal-dot*`, `.terminal-btn*`)

## Dark Mode

### How dark mode is applied

References: `src/components/layout/ThemeProvider.tsx`, `src/app/globals.css`, `src/styles/tokens.css`

- Theme attribute is set on `<html>`: `data-theme="light" | "dark"`
- Initial theme resolution order:
  1. Stored value in `localStorage`
  2. `prefers-color-scheme`
- `html` uses `color-scheme: light`, and `[data-theme="dark"]` switches to `color-scheme: dark`
- Token override block in `src/styles/tokens.css` provides dark equivalents

### Dark token overrides

From `src/styles/tokens.css`:

- `--bg-base: #0f0f0f`
- `--bg-surface: #1a1a1a`
- `--border-default: #2a2a2a`
- `--text-primary: #e5e5e5`
- `--text-muted: #666666`
- `--text-faint: #444444`
- Accent and heading remain unchanged: `#22c55e`, `#3ddc84`
- Status backgrounds and status text are shifted for contrast on dark surfaces

## Do's / Don'ts

### Do

- Reuse existing CSS variables from `src/styles/tokens.css`
- Keep interaction styling subtle, thin borders, accent-driven state changes
- Prefer mono for controls, metrics, labels, and data-heavy surfaces
- Follow existing spacing increments and container widths
- Make hover and focus-visible states explicit, especially for interactive chips and icon buttons
- Keep dark mode parity by using token-based colors instead of hard-coded light-only values

### Don't

- Don't introduce new design tokens unless existing variables cannot express the requirement
- Don't add heavy shadows, glass effects, or gradient-heavy styling outside current patterns
- Don't replace bracketed or terminal-like UI language with unrelated visual motifs
- Don't hard-code colors where a matching token already exists
- Don't create one-off spacing values that break the 4px scale
