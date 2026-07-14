# Tareeq Design System v2 — Mystical, authentic

Branch: `redesign/mystical-v2`
Previous: v1 archived on `archive/v1-plum-coral`

`v0.1 · 2026-05-13 · proof-of-concept landed on /intro`

---

## Direction

**Editorial × mystical × authentic.** Career discovery as a soulful
act — not a corporate task. Visual language borrowed from Moonly's
reverence + Headway's bold typography, reinterpreted for Tareeq's
MENA youth audience as *consulting your inner compass*.

The previous v1 was a "playful product compass." v2 is a "**considered
night sky**" — you sit with it.

**One thing the user should remember:** The headline.

---

## 1. Surface system

| Surface | Use | Tokens |
|---|---|---|
| **Night** | Default product surface — onboarding intro, question screens, result reveal | `--night-gradient` `bg-night-gradient` + atmospheric radial glows |
| **Sand** | Celebratory contrast moments only — "your compass is ready" reveal, share card, optional marketing page | `bg-sand` |
| Plum (v1) | Currently still used by `/start` and `/contract` — to be migrated | preserved for back-compat |
| Cream (v1) | Currently still used by `/q/*` — to be migrated to night | preserved for back-compat |

The night surface ships with built-in atmospheric layers via
`::before` and `::after`:
- top-right violet-soft glow (lavender bloom)
- bottom-left gold glow (warm ember)

Add `.bg-night-stars` to layer a fine 5-point star field on top.

---

## 2. Color tokens (v2)

```css
/* Night surfaces */
--night:     #0E0A28;   /* deepest near-black violet */
--midnight:  #1B1240;   /* gradient mid */
--dusk:      #3D2270;   /* gradient end (matches v1 plum-mid) */

/* Violets — primary brand */
--violet:       #6E48E4;   /* vibrant violet — primary action color */
--violet-soft:  #9D7FF0;   /* highlights, eyebrow chips */
--lilac:        #C8B6F0;   /* text accent on dark */

/* Warm field */
--sand:    #F5EEE6;   /* main light surface (was --cream in v1) */
--paper:   #F9F4EC;   /* layered cards on sand */

/* Ink on cream */
--carbon:       #14101F;
--carbon-soft:  #2B2440;

/* Accents (selective — never all on one surface) */
--gold:       #F4C660;   /* primary accent CTA on night surface */
--gold-soft:  #FDE7A8;   /* gold tinted backgrounds */
--blush:      #F2A8B3;   /* secondary accent */
--mint:      #6FE0C0;   /* tertiary accent */

/* Gradients */
--night-gradient: 180deg → night → midnight → dusk
--aurora:         135deg → violet → violet-soft → blush → gold
--gold-gradient:  135deg → gold → light-gold
```

Tailwind utilities exposed: `bg-night`, `bg-midnight`, `bg-dusk`,
`bg-violet`, `bg-violet-soft`, `bg-lilac`, `bg-sand`, `bg-paper`,
`bg-gold`, `bg-gold-soft`, `bg-blush`, `bg-mint`, plus the matching
`text-*` variants. Gradients via `bg-night-gradient`, `bg-aurora`,
`bg-gold-gradient`.

---

## 3. Typography

Font families:
- **Fraunces** (display) — variable-axis serif, loaded with weights
  `400-900` + italic + roman. Display heads crank `SOFT` and `opsz`
  for the chunky Moonly-style serif.
- **Plus Jakarta Sans** (body / UI) — preserved from v1.
- **DM Serif Display Italic** — preserved for the assessment question
  voice only.

Scale (mobile-first, fluid via `clamp`):

| Class | Use | Size | Weight | Tracking | Family |
|---|---|---|---|---|---|
| `.text-hero` | One per page hero ("Meet Kai.") | clamp(40 → 72px) | 800 | -0.025em | Fraunces, soft 100, opsz 144 |
| `.text-display-2` | Section header | clamp(32 → 48px) | 700 | -0.02em | Fraunces, soft 100 |
| `.text-display-3` | Card / list header | clamp(24 → 32px) | 600 | -0.015em | Fraunces, soft 60 |
| `.text-eyebrow` | Tracked uppercase caption | 12px | 600 | 0.16em | Plus Jakarta |
| `.text-lead` | Body lead paragraph | clamp(15 → 17px) | 400 | normal | Plus Jakarta |

**One Display per screen.** The hero headline does the dramatic lift;
nothing else competes.

---

## 4. Button system

```html
<button class="btn-v2 btn-v2--primary">Continue →</button>
<button class="btn-v2 btn-v2--violet">Begin</button>
<button class="btn-v2 btn-v2--ghost-on-dark">Save for later</button>
```

| Variant | Surface | Background |
|---|---|---|
| `--primary` | Night | Gold gradient — replaces v1 coral as the CTA color |
| `--violet` | Sand / cream | Solid violet for prominent action on light pages |
| `--ghost-on-dark` | Night | Translucent sand 8%, border sand 18% |

Default height **60px**, pill radius (`9999px`), heavy soft shadow,
spring hover. `transform: translateY(-1px)` on hover + shadow expansion.

---

## 5. Composition rules

- **Asymmetric headlines** anchor left, never centered (unless it's a
  reveal moment)
- **Hero illustration** gets prominent vertical space — at least
  280×280
- **Whitespace before content** is non-negotiable — never crowd the
  hero
- **Numbered timelines** for sequential content (Day 1 / Day 2 / Step 1
  / Step 2…), with vertical connector + numbered station nodes
- **Cards** are large, generously padded (24–32px), heavily rounded
  (24px+), with subtle translucent borders on night surfaces
  (`card-night` utility)
- **Bottom navigation** for product surfaces — not yet built

---

## 6. Motion

Inherited from v1 (keyframes preserved):

- `anim-screen-enter` page entrance
- `anim-aura-bloom` + `anim-aura-rotate` (aurora pocket)
- `anim-kai-pop` spring overshoot
- `anim-eyebrow-fade-up` (letter-spacing eases out)
- `anim-accent-line-grow` (typing progress)
- `anim-cta-spring` (button springs into place)
- `anim-particle-a/b/c` (atmospheric drift)
- `anim-avatar-bob` (continuous gentle bob)

All respect `prefers-reduced-motion: reduce`.

**Pacing:** v2 leans slower (400-800ms entrances, 4-8s loops). One
memorable moment per screen.

---

## 7. Migration status

| Surface | v1 | v2 status |
|---|---|---|
| `/` (marketing) | cream | not migrated |
| `/start` | plum + CareerOrbit | not migrated |
| **`/intro`** | plum + KaiAura | **✓ migrated (POC)** |
| `/contract` | plum + list | not migrated |
| `/q/[index]` | cream + Kai | not migrated |
| Result reveal | not built | not migrated |

**Next moves:** apply the new system to `/start` (the entry hero), then
`/contract`, then question screens, then build the result reveal as
the celebration sand-surface moment.

---

## 8. Components added in v2

| File | Role |
|---|---|
| `components/brand/KaiAuraV2.tsx` | Aurora-style aura with violet/blush/mint/gold pockets + Gaussian blur. Used behind Kai on `/intro` |
| `IntroScreen` (rewritten) | Night surface · chunky display headline `Meet Kai.` · aurora hero · gold CTA · typewriter body |

The legacy `KaiAura.tsx`, `Kai.tsx`, `Typewriter.tsx`, and motion
keyframes are all preserved and reused.

---

## 9. Quality gate (v2)

Before merging any v2 visual change:

- [ ] Use v2 tokens — no hardcoded hex/px
- [ ] If the screen has a display headline, it's `text-hero` (one per page)
- [ ] One memorable visual moment per screen — not four
- [ ] Motion respects `prefers-reduced-motion`
- [ ] Above-the-fold check on iPhone 12 (390×844)
- [ ] `pnpm typecheck && pnpm lint && pnpm test` all green
