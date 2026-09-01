# Design System — Marasil

**Status:** Phase 1 implemented (tokens, primitives, showcase).  
**Palette:** Aubergine Noir × Electric Lime × Warm Ivory

## Source of truth

| Layer | Path |
|-------|------|
| Tokens | `apps/platform/resources/js/DesignSystem/tokens.css` |
| Tailwind theme | `apps/platform/resources/css/app.css` |
| Component variants | `apps/platform/resources/js/DesignSystem/component-variants.ts` |
| Brand helpers | `apps/platform/resources/js/DesignSystem/themes.ts` |
| Showcase (dev) | `/dev/design-system` → `Pages/Dev/DesignSystem.tsx` |

## Docs

- [design-tokens.md](./design-tokens.md) — full palette contract
- [brand-foundation.md](./brand-foundation.md) — personality, usage rules, migration

## Naming

| Context | Name |
|---------|------|
| English | Marasil |
| Arabic | مراسيل |

`primary-*` Tailwind utilities remain a **temporary alias** to `brand-*`.

## Verification

After token changes, run in `apps/platform`:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
