# Brand Foundation — Marasil

> English: **Marasil** · Arabic: **مراسيل**  
> Product names: Marasil API · Marasil Console · Marasil Docs · Marasil Connect

## Personality

| Trait | How it shows |
|-------|----------------|
| Trusted & secure | Warm ivory surfaces, Aubergine structure, clear status language |
| Distinct but restrained | Electric Lime accent used sparingly for focus and emphasis |
| Modern & quiet | Soft Aubergine shadows, motion ≤ 350ms |
| B2B professional | Dense but breathable layouts, tabular nums |
| Device/message clarity | StatusBadge + text (never color alone) |
| Authentic Arabic RTL | Real RTL layout, Cairo typography |

## Anti-patterns (explicit)

- Do **not** use WhatsApp green `#25D366` as brand identity (channel icon only).
- Do **not** flood the UI with purple or lime — follow the 70/20/7/3 distribution.
- No default dark mode in v1.
- No heavy glassmorphism, neon overload, or gradient on every card.
- No emoji as icons; use Lucide only.
- No animations that block QR scanning or slow dashboards.

## Brand assets strategy

| Asset | Source of truth | Notes |
|-------|-----------------|-------|
| Product name | `VITE_APP_NAME` / `config('app.name')` | Default: Marasil |
| Arabic display | `brand.arabicDisplayName` in `themes.ts` | مراسيل |
| Logo mark | `resources/js/DesignSystem/themes.ts` helpers | `displayBrandName()`, `brandMonogram()` |
| Primary CTA | `brand-900` | Hover `brand-800`, active `brand-950` |
| Accent emphasis | `accent-400` | Focus rings, highlights — max ~5% of UI |

## Color roles (summary)

- **Aubergine (`brand-*`)**: primary buttons, headings, navigation emphasis, inverse footer.
- **Electric Lime (`accent-*`)**: focus rings, accent buttons, small highlights — not page backgrounds.
- **Warm Ivory (`neutral-*`, `surface-*`)**: canvas, cards, forms — majority of the UI.
- **Semantic**: success/warning/danger/info/pending — functional states only.

## Voice (UI copy)

- Status labels in human Arabic (see accessibility + status map).
- Errors: field-adjacent + optional page summary.
- Security warnings for secrets: explicit, once, confirm-before-dismiss.

## Migration from previous identity

**Retired:** Deep Teal, Indigo accent, Nexa Message / Wasil / راسل naming.

**Current:** Marasil tokens in `tokens.css`; `primary-*` is a temporary alias to `brand-*`.  
Migrate feature pages to semantic tokens (`text-primary`, `surface-muted`, `brand-*`) over time.

## Accessibility

- `text-primary` on light surfaces; `text-inverse` on `brand-700` and darker.
- Target WCAG AA for text and interactive controls.
- Focus visible via Electric Lime ring (`--shadow-focus` / `accent-400`).

## Showcase

Dev-only page: `/dev/design-system` — full palette, components, RTL/LTR samples.
