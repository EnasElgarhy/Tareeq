/**
 * Provision an admin user for the Tareeq admin app and verify sign-in.
 *   ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=secret node_modules/.bin/tsx scripts/create_admin.mts
 * Both default if omitted (a strong password is generated + printed once).
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path: string) {
  const full = resolve(path);
  if (!existsSync(full)) return;
  for (const line of readFileSync(full, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const email = process.env.ADMIN_EMAIL || "ahmedwahbn22@gmail.com";
const password = process.env.ADMIN_PASSWORD || randomBytes(9).toString("base64url");

const admin = createClient(url, svc, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Create (or reuse) the auth user.
let userId: string | undefined;
const created = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (created.error) {
  // Likely already registered — find them and reset the password.
  const list = await admin.auth.admin.listUsers();
  const existing = list.data.users.find((u) => u.email === email);
  if (!existing) {
    console.error("create failed:", created.error.message);
    process.exit(1);
  }
  userId = existing.id;
  await admin.auth.admin.updateUserById(userId, { password });
  console.log("reused existing user", email);
} else {
  userId = created.data.user.id;
  console.log("created user", email);
}

// Grant the admin role.
const profile = await admin
  .from("profiles")
  .upsert({ id: userId, role: "admin" }, { onConflict: "id" });
if (profile.error) {
  console.error("profiles upsert failed:", profile.error.message);
  process.exit(1);
}
console.log("granted role=admin");

// Prove the full sign-in path works with the public anon key.
const pub = createClient(url, anon);
const signIn = await pub.auth.signInWithPassword({ email, password });
console.log(
  "sign-in check:",
  signIn.error ? `FAILED — ${signIn.error.message}` : "OK ✓",
);

console.log("\n--- ADMIN CREDENTIALS (change the password after first login) ---");
console.log("email:   ", email);
console.log("password:", password);
