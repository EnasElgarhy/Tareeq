# Tareeq Admin — one-time setup

The admin app lives at **`/admin`** and is gated by Supabase auth + the
`profiles.role = 'admin'` flag. To get in the first time:

### 1. Env
`.env.local` already needs (you have these):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```
`DATABASE_URL` is only needed later (Phase 1, Drizzle migrations).

### 2. Create an admin user
In the **Supabase dashboard → Authentication → Users → Add user**, create a user
with an email + password (enable "Auto Confirm" so it can sign in immediately).

### 3. Grant the admin role
The app reads the role from the `profiles` table. Run this in the Supabase
**SQL editor** (replace the email), which upserts the profile row with
`role = 'admin'`:

```sql
insert into public.profiles (id, role)
select id, 'admin' from auth.users where email = 'you@example.com'
on conflict (id) do update set role = 'admin';
```

### 4. Sign in
Go to `/admin/login`, sign in with that email + password. You'll land on the
dashboard. Anyone authenticated but **not** an admin is bounced back to the
login with a notice.

---

**Security notes**
- `middleware.ts` runs only on `/admin/*` (the public app is untouched).
- The role check uses the service-role client (server-only); the key is never
  exposed to the browser.
- To add more admins later, repeat step 3 (a Users screen lands in Phase 4).
