# Design System — Developer Tool / Data Directory
> Extracted from canirun.ai · Abstract design language for reuse across projects

---

## 1. Visual Language

**Personality:** Functional, data-dense, terminal-inspired. No decorative noise — every element earns its place through information value. Think "crt monitor meets clean SaaS dashboard."

**Tone:** Direct and utilitarian. Hacker-culture typographic nods (e.g. bracket-wrapped labels) signal that the audience is technical. Numbers and structured data are the hero.

**Theme:** Full light/dark mode support. A theme toggle is a first-class nav element.

---

## 2. Color System

### Base Palette (Light Mode)

| Role | Token | Value |
|---|---|---|
| Page background | `--bg-base` | `#f9f9f8` — warm off-white |
| Surface / Card | `--bg-surface` | `#ffffff` |
| Border | `--border-default` | `#e5e5e5` |
| Text — primary | `--text-primary` | `#1a1a1a` |
| Text — secondary | `--text-muted` | `#888888` |
| Text — tertiary | `--text-faint` | `#aaaaaa` |
| Brand accent | `--accent` | `#22c55e` — vivid green |
| Hero heading | `--color-heading` | `#3ddc84` (can shift toward `--accent`) |

### 6-Level Semantic Status System

Used for any domain that needs a tiered pass/fail or fitness scale (compatibility, health, score, grade, etc.).

| Level | Semantic meaning | Text color | Badge background |
|---|---|---|---|
| 1 — Best | Fully supported / optimal | `#16a34a` | `#dcfce7` |
| 2 — Good | Works well | `#22c55e` | `#f0fdf4` |
| 3 — Fair | Marginal / adequate | `#ca8a04` | `#fef9c3` |
| 4 — Caution | Degraded / tight | `#ea580c` | `#fff7ed` |
| 5 — Warning | Barely functional | `#dc2626` | `#fef2f2` |
| 6 — Blocked | Not supported / too heavy | `#991b1b` | `#fdf2f2` |

Assign domain-specific labels at the application layer — the color system is label-agnostic.

### Continuous Resource Usage Indicator

For any metric expressed as a % of a limit (memory, CPU, quota, capacity):

| Threshold | Color |
|---|---|
| < 50% | `#16a34a` green — comfortable |
| 50–80% | `#ca8a04` amber — approaching limit |
| 80–100% | `#ea580c` orange — near capacity |
| > 100% | `#dc2626` red — over limit |

### Category Tag Colors

Outlined pill badges used to tag items by category, license, origin, or type. No fill — border + text only.

| Category family | Color |
|---|---|
| Community / open | `#8b5cf6` purple |
| Permissive / standard | `#3b82f6` blue |
| Vendor A (primary) | `#0ea5e9` sky |
| Vendor B / restricted | `#f59e0b` amber |

Keep total distinct tag colors ≤ 6 to avoid visual noise.

---

## 3. Typography

| Role | Family | Weight | Size | Notes |
|---|---|---|---|---|
| Hero heading | `--font-sans` | 700 | 2.5–3rem | Accent color, centered |
| Hero subheading | `--font-sans` | 400 | 1rem | Muted, centered |
| Nav links | `--font-mono` | 400 | 0.875rem | `[bracket]` wrapper pattern |
| Section label | `--font-sans` | 700 | 0.75rem | All-caps, `letter-spacing: 0.05em` |
| Item title | `--font-sans` | 600 | 0.9375rem | |
| Data / numeric values | `--font-mono` | 400 | 0.8125rem | Right-aligned, tabular |
| Metadata / timestamps | `--font-sans` | 400 | 0.75rem | Muted gray |
| Badge label | `--font-sans` | 600–700 | 0.6875rem | All-caps |

**Key principle:** Apply `font-variant-numeric: tabular-nums` to all numeric data — ensures column alignment without fixed widths.

---

## 4. Spacing & Layout

### Grid

- **Max content width:** `1100px`
- **Horizontal padding:** `24px` (mobile) / `48px` (desktop)
- **Layout pattern:** Single-column, centered. No sidebar.

### Spacing Scale (4px base)

| Token | Value | Typical usage |
|---|---|---|
| `--space-1` | 4px | Icon gaps, tight inline spacing |
| `--space-2` | 8px | Badge internal padding, small gaps |
| `--space-3` | 12px | Card internal padding |
| `--space-4` | 16px | Between elements in a section |
| `--space-6` | 24px | Section padding |
| `--space-8` | 32px | Between sections |
| `--space-12` | 48px | Hero / page-level vertical rhythm |

### Component Sizing

- **Nav bar height:** ~48px
- **Hero section:** `padding-top: 64px`, `padding-bottom: 32px`
- **Toolbar row:** `padding: 8px 0`, `gap: 8px` between controls
- **Data row height:** ~52px
- **Data row internal padding:** `12px 16px`

---

## 5. Component Patterns

### 5.1 Navigation Bar

**Structure:**
- **Left:** Site identity mark (icon + name) + optional secondary metadata label (e.g. last updated, version, live status) in `--text-faint`
- **Center/Right:** Primary nav links in `[bracket]` monospace format
- **Far right:** Utility action (theme toggle, user menu, etc.)

**Style:**
- Sticky, `background: var(--bg-base)`
- `border-bottom: 1px solid var(--border-default)`
- Nav links: no underline; hover shifts text to `var(--accent)`

### 5.2 Hero / Page Header

**Structure:**
- Large H1 in `--color-heading`, centered
- One-line descriptor in `--text-muted`, centered
- Optional **context strip** — a horizontal row of key metrics relevant to the current user/environment (icon + label + live value per slot, pipe-separated)
  - Each slot: small category label above, resolved value below
  - Async-resolvable: show neutral placeholder → silently replace on resolution
  - Optional disclaimer line in `--text-faint` + verification badge

### 5.3 Status Summary Strip

A compact bar showing item distribution across status levels.

**Pattern:** `[count] [LABEL]` per level, color-coded by status level (see §2).
- No dividers — implicit spacing only
- Count in bold, label in all-caps small text
- Clicking a level optionally filters the list

### 5.4 Filter & Sort Toolbar

**Structure:**
- Left: Search input + filter dropdowns (by any facet: category, type, tag, range, etc.)
- Right: Sort dropdown + view-mode toggle (list / grid)

**Style:**
- All controls: `border-radius: var(--radius-md)`, `border: 1px solid var(--border-default)`
- Hover: border color darkens to `--text-muted`
- Search input: leading search icon + trailing keyboard shortcut hint badge
- Dropdowns: outlined only, no fill

### 5.5 Data Row Card

The core repeating list item. Adapts to any domain.

**Anatomy:**
```
[ Primary title ]  [ tag ][ tag ]   ···   [ meta-A ]  [ meta-B + usage% ]  [ meta-C ]  [ STATUS label  score ]
```

- `border-bottom: 1px solid var(--border-default)`, no side/top borders
- Hover: subtle background tint
- **Left zone:** Primary label (semibold) + inline icon badges + category tags
- **Right zone:** Right-aligned data columns — tabular monospace
- **Usage indicator:** Colored pill showing % of a limit (color from §2 resource scale)
- **Status column:** Status label in level color + numeric score in `--text-muted`
- Full row is clickable → detail view

### 5.6 Pill / Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* Outlined — for category tags */
.badge-outline {
  background: transparent;
  border: 1px solid currentColor;
}

/* Filled soft — for status */
.badge-filled {
  background: var(--status-bg);
  color: var(--status-text);
}
```

### 5.7 Inline Icon Badge

Small tile used to indicate item attributes, sources, or capabilities inline with a row.

- Size: 18–20px square, `border-radius: var(--radius-sm)`
- Colored background per source/attribute family
- Tooltip with full label on hover
- Use for: third-party integrations, feature flags, capability indicators, origin marks

---

## 6. Interaction & Motion

- **Hover transitions:** `150ms ease` for color and background only — no layout animation
- **No page transitions** — prioritize perceived speed
- **Filtering/sorting:** Instant, client-side; no spinners for in-memory operations
- **Async resolution:** Neutral placeholder → silently swap to resolved value; no flash of loading state
- **Keyboard affordances:** Show shortcut hints as badge-style labels inside controls

---

## 7. Iconography

- Minimal line-weight, single-color, consistent stroke
- Prefer a small custom SVG set over importing a full icon library
- Icons must function as labels — legible at 16px without accompanying text
- No illustration, no decorative imagery anywhere in the UI

---

## 8. Dark Mode

| Light token | Dark value |
|---|---|
| `--bg-base: #f9f9f8` | `#0f0f0f` |
| `--bg-surface: #ffffff` | `#1a1a1a` |
| `--border-default: #e5e5e5` | `#2a2a2a` |
| `--text-primary: #1a1a1a` | `#e5e5e5` |
| `--text-muted: #888888` | `#666666` |
| `--accent: #22c55e` | unchanged |
| Status level colors | increase lightness ~10% for contrast |

---

## 9. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use monospace for nav links and all data columns | Use serif fonts |
| Color-code status levels from the 6-level system | Invent ad-hoc status colors per feature |
| Keep data rows information-dense but scannable | Use cards with drop shadows or gradients |
| Surface keyboard shortcuts as visible UI hints | Add tooltips on self-explanatory controls |
| Right-align all numeric data | Center-align numeric values in columns |
| Use `[bracket]` pattern for secondary nav items | Use icon-only nav without text labels |
| Separate sections with `border`, not `box-shadow` | Use transitions longer than 200ms |
| Maintain exactly 2 font families (sans + mono) | Introduce a third typeface |
| Keep backgrounds flat — no gradient fills | Use color fills on cards or page sections |

---

## 10. CSS Variables

```css
:root {
  /* Backgrounds */
  --bg-base:    #f9f9f8;
  --bg-surface: #ffffff;

  /* Borders */
  --border-default: #e5e5e5;

  /* Text */
  --text-primary: #1a1a1a;
  --text-muted:   #888888;
  --text-faint:   #aaaaaa;

  /* Brand */
  --accent:        #22c55e;
  --color-heading: #3ddc84;

  /* Status levels — text */
  --status-1: #16a34a;
  --status-2: #22c55e;
  --status-3: #ca8a04;
  --status-4: #ea580c;
  --status-5: #dc2626;
  --status-6: #991b1b;

  /* Status levels — badge background */
  --status-1-bg: #dcfce7;
  --status-2-bg: #f0fdf4;
  --status-3-bg: #fef9c3;
  --status-4-bg: #fff7ed;
  --status-5-bg: #fef2f2;
  --status-6-bg: #fdf2f2;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: ui-monospace, 'Fira Code', monospace;

  /* Spacing */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;

  /* Radii */
  --radius-sm:   4px;
  --radius-md:   6px;
  --radius-pill: 9999px;

  /* Motion */
  --transition-fast: 150ms ease;
}
```
