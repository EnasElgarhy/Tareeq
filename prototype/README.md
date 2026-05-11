# tareeq — web app

A mobile-first web app for the CORE Assessment. The app is a single
self-contained HTML file plus a small `audio/` folder of pre-generated
MP3 narration.

```
index.html        the whole web app (HTML + CSS + JS)
bake_audio.py     pre-bakes question audio using Gemini-TTS
audio/            generated MP3s — one per question (created by bake_audio.py)
```

## Running it

The app is static. Open `index.html` directly in a browser, or serve the
folder over any HTTP server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Audio playback uses relative paths (`audio/Q1.mp3`, `audio/Q1.wav`, ...), so the app
keeps working even when the audio folder is missing. The play button
shows narration as unavailable and the assessment continues silently.

## Generating the voice narration

Why a bake step? Google Cloud credentials cannot safely live in
client-side HTML. Instead, run the script once with server-side
credentials, ship the resulting MP3s alongside the app, and the browser
never sees your token.

```bash
# 1. Set a Gemini API key:
export GEMINI_API_KEY=...

# 2. From this folder:
python3 bake_audio.py
```

The script also supports Google Cloud Text-to-Speech OAuth:

```bash
gcloud auth application-default login
GOOGLE_CLOUD_PROJECT=your-project-id python3 bake_audio.py --provider cloud-tts
```

The script reads question text directly out of `index.html`, so you
don't have to maintain a separate copy. Files in `audio/` that already
exist are skipped, so re-running is cheap.

### Useful flags

| Flag                | Default     | What it does                                                                 |
| ------------------- | ----------- | ---------------------------------------------------------------------------- |
| Flag                              | Default                  | What it does                                          |
| --------------------------------- | ------------------------ | ----------------------------------------------------- |
| `--provider auto`                 | `auto`                   | Uses `GEMINI_API_KEY` when present, otherwise Cloud TTS OAuth. |
| `--voice Kore`                    | `Kore`                   | Gemini-TTS prebuilt voice, such as `Kore` or `Charon`. |
| `--model`                         | provider-specific        | Gemini-TTS model to use.                              |
| `--location global`               | `global`                 | Cloud TTS endpoint region, such as `global` or `eu`.  |
| `--language-code en-US`           | `en-US`                  | BCP-47 language code for the narration.               |
| `--prompt "..."`                  | Kai guide prompt         | Style direction sent with every line.                 |
| `--force`                         | off                      | Re-generate every MP3, even if it already exists.     |
| `--dry-run`                       | off                      | Show what would be generated without calling the API. |
| `--out-dir audio`                 | `audio`                  | Where to write the MP3 files.                         |

### Cost

The current 44 questions total about 3,000 characters. Gemini-TTS
pricing depends on the selected Google Cloud model and region; the
script prints the character count before it makes any API calls.
Editing existing question wording and re-running with `--force`
triggers another bake.

### Changing question text

1. Edit the question's `title` field in `index.html`.
2. Re-run `python3 bake_audio.py --force` (or delete the affected
   `audio/QN.*` file and run without `--force`).

## How playback works in the app

- The header has a text/listen mode pill. The preference persists in
  `localStorage`.
- Every time a new question is rendered, the app tries to auto-play the
  matching audio file (`.mp3`, `.m4a`, then `.wav`). If the file is
  missing, the replay button reports "unavailable" and the assessment
  continues silently.
- The circular button below the speech bubble replays the current
  question's narration. A `0.75x` chip appears when the file exists.

## The 3D Kai avatar

The landing page shows a 3D animated character ("Kai") that introduces
the assessment, lip-syncs each question, and remains large in a
character-led lesson stage while the user is taking the quiz.

- The avatar is a **Ready Player Me** GLB loaded at runtime from
  `models.readyplayer.me`. It uses Three.js (loaded from jsDelivr via
  an importmap — no build step required).
- Lip-sync is **amplitude-based**: a Web Audio analyser reads the
  loudness of the current audio file while it plays and drives the avatar's
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

- `audio/kai_intro.*` — plays on the landing page on first tap
- `audio/kai_results.*` — plays when the Career Compass appears

Edit the `EXTRA_LINES` constant near the top of `bake_audio.py` to
change what Kai says. Re-run with `--force` to re-generate.

## Going to production

For a public deployment, `bake_audio.py` is the right approach: ship the
generated MP3s as static assets behind a CDN. No API key ever leaves
your build machine, and there are no per-user TTS costs.

If you need on-the-fly speech (e.g. dynamically generated content), put
the provider credential behind a small backend proxy that the browser
calls. Never let a TTS credential ship in the client bundle.
