# tareeq — prototype

A mobile-first single-file prototype for the CORE Assessment. The app is
plain HTML/CSS/JS plus a small `audio/` folder of pre-generated WAV/MP3
narration.

```
index.html        the whole prototype app
bake_audio.py     pre-bakes question audio
audio/            generated WAV/MP3 files, one per question
```

## Running It

Serve the folder over HTTP so audio fetches work cleanly:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Audio playback uses relative paths such as `audio/Q1.mp3` and
`audio/Q1.wav`. If the audio folder is missing, the replay button reports
that narration is unavailable and the assessment continues silently.

## Generating Narration

Why a bake step? TTS credentials and local model dependencies cannot
safely live in client-side HTML. Run the script once server-side, ship
the resulting files with the app or upload them to storage, and the
browser never sees your token or model runtime.

Gemini API key path:

```bash
export GEMINI_API_KEY=...
python3 bake_audio.py
```

ElevenLabs / ElevenStudio key path:

```bash
export ELEVENLABS_API_KEY=...
export ELEVENLABS_VOICE_ID=... # optional, but recommended
python3 bake_audio.py --provider elevenlabs
```

Google Cloud Text-to-Speech OAuth path:

```bash
gcloud auth application-default login
GOOGLE_CLOUD_PROJECT=your-project-id python3 bake_audio.py --provider cloud-tts
```

Open-source Arabic-ready path with Coqui XTTS-v2:

```bash
python3 -m pip install "git+https://github.com/coqui-ai/TTS.git@dev"
export NOUR_SPEAKER_WAV=assets/voice/nour_warm_reference.wav
python3 bake_audio.py \
  --provider coqui \
  --locale en \
  --out-dir audio

# Later, after Arabic strings exist:
python3 bake_audio.py \
  --provider coqui \
  --locale ar \
  --out-dir audio_ar
```

For a warmer, more human accent, the important input is the reference
WAV. XTTS clones the voice color, accent, and warmth from that recording.
Use a clean 10-20 second adult mentor voice: calm, friendly, clear
English, soft MENA-friendly international accent, no music or room echo.
See `assets/voice/README.md` for the exact recording brief.

The script reads question text directly out of `index.html`, so you do
not have to maintain a separate copy. Existing files are skipped unless
you pass `--force`.

## Useful Flags

| Flag | Default | What it does |
| --- | --- | --- |
| `--provider auto` | `auto` | Uses Coqui XTTS-v2 when `NOUR_SPEAKER_WAV` is set, then `ELEVENLABS_API_KEY`, then `GEMINI_API_KEY`, otherwise Cloud TTS OAuth. |
| `--provider elevenlabs` / `elevenstudio` | off | Uses ElevenLabs text-to-speech and writes MP3 files. Requires `ELEVENLABS_API_KEY`; set `ELEVENLABS_VOICE_ID` for a specific workspace voice. |
| `--provider coqui` / `xtts` | off | Uses local Coqui XTTS-v2 from the GitHub `dev` branch; supports English and Arabic with a reference voice. |
| `--voice Kore` | `Kore` | Gemini/Cloud prebuilt voice, such as `Kore` or `Charon`. |
| `--elevenlabs-voice-id` | Kai voice | ElevenLabs voice id. Defaults to `ELEVENLABS_VOICE_ID` or Kai's approved voice (`ZF6FPAbjXT4488VcRRnw`). |
| `--speaker-wav` | `NOUR_SPEAKER_WAV` or `assets/voice/nour_warm_reference.wav` | Reference WAV for XTTS voice cloning; controls the warm human accent. |
| `--model` | provider-specific | TTS model to use. |
| `--locale en/ar` | unset | Content locale; helps choose provider language. |
| `--language-code en-US` | `--locale` or `en-US` | BCP-47/provider language code. |
| `--prompt "..."` | Nour guide prompt | Style direction sent with every Gemini/Cloud line. |
| `--force` | off | Re-generate files that already exist. |
| `--dry-run` | off | Show what would be generated without calling an API/model. |
| `--out-dir audio` | `audio` | Where to write the generated files. |

The current questions plus two narration lines total about 3,000
characters. Gemini/Cloud pricing depends on provider, model, and region.
XTTS runs locally but requires local disk and compute.

## Playback

- The header has a text/listen mode pill. The preference persists in
  `localStorage`.
- Each new question tries to auto-play the matching audio file
  (`.mp3`, `.m4a`, then `.wav`).
- The circular button below the speech bubble replays the current
  question. A `0.75x` chip appears when the file exists.

## Nour

The landing page and question flow show an animated 2D SVG mentor named
Nour. She introduces the assessment, lip-syncs each question, and stays
present in a compact character-led lesson stage.

- Nour is an inline SVG. There is no Three.js, Ready Player Me GLB,
  runtime model fetch, or canvas dependency.
- Lip-sync is amplitude-based: a Web Audio analyser reads the loudness
  of the current audio file and drives the SVG mouth shape.
- The legacy `kai_intro.*` and `kai_results.*` filenames are preserved
  as track ids so the playback pipeline did not churn.

Edit the `EXTRA_LINES` constant near the top of `bake_audio.py` to
change Nour's intro/results narration. Re-run with `--force` to
re-generate.

## Production Notes

For a public deployment, keep the pre-bake approach: ship generated
audio as static assets behind a CDN or Supabase Storage. If dynamic
speech is ever needed, put the provider credential behind a backend
proxy. Never ship a TTS credential in the client bundle.
