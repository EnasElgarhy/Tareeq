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
- `GEMINI_API_KEY` or Google Cloud OAuth credentials are only for audio baking and must never reach client code.

## Audio Baking

Tareeq uses Gemini TTS to pre-generate local narration. The browser only plays
files from `public/audio`; Google credentials never reach client code.

```bash
GEMINI_API_KEY=... pnpm audio:bake
```

This writes `public/audio/<questionId>.wav` for the Gemini API key path, such as
`public/audio/Q1.wav`. The prototype also supports existing `.mp3` files.
Use `pnpm audio:bake:dry` to inspect the bake list without calling Google Cloud, and
`pnpm audio:bake:force` after question text changes.

## Reference Prototype

The frozen static prototype lives in `prototype/`. It remains the source of truth
for the assessment copy, scoring behavior, brand tokens, audio bake script, and
Kai avatar until the migration phases port each piece forward.
