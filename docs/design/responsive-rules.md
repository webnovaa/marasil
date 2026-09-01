# Responsive Rules

## Breakpoints

| Name | Min width | Primary layout changes |
|------|-----------|------------------------|
| base | 0 | Single column; sheet nav; card tables |
| sm | 640 | Comfortable form padding |
| md | 768 | 2-col stats; optional horizontal table scroll |
| lg | 1024 | Sidebar + content; 4-col stats |
| xl | 1280 | Full analytics width |
| 2xl | 1536 | Cap content; avoid ultra-wide stretch |

## Layout rules

| Context | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Tenant shell | Topbar + Sheet (from inline-start in RTL = right) | Same | Sidebar 272 / collapse 80 + Topbar 68 |
| Auth | Form only, max 440px | Form centered | Split: form + brand panel |
| Admin | Same as tenant + indigo cue bar | Same | Master/detail for approvals |
| Stats | 1 col | 2 col | 4 col |
| Tables | Prefer cards for devices; scroll for dense message logs | Hybrid | Full DataTable |
| Page padding | 16px | 24px | 32px |
| Primary actions | Sticky bottom when critical (QR connect, approve) | Inline in header | PageActions in header |

## Density

- Analytical pages: max content **1600px**.
- Forms / settings / docs reading: **1200px**.
- Do not card-wrap everything — use sections + separators.

## Test matrix (DoD)

360 · 390 · 768 · 1024 · 1366 · 1440 · 1920  
No unintended horizontal overflow; sticky topbar must not jump; sidebar collapse must not shift focus trap incorrectly.
