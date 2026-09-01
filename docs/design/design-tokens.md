# Design Tokens — Marasil

Central definition: `apps/platform/resources/js/DesignSystem/tokens.css`  
Tailwind mapping: `apps/platform/resources/css/app.css` (`@theme`)

**Contract:** no raw hex in React components. Use CSS variables and Tailwind tokens (`bg-brand-900`, `text-[rgb(var(--text-muted))]`, etc.).

## Identity

| Context | Name |
|---------|------|
| English UI | **Marasil** |
| Arabic UI | **مراسيل** |
| API | Marasil API |
| Console | Marasil Console |
| Docs | Marasil Docs |
| Connect | Marasil Connect |

Palette: **Aubergine Noir × Electric Lime × Warm Ivory**

## Brand — Aubergine (`brand-*`)

Stored as RGB channel triplets in `tokens.css` for alpha-friendly Tailwind.

| Token | Hex | Role |
|-------|-----|------|
| brand-50 | `#FBF8FC` | Light brand wash |
| brand-100 | `#F4ECF6` | Soft purple backgrounds |
| brand-200 | `#E7D6EA` | Borders / hover fills |
| brand-300 | `#D2B4D8` | Secondary borders |
| brand-400 | `#B588BC` | Decorative mulberry |
| brand-500 | `#925C9A` | Border brand |
| brand-600 | `#743E7C` | Strong brand accents |
| brand-700 | `#5B2F62` | Links, active text |
| brand-800 | `#46234D` | Primary hover |
| brand-900 | `#321A39` | **Primary actions / brand base** |
| brand-950 | `#211026` | Active / pressed, hero ink |

## Accent — Electric Lime (`accent-*`)

Use sparingly (~3–5% of page surface). Never as large background or long text.

| Token | Hex | Role |
|-------|-----|------|
| accent-400 | `#C8F45D` | **Accent base, focus ring** |
| accent-500 | `#A9D936` | Accent hover |
| accent-600 | `#82AF22` | Accent active |

Full scale: accent-50 … accent-950 in `tokens.css`.

## Warm neutrals (`neutral-*`)

| Token | Hex |
|-------|-----|
| neutral-50 | `#FFFDF9` |
| neutral-100 | `#F7F5F0` |
| neutral-200 | `#EFEAE4` |
| neutral-900 | `#211923` |
| neutral-950 | `#140F16` |

## Semantic surfaces

| Token | Hex | Use |
|-------|-----|-----|
| canvas | `#F7F5F0` | App background |
| surface | `#FFFDF9` | Cards, panels |
| surface-muted | `#F4ECF6` | Subtle panels |
| text-primary | `#211923` | Body on light surfaces |
| text-muted | `#756A77` | Secondary copy |
| text-inverse | `#FFFFFF` | Text on brand-700+ |
| border | `#E5DDE5` | Default border |
| border-focus | `#C8F45D` | Focus cues |

## Buttons (semantic)

| Variant | Background | Foreground | Hover | Active |
|---------|------------|------------|-------|--------|
| Primary | brand-900 | white | brand-800 | brand-950 |
| Accent | accent-400 | neutral-900 | accent-500 | accent-600 |
| Secondary | neutral-50 | brand-800 | brand-100 | brand-200 |
| Ghost | transparent | brand-700 | brand-100 | brand-200 |

Focus ring: **accent-400** (primary/secondary/ghost) or **brand-600** (accent button).

## Status colors

Functional only — success / warning / danger / info / pending.  
Do not reuse for general UI chrome.

## Channel colors

Icons and channel badges only (`channel-whatsapp`, `channel-api`, …).  
Not for primary buttons or large surfaces.

## Chart colors

`chart-1` … `chart-8` — pair with labels/icons; never rely on color alone.

## Gradients (CSS variables)

| Token | Use |
|-------|-----|
| `--gradient-brand` | Hero / limited marketing |
| `--gradient-signature` | Logo / identity moments |
| `--gradient-soft-bg` | Soft page washes |
| `--gradient-accent-glow` | Accent highlight glow |

No gradients on every card or button. Dashboard stays flat and calm.

## Shadows

```css
--shadow-xs … --shadow-lg
--shadow-dialog
--shadow-focus  /* accent glow ring */
```

Tint: Aubergine (`rgb(50 26 57 / …)`).

## Temporary legacy alias

`primary-*` Tailwind colors map to `brand-*` until pages migrate.  
**New code:** use `brand-*` or semantic tokens.

## Typography

| Role | Size / Line | Weight |
|------|-------------|--------|
| Display | 36/44 | 700 |
| H1 | 30/38 | 700 |
| H2 | 24/32 | 700 |
| H3 | 20/28 | 700 |
| Body | 14/24 | 400 |
| Label | 13/20 | 600 |
| Caption | 12/18 | 500 |

**Fonts:** Cairo (Arabic UI), IBM Plex Sans Arabic fallback, Inter, JetBrains Mono.

## Color distribution (target)

- 70% Warm Ivory / neutrals  
- 20% Aubergine brand  
- 7% Soft purple shades  
- 3% Electric Lime accent  

## Inertia progress

Uses `--brand-900-hex` via `getInertiaProgressColor()` — not hardcoded in React.

## Dark mode

Not implemented in v1.
