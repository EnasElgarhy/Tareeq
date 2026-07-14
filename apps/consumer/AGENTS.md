# tareeq — project context for Claude Code

A mobile-first web app for the **CORE Assessment v4**, a 40-question
career-discovery quiz aimed at youth in the Middle East. The prototype's
current user-facing guide is the animated 2D mentor **Nour**. The result
is a "Career Compass" — top cluster, operational archetype, reward
drivers, and ecosystem fit.

## Current state — 2026-05-11

Phases 1, 2, 3, and 4 are complete. The repo now contains a root Next.js
15.5.18 + TypeScript + App Router scaffold using pnpm, React 19,
Tailwind CSS, ESLint, Prettier, and Vitest with `happy-dom`.

- `prototype/` remains the reference for assessment content, scoring,
  audio baking, brand tokens, and Nour. On 2026-05-11 its question flow
  was redesigned into the character-led lesson layout that future
  Next.js work should port forward.
- `app/globals.css` ports the prototype `:root` brand tokens verbatim
  and wires the Outfit + Fraunces font variables.
- `app/(marketing)/page.tsx` now renders the mobile-first landing page
  with the brand wordmark, CORE v4 summary, and assessment CTA.
- Phase 1 dependencies are installed, including Supabase, Drizzle,
  next-intl, react-three-fiber/drei, Three.js, lucide-react, zod, and
  Vitest. Supabase runtime persistence is not wired yet because the
  local environment keys are not present.
- `pnpm-workspace.yaml` exists only to approve pnpm v11 native helper
  builds non-interactively.
- `db/schema.ts` defines the Phase 2 Drizzle schema for clusters,
  content versions, questions, options, profiles, assessments, and audio
  clips.
- `db/migrations/0001_initial_schema.sql` and
  `supabase/migrations/202605110001_initial_schema.sql` contain the raw
  SQL schema, RLS policies, and auth profile trigger from
  `ARCHITECTURE.md` sections 2-3.
- `lib/content/seed.ts` ports the prototype assessment content:
  4 demographic questions, 40 scored questions, 8 clusters, and
  125 options. `lib/content/seed.test.ts` verifies those counts locally.
- `scripts/seed_db.ts` seeds Supabase with the active `v4` content
  version via `pnpm seed`; it requires `NEXT_PUBLIC_SUPABASE_URL` (or
  `SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` in the environment.
- `lib/scoring/types.ts` and `lib/scoring/index.ts` port the prototype
  `score()` behavior into a pure TypeScript `computeScore()` function.
  It accepts letter answers or numeric option indexes and returns a
  structured Career Compass result.
- `lib/scoring/scoring.test.ts` pins the four approved persona outputs:
  All-A, All-D/B, Tech-leaning, and Arts/PPL.
- `app/(assessment)/layout.tsx`, `app/(assessment)/start/page.tsx`, and
  `app/(assessment)/q/[index]/page.tsx` implement the Phase 4
  assessment flow: start/resume, one question per route, progress, back
  navigation, country select, and completion redirect.
- `/start` wraps the client assessment-start component in a Suspense
  boundary so `useSearchParams()` passes the Next.js production build.
- `components/assessment/*` contains the mobile UI shell, landing/start
  client behavior, question rendering, and temporary guide/text-mode
  placeholders. `QuestionScreen` includes narration/text-only controls
  that play `/audio/<externalId>.mp3` when files exist and show a clear
  missing-file message otherwise. The prototype's new 2D Nour stage
  should replace the old 3D Kai/RPM plan when the character is ported.
- `lib/assessment/questions.ts` adapts the seeded 44-question content for
  the UI. `lib/assessment/progress.ts` persists a local draft in
  `localStorage`, resumes at the next unanswered question, and stores the
  completed local `CompassResult`.
- `lib/assessment/progress.test.ts` verifies local draft creation,
  answer merging, answer counts, and resume-index behavior.
- `prototype/index.html` now uses a Duolingo-style question experience:
  slim header, progress bar plus eyebrow, compact Nour lesson stage,
  Fraunces italic speech bubble, one replay button, optional `0.75x`
  replay, persisted Listen/Read mode, answer-pill selection, a delayed
  final-question thinking pose, illustrated tip screens between
  demographics/curiosities/operations/rewards/ecosystems, and a pure
  inline SVG/JS character animation. As of 2026-05-12 the character is a
  panel-free flat SVG (`#kaiSvg`) animated with CSS blinks/breathing and
  the existing Web Audio analyser for mouth amplitude. The old Three.js
  + Ready Player Me path is removed and deprecated; future Next.js work
  should port this SVG controller instead of the 3D pipeline.
- `prototype/bake_audio.py` now bakes local narration with multiple
  providers. It auto-detects `NOUR_SPEAKER_WAV` first and uses local
  Coqui XTTS-v2 via `--provider coqui` / `xtts` (`.wav` output), then
  falls back to `GEMINI_API_KEY` for the Gemini API
  (`gemini-2.5-flash-preview-tts`, voice `Kore`, `.wav` output), or
  Google Cloud Text-to-Speech OAuth via `--provider cloud-tts` (`.mp3`
  output). Coqui should be installed from the GitHub `dev` branch:
  `python3 -m pip install "git+https://github.com/coqui-ai/TTS.git@dev"`.
  For the desired warm human accent, use or create
  `prototype/assets/voice/nour_warm_reference.wav`; XTTS clones accent
  and warmth from that licensed 10-20 second reference recording.
- `prototype/audio/` currently contains temporary local macOS-generated
  demo WAV files so the static prototype speaks without a cloud key.
  Replace them with Gemini, Cloud TTS, or XTTS output before production.

Next phase: Phase 5 — port the Career Compass results page.

## File map

```
index.html        single-file web app (HTML + CSS + JS, no build step)
bake_audio.py     narrator bake script (Gemini, Cloud TTS, or local XTTS)
audio/            generated WAV/MP3 files — one per question (created by bake_audio.py)
README.md         human-facing setup notes
CLAUDE.md         this file
logo.svg|png|...  optional brand asset; auto-loaded if present (see below)
```

There is no backend, no bundler, no package manager. The app runs by
opening `index.html` in a browser, or via any static file server
(`python3 -m http.server`).

## Architecture

- **Single source of truth** for question text lives inline in `index.html`
  inside the `pillar1` / `pillar2` / `pillar3` / `pillar4` / `demographics`
  arrays (search for `const pillar1 = [`).
- **Scoring** is fully deterministic and runs in the browser. See the
  `score()` function in the inline `<script>`. Pillar 1 maps each option
  to one of 8 career clusters via the `c:` field. Pillars 2–4 map options
  to axes/drivers via the `v:` field.
- **Brand logo** uses progressive enhancement. The page ships with an SVG
  recreation of the tareeq wordmark. On load, JS probes for
  `logo.svg`, `logo.png`, `logo.webp`, `logo.jpg` — the first one that
  exists replaces the SVG. Drop a file into the folder and reload; no
  code changes needed.
- **Audio narration** is pre-baked, not live-generated. `bake_audio.py`
  reads question text directly from `index.html` and writes local audio
  files. Gemini API output is `.wav`, Cloud TTS OAuth output is `.mp3`,
  and local Coqui XTTS-v2 output is `.wav` with `--provider coqui` /
  `xtts` plus a Nour reference speaker file. The preferred warm human
  reference path is `assets/voice/nour_warm_reference.wav`. The legacy
  narration track ids are still `audio/kai_intro.*` and
  `audio/kai_results.*`. The browser only ever plays local audio files;
  provider credentials and model runtimes never reach the client.
  Missing files degrade gracefully.
- **2D character "Nour"** is a flat inline SVG portrait inside
  `#kaiStage` (legacy id preserved so the surrounding layout did not
  churn). `window.kai = { setMode, show, setState, isReady }` is kept as
  the compatibility API while driving the Nour SVG modes: `landing`,
  `lesson`, `corner`, and `hidden`. Nour has
  breathing, blinks, nod/tilt poses, thinking and celebrating states,
  and amplitude-based lip-sync from a Web Audio `AnalyserNode` connected
  to the existing `<audio id="ttsAudio">`. The deprecated Three.js,
  Ready Player Me GLB, procedural fallback, and canvas path have been
  removed from the prototype.
- **Persistence** uses `localStorage` for the sound-toggle preference
  only. Answers are kept in memory; refreshing the page resets them.
  This is intentional for now.

## CORE assessment scoring rules (do not change without spec approval)

- **Pillar 1 — Curiosities (16 Qs, 4 options each).** Each option has
  `c: "<CLUSTER>"`. Tally per cluster; rank descending; top one is the
  user's primary career cluster. Clusters: `TECH, ENG, SCI, ART, BUS,
  LAW, PPL, ENV`.
- **Pillar 2 — Operations (8 Qs, binary).** Q17–Q20 score the Processing
  axis (`STRUCT` vs `FLEX`). Q21–Q24 score the Scope axis (`DEEP` vs
  `BROAD`). The four-quadrant combination produces an Operational
  Archetype: Precisionist (Struct+Deep), Coordinator (Struct+Broad),
  Explorer (Flex+Deep), Catalyst (Flex+Broad).
- **Pillar 3 — Rewards (10 Qs, binary).** Each option carries one of
  `REC, IMP, AUT, MAS, STA`. Tally; primary + secondary drivers come
  from the top two.
- **Pillar 4 — Ecosystems (6 Qs, binary).** Q35–Q37 score Social
  (`COL` vs `IND`). Q38–Q40 score Environment (`DYN` vs `PRE`).

If you change question wording, **re-run `bake_audio.py --force`** so
the narration matches.

## How to run

```bash
# Static serve (so audio fetches work cleanly)
python3 -m http.server 8000

# Bake audio with Google Cloud Gemini-TTS
gcloud auth application-default login
GOOGLE_CLOUD_PROJECT=<project> python3 bake_audio.py

# Bake Arabic-ready local Coqui XTTS audio once Arabic strings exist
python3 -m pip install "git+https://github.com/coqui-ai/TTS.git@dev"
NOUR_SPEAKER_WAV=assets/voice/nour_warm_reference.wav python3 bake_audio.py --provider coqui --locale ar --out-dir audio_ar
```

Useful flags: `--voice`, `--model`, `--location`, `--force`, `--dry-run`. See
the script's `--help`.

## Known limitations / open work

These are good things to ask Claude Code to tackle. None of them are
blocking — the app works as-is.

1. **Arabic localization.** The audience is MENA. Need: RTL layout
   support, translated question + UI strings, Arabic narration (bake a
   second voice/locale with `--provider coqui --locale ar --out-dir audio_ar`
   or another Arabic-capable provider such as SILMA).
2. **Persistence across reloads.** Answers are in-memory only. Decide:
   `localStorage`-only, or backend submission with a session ID.
3. **Backend.** Currently none. To capture results for research, add a
   small endpoint that accepts a JSON payload of `{ answers, score }`.
   Keep TTS pre-baked even after adding a backend — no need for live
   generation unless dynamic content gets introduced.
4. **Sharing the Compass.** No share-sheet / OG-image / unique URL yet.
   A static HTML result page with the user's compass embedded as a
   query string would be the lightest path.
5. **Cluster mapping audit.** Each Pillar 1 option was hand-mapped to a
   single cluster. The original spec implies a 2-questions-per-cluster
   balance — current mapping is intent-based and may not be perfectly
   even. Worth a deliberate review with whoever owns the assessment
   design.
6. **Real research-backed scoring weights.** Current scoring is uniform
   (each answer = 1 point). The CORE spec mentions a "deterministic
   scoring engine" — if there are weighted rules, they need to land in
   `score()`.
7. **Brand assets.** The logo on the landing page is an SVG recreation;
   the user will likely drop a real `logo.svg` or `logo.png` in. The
   loader already handles that — no code changes needed.
8. **Accessibility pass.** Keyboard nav works (1–9 to pick, Enter to
   advance, ←  back). Screen-reader labels could be improved on the
   options and result charts.
9. **Question-option narration.** Today only the question stem is
   narrated. Baking option text too is supported by extending
   `bake_audio.py` to also read the `options` array — tradeoff is more
   files (~200 vs 44) and slightly higher cost (~$0.20).
10. **Phoneme-accurate lip-sync.** Current lip-sync is amplitude-based
    (mouth opens proportional to audio loudness). For viseme-accurate
    sync, bake a JSON timeline per audio file, then drive Nour's SVG
    mouth path from `audio.currentTime` instead of from the analyser.
11. **Custom Nour illustration.** The character is currently a locked
    inline SVG portrait with navy side bun, warm tan skin, coral panel,
    and cyan earrings. Future art changes should preserve those brand
    anchors unless the design direction changes explicitly.
12. **Avatar emotional states.** Nour already supports idle/listening,
    speaking, thinking, celebrating, nod, and tilt states. Next work
    should port those states into the Next.js character component.

## Conventions / preferences

- **No frameworks.** Keep this a single-file app until there's a real
  reason to bundle. If a framework becomes necessary, prefer Vite + React
  with TypeScript and migrate cleanly rather than half-converting.
- **No new dependencies in `bake_audio.py`** — stdlib only (urllib).
- **Don't put a TTS provider credential in client code, ever.** If live TTS
  becomes necessary, build a backend proxy first.
- **Mobile-first.** Design at 380–414px width and let larger screens
  inherit. The desktop layout is just the mobile shell centered with a
  card frame.
- **Brand**: dominant color is the deep purple/violet base from the
  reference screenshot, with a pink-to-orange gradient (`--grad-warm`)
  for accents and CTAs. Cyan is reserved for the logo. Don't introduce
  new accent colors without a specific reason.
- **Typography**: Outfit (UI) + Fraunces (display, italic for emphasis).

## Sample prompts to give Claude Code

- "Add Arabic localization. Translate the 44 questions and UI strings,
  flip layout to RTL on `<html lang='ar'>`, and update `bake_audio.py`
  so it can bake into `audio_ar/`."
- "Persist answers to localStorage so a reload resumes where the user
  left off. Show a 'Resume / Start over' choice on the landing screen
  if a partial run exists."
- "Add a results-share screen: generate a unique URL (state encoded in
  the hash) plus a downloadable PNG of the Compass."
- "Audit the Pillar 1 cluster mapping. The spec implies two questions
  per cluster across the 16 questions; report the current distribution
  and propose a re-mapping to balance it."
- "Replace the SVG logo with `logo.png` (the user will drop the file
  in). Verify the auto-swap loader works on iOS Safari."
- "Add option narration to `bake_audio.py` and a per-option play button
  to the UI."


<claude-mem-context>
# Memory Context

# claude-mem status

This project has no memory yet. The current session will seed it; subsequent sessions will receive auto-injected context for relevant past work.

Memory injection starts on your second session in a project.

`/learn-codebase` is available if the user wants to front-load the entire repo into memory in a single pass (~5 minutes on a typical repo, optional). Otherwise memory builds passively as work happens.

Live activity: http://localhost:37701
How it works: `/how-it-works`

This message disappears once the first observation lands.
</claude-mem-context>
