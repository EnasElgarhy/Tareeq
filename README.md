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
- `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, Google Cloud OAuth credentials, or local TTS model assets are only for audio baking and must never reach client code.

## Audio Baking

Tareeq pre-generates local narration from `lib/content/seed.ts`. The browser
only plays files from `public/audio`; TTS credentials and local model runtimes
never reach client code.

```bash
GEMINI_API_KEY=... pnpm audio:bake
```

This writes `public/audio/<questionId>.wav` for the Gemini API key path, such as
`public/audio/Q1.wav`. Use `pnpm audio:bake:dry` to inspect the full app bake
list without calling a provider, and `pnpm audio:bake:force` after question text
changes.

For ElevenLabs / ElevenStudio narration, put your key in `.env.local` as
`ELEVENLABS_API_KEY`. Kai uses the Matilda voice by default
(`XrExE9yKIg1WjnnlVkGX`) with stability `0.4`, similarity boost `0.75`, style
`0.3`, and speed `0.95`. Then bake MP3 files:

```bash
pnpm audio:bake:elevenlabs
```

This writes `public/audio/<questionId>.mp3`, which is the format the assessment
question screens request.

Question screens can also request speech through the server-only
`/api/kai-tts/<audioId>` route. That route keeps the ElevenLabs credential out of
the browser and uses the same Matilda settings above.

For an Arabic-ready open-source path, use the prototype script directly with
Coqui XTTS-v2 and a Nour reference voice WAV:

```bash
python3 -m pip install "git+https://github.com/coqui-ai/TTS.git@dev"
export NOUR_SPEAKER_WAV=prototype/assets/voice/nour_warm_reference.wav
python3 prototype/bake_audio.py \
  --provider coqui \
  --locale ar \
  --html prototype/index.html \
  --out-dir public/audio_ar
```

The warm human accent comes from that reference WAV. Use a clean,
licensed 10-20 second adult mentor recording with calm, friendly English
and a soft MENA-friendly international accent.

## Reference Prototype

The frozen static prototype lives in `prototype/`. It remains the source of truth
for the assessment copy, scoring behavior, brand tokens, audio bake script, and
animated Nour mentor until the migration phases port each piece forward.
