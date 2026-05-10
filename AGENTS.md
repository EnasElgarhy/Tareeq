# tareeq — project context for Claude Code

A mobile-first web app for the **CORE Assessment v4**, a 40-question
career-discovery quiz aimed at youth in the Middle East. The user-facing
guide is named **Kai**. The result is a "Career Compass" — top cluster,
operational archetype, reward drivers, and ecosystem fit.

## File map

```
index.html        single-file web app (HTML + CSS + JS, no build step)
bake_audio.py     OpenAI TTS-1 narrator (run once, pre-generates MP3s)
audio/            generated MP3s — one per question (created by bake_audio.py)
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
  reads question text directly from `index.html`, calls OpenAI's
  `/v1/audio/speech` endpoint with `model=tts-1, voice=nova`, and writes
  `audio/<question_id>.mp3` plus two narration tracks
  (`audio/kai_intro.mp3`, `audio/kai_results.mp3`) sourced from the
  `EXTRA_LINES` constant at the top of the script. The browser only
  ever plays local MP3 files — the OpenAI key never reaches the client.
  Missing files degrade gracefully (the speaker icon dims; assessment
  continues silently).
- **3D character "Kai"** is a Three.js scene loaded from a Ready Player
  Me GLB (`models.readyplayer.me/<id>.glb`). Lives in a single `<canvas>`
  inside `#kaiStage`, which has three CSS-driven modes: `landing`
  (large hero), `corner` (64×64 fixed top-right during questions),
  `hidden` (results). Idle animation: gentle floating, periodic
  morph-target blinks, slight head sway. Lip-sync is amplitude-based —
  a Web Audio AnalyserNode on the existing `<audio id="ttsAudio">`
  drives a smoothed mouth-open value into RPM viseme morph targets
  (or a procedural mouth on the fallback character). If the GLB load
  fails for any reason (CORS, network, bad URL), the scene falls back
  to a procedural on-brand character — a glowing sphere head + halo +
  shoulder dome — so the experience never breaks.
  - Configure the avatar URL by setting `window.TAREEQ_AVATAR_URL`
    before the `<script type="module">` at the bottom of the page,
    OR by appending `?avatar=<glb-url>` to the page URL. Default is
    a Ready Player Me sample.
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

# Bake audio (one-time, ~$0.05 with the current 44 questions)
python3 bake_audio.py --api-key sk-...
# or:
OPENAI_API_KEY=sk-... python3 bake_audio.py
```

Useful flags: `--voice`, `--model tts-1-hd`, `--force`, `--dry-run`. See
the script's `--help`.

## Known limitations / open work

These are good things to ask Claude Code to tackle. None of them are
blocking — the app works as-is.

1. **Arabic localization.** The audience is MENA. Need: RTL layout
   support, translated question + UI strings, Arabic narration (TTS-1
   handles Arabic; just bake a second voice with `--out-dir audio_ar`).
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
    sync, integrate Rhubarb Lip Sync at bake time to produce a JSON
    timeline per MP3, then drive the RPM `viseme_*` morph targets from
    the timeline + audio.currentTime instead of from the analyser.
11. **Custom Kai avatar.** Default is a Ready Player Me sample. Generate
    a brand-aligned avatar at https://readyplayer.me, copy the .glb URL,
    and either set `window.TAREEQ_AVATAR_URL` in the page or pass
    `?avatar=<url>` in the URL. For an on-brand stylized look (not
    photoreal humanoid), consider VRM models with a toon shader.
12. **Avatar emotional states.** The character could nod when the user
    selects an answer, look "thinking" while loading, or celebrate on
    the results screen. The infrastructure is there — just add named
    triggers from the existing event handlers.

## Conventions / preferences

- **No frameworks.** Keep this a single-file app until there's a real
  reason to bundle. If a framework becomes necessary, prefer Vite + React
  with TypeScript and migrate cleanly rather than half-converting.
- **No new dependencies in `bake_audio.py`** — stdlib only (urllib).
- **Don't put the OpenAI API key in client code, ever.** If live TTS
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
