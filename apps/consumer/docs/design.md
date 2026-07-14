# Tareeq — Design System

The complete visual system for the Tareeq web app. One source of
truth. When tokens, components, or screens change, this file changes.

`design.md v2.0 · 2026-05-13 · maintained on redesign/mystical-v2`

---

## 0. The product, in one paragraph

Tareeq (طريق — "path") is a career discovery web app for 16–22 year
olds in MENA and Muslim-majority regions. The hero surface is an
assessment flow: a character (Kai) asks the user a question, the user
answers via tap or write. After ~50 questions, the user gets a result
persona and a shareable result card.

**Two audiences, one voice:** Gen Z (share-native) and parents
(credibility-driven).

---

## 1. The direction

**Editorial × mystical × authentic.**

Career discovery is a *soulful act*, not a corporate task. The
interface evokes "consulting your inner compass" — a quiet moment of
self-inquiry under a night sky — without literally being astrological.

Visual references: Moonly's reverence, Headway's typographic boldness,
Calm's atmospheric depth. Reinterpreted for a youth audience that's
fluent in TikTok aesthetics but starved for meaning.

**One sentence the user should remember per screen.** The headline.
Everything else is supporting cast.

### Tone matrix

| Surface | Tone |
|---|---|
| Marketing landing | Confident, contemplative |
| Onboarding intro | Personal, warm |
| Contract / rules | Direct, grounded |
| Question | Curious, neutral |
| Interstitial | Encouraging, earned |
| Result reveal | Celebratory, specific |

---

## 2. Color system

### Tokens

```css
:root {
  /* Night — primary product surfaces */
  --night:     #0E0A28;   /* deepest near-black violet */
  --midnight:  #1B1240;   /* gradient mid */
  --dusk:      #3D2270;   /* gradient end (warm purple) */

  /* Violet — primary brand */
  --violet:       #6E48E4;   /* primary action / brand voice */
  --violet-soft:  #9D7FF0;   /* highlights, eyebrow chips */
  --lilac:        #C8B6F0;   /* text accent on dark */

  /* Sand — celebratory contrast surfaces */
  --sand:    #F5EEE6;   /* warm cream — main light surface */
  --paper:   #F9F4EC;   /* slightly warmer for layered cards */

  /* Carbon — type ink on cream surfaces */
  --carbon:       #14101F;   /* near-black with violet undertone */
  --carbon-soft:  #2B2440;   /* secondary */

  /* Accents — selective, never all on one surface */
  --gold:       #F4C660;   /* primary accent CTA on night */
  --gold-soft:  #FDE7A8;   /* gold tinted backgrounds */
  --blush:      #F2A8B3;   /* secondary accent */
  --mint:       #6FE0C0;   /* tertiary accent */

  /* Functional */
  --success:  #6FE0C0;     /* uses mint */
  --warning:  #F4C660;     /* uses gold */
  --error:    #E07A6F;     /* warm coral-red */

  /* Gradients */
  --night-gradient: linear-gradient(180deg, #0E0A28 0%, #1B1240 60%, #3D2270 100%);
  --aurora:         linear-gradient(135deg, #6E48E4 0%, #9D7FF0 35%, #F2A8B3 70%, #F4C660 100%);
  --gold-gradient:  linear-gradient(135deg, #F4C660 0%, #F5D57F 100%);
  --violet-gradient: linear-gradient(135deg, #6E48E4 0%, #9D7FF0 100%);
}
```

### Surface roles

**Night surface** (default — onboarding + product):
| Role | Token |
|---|---|
| Background | `--night-gradient` + atmospheric radial glows |
| Surface card | `card-night` utility — sand at 4% with 8% border |
| Text primary | `--sand` |
| Text secondary | `rgba(245, 238, 230, 0.72)` |
| Text muted | `rgba(245, 238, 230, 0.5)` |
| Brand accent | `--violet-soft` for highlights, `--gold` for CTAs |
| Focus ring | `--gold` at 70% |

**Sand surface** (celebration / share moments):
| Role | Token |
|---|---|
| Background | `--sand` |
| Surface card | `--paper` |
| Border subtle | `rgba(20, 16, 31, 0.08)` |
| Text primary | `--carbon` |
| Text secondary | `rgba(20, 16, 31, 0.68)` |
| Text muted | `rgba(20, 16, 31, 0.44)` |
| Brand accent | `--violet` for CTAs and headline accents |

### Accessibility

Every text-on-bg pair clears WCAG 2.1 AA.

| Foreground / Background | Ratio | Verdict |
|---|---|---|
| Sand on Night | 14.8:1 | ✅ AAA |
| Carbon on Sand | 14.1:1 | ✅ AAA |
| Gold on Night | 8.2:1 | ✅ AAA |
| Carbon on Gold | 11.8:1 | ✅ AAA — gold buttons get dark text |
| Violet-soft on Night | 5.9:1 | ✅ AA |
| Violet on Sand | 5.4:1 | ✅ AA |
| Blush on Night | 7.4:1 | ✅ AAA |
| Mint on Night | 9.8:1 | ✅ AAA |

**Rules**
- Coral CTAs are dead. Gold replaces them.
- Gold body text is forbidden. Gold is for CTAs, accents, and short emphasis only.
- The lilac/violet-soft text on night is the equivalent of "secondary tone" — never use it for body paragraphs.

---

## 3. Typography

### Families

| Use | Family | Source |
|---|---|---|
| **Display** | **Fraunces** (variable: wght, opsz, SOFT, ital) | Google Fonts |
| Body / UI | Plus Jakarta Sans | Google Fonts |
| Arabic UI | IBM Plex Sans Arabic | Google Fonts |
| Assessment **question** voice | DM Serif Display Italic | Google Fonts — reserved for the question surface only |

### Loading

All four are loaded via `next/font` in `app/layout.tsx`. Fraunces is
loaded with weights **400–900** plus italic + roman so display heads
can crank weight and softness.

### Scale

| Class | Use | Size | Weight | Axes | Family |
|---|---|---|---|---|---|
| `text-hero` | One per page hero | clamp(40 → 72px) | 800 | SOFT 100, opsz 144 | Fraunces |
| `text-display-2` | Section header | clamp(32 → 48px) | 700 | SOFT 100, opsz 144 | Fraunces |
| `text-display-3` | Card / list header | clamp(24 → 32px) | 600 | SOFT 60, opsz 96 | Fraunces |
| `text-h3` | Subhead | 18 / 26px | 600 | — | Plus Jakarta |
| `text-subhead` | Form labels, nav | 16 / 24px | 500 | — | Plus Jakarta |
| `text-lead` | Body lead | clamp(15 → 17px) / 1.55 | 400 | — | Plus Jakarta |
| `text-body` | Default paragraph | 15 / 22px | 400 | — | Plus Jakarta |
| `text-body-sm` | Secondary copy | 13.5 / 20px | 400 | — | Plus Jakarta |
| `text-eyebrow` | Tracked uppercase caption | 12 / 16px | 600, 0.16em | — | Plus Jakarta |
| `text-button` | Button label | 16 / 1, -0.005em | 600 | — | Plus Jakarta |
| `text-question` | Assessment question only | clamp(20 → 28px) italic | 400 | — | DM Serif Display |

### Rules

- One `text-hero` per screen.
- Pull-quote accent inside a hero: italic Fraunces, often colored gold.
- Plus Jakarta Sans has no real italic — never `font-style: italic` on it.
- DM Serif Display Italic is **only** for the assessment question.
- Sentence case for everything except brand names and proper nouns. No Title Case headlines.
- Curly quotes only. `·` middle dot as separator. Em dash without spaces.

---

## 4. Spacing & layout

### Base unit: 8px

Every spacing / sizing / radius / shadow snaps to a multiple of 8
(4px allowed for icon-scale tweaks).

### Spacing scale

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Containers

Mobile-first. Max product width: **480px**. Max marketing width: **1320px**.

### Radius

```css
--radius-sm:   8px;    /* chips, badges */
--radius-md:   12px;   /* small cards */
--radius-lg:   20px;   /* default cards on dark */
--radius-xl:   28px;   /* hero panels, illustrated tiles */
--radius-2xl:  36px;   /* big editorial cards */
--radius-pill: 9999px;
```

### Shadows / elevation

```css
/* On night surfaces — soft inner outlines */
--ring-dark-sm: inset 0 0 0 1px rgba(245, 238, 230, 0.08);
--ring-dark-md: inset 0 0 0 1px rgba(245, 238, 230, 0.14);

/* On sand surfaces — soft layered shadows */
--shadow-sand-sm: 0 1px 2px rgba(20, 16, 31, 0.04), 0 1px 3px rgba(20, 16, 31, 0.06);
--shadow-sand-md: 0 8px 24px rgba(20, 16, 31, 0.06), 0 2px 8px rgba(20, 16, 31, 0.04);
--shadow-sand-lg: 0 24px 48px rgba(20, 16, 31, 0.08), 0 8px 16px rgba(20, 16, 31, 0.05);

/* Glow shadows under accent buttons */
--shadow-gold-glow:    0 12px 28px rgba(244, 198, 96, 0.35), 0 4px 10px rgba(244, 198, 96, 0.15);
--shadow-violet-glow:  0 12px 28px rgba(110, 72, 228, 0.35), 0 4px 10px rgba(110, 72, 228, 0.15);
```

---

## 5. Components

### 5.1 Button (`.btn-v2`)

Three sizes (`sm` 44, `md` 52, `lg` 60), four variants:

| Variant | Surface | Background |
|---|---|---|
| `--primary` | Night | Gold gradient — primary CTA |
| `--violet` | Sand | Solid violet |
| `--ghost-on-dark` | Night | Translucent sand 8% + 18% border |
| `--ghost-on-light` | Sand | Translucent carbon 5% + 12% border |

Pill radius. Heavy soft shadow on primary variants. `translateY(-1px)` on hover + shadow expansion. Focus ring uses the button's own color at 70% opacity, outline-offset 3px.

Labels: verb-first, sentence case ("Continue", "I'm ready", "Begin").

### 5.2 Card

```text
.card-night  — sand at 4% + 8% border, 24px padding, 20-28px radius, backdrop-blur 8px
.card-sand   — paper bg, sand-md shadow, carbon/8% border, 24-32px radius
```

### 5.3 Speech bubble

The voice of Kai. DM Serif Display Italic only. Tail can attach to
`top` or `bottom` edge, position `start` or `center`. Two surface
variants: `dark` (cream bubble on night) and `light` (paper bubble on
sand).

### 5.4 Compass progress

Four-quadrant CORE compass that fills as the user answers questions in
each pillar. Replaces all linear progress bars. Active quadrant pulses
with a violet ring. Center shows overall %.

### 5.5 Kai character + aura

Mature female mentor, line-art geometric. Wears a violet-mauve scarf
with cream dot pattern across the forehead, deep walnut visible hair.
Five moods: `curious · warm · thinking · encouraging · listening`.

Backed by `KaiAuraV2` — an aurora-style blob of violet / blush / mint
/ gold pockets with heavy Gaussian blur, slowly rotating + breathing.
Never wrapped in a hard-edged colored frame.

### 5.6 Typewriter

Character-by-character reveal of body text. Honors
`prefers-reduced-motion` (collapses to instant). Blinking caret while
typing. Full text always in `aria-label`.

### 5.7 Step ladder

Numbered timeline (Day 1 / Step 1) with vertical connector line +
numbered station nodes. Used on Contract and onboarding flows.

### 5.8 Illustrated icon tile

40px rounded-square gradient tile, cream-stroke glyph inside, optional
brand-color signature dot. Tiles rotate through brand colors so lists
read with rhythm.

---

## 6. Surface specs

### 6.1 Marketing landing (`/`) — **sand surface**

Open with the editorial hero. Big `text-hero` headline, KaiAuraV2 +
Kai as the visual, single violet CTA. Optional: a single illustration
tile demonstrating what the result looks like.

### 6.2 Start (`/start`) — **night surface**

```
[← back]                  [Tareeq mark in cream]

A career compass
─────────────────

  ╔══════════════════════════╗
  ║                          ║
  ║  Find the work          ║   ← text-hero (Fraunces 800, soft 100)
  ║  that's been           ║      Cream + italic gold "waiting for you"
  ║  waiting for you.      ║
  ║                          ║
  ╚══════════════════════════╝

  Three steps. Designed with school counsellors.

  ◯  Take the assessment      ← step ladder
  │  12 min · 60 questions
  │
  ◯  Meet your Compass
  │  One persona, four pillars
  │
  ◯  Walk the path with us
     Curated mentors + community

  [─────── Begin → ────────]    ← gold CTA, 60px tall

  ~12 min · Free · Stays on your device
```

### 6.3 Intro (`/intro`) — **night surface**

```
[← back]                  [Tareeq mark]

✦ Meet your guide    ← eyebrow chip

Meet Kai.            ← text-hero
─────

      [aurora]
      [ Kai  ]      ← painterly, breathing
      [aurora]

Hey! I'm Kai. Think of me as
a filter for all the noise...     ← Typewriter

────────                          ← accent line growing left-to-right

[─────── Continue → ────────]    ← gold CTA (springs in)
```

### 6.4 Contract (`/contract`) — **night surface**

```
[← back]                  [Tareeq mark]

Before we start
─────

The CORE                ← text-hero with mixed type
Contract of Honesty.    ← "Contract" in italic gold

[#1 violet tile · The "Vibe" Check]
This isn't about what you're good at in school...

[#2 gold tile · Non-entertainment focus]
Answer for what ignites curiosity...

[#3 blush tile · No wrong answers]
Picking "Gaming" over "Studying"...

[#4 mint tile · Intent over output]
...

[#5 violet-soft tile · Cluster, not a job title]
...

[#6 gold-soft tile · Compass, not a GPS]
...

[─────── I'm ready → ──────]    ← gold CTA
```

### 6.5 Question (`/q/[index]`) — **night surface**

```
[← back] [◐ CORE compass ◑]  [Tareeq mark]

Pillar · Pillar 1 · Curiosities    01 / 54

   ┌──────────────────────────┐
   │ Question text in DM      │   ← speech bubble (paper card,
   │ Serif Italic, carbon     │     tail down toward Kai)
   └──────────────┬───────────┘
                  ▼
            ┌──────────┐
            │   Kai    │
            └──────────┘
        ⌣ aurora softly behind

   🔇    ▶ (gold)    1.0×

   [✦] Answer one                  →
   [💧] Answer two                  →
   [🌿] Answer three                →

   Tap to continue · 1, 2, 3     ← Previous
```

### 6.6 Interstitial / Did You Know — **sand surface** (the bright beat)

```
[Eyebrow]    Did you know?

[Big scene illustration with violet/gold halo]

Almost at                  ← text-display-2 in carbon
your Compass.              ← "your Compass" italic violet

The last few questions
sharpen your environment...

[──────  Keep going → ──────]   ← violet CTA
```

The sand interstitials are the *bright moments* in an otherwise
night-surface journey — they earn their own visual energy.

### 6.7 Result reveal — **sand → night transition**

Not yet built. Spec:
1. Sand surface fades in with celebration ("Your Compass is ready")
2. Tap → flips to a night-surface card showing the persona
3. Share-friendly card with the persona name in `text-hero` gold-italic, a soft aurora behind, single share CTA in violet

---

## 7. Motion

### Principles

1. **Pacing slow, deliberate.** Entrances 400–800ms, loops 4–8s.
2. **One memorable moment per screen.** Not four.
3. **Stage information.** Hero → headline → body → CTA, not all at once.
4. **`prefers-reduced-motion: reduce` collapses everything to ≤120ms linear.**

### Keyframes (in `globals.css`)

| Name | Use |
|---|---|
| `screen-enter` | Page entrance fade-up |
| `aura-bloom` | Aurora scales in from 0.6 → 1.0 |
| `aura-rotate` | 16s breathing rotation loop |
| `kai-pop-overshoot` | Spring entrance for character |
| `eyebrow-fade-up` | Letter-spacing eases out while fading |
| `accent-line-grow` | Horizontal line growing left → right |
| `cta-spring-up` | Button springs into place |
| `particle-drift-a/b/c` | Atmospheric particle drift |
| `caret-blink` | Typewriter caret |
| `option-confirm` | Coral/gold pulse on answer commit |

### Composition rule

If one element runs two animations that both touch `transform`, split
them across two wrappers — outer owns positioning + enter, inner owns
the loop. Otherwise the later animation wins the cascade.

---

## 8. Audio (procedural)

Web Audio API tones in `lib/audio/ui-sounds.ts`. No audio assets ship
for UI sounds. Gated by `tareeq:sound` localStorage toggle.

| Sound | Trigger | Notes |
|---|---|---|
| `select()` | Country dropdown pick | 660Hz tick |
| `confirm()` | Answer commit | C–E major third chord |
| `advance()` | Next question / forward nav | 880→1320Hz glide |
| `back()` | Back nav | 660→440Hz glide |
| `transition()` | Screen change / interstitial enter | Triangle 1100→520Hz + sub-bass |
| `complete()` | Assessment complete + interstitial enter (layered) | C–E–G chord |

---

## 9. Voice & microcopy

Voice is constant. Tone shifts by surface.

### Three principles

1. **Confident.** State things. "Your top three traits" beats "Some of your possibly top traits."
2. **Energetic.** Verbs over nouns. "Begin" beats "Get started."
3. **Grounded.** Specific. "12 minutes, 54 questions" beats "a quick assessment."

### Reserved words

- **Path** = the user's career direction. Never repurpose for UI flows.
- **CORE** = the assessment model. Always uppercase.
- **Result** = singular per user.
- **Trait** = a CORE dimension. **Never** use "personality type."
- **Compass** = the metaphor for the result. Capitalized when used as the noun.

---

## 10. RTL behaviour

Use CSS logical properties from day one (`margin-inline-start`,
`padding-inline-end`, `text-align: start`). Avoid `left` / `right` in
component CSS.

The Latin wordmark and Kai character never mirror. Directional icons
mirror via `.flip-rtl` or `data-flip-rtl`.

---

## 11. Anti-patterns

| Don't | Why |
|---|---|
| Use coral as a CTA color | v1 system retired; gold is the new accent |
| Use plum gradient | Replaced by `--night-gradient` |
| Default symmetric card grids | Use editorial composition — break the grid |
| Use ink-soft text on dark | `lilac` or sand at 72% only |
| Use gold for body text | Gold is CTAs and short emphasis only |
| Add micro-animations on every element | One memorable moment per screen |
| Center every headline | Editorial defaults to left-aligned; center only on celebratory reveals |

---

## 12. File structure

```
src/
├── app/
│   ├── (marketing)/page.tsx       # /
│   ├── (assessment)/layout.tsx
│   ├── (assessment)/start/page.tsx
│   ├── (assessment)/intro/page.tsx
│   ├── (assessment)/contract/page.tsx
│   └── (assessment)/q/[index]/page.tsx
├── components/
│   ├── primitives/       # Logo, Button, Card, Input, Badge, Progress…
│   ├── brand/            # icons, illustrations, characters
│   ├── assessment/       # Chrome + screen components
│   └── onboarding/       # PathSteps, DidYouKnow
├── lib/
│   ├── assessment/       # progress, pillar-progress, interstitials, questions
│   ├── audio/            # ui-sounds
│   └── scoring/          # types, computeScore
└── docs/
    └── design.md         # this file
```

---

## 13. Versioning

`design.md` is the source of truth. When a token name, component API,
or screen spec changes:

1. Bump the version at the top.
2. Note the diff in the PR body.
3. Do a codebase-wide search/replace if a token name changes.

---

`design.md v2.0 · 2026-05-13 · maintained on redesign/mystical-v2`
