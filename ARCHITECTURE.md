# Tareeq — Full-Stack Architecture Plan

> Status: planning doc. No code in this repo has been migrated yet. The
> existing prototype lives in `index.html`, `bake_audio.py`, and `audio/`.
> This document is the canonical source for the new build. Treat it as
> the contract.

## TL;DR

We are migrating from a single-file static prototype to a Next.js +
Supabase full-stack app. The prototype's assessment logic, scoring
rules, audio pipeline, and Three.js avatar all port forward; the shape
of the app changes.

**Stack chosen.**
- Frontend + API: **Next.js 15 (App Router) + TypeScript + React 19**
- UI: **Tailwind CSS + Radix UI primitives**, custom theme tokens (the
  existing purple/orange/cyan palette is the source of truth)
- 3D: **react-three-fiber** + **@react-three/drei** (wraps the existing
  Three.js work; same RPM avatar, same lip-sync logic)
- DB + Auth + Storage: **Supabase** (Postgres + Auth + Storage + Edge Functions)
- ORM: **Drizzle** (lightweight, SQL-first, no codegen drama)
- i18n: **next-intl** (English + Arabic, RTL via CSS logical properties)
- Hosting: **Vercel** (app) + **Supabase Storage / Cloudflare R2** (audio MP3s)
- Analytics: **PostHog** (events + funnel + session replay) — optional
- TTS: keep `bake_audio.py` as a build-time script; output uploads to Storage

**What stays the same.**
- The 40-question CORE Assessment + scoring rules. Locked contract — see
  `CLAUDE.md`. Scoring runs client-side for instant feedback AND server-side
  for trust. Server wins if they disagree.
- OpenAI TTS-1 narration. Pre-baked, never live in the browser. Audio
  files stop being checked into the repo and start being deployed to
  Supabase Storage as part of CI.
- Brand: deep purple/violet base, pink-to-orange gradient (`--grad-warm`)
  for accents, cyan reserved for the logo.
- Mobile-first. Design at 380–414px width.

---

## 1. Repo structure

Single repo, single deployment target. Monorepo overhead not justified
yet.

```
tareeq/
├── app/                              # Next.js App Router
│   ├── (marketing)/                  # public, no auth
│   │   ├── page.tsx                  # landing page (current "screen-landing")
│   │   ├── about/page.tsx
│   │   └── privacy/page.tsx
│   ├── (assessment)/                 # the 40-question flow
│   │   ├── start/page.tsx            # demographic intro
│   │   ├── q/[index]/page.tsx        # one question per route, deep-linkable
│   │   └── layout.tsx                # progress bar, Kai corner avatar
│   ├── compass/[id]/page.tsx         # results page; [id] = assessment id
│   ├── account/                      # user settings, history
│   │   └── page.tsx
│   ├── admin/                        # admin-only
│   │   ├── layout.tsx                # gate by role check
│   │   ├── page.tsx                  # overview
│   │   ├── assessments/page.tsx      # browse + filter
│   │   ├── content/page.tsx          # edit questions
│   │   └── exports/page.tsx          # CSV download
│   ├── api/                          # route handlers (use sparingly)
│   │   └── tts/route.ts              # optional live TTS proxy (later)
│   ├── auth/
│   │   └── callback/route.ts         # OAuth callback
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── kai/                          # 3D avatar
│   │   ├── KaiStage.tsx              # canvas, modes (landing/corner/hidden)
│   │   ├── useLipSync.ts             # Web Audio analyser hook
│   │   ├── AvatarModel.tsx           # GLTF load + morph target setup
│   │   └── ProceduralFallback.tsx    # the glowing-orb fallback
│   ├── assessment/
│   │   ├── QuestionCard.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── OptionList.tsx
│   │   └── ResultsCompass.tsx
│   ├── ui/                           # Radix-wrapped primitives
│   └── shared/
├── lib/
│   ├── scoring/
│   │   ├── index.ts                  # computeScore(answers) → CompassResult
│   │   ├── clusters.ts               # 8 cluster definitions
│   │   ├── rules.ts                  # cluster mapping per question option
│   │   └── scoring.test.ts           # snapshot of current persona outputs
│   ├── content/
│   │   ├── seed.ts                   # default 40-question seed
│   │   └── loader.ts                 # fetch from DB with fallback to seed
│   ├── supabase/
│   │   ├── server.ts                 # server-side client
│   │   ├── client.ts                 # browser client
│   │   └── admin.ts                  # service-role client (server only)
│   ├── audio/
│   │   ├── url.ts                    # builds /audio/<id>.mp3 from Storage CDN
│   │   └── play.ts                   # imperative play helpers
│   └── i18n/
│       ├── config.ts                 # locales: ['en', 'ar']
│       └── messages/
│           ├── en.json
│           └── ar.json
├── db/
│   ├── schema.ts                     # Drizzle schema
│   └── migrations/                   # generated SQL
├── supabase/
│   ├── migrations/                   # SQL migrations (mirrored from drizzle)
│   └── functions/                    # edge functions if needed
├── scripts/
│   ├── bake_audio.py                 # ported from current repo
│   ├── upload_audio.ts               # uploads MP3s to Supabase Storage
│   └── seed_db.ts                    # seeds questions + clusters
├── public/
│   └── (logos, favicons, OG images)
├── .env.example
├── drizzle.config.ts
├── next.config.ts
├── package.json
└── README.md
```

Notable choices:

- **One question per route** (`/q/0` through `/q/43`) instead of a single
  SPA screen. This makes the assessment deep-linkable, gives Next.js
  free progress restoration, and makes the back button do the right
  thing.
- **Admin under `/admin`** behind a layout that does a server-side role
  check. RLS is the real enforcement; the layout is just UX.
- **`lib/scoring`** is the single source of truth for the rules. Used
  by both the client (for instant feedback) and the server (for the
  authoritative result). Has a test file pinned against the current
  persona outputs in `CLAUDE.md`.

---

## 2. Database schema

All tables in the `public` schema. RLS enabled on every table. UUIDs
everywhere except references to `auth.users(id)`.

### 2.1 Reference data (seeded, rarely changes)

```sql
-- 8 fixed career clusters
create table clusters (
  code        text primary key,         -- 'TECH', 'ENG', 'SCI', ...
  name        text not null,            -- 'Technology'
  description text not null,
  display_order int not null
);

-- Versioned content. Editing a question creates a new version row;
-- existing assessments stay pinned to the old version_id.
create table content_versions (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,            -- 'v4', 'v4.1-pilot', etc.
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  notes       text
);

create table questions (
  id              uuid primary key default gen_random_uuid(),
  version_id      uuid not null references content_versions(id) on delete cascade,
  external_id     text not null,        -- 'Q1', 'QD1' — stable across versions
  pillar          int not null,         -- 0=demographic, 1..4 = pillars
  position        int not null,         -- ordering within pillar
  kind            text not null,        -- 'single' | 'binary' | 'select'
  -- localized title + helper text live here as JSON keyed by locale:
  -- { "en": "...", "ar": "..." }
  title           jsonb not null,
  axis            text,                 -- nullable; for binary/axis questions ('PROC','SCOPE','SOC','ENV')
  unique (version_id, external_id)
);

create table question_options (
  id              uuid primary key default gen_random_uuid(),
  question_id     uuid not null references questions(id) on delete cascade,
  letter          text not null,        -- 'A' | 'B' | 'C' | 'D'
  position        int not null,
  -- localized text per locale
  text            jsonb not null,
  cluster_code    text references clusters(code),  -- pillar 1 only
  driver_code     text,                 -- pillar 3: 'REC','IMP','AUT','MAS','STA'
  axis_value      text,                 -- pillar 2/4: 'STRUCT','FLEX','DEEP','BROAD','COL','IND','DYN','PRE'
  unique (question_id, letter)
);
```

### 2.2 User data

```sql
-- Mirrors auth.users, adds app-level fields. Inserted via trigger.
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  country         text,
  birth_year      int,
  gender          text,
  locale          text not null default 'en',
  role            text not null default 'user' check (role in ('user','admin')),
  created_at      timestamptz not null default now()
);

-- One row per started assessment. May be incomplete.
create table assessments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,  -- nullable for anon
  anon_session_id text,                 -- if user_id is null, ties together pages
  version_id      uuid not null references content_versions(id),
  locale          text not null default 'en',
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  -- Answers submitted as { questionExternalId: optionLetter | string } map.
  -- Stored as jsonb so we can validate against the version's questions.
  answers         jsonb not null default '{}'::jsonb,
  -- Result computed server-side at completion time (snapshot).
  result          jsonb,                -- CompassResult shape: see lib/scoring
  client_result   jsonb,                -- what the client computed (for audit/integrity)
  user_agent      text,
  ip_country      text,                 -- ISO2, derived server-side
  share_token     text unique           -- for public /compass/<token> URLs
);

create index assessments_user_idx on assessments(user_id);
create index assessments_completed_idx on assessments(completed_at);
create index assessments_version_idx on assessments(version_id);
```

### 2.3 Audio assets

Audio files are stored in Supabase Storage in a `audio/` bucket. We
store metadata so we know which version of the question text a given
MP3 corresponds to. Re-baking creates new rows with bumped version
numbers; the app always serves the latest for the active version.

```sql
create table audio_clips (
  id              uuid primary key default gen_random_uuid(),
  question_id     uuid references questions(id) on delete cascade,
  kind            text not null,        -- 'question' | 'kai_intro' | 'kai_results'
  locale          text not null,
  voice           text not null,        -- 'nova', 'shimmer', etc.
  storage_path    text not null,        -- 'audio/<version>/<lang>/<id>.mp3'
  bytes           int not null,
  duration_ms     int,
  generated_at    timestamptz not null default now(),
  generated_by    uuid references auth.users(id)
);

create index audio_clips_q_idx on audio_clips(question_id, locale);
```

---

## 3. RLS policies

Enabled on every table. Service-role key is used server-side for
admin work; the public anon key never has elevated rights.

```sql
-- Reference data: anyone can read.
alter table clusters enable row level security;
create policy "clusters readable by all" on clusters for select using (true);
-- (no insert/update/delete for non-admins; admin work uses service role)

alter table content_versions enable row level security;
create policy "active version readable by all" on content_versions
  for select using (is_active = true or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

alter table questions enable row level security;
create policy "questions in active version readable by all" on questions
  for select using (exists (
    select 1 from content_versions v
    where v.id = questions.version_id and (v.is_active or exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    ))
  ));

alter table question_options enable row level security;
create policy "options of readable questions are readable" on question_options
  for select using (exists (
    select 1 from questions q where q.id = question_options.question_id
  ));

-- Profiles: users see/edit their own; admins see all.
alter table profiles enable row level security;
create policy "self read" on profiles for select using (auth.uid() = id);
create policy "self write" on profiles for update using (auth.uid() = id);
create policy "admin read all" on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Assessments: users see/edit their own; admins see all.
alter table assessments enable row level security;
create policy "owner read" on assessments for select
  using (auth.uid() = user_id);
create policy "owner write" on assessments for insert
  with check (auth.uid() = user_id or user_id is null);
create policy "owner update" on assessments for update
  using (auth.uid() = user_id);
create policy "admin read all" on assessments for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
-- Public sharing: read by share_token.
create policy "public read by share_token" on assessments for select
  using (share_token is not null and current_setting('request.jwt.claims', true)::jsonb->>'share_token' = share_token);
-- (alternative: server route reads with service role, doesn't go through RLS)

-- Audio clips: anyone can read metadata (storage paths) for the active version.
alter table audio_clips enable row level security;
create policy "audio readable" on audio_clips for select using (true);
```

**Trigger to mirror auth.users into profiles:**

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, locale)
  values (new.id, coalesce(new.raw_user_meta_data->>'locale', 'en'));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 4. API surface

Rule of thumb: **prefer Server Components + Server Actions** over REST
endpoints. Use route handlers only for things that need a stable URL
(webhooks, share links, `/api/tts`).

### Server Actions (called from React components)

```ts
// app/(assessment)/actions.ts
'use server';

export async function startAssessment(opts: { locale: string }) {
  // create draft assessment row, return id
}

export async function saveAnswer(opts: {
  assessmentId: string;
  questionExternalId: string;
  value: string;          // option letter, or country code, etc.
}) {
  // update assessments.answers jsonb, validate against version's questions
}

export async function completeAssessment(opts: {
  assessmentId: string;
  clientResult: CompassResult;
}) {
  // server-side recompute via lib/scoring, store both result + client_result,
  // generate share_token, return final result
}
```

### Route handlers

```
GET  /compass/[id]              # SSR result page
GET  /share/[token]             # public read by share token
GET  /api/audio/[id]            # signed URL or proxy for private audio (if needed)
POST /auth/callback             # supabase auth handlers
```

No public mutation endpoints — everything goes through server actions
authenticated via Supabase auth cookies.

---

## 5. Auth flow

**Anonymous-first.** A user can take the entire assessment without
signing up. We use Supabase's anonymous auth (every browser gets a UUID
on first visit, stored as a cookie). On the results screen we offer:

> Save your Compass — get an account so you can come back to this any
> time, on any device.

When they sign up (email magic link / Google / Apple), we link the
existing anonymous `auth.users` row to the new identity. Their existing
assessment carries over because `user_id` doesn't change.

Admins are flagged manually via SQL (`update profiles set role='admin'
where id = '...'`). No self-service admin signup.

---

## 6. Content management

Two tiers, both backed by the `questions` / `question_options` tables.

### Tier 1 — Read-only at runtime

The active `content_versions.is_active = true` row is what the public
sees. The app reads this on the server during render. To change a
question, an admin in `/admin/content` either:

- Edits in place (cheap fix to typo / translation), or
- Creates a new `content_version`, makes their changes, marks it active.

Marking a new version active is atomic: at most one version is active
at a time (enforced by a unique partial index).

### Tier 2 — Audio re-bake

When questions change, the audio drifts out of sync. Two options:

1. **Manual**: admin triggers a "Bake audio for active version" button in
   the admin panel. Calls a Supabase Edge Function that runs the bake
   script (or calls OpenAI directly) and uploads to Storage.
2. **CI**: GitHub Action listens for `content_versions.is_active`
   changes via Supabase webhooks, runs `bake_audio.py`, uploads new
   MP3s. Slower but no human in loop.

Recommend: ship #1 for v1, add #2 once content velocity is known.

---

## 7. i18n strategy

`next-intl` with two locales: `en`, `ar`.

- **Routing**: `/[locale]/...` (so `/en/q/3` and `/ar/q/3`).
- **RTL**: a `dir="rtl"` attribute on the root when locale is `ar`.
  Layout uses CSS logical properties (`margin-inline-start` etc.) so
  most styles work both ways without forks.
- **Data**: question/option text stored as JSONB keyed by locale. Read
  the active locale, fall back to `en` if missing.
- **Audio**: separate `audio/<lang>/...` folders. `bake_audio.py` gets a
  `--locale` flag.
- **Formatting**: numbers, dates, durations via `next-intl`'s formatters.

**Initial scope**: ship English first (matches current state). Open a
single PR that adds the Arabic locale — translation table separate
from code changes.

---

## 8. Audio pipeline (post-migration)

Same `bake_audio.py` script, slightly evolved:

```
Old: reads index.html, writes audio/Q1.mp3
New: reads from Supabase (active version, given locale), writes to
     audio/<version_id>/<locale>/<external_id>.mp3, uploads to Storage,
     inserts/updates rows in audio_clips.
```

CLI:

```bash
python3 scripts/bake_audio.py \
  --supabase-url $SUPABASE_URL \
  --supabase-key $SUPABASE_SERVICE_ROLE_KEY \
  --openai-key $OPENAI_API_KEY \
  --locale en \
  --voice nova \
  --version-id <uuid>
```

Frontend reads the public URL of each clip from `audio_clips.storage_path`
joined to the bucket's public CDN base.

---

## 9. Migration path from the current static app

The current `index.html` has the right shape; we're refactoring, not
rebuilding. Order of operations:

### Step 1 — Project scaffold
- `pnpm create next-app tareeq --typescript --app --tailwind --eslint`
- Add Supabase, Drizzle, next-intl, react-three-fiber, drei
- Port the CSS variables (`--bg-0`, `--accent-pink`, etc.) into
  `app/globals.css` and Tailwind theme

### Step 2 — Port the data model
- Translate the inline `pillar1/pillar2/pillar3/pillar4/demographics`
  arrays in `index.html` into `lib/content/seed.ts`
- Write `scripts/seed_db.ts` to push that into Supabase
- Verify with the existing test personas in CLAUDE.md

### Step 3 — Port the scoring engine
- Move the `score()` function into `lib/scoring/index.ts` as a pure TS
  function: `(answers, version) => CompassResult`
- Port the four current node-based persona tests into Vitest snapshots
- Wire it up to be callable from both client + server

### Step 4 — Port the screens
- Landing → `app/(marketing)/page.tsx`
- Demographic + 40 questions → `app/(assessment)/q/[index]/page.tsx`
- Results → `app/compass/[id]/page.tsx`
- Reuse the same DOM structure and class names where it accelerates the
  port; refactor to Tailwind once visual parity is confirmed

### Step 5 — Port the avatar
- `components/kai/KaiStage.tsx` is a Client Component that wraps a
  `<Canvas>` from react-three-fiber
- The amplitude-based lip-sync hook becomes `useLipSync(audioRef)`
- The procedural fallback becomes `<ProceduralFallback />`
- The mode prop (`landing`/`corner`/`hidden`) is driven by the route

### Step 6 — Wire persistence
- Server action `saveAnswer` runs on every option click (debounced 250ms)
- Server action `completeAssessment` runs on the last "See My Compass" click
- Anonymous mode works out of the box

### Step 7 — Auth + sharing
- Add Supabase auth with magic link + Google + Apple
- Results page becomes shareable via `share_token`
- Account page lets users see all their past assessments

### Step 8 — Admin
- `/admin` routes, role-gated
- Browse + filter assessments, basic dashboard
- CSV export

### Step 9 — Content management
- `/admin/content` lets admins edit question text, options, mappings,
  and create new content versions

### Step 10 — i18n
- Add Arabic locale, RTL layout, translated content + audio bake

---

## 10. Deploy

- **App**: Vercel, connected to GitHub. Preview deploys per PR.
- **Database + Auth**: Supabase project. Free tier is fine until ~50k MAU.
- **Audio**: Supabase Storage public bucket, served via Supabase's CDN.
  Optionally front with Cloudflare for MENA latency.
- **Domain**: `app.tareeq.<tld>` (or whatever you own). Configure SPF /
  DKIM in Supabase auth so magic link emails don't go to spam.

### Environment variables

```env
# Public (NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_POSTHOG_KEY=...

# Server-only
SUPABASE_SERVICE_ROLE_KEY=...   # used by scripts and server actions
OPENAI_API_KEY=...              # used only at audio-bake time
```

---

## 11. Open decisions (need your input before/during build)

1. **Domain & branding finality.** Do you have a domain registered?
   This blocks email auth setup.
2. **Sign-up gating.** Is the assessment fully anonymous-first (my
   recommendation) or do we require sign-up before starting?
3. **Sharing model.** Public-by-default share URLs, or private-by-default
   with a manual "share" flip?
4. **Analytics.** PostHog (full-featured, MENA-friendly), Plausible
   (privacy-first, simpler), or neither for v1?
5. **Email provider.** Supabase's default email is fine for low volume.
   For production, plug in Resend or Postmark for better deliverability.
6. **GDPR / data sovereignty.** What region should the Supabase project
   live in? `eu-central-1` is the sane default for MENA users; Supabase
   doesn't yet have a Middle East region.
7. **Pricing / payments timeline.** Are we monetising in v1? If yes,
   factor in Stripe (or Paymob / Tap for MENA) before the migration is
   "done".

---

## 12. Phased build plan with Claude Code prompts

Each phase is a session's worth of work. Run them in order; don't skip.

### Phase 1 — Scaffold (1 session)

```
Bootstrap a new Next.js 15 + TypeScript + App Router project named
"tareeq" in this folder. Use pnpm. Install: tailwindcss, @supabase/ssr,
@supabase/supabase-js, drizzle-orm, drizzle-kit, postgres, next-intl,
@react-three/fiber, @react-three/drei, three, lucide-react, zod, vitest.

Set up:
- ESLint + Prettier with sensible defaults
- Tailwind config that includes the brand tokens from
  /Users/.../outputs/index.html (--bg-0, --grad-warm, --accent-pink,
  --accent-orange, --logo-cyan, --text-100/80/60/40)
- A basic app/layout.tsx with the Outfit + Fraunces fonts
- An empty app/page.tsx that renders "tareeq" in the brand style
- A working dev server
- vitest.config.ts with happy-dom
- A README that explains how to set the .env.local variables

Don't add Supabase code yet beyond installing the packages. Don't port
the assessment yet. End the session by running `pnpm dev` and showing
me the rendered page.
```

### Phase 2 — Database schema + seed (1 session)

```
Create the Drizzle schema for the tareeq app exactly as specified in
ARCHITECTURE.md section 2 ("Database schema"). Add the RLS policies in
section 3 as raw SQL migrations.

Then port the assessment data from ../outputs/index.html into
lib/content/seed.ts:
- 4 demographic questions
- 16 Pillar 1 questions (Curiosities) with cluster mappings
- 8 Pillar 2 questions (Operations) with axis values
- 10 Pillar 3 questions (Rewards) with driver values
- 6 Pillar 4 questions (Ecosystems) with axis values
- The 8 cluster definitions

Write scripts/seed_db.ts that pushes the seed into Supabase. Test
locally against a fresh Supabase project. Add a `pnpm seed` script.

Verify: select count(*) from questions returns 44; select count(*)
from question_options returns the right number per pillar.
```

### Phase 3 — Port scoring engine + tests (1 session)

```
Port the score() function from ../outputs/index.html into
lib/scoring/index.ts as a pure TypeScript function with this signature:

  computeScore(
    answers: Record<string, string>,
    questions: Question[]
  ): CompassResult

Define CompassResult, Question, ClusterCode, ArchetypeName, DriverCode
types in lib/scoring/types.ts.

Write Vitest snapshot tests in lib/scoring/scoring.test.ts that pin
these four persona outputs (taken from CLAUDE.md):

  All-A persona       → top: LAW · Precisionist · Recognition+Mastery
  All-D/B persona     → top: TECH · Catalyst · Impact+Autonomy
  Tech-leaning        → top: TECH · Catalyst · Autonomy+Mastery
  Arts/People-leaning → top: ART · Precisionist · Impact

If any test diverges from the prototype's output, STOP and ask me
before changing the rules.
```

### Phase 4 — Port the assessment UI (1–2 sessions)

```
Port the assessment screens from ../outputs/index.html into Next.js:
- (marketing)/page.tsx        — landing
- (assessment)/start/page.tsx — demographics
- (assessment)/q/[index]/page.tsx — one question per route
- (assessment)/layout.tsx     — progress bar + Kai corner stage

Use Tailwind for layout. Keep the brand exactly: same colors, Outfit +
Fraunces fonts, glassmorphism options, gradient CTAs. Read questions
from Supabase using the active content_version. Anonymous Supabase
session + draft assessment row created on /start.

Server action saveAnswer(assessmentId, questionExternalId, value)
debounced from the client. Server action completeAssessment redirects
to /compass/[id].
```

### Phase 5 — Results page (1 session)

```
Port the Career Compass results UI from ../outputs/index.html into
app/compass/[id]/page.tsx. Server-renders the compass from the
assessment's stored result jsonb. Animate bars + axis dots on mount.

Add a share_token mechanism: the server action that generates the
result also generates a token, surfaced as /share/<token> for
public/anonymous access (server-side fetch with service role).
```

### Phase 6 — Auth + account (1 session)

```
Wire Supabase auth: email magic link + Google + Apple. Use anonymous
sessions for the assessment flow; on the results page, surface a
"Save your Compass" CTA that promotes the anonymous user to a real
identity.

Build /account/page.tsx that lists the user's past assessments and
links to each Compass. Add a sign-out button.
```

### Phase 7 — 3D Kai avatar (1 session)

```
Port the Three.js Kai avatar from ../outputs/index.html into
components/kai/KaiStage.tsx as a react-three-fiber component. Same
Ready Player Me GLB loading, same procedural fallback, same
amplitude-based lip-sync against an <audio> ref.

Add a useKaiStage() hook that exposes mode controls
(landing/corner/hidden) so the assessment routes can drive it. Keep
the audio file URLs identical to the prototype's structure.
```

### Phase 8 — Admin + analytics (1–2 sessions)

```
Build /admin gated by role='admin'. Pages:
- /admin              — overview cards (total assessments, completion rate, top clusters)
- /admin/assessments  — paginated list, filters by date/country/cluster/archetype
- /admin/content      — list versions, edit questions inline, mark-version-active button
- /admin/exports      — CSV download of (anonymized) assessment data

Add PostHog with autocapture + key events: assessment_started,
question_answered, assessment_completed, account_created, share_clicked.
```

### Phase 9 — i18n + Arabic (1 session)

```
Add next-intl with locales en + ar. Route segment is /[locale]/...
Translate UI strings (lib/i18n/messages/{en,ar}.json). Translate the
44 questions + Kai narration lines stored in the database (jsonb keyed
by locale). Set dir="rtl" on the html when locale is 'ar'. Audit all
layouts use logical properties (margin-inline-start, padding-inline,
border-start-radius) — no hard-coded left/right.

Update bake_audio.py to accept --locale and write audio under
audio/<version>/<locale>/. Bake the Arabic narration with voice
'shimmer' (or pick a different voice for Arabic).
```

### Phase 10 — Polish + launch prep (1 session)

```
- OG images for the Compass result page (dynamic via @vercel/og)
- Sitemap + robots.txt
- A privacy policy + terms page
- Error boundaries on every route segment
- Loading states for every async boundary
- Mobile QA: iOS Safari, Chrome Android, lowest-spec test (4-year-old phone)
- A Lighthouse pass: performance ≥90 on mobile
- Production .env validation (zod) on boot — refuse to start without
  required env vars
```

---

## 13. Anti-patterns to avoid

A few places where Claude Code would naturally drift into the wrong shape:

- **Don't put scoring rules in the database.** Cluster mapping per option
  goes in the DB (so admins can edit), but the algorithm that combines
  them stays in code. The DB is data; the rules are code.
- **Don't store computed results denormalized everywhere.** The result
  jsonb on the assessment row is the single canonical computed result.
  Don't cache top_cluster on the row.
- **Don't put the OpenAI API key in any client bundle.** Even via
  environment variables. The bake script is the only thing that ever
  sees it.
- **Don't skip RLS on a "I'll add it later" basis.** Add policies as
  you create tables. Test by running queries with the anon key.
- **Don't cargo-cult Server Components.** Anything that needs interaction
  is a Client Component. Don't sprinkle `'use client'` on giant trees;
  push it as deep as possible.
- **Don't migrate everything to Tailwind in one PR.** Get parity with
  the prototype first using whatever class structure ports cleanest;
  refactor to Tailwind in a separate pass once it works.

---

## 14. What to hand to Claude Code

Three files become the source of truth for the migration:

1. **`ARCHITECTURE.md`** (this document) — checked into the new repo at
   the root. Don't edit it during a session unless an architectural
   decision is being made.
2. **`CLAUDE.md`** — already exists for the prototype. Move it to the
   new repo root and update it once Phase 4 is in. It captures the
   _current state_ and the things that have settled.
3. **`prototype/`** — the existing static files (`index.html`,
   `bake_audio.py`, `audio/`, the `README.md`) copied wholesale into
   the new repo as a frozen reference. Remove after Phase 9.

Your standard kickoff prompt for each phase:

```
Read ARCHITECTURE.md and CLAUDE.md first. Then execute Phase N as
specified in section 12. Stop and ask me ONE focused question whenever
you're unsure. Show me a diff before any non-trivial change. Don't
commit unless I explicitly say so.
```
