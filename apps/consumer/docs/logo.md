# Tareeq Logo

The mark is intentional. Always reference the SVG files in `public/logo/`
— never recreate the geometry in code, CSS, or any drawing library.

## Files

| File | Fill | Use on |
|---|---|---|
| `public/logo/tareeq-logo.svg` | Ink `#0D1B21` | Cream / white / light surfaces |
| `public/logo/tareeq-logo-cream.svg` | Cream `#F5EEE6` | Plum gradient / dark surfaces |
| `public/logo/tareeq-mark.svg` | Ink `#0D1B21` | App icons, favicons, avatars, < 120 px wide |
| `public/logo/tareeq-mark-cream.svg` | Cream `#F5EEE6` | Same, on dark |

Source viewBoxes:
- Lockup files: `0 0 320 214` → aspect 214/320 ≈ 0.669
- Mark files: `28 58 80 80` → 1:1 square

## Component

```tsx
import { Logo } from "@/components/primitives/Logo";

<Logo />                                       // default lockup, ink, 140px wide
<Logo tone="cream" width={120} />              // on plum surface
<Logo variant="mark" width={32} />             // small / square frame
<Logo variant="mark" tone="cream" width={28} asLink />  // assessment chrome
```

API:
- `variant: "lockup" | "mark"` — shape (default `lockup`)
- `tone: "ink" | "cream"` — color (default `ink`)
- `width: number` — height auto-scales from the aspect ratio
- `asLink?: boolean` — wraps in `<Link href="/" aria-label="Tareeq home">`

## Decision rule

```
Width < 120 px or square frame?     → variant="mark"
Background plum / dark gradient?    → tone="cream"
Background cream / white / light?   → tone="ink"  (default)
```

## Sizing

| Surface | Component | Width |
|---|---|---|
| Marketing nav | `<Logo width={132} />` | 132px |
| Marketing aside poster (plum) | `<Logo tone="cream" width={120} />` | 120px |
| Assessment chrome (plum) | `<Logo variant="mark" tone="cream" width={28} asLink />` | 28px |
| Splash | `<Logo variant="mark" tone="cream" width={72} />` | 72px |

Minimums: lockup ≥ 120 px, mark ≥ 16 px. Never set both `width` and
`height` manually — the component handles aspect ratio.

## Clear space

Equal to the height of the arrowhead on every side. `x` ≈ 14px at a
140px-wide lockup. Set this as `padding-inline` on the wrapper, never
on the logo itself.

## Don'ts

- Never recreate the mark in code or CSS
- Never stretch, rotate, or recolor outside the ink/cream fills
- Never apply drop-shadow, glow, or gradient effects
- Never mirror in RTL — the orientation is fixed
- Never typeset "Tareeq" in another font next to the mark
- Never place on a busy photo without a solid scrim
- Never use the cream variant on a light surface (it disappears)
- Never use the lockup under 120 px wide — switch to mark only

## Favicon

```html
<link rel="icon" type="image/svg+xml" href="/logo/tareeq-mark.svg" />
```

For Apple touch icons / OG cards, generate PNGs from the mark on a plum
background — see `scripts/build-og.ts` once added.
