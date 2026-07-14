# Supabase setup — connect a project to Tareeq

You do **steps 1–2** (only you can create the project). Then I automate the rest
(schema, seed, admin user, verify) once the keys are in `.env.local`.

---

## Step 1 — Create the project (≈2 min)

1. Go to **https://supabase.com/dashboard** → sign in → **New Project**.
2. Name: `tareeq`. Pick a strong DB password (save it). Region: **Frankfurt
   (eu-central-1)** or the closest to MENA. Plan: **Free** is fine.
3. Wait for it to provision (~1 min).

## Step 2 — Copy the keys into `.env.local`

In the project, open **Settings**:

- **Settings → API**
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`  *(keep secret)*
- **Settings → Database → Connection string → URI** (the "Transaction"/pooler
  one) → `DATABASE_URL`  *(replace `[YOUR-PASSWORD]` with your DB password)*

Paste into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres.xxxx:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

**Then tell me "keys are in" — I'll take it from here.**

---

## Step 3 onward — automated (what I'll run)

Once the keys are present I will:

3. **Apply the schema** — the two migrations create the tables (clusters,
   content_versions, questions, question_options, profiles, user_accounts,
   assessments, assessment_data, user_outcomes, audio_clips):
   ```
   psql "$DATABASE_URL" -f db/migrations/0001_initial_schema.sql
   psql "$DATABASE_URL" -f db/migrations/0002_assessment_data_extensions.sql
   ```
4. **Seed the content** — clusters + the 40-question CORE assessment:
   ```
   pnpm seed
   ```
5. **Create your admin user** + grant the role (via the service-role API), or you
   pick the email/password and I wire `profiles.role = 'admin'`.
6. **Verify** — restart the dev server and confirm `/admin/login` accepts you and
   the dashboard shows live counts.

> RLS hardening (locking tables for the anon key) is a later phase — the public
> app still uses localStorage today, and the admin uses the service-role key, so
> the app works without RLS for now.
