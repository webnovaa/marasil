# Accessibility & RTL

## Target

WCAG **2.2 AA**. Keyboard-first. Screen reader sane. Zoom 200% usable.

## Focus & interaction

- Visible focus ring: brand/accent 2px offset.
- Dialogs: focus trap + restore.
- IconButton: accessible name + Tooltip.
- Hit target ≥ 44px on mobile.
- Do not rely on hover alone for critical actions.
- `prefers-reduced-motion` disables decorative motion.

## Forms

- Real `<label>` (or `aria-labelledby`) for every control.
- Errors: `aria-invalid` + `aria-describedby` linking FieldError.
- Blocking errors: Inline Alert / ErrorState, not toast-only.

## Status (color never alone)

| Code | Arabic label |
|------|----------------|
| connected | متصل وجاهز |
| connecting | جارٍ الاتصال |
| qr_required | يحتاج ربطًا |
| disconnected | الاتصال منقطع |
| logged_out | تم تسجيل الخروج |
| suspended | موقوف |
| queued | بانتظار الإرسال |
| processing | جارٍ الإرسال |
| sent | تم الإرسال |
| delivered | تم التسليم |
| read | تمت القراءة |
| failed | فشل الإرسال |

Badge = color + text (+ optional StatusDot).

## RTL / LTR

- App default `dir=rtl` / `lang=ar`.
- Sidebar on inline-start (right in RTL).
- Drawers open from inline-end appropriately; breadcrumbs & pagination arrows logical.
- Technical islands `dir="ltr"`: API keys, URLs, code, E.164 phones, ULIDs.
- Charts: provide text summary for SR.

## Contrast

- Body text on canvas/surface: text-main / muted only after AA check.
- brand-600 on white for buttons: verify AA for large text; use brand-700 on soft fills for small text if needed.
- Semantic text on semantic-bg pairs from tokens.

## Live regions

- OTP countdown, QR countdown, connection state: polite `aria-live` where updates matter.
- Toasts: assertive only for critical failures user must notice immediately.
