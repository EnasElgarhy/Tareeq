import { readFileSync } from "node:fs";
import path from "node:path";
import type { Page, Request } from "@playwright/test";
import {
  localeStorageKey,
  makeResultRegistration,
  makeUnlockedAccess,
  reportAccessStoragePrefix,
  resultRegistrationStorageKey,
} from "./report";

/**
 * A signed-in student with a CORE 2.0 result, for driving the app without a
 * real Supabase account. Every request to Supabase is answered here, so a
 * test never reaches the live project: auth returns a fake user, REST reads
 * return nothing. Server routes that need a real session (/api/kai/chat,
 * /api/payments/entitlement) are stubbed by the test that uses them.
 */

export const coreResultStorageKey = "tareeq.core.result.v2";
export const assessmentStorageKey = "tareeq.assessment.v4";
export const CORE_GENERATED_AT = "2026-10-18T09:00:00.000Z";
export const E2E_EMAIL = "sara@example.com";

/** Case 01 of CORE_08_Test_Cases.json (clear, single curiosity), as the platform stores it. */
export const CORE_CASE_01_RESULT = {
  scoringVersion: "2.0",
  curiosityCounts: { RD: 8, IE: 1, PW: 2, EI: 0, PE: 0, TS: 3, IR: 1, AE: 1 },
  leadingCuriosities: ["RD"],
  directionClarity: "clear",
  margin: 5,
  circleReading: "single",
  motivatorCounts: { REC: 2, IMP: 6, MAS: 5, AUT: 0, SEC: 1, INC: 0, FAM: 0, LIF: 0 },
  leadingMotivators: ["IMP", "MAS"],
  noSmallSet: false,
  topTwoMotivators: ["IMP", "MAS"],
  axes: {
    structure: { count: 4, zone: 1, lean: "S" },
    focus: { count: 4, zone: 1, lean: "D" },
    team: { count: 1, zone: 3, lean: "O" },
    setting: { count: 4, zone: 3, lean: "CH" },
  },
  leadingShare: 100,
};

function supabaseProjectRef(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url =
    fromEnv ??
    readFileSync(path.join(__dirname, "../../.env.local"), "utf8").match(
      /^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m,
    )?.[1];
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is needed to name the auth cookie");
  return new URL(url.trim()).hostname.split(".")[0];
}

const base64url = (value: string) => Buffer.from(value).toString("base64url");

const fakeUser = {
  id: "00000000-0000-4000-8000-0000000000e2",
  aud: "authenticated",
  role: "authenticated",
  email: E2E_EMAIL,
  app_metadata: { provider: "email" },
  user_metadata: { display_name: "Sara" },
  created_at: "2026-10-01T00:00:00.000Z",
};

function fakeSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600 * 24;
  const accessToken = [
    base64url(JSON.stringify({ alg: "HS256", typ: "JWT" })),
    base64url(JSON.stringify({ sub: fakeUser.id, email: E2E_EMAIL, role: "authenticated", exp: expiresAt })),
    "e2e",
  ].join(".");
  return {
    access_token: accessToken,
    refresh_token: "e2e-refresh",
    token_type: "bearer",
    expires_in: 3600 * 24,
    expires_at: expiresAt,
    user: fakeUser,
  };
}

/**
 * Answers every Supabase call in the browser: the email code is always
 * accepted, auth returns the fake user, REST reads return nothing. Records
 * the email each code was sent to.
 */
export async function mockSupabase(page: Page) {
  const codesSentTo: string[] = [];
  const json = (body: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  await page.route(/\.supabase\.co\//, async (route) => {
    const url = route.request().url();
    if (url.includes("/auth/v1/otp")) {
      codesSentTo.push((route.request().postDataJSON() as { email?: string }).email ?? "");
      return route.fulfill(json({}));
    }
    if (url.includes("/auth/v1/verify") || url.includes("/auth/v1/token")) {
      return route.fulfill(json(fakeSession()));
    }
    if (url.includes("/auth/v1/user")) return route.fulfill(json(fakeUser));
    if (url.includes("/auth/v1/logout")) return route.fulfill({ status: 204 });
    return route.fulfill(json([]));
  });
  await page.route("**/api/analytics/**", (route) => route.fulfill({ status: 204 }));
  return { codesSentTo };
}

/** A student who is already signed in: Supabase mocked plus the session cookie. */
export async function signInFakeStudent(page: Page) {
  await mockSupabase(page);
  await page.context().addCookies([
    {
      name: `sb-${supabaseProjectRef()}-auth-token`,
      value: `base64-${base64url(JSON.stringify(fakeSession()))}`,
      url: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    },
  ]);
}

/** The device state a student has after finishing CORE and paying for the report. */
export async function seedCoreStudent(page: Page, locale: "en" | "ar" = "en") {
  await page.addInitScript(
    ({ keys, result, generatedAt, registration, access, selectedLocale }) => {
      window.localStorage.setItem(keys.locale, selectedLocale);
      window.localStorage.setItem("tareeq:sound", "off");
      window.localStorage.setItem(keys.registration, JSON.stringify(registration));
      window.localStorage.setItem(keys.core, JSON.stringify({ generatedAt, result, isFlagged: false }));
      window.localStorage.setItem(`${keys.accessPrefix}${access.reportId}`, JSON.stringify(access));
      window.localStorage.setItem(
        keys.assessment,
        JSON.stringify({
          assessmentId: "e2e-core-attempt",
          versionId: null,
          versionLabel: "core-5.1-interim-2026-10-15",
          answers: { QD1: "B", QD2: "Jordan", QD3: "A", QD4: "A" },
          currentIndex: 49,
          startedAt: generatedAt,
          updatedAt: generatedAt,
          completedAt: generatedAt,
          coreResult: result,
        }),
      );
    },
    {
      keys: {
        locale: localeStorageKey,
        registration: resultRegistrationStorageKey,
        core: coreResultStorageKey,
        assessment: assessmentStorageKey,
        accessPrefix: reportAccessStoragePrefix,
      },
      result: CORE_CASE_01_RESULT,
      generatedAt: CORE_GENERATED_AT,
      registration: makeResultRegistration({ email: E2E_EMAIL }),
      access: makeUnlockedAccess(CORE_GENERATED_AT),
      selectedLocale: locale,
    },
  );
  await page.route("**/api/payments/entitlement*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "active", unlockedAt: CORE_GENERATED_AT }),
    }),
  );
}

/** Stubs Kai's chat route with one streamed reply and records every request. */
export async function stubKaiChat(page: Page, replyText = "That's a great place to start. What drew you to it?") {
  const requests: Array<Record<string, unknown>> = [];
  await page.route("**/api/kai/threads*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ threads: [] }) }),
  );
  await page.route("**/api/kai/chat", async (route) => {
    const request: Request = route.request();
    requests.push(request.postDataJSON() as Record<string, unknown>);
    const complete = {
      type: "complete",
      data: {
        message: {
          id: `kai-e2e-${requests.length}`,
          role: "kai",
          createdAt: new Date().toISOString(),
          text: replyText,
        },
        summary: "",
        source: "gemini",
        timings: { modelMs: 1, totalMs: 1, attempts: 1 },
      },
    };
    await route.fulfill({
      status: 200,
      contentType: "application/x-ndjson; charset=utf-8",
      body: `${JSON.stringify({ type: "text", text: replyText })}\n${JSON.stringify(complete)}\n`,
    });
  });
  return requests;
}
