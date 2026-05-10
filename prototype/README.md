# tareeq — web app

A mobile-first web app for the CORE Assessment. The app is a single
self-contained HTML file plus a small `audio/` folder of pre-generated
MP3 narration.

```
index.html        the whole web app (HTML + CSS + JS)
bake_audio.py     pre-bakes question audio using OpenAI TTS-1
audio/            generated MP3s — one per question (created by bake_audio.py)
```

## Running it

The app is static. Open `index.html` directly in a browser, or serve the
folder over any HTTP server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Audio playback uses relative paths (`audio/Q1.mp3`, ...), so the app
keeps working even when the audio folder is missing — the speaker icon
just dims to "unavailable" and the assessment continues silently.

## Generating the voice narration

Why a bake step? An OpenAI API key cannot safely live in client-side
HTML — anyone who views the page source can copy it. Instead, run the
script once with your key, ship the resulting MP3s alongside the app,
and the browser never sees your key.

```bash
# 1. Get an API key from https://platform.openai.com/api-keys
# 2. From this folder:
python3 bake_audio.py --api-key sk-...

# Or via env var:
OPENAI_API_KEY=sk-... python3 bake_audio.py
```

The script reads question text directly out of `index.html`, so you
don't have to maintain a separate copy. Files in `audio/` that already
exist are skipped, so re-running is cheap.

### Useful flags

| Flag                | Default     | What it does                                                                 |
| ------------------- | ----------- | ---------------------------------------------------------------------------- |
| `--voice nova`      | `nova`      | Any OpenAI voice — `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`, etc. |
| `--model tts-1`     | `tts-1`     | Use `tts-1-hd` for higher-quality, slower output at 2× the cost.             |
| `--force`           | off         | Re-generate every MP3, even if it already exists.                            |
| `--dry-run`         | off         | Show what would be generated without calling the API.                        |
| `--out-dir audio`   | `audio`     | Where to write the MP3 files.                                                |

### Cost

The current 44 questions total about 3,000 characters. At TTS-1's rate
of $15 per 1M characters, a full bake costs roughly **$0.05**. The
script prints an exact estimate before it makes any API calls. Editing
existing question wording and re-running with `--force` triggers
another bake at the same cost.

### Changing question text

1. Edit the question's `title` field in `index.html`.
2. Re-run `python3 bake_audio.py --api-key sk-... --force` (or delete
   the affected `audio/QN.mp3` and run without `--force`).

## How playback works in the app

- The header has a speaker icon. Tap to toggle voice on/off — the
  preference persists in `localStorage`.
- Every time a new question is rendered, the app tries to auto-play
  `audio/<question_id>.mp3`. If the file is missing, the small replay
  button on the question card dims to "unavailable" and the assessment
  continues silently.
- The small circular button on the question card replays the current
  question's narration. It also works to "start" audio if the browser
  blocked the initial auto-play.

## The 3D Kai avatar

The landing page shows a 3D animated character ("Kai") that introduces
the assessment, lip-syncs each question, and shrinks into a small
floating avatar in the top-right while the user is taking the quiz.

- The avatar is a **Ready Player Me** GLB loaded at runtime from
  `models.readyplayer.me`. It uses Three.js (loaded from jsDelivr via
  an importmap — no build step required).
- Lip-sync is **amplitude-based**: a Web Audio analyser reads the
  loudness of `audio/<id>.mp3` while it plays and drives the avatar's
  `mouthOpen` / `viseme_*` morph targets. Not phoneme-accurate, but it
  feels alive.
- If the GLB fails to load (no internet, bad URL, CORS), the scene
  falls back to a procedural on-brand "glowing orb" character so the
  experience never breaks.

### Using your own avatar

Generate one at https://readyplayer.me/avatar (free), copy the `.glb`
URL, and either:

```html
<!-- Option 1: edit the page -->
<script>window.TAREEQ_AVATAR_URL = "https://models.readyplayer.me/<your-id>.glb";</script>
```

```
# Option 2: just append the URL as a query param
http://localhost:8000/?avatar=https://models.readyplayer.me/<your-id>.glb
```

### Kai's spoken lines

In addition to the 44 questions, `bake_audio.py` also generates two
short narration tracks for Kai:

- `audio/kai_intro.mp3` — plays on the landing page on first tap
- `audio/kai_results.mp3` — plays when the Career Compass appears

Edit the `EXTRA_LINES` constant near the top of `bake_audio.py` to
change what Kai says. Re-run with `--force` to re-generate.

## Going to production

For a public deployment, `bake_audio.py` is the right approach: ship the
generated MP3s as static assets behind a CDN. No API key ever leaves
your build machine, and there are no per-user TTS costs.

If you need on-the-fly speech (e.g. dynamically generated content), put
the API key behind a small backend proxy that the browser calls — never
let the key ship in the client bundle.
