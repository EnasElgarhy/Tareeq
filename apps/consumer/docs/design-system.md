# Tareeq Design System

The source of truth for everything visual in the Tareeq web app. Adds to
the design.md brand spec by capturing the actual implementation —
tokens, primitives, illustrations, motion, audio — as it stands today.

When you ship something new (component, illustration, motion pattern,
sound, font), document it here. The frontend-design skill should be
invoked before any visual work; this file is the project-specific
reference it reads from.

`v0.4 · last updated 2026-05-13`

---

## 1. Direction

**Editorial × Soft Illustration × Immersive plum.**

- Two surfaces only: cream marketing pages, plum-gradient product surfaces.
- One Primary CTA per view. Coral commits forward.
- Cyan is reserved for the signature dot, focus rings, and small accents.
- Type pairs Plus Jakarta Sans (sans) with Fraunces italic (editorial
  pull-quote) and DM Serif Display italic (the assessment question
  voice — reserved, used nowhere else).

The interface should feel illustrated, intentional, and warm — never
generic SaaS.

---

## 2. Tokens

### Colors (`app/globals.css`)

| Token | Hex | Use |
|---|---|---|
| `--tareeq-plum` | `#1B0E3F` | Primary brand surface |
| `--plum-deep` | `#0F0824` | Darkest text on cream / dark mode bg |
| `--plum-mid` | `#3D2270` | Gradient companion |
| `--mauve` | `#5B3D8C` | Gradient end |
| `--lavender` | `#B8A5D9` | Tints, secondary on dark |
| `--lavender-mist` | `#E5DAF5` | Connector lines, badges, focus rings |
| `--coral` | `#FF6B47` | Primary CTA |
| `--coral-glow` | `#FF8252` | Gradient companion |
| `--coral-deep` | `#E55530` | Hover |
| `--cyan` | `#5BD6E8` | Signature dot, focus rings (never a surface) |
| `--ink` | `#0D1B21` | Logo, primary text on light |
| `--cream` | `#F5EEE6` | Light page bg, text on dark |
| `--mist` | `#E8E0D4` | Borders, dividers |
| `--success` `--warning` `--error` | functional |  |

### Gradients

```css
--plum-gradient: linear-gradient(135deg, #1B0E3F 0%, #3D2270 55%, #5B3D8C 100%);
--coral-gradient: linear-gradient(135deg, #FF6B47 0%, #FF8252 100%);
--grad-warm: linear-gradient(95deg, #FF3D83 0%, #FF6B3D 55%, #FFA53D 100%);
```

`--grad-warm` is the signature pink→orange→gold sweep, used only as a
clipped-text accent on big headlines. Apply via the `.text-grad-warm`
utility (handles `-webkit-text-fill-color` for Safari).

### Spacing / radius / shadows / motion

Defined in `app/globals.css`. Always use tokens — never hardcode.

### Type

| Family | Use | Loader |
|---|---|---|
| **Plus Jakarta Sans** (sans) | UI, body, button labels | `next/font` |
| **IBM Plex Sans Arabic** | Arabic content | `next/font` |
| **DM Serif Display** italic | Assessment question text **only** | `next/font` |
| **Fraunces** italic 400/500/600 | Editorial pull-quote accents on `/start` | `next/font` |

CSS variables: `--font-jakarta`, `--font-arabic`, `--font-question`,
`--font-display-italic`. Plus Jakarta Sans has no real italic — never
apply `font-style: italic` to it.

Scale classes live in `globals.css`:
`.text-display .text-h1 .text-h2 .text-h3 .text-subhead .text-body
 .text-body-sm .text-caption .text-button .text-question
 .text-question-tight`.

---

## 3. Primitives — `components/primitives/`

| File | Role | Notes |
|---|---|---|
| `Logo.tsx` | Brand mark / lockup | API: `variant: 'lockup' \| 'mark'`, `tone: 'ink' \| 'cream'`, `width`, `asLink`. See `docs/logo.md` |
| `Button.tsx` | All buttons | `variant: primary \| secondary \| tertiary \| ghost \| ghost-on-dark \| destructive`, `size: sm \| md \| lg \| xl`, `fullWidth`, `loading`, `iconLeft`, `iconRight`. Wraps `iconRight` in `[data-flip-rtl]` so arrows mirror in RTL |
| `Input.tsx` | Text input | Label + helper + error pattern |
| `Card.tsx` | Surface container | `variant: quiet \| default \| raised \| glass` |
| `Badge.tsx` | Chips / tags | `tone: brand \| accent \| neutral \| success \| on-dark`, `withDot` |
| `Progress.tsx` | Linear progress bar (legacy) | Use `CompassProgress` for assessment |
| `AvatarCard.tsx` | Coral-glowing avatar holder | 144px coral-gradient frame for the character |
| `SpeechBubble.tsx` | The question voice | `tight?` variant for compact rendering |
| `PlayButton.tsx` / `SpeedPill` | Audio narration controls | `state: idle \| loading \| playing` |
| `SelectPill.tsx` | Cream dropdown pill | Wraps a native `<select>` for a11y |
| `CharacterIllustration.tsx` | Back-compat shim → `Nour` | Older imports keep working |

---

## 4. Brand assets — `components/brand/`

### Icons (`icons.tsx`)
14 custom SVG icons, all with a small cyan signature dot at a natural
termination point:

`TareeqCompass · TareeqSparkle · TareeqUsers · TareeqArrowRight · TareeqArrowLeft · TareeqLock · TareeqRotate · TareeqPlay · TareeqPause · TareeqVolumeOn · TareeqVolumeOff · TareeqMic · TareeqChevronDown · TareeqCheck`

Conventions: `viewBox="0 0 24 24"`, stroke `currentColor` @ 1.75px, round
joins. Pass `showAccent={false}` to drop the cyan dot.

### Step icons (`StepIcons.tsx`)
3 illustrated 40×40 tiles, used in the `/start` PathSteps:

| Icon | Background | Story |
|---|---|---|
| `AssessIcon` | coral gradient | chat bubble + check — "answer questions" |
| `DiscoverIcon` | lavender gradient | compass star with plum center pin — "find your direction" |
| `GrowIcon` | cyan gradient | three plum figures linked — "community" |

Each carries an inner-highlight stroke and a signature dot (cyan on
coral/lavender, cream on cyan).

### Answer icons (`AnswerIcons.tsx`)
5 playful 32×36 tiles for the question-screen answer cards. Same
family as StepIcons (gradient tile + cream stroke icon + signature
dot), mapped by option position so each letter (A/B/C/D/E) always
gets a consistent visual identity:

| Position | Icon | Background |
|---|---|---|
| A (0) | `AnswerSpark` — 4-point star | coral gradient |
| B (1) | `AnswerDrop` — water droplet | cyan gradient |
| C (2) | `AnswerLeaf` — outlined leaf | lavender gradient |
| D (3) | `AnswerHeart` — soft heart | coral-glow gradient |
| E (4) | `AnswerBolt` — lightning | plum gradient |

Use via the position-picker helper:

```tsx
import { AnswerIcon } from "@/components/brand/AnswerIcons";
<AnswerIcon position={optionIdx} size={36} />
```

The icon replaces the old A/B/C letter chip. Letter position is still
exposed for keyboard users via the footer hint ("press 1, 2, 3") and
the screen-reader name on the underlying button.

On hover/active/confirming, the tile scales up 5% + picks up a
drop-shadow — same micro-interaction language as the rest of the
answer card.

### Scenes (`Illustrations.tsx`)
Full vector compositions for hero moments:

- `CompassScene` — compass rose with coral needle + ambient stars
- `PersonaScene` — silhouette portrait inside the 4-pillar halo
- `CommunityScene` — three figures linked by a flowing coral→cyan→coral path
- `AmbientStars` — decorative dot field

All accept `tone="cream" | "ink"` to swap stroke color for the surface.

### Kai character (`Kai.tsx`)
Tareeq's mentor character. Gender-neutral mascot-y youth — bold tousled
hair with a cyan front-tuft streak, big dot eyes with highlights, cheek
warmth, cyan turtleneck collar (the "Kai = ocean/sea" cue), and the
small cyan signature star above the head. Five moods:
`curious · warm · thinking · encouraging · listening`.

Mood atlas adjusts the eye position, brow angle, mouth curve, head
tilt, and cheek blush position. Reads cleanly from 24px (avatar
fallback) up to 144px (assessment hero).

The legacy `Nour.tsx` was removed in favor of this redesign; the
`components/primitives/CharacterIllustration.tsx` shim now re-exports
Kai for any legacy import paths.

### Student portrait (`StudentPortrait.tsx`)
Line-art student in the editorial illustration style. Coral wash blob
backdrop + cream linework + dot eyes + soft smile + signature sparkle.
Three variants: `curly · hijab · bun`. Used as the centerpiece of the
`CareerOrbit`.

### Career orbit (`CareerOrbit.tsx`)
The `/start` screen hero. Central `StudentPortrait` (curly variant)
surrounded by 8 floating career-path tag chips (Doctor · Designer ·
Engineer · Filmmaker · Educator · Founder · Researcher · Architect).
Dotted orbit rings, ambient stars, gentle drift animations.

### Compass progress (`CompassProgress.tsx`)
Replaces the linear progress bar in the assessment chrome. Four
quadrants for the C-O-R-E pillars, each fills with coral as the user
answers questions in that pillar. Active quadrant pulses with a cyan
ring. Center holds overall percentage. Layouts: `bare · compact · display`.

Per-pillar progress computed by `lib/assessment/pillar-progress.ts`.

---

## 5. Onboarding — `components/onboarding/`

| File | Role |
|---|---|
| `PathSteps.tsx` | Vertical timeline used on `/start`. Continuous thick lavender connector bar behind illustrated icon column. Bold title + body description per step. Mimo-style. |
| `StepStrip.tsx` | Horizontal 3-step strip (no longer used on `/start` — kept for marketing future use) |
| `DidYouKnow.tsx` | Full-bleed pause-beat between question stacks (every 10 questions). Big scene illustration, Fraunces-italic title, short body, single coral CTA. Plays the `complete` chord on enter. See §5b. |

### 5b. Interstitial pause-beats — "Did you know?"

Content lives in `lib/assessment/interstitials.ts`. Triggers fire after
questions **10, 20, 30, 40** (indexes 9, 19, 29, 39) — four moments to
break the rhythm and add education + anticipation.

Each interstitial defines:
- `key` — stable id for "already-seen" persistence (`tareeq:interstitials-seen` localStorage)
- `triggerAfterIndex` — 0-indexed question after which it fires
- `illustration` — scene component from `Illustrations.tsx`
- `glow` — `"coral" | "cyan" | "lavender"` for the soft halo behind
- `title` — Fraunces italic, max ~18ch
- `body` — sans, max ~34ch, ≤ 2 sentences, voice rules from §10
- `ctaLabel` — verb-first phrase ("Got it", "Keep going", "Makes sense", "Finish strong")

Trigger logic in `QuestionScreen.commitAndAdvance`:
1. Confirm pulse + audio plays as usual
2. After confirm delay, check `findInterstitialFor(index) && !hasSeenInterstitial(key)`
3. If matched: `markInterstitialSeen(key)` and set state to render `DidYouKnow` overlay
4. On CTA click: dismiss + navigate to next question

The component plays `uiSounds.complete()` on mount so the moment lands
as a celebratory beat rather than an interruption.

Add a new interstitial by appending to the `INTERSTITIALS` array — no
other code changes needed.

---

## 6. Audio — `lib/audio/ui-sounds.ts`

Procedural Web Audio API tones. No audio assets shipped for UI sounds.
Gated by the `tareeq:sound` localStorage toggle.

| Sound | Trigger | Notes |
|---|---|---|
| `select()` | option pick on the country dropdown | 660Hz tick |
| `confirm()` | answer commit | 523→784Hz major-third chord |
| `advance()` | move to next question | 880→1320Hz upward glide |
| `back()` | back navigation | 660→440Hz downward glide |
| `transition()` | screen-to-screen mount (mid-flow only) + interstitial enter | Triangle 1100→520Hz over a sub-bass 220→110Hz layer — soft whoosh |
| `complete()` | finish assessment + interstitial enter (layered) | C-E-G resolved chord |

Gain levels were bumped (May 2026) so the cues are audible without
headphones: confirm 0.06→0.10, advance 0.045→0.075, back 0.04→0.07,
complete 0.06→0.09. Still gentle enough to coexist with narration.

`prefersReducedMotion()` helper lives in the same file. Audio is NOT
gated by reduced-motion — it's a separate preference (`tareeq:sound`).

### 6b. Animated illustrations

The three scene illustrations (`CompassScene`, `PersonaScene`,
`CommunityScene`) embed SMIL animations directly in the SVG so they're
"alive" without React state:

| Scene | Signature motion |
|---|---|
| Compass | Needle rotates 24s / full revolution · cyan dot pulses (r 6→9) · 6 stars twinkle on staggered 3-5s clocks · backdrop glow breathes 4s |
| Persona | Four C-O-R-E pillar dots pulse out (r 9→14) staggered 0.5s · sparkle above the head rotates 12s + breathes · cyan tip dot pulses 1.6s |
| Community | Connecting path flows via animated `stroke-dashoffset` (3.6s loop, `10/12` dasharray) · three spark crowns twinkle staggered 0.8s apart · backdrop glow breathes 4.5s |

All SMIL `<animate>` / `<animateTransform>` elements pause automatically
in browsers that honor `prefers-reduced-motion: reduce` only when
applied via CSS — SMIL itself ignores that media query, so for full
respect a `@media (prefers-reduced-motion: reduce)` rule in
`globals.css` should set `animation-play-state: paused` on the SVG
containers if motion sensitivity becomes a priority.

---

## 7. Motion — `app/globals.css`

Keyframes + utility classes:

| Class | Effect |
|---|---|
| `.anim-bubble-in` | Speech bubble enter (fade + scale) |
| `.anim-avatar-in` / `.anim-avatar-bob` | Avatar pop-in + 4.2s bob loop |
| `.anim-option-in` | Answer / step card enter with stagger via `animation-delay` |
| `.anim-option-confirm` | Coral pulse + cyan halo on commit |
| `.anim-screen-enter` / `.anim-screen-exit-forward` / `.anim-screen-exit-back` | Page transitions |
| `.anim-tag-float-a/b/c` | 3 drift variants for orbit tags |
| `.anim-tag-enter` | One-shot enter for orbit tags (with stagger) |
| `.anim-orbit-spin` | Slow 60s/rev for the outer orbit ring |

All collapse to ≤120ms linear under `prefers-reduced-motion: reduce`.

### Composition rule

If one element runs **two** animations that both touch `transform`,
split them across **two wrappers** — outer owns positioning + enter,
inner owns the loop. Otherwise the later animation wins the cascade and
clobbers the earlier transform. Hit this with the orbit center and the
orbit tags both.

---

## 7b. Assessment surface — per-route

The assessment chrome flips surface based on the active route:

| Route | Surface | Why |
|---|---|---|
| `/start` | **Plum** (`surface-plum`) | Onboarding hero — CareerOrbit + dark immersive |
| `/q/*` | **Cream** (light) | Reading + answering — easier on the eyes during a long session |

Light surface is not flat — it uses a warm-radial backdrop:

```css
background:
  radial-gradient(60% 50% at 80% 0%, rgba(255,107,71,0.10), transparent 60%),
  radial-gradient(50% 40% at 15% 100%, rgba(184,165,217,0.18), transparent 65%),
  var(--cream);
```

The chrome reads `hasQuestion` from the route and switches:
- Back button: `border-ink/10 bg-white/70 text-ink` (light) vs `border-white/15 bg-white/5 text-cream` (dark)
- Compass progress: `surface="light"` flips track to mist, letters to plum, center to cream
- Wordmark: `text-ink` (light) vs `text-cream` (dark) — gradient mark stays the same

### Question kinds — four flavors

The assessment supports four `QuestionKind` values today:

| Kind | UI | Commit |
|---|---|---|
| `single` | Stacked answer cards with illustrated icon tiles. Per-letter coral edge stripe. | Auto-advance on tap — confirm pulse + sound + interstitial check |
| `binary` | Same card stack, no letter chip | Auto-advance on tap |
| `select` | Cream pill wrapping a native `<select>` | Explicit Next button |
| **`text`** | Generous textarea (5 rows, 600 char max) with character counter + helper line "No wrong answers — write what comes to mind." | Explicit Next button (greyed until non-empty after `.trim()`) |

**Text questions** render with a different pillar caption ("Reflect"
instead of "Pillar 1 · Curiosities" etc.) so the user feels the mode
change from "tap" to "write". Keyboard handling is fully released to
the textarea — numeric and Enter keys reach the input untouched. Auto-
focus on mount. Text answers are stored as raw strings on the same
`saveLocalAnswer` path; the scorer silently skips them because their
`options` array is empty.

The seed appends **10 open-text questions** (QT1–QT10, pillar 4) after
Q40. They're excluded from `CompassProgress` so the dial still reflects
true C-O-R-E completion at 100%.

### Question screen composition (light, centered stack)

```
[pillar caption in chrome]
   ⌄
[Speech bubble — white, light surface, tail centered on BOTTOM edge ↓]
   ⌄ (tail points down)
[Avatar — Kai 88px in 104px coral card, -mt-3 so bubble overlaps top]
   ⌄
[Mute] [Play 48px coral] [Speed]   ← the 3 audio buttons
   ⌄
[Answer A — white card with per-letter coral stripe + Spark icon]
[Answer B — Drop icon]
[Answer C — Leaf icon]
   ⌄
[Caption: "Tap to continue · 1, 2, 3"]    [← Previous]
```

Answer cards on light: `bg-white border-ink/8` default · `coral-gradient` on
active/confirming · per-letter accent stripe inset on the leading edge.

## 8. Special lockup — gradient mark + typeset wordmark

Used in `AssessmentChrome` only. The brand mark is painted with the
`--grad-warm` sweep via CSS `mask-image`, with a typeset wordmark in
cream sans-bold next to it. Sits centered in the header via a
3-column `grid-cols-[1fr_auto_1fr]` layout.

```tsx
<Link href="/" aria-label="Tareeq home" className="inline-flex items-center gap-1.5">
  <span
    aria-hidden
    className="inline-block size-7 bg-grad-warm"
    style={{
      WebkitMaskImage: "url('/logo/tareeq-mark.svg')",
      maskImage: "url('/logo/tareeq-mark.svg')",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskSize: "contain",
      maskSize: "contain",
    }}
  />
  <span className="text-[20px] font-bold leading-none tracking-[-0.025em] text-cream lowercase">
    tareeq
  </span>
</Link>
```

Reserved for the assessment chrome — outside that surface, always use
the file-based `<Logo>` component (see `docs/logo.md`).

---

## 9. Screens (current)

| Route | Surface | Key composition |
|---|---|---|
| `/` | cream | Marketing landing — hero CTA + plum-gradient preview poster |
| `/start` | plum | Onboarding — big headline (sans + Fraunces italic gradient accent) → `CareerOrbit` → `PathSteps` → CTA |
| `/q/[index]` | plum | Question — compass progress in chrome, mood-reactive Nour avatar + tight speech bubble, per-letter accented answer cards with auto-advance |

---

## 10. Voice (microcopy)

- One Display per screen. Sentence case only.
- Confident, energetic, grounded. No exclamation marks except hero moments.
- Curly quotes. `·` for separators.
- Verb-first button labels: "Take the assessment", never "Get started".
- Numbers stay Western Arabic (0-9) by default.

---

## 11. RTL

Logical CSS properties everywhere (`padding-inline`, `margin-inline-start`,
`text-align: start`). Directional icons mirror via `.flip-rtl` or
`data-flip-rtl`. The logo file itself **never** mirrors.

---

## 12. Quality gate

Before merging any visual change:

- [ ] Invoke the `frontend-design` skill
- [ ] Use existing tokens — no hardcoded hex / px values for colors, spacing, radii, motion
- [ ] If you added a primitive or pattern, add it to this file
- [ ] `pnpm typecheck && pnpm lint && pnpm test` all green
- [ ] `prefers-reduced-motion` respected on any new animation
- [ ] Focus states visible on any new interactive element
- [ ] Above-the-fold check on iPhone 12 (390×844) for any assessment surface

---

## 12b. Onboarding flow — five surfaces, one chapter

```
/                marketing landing (cream)
   ↓ Take the assessment
/start           "Fast track career success" + CareerOrbit + PathSteps  (plum)
   ↓ Take the assessment / Resume
/intro           "Hey! I'm Kai." — single hero speech + Continue        (plum)
   ↓ Continue
/contract        "The CORE Contract of Honesty" — 6-item list + I'm ready (plum)
   ↓ I'm ready
/q/[index]       Question screens — light cream surface, centered stack
```

**Resume bypass** — if the user already has answers saved, the
AssessmentStart Resume CTA jumps straight to the saved question index
and skips both /intro and /contract. Only fresh starts walk the
chapter end-to-end.

**Back-button rules** (in `AssessmentChrome`):

| Current route | Back goes to |
|---|---|
| `/start` | `/` |
| `/intro` | `/start` |
| `/contract` | `/intro` |
| `/q/0` | `/contract` |
| `/q/[n>0]` | `/q/[n-1]` |

### IntroScreen (`/intro`)
Cinematic onboarding moment, choreographed reveal:

```
   0ms  page enters (anim-screen-enter)
  80ms  aura blooms in (anim-aura-bloom) + rotation loop begins
 200ms  particles start fading in on a 200–720ms stagger
 320ms  Kai pops in with overshoot (anim-kai-pop, 1.06 → 1)
 620ms  "Meet your guide" eyebrow fades + letter-spacing eases out
 900ms  Typewriter starts + accent line grows left-to-right
~4900ms typing completes → CTA springs up (anim-cta-spring)
```

**Atmospheric particles** — 8 small dots positioned around the aura,
each with a per-particle drift loop (variants `a/b/c`) and a fade-in
delay. Use brand colors (coral / cyan / lavender / coral-glow) with
matching box-shadow glow.

**Cinematic eases** — `kai-pop-overshoot` and `cta-spring-up` both use
the spring curve `cubic-bezier(0.34, 1.56, 0.64, 1)` for a subtle
bounce-into-place. The accent line uses `ease-out` to feel like it
slows as it crosses the screen.

**Audio** — `uiSounds.transition()` fires on mount so the entrance has
a sound texture too. CTA click fires `uiSounds.advance()`.

All animations respect `prefers-reduced-motion: reduce`: aura rotation,
caret blink, and particle drift go to `none`; the spring eases
collapse to 120ms linear.

### ContractScreen (`/contract`)
Editorial 6-item list, color-coded icon tiles + bold title + short body.
Headline pairs sans-bold "The CORE" with Fraunces-italic + warm-gradient
"Contract of Honesty" (same pull-quote pattern as the `/start`
headline). Tiles rotate through coral / cyan / lavender / coral-glow /
mauve / lavender-mist so the list reads with rhythm. Single primary
"I'm ready" CTA hands off to `/q/0`.

---

## 13. Pending / not yet built

- Result hero / shareable poster (`/result/[id]`)
- Full report screen
- Dashboard (post-assessment)
- Arabic locale flip + native font validation
- Light theme on assessment surface (currently plum-only)
- E2E test coverage on the assessment flow
