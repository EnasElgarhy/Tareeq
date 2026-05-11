# tareeq

Mobile-first career discovery for youth in the Middle East and North Africa.

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` before phases that touch Supabase or audio.

```bash
cp .env.example .env.local
```

Phase 1 does not need live keys. When they are needed:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are browser-safe.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only.
- `GEMINI_API_KEY`, Google Cloud OAuth credentials, or local TTS model assets are only for audio baking and must never reach client code.

## Audio Baking

Tareeq pre-generates local narration. The browser only plays files from
`public/audio`; TTS credentials and local model runtimes never reach client code.

```bash
GEMINI_API_KEY=... pnpm audio:bake
```

This writes `public/audio/<questionId>.wav` for the Gemini API key path, such as
`public/audio/Q1.wav`. The prototype also supports existing `.mp3` files.
Use `pnpm audio:bake:dry` to inspect the bake list without calling Google Cloud, and
`pnpm audio:bake:force` after question text changes.

For an Arabic-ready open-source path, use the prototype script directly with
Coqui XTTS-v2 and a Nour reference voice WAV:

```bash
python3 -m pip install TTS
python3 prototype/bake_audio.py \
  --provider xtts \
  --speaker-wav path/to/nour_reference.wav \
  --locale ar \
  --html prototype/index.html \
  --out-dir public/audio_ar
```

## Reference Prototype

The frozen static prototype lives in `prototype/`. It remains the source of truth
for the assessment copy, scoring behavior, brand tokens, audio bake script, and
animated Nour mentor until the migration phases port each piece forward.
