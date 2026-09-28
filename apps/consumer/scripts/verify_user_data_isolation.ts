import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CheckName =
  | "owner_can_read_own_assessment"
  | "other_user_cannot_read_assessment"
  | "other_user_cannot_update_assessment"
  | "other_user_cannot_insert_for_owner"
  | "owner_can_read_own_profile"
  | "other_user_cannot_read_profile"
  | "other_user_cannot_update_profile"
  | "owner_can_read_own_kai_thread"
  | "other_user_cannot_read_kai_thread"
  | "other_user_cannot_update_kai_thread"
  | "other_user_cannot_write_to_kai_thread";

type TestUser = {
  id: string;
  client: SupabaseClient;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function assertNoError(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

async function createTestUser(
  admin: SupabaseClient,
  supabaseUrl: string,
  anonKey: string,
  label: string,
): Promise<TestUser> {
  const email = `m2-isolation-${label}-${Date.now()}-${randomUUID()}@example.com`;
  const password = `M2-${randomUUID()}-9a!`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (created.error || !created.data.user) {
    throw new Error(
      created.error?.message ?? `Could not create disposable user ${label}.`,
    );
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error) {
    throw new Error(
      `Could not sign in disposable user ${label}: ${signedIn.error.message}`,
    );
  }

  return {
    id: created.data.user.id,
    client,
  };
}

async function main() {
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const users: TestUser[] = [];
  let assessmentId: string | null = null;
  let threadId: string | null = null;
  const checks = {} as Record<CheckName, boolean>;
  let checksPassed = false;
  let cleanupComplete = true;

  try {
    const owner = await createTestUser(
      admin,
      supabaseUrl,
      anonKey,
      "owner",
    );
    users.push(owner);
    const other = await createTestUser(
      admin,
      supabaseUrl,
      anonKey,
      "other",
    );
    users.push(other);

    const version = await admin
      .from("content_versions")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    assertNoError(version.error, "Could not resolve active content version");
    if (!version.data?.id) {
      throw new Error("No active content version exists.");
    }

    const insertedAssessment = await owner.client
      .from("assessments")
      .insert({
        user_id: owner.id,
        version_id: version.data.id,
        locale: "en",
        answers: { acceptance_probe: "owner-only" },
        result: { acceptance_probe: true },
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    assertNoError(
      insertedAssessment.error,
      "Owner could not create assessment fixture",
    );
    assessmentId = insertedAssessment.data?.id ?? null;
    if (!assessmentId) throw new Error("Assessment fixture has no ID.");

    const ownerAssessmentRead = await owner.client
      .from("assessments")
      .select("id")
      .eq("id", assessmentId)
      .maybeSingle();
    assertNoError(ownerAssessmentRead.error, "Owner assessment read failed");
    checks.owner_can_read_own_assessment =
      ownerAssessmentRead.data?.id === assessmentId;

    const otherAssessmentRead = await other.client
      .from("assessments")
      .select("id")
      .eq("id", assessmentId);
    assertNoError(
      otherAssessmentRead.error,
      "Cross-user assessment read returned an unexpected backend error",
    );
    checks.other_user_cannot_read_assessment =
      otherAssessmentRead.data?.length === 0;

    const otherAssessmentUpdate = await other.client
      .from("assessments")
      .update({ locale: "ar" })
      .eq("id", assessmentId)
      .select("id");
    assertNoError(
      otherAssessmentUpdate.error,
      "Cross-user assessment update returned an unexpected backend error",
    );
    const assessmentAfterUpdate = await admin
      .from("assessments")
      .select("locale")
      .eq("id", assessmentId)
      .single();
    assertNoError(
      assessmentAfterUpdate.error,
      "Could not verify assessment after blocked update",
    );
    checks.other_user_cannot_update_assessment =
      otherAssessmentUpdate.data?.length === 0 &&
      assessmentAfterUpdate.data?.locale === "en";

    const otherAssessmentInsert = await other.client
      .from("assessments")
      .insert({
        user_id: owner.id,
        version_id: version.data.id,
        locale: "en",
      });
    checks.other_user_cannot_insert_for_owner = Boolean(
      otherAssessmentInsert.error,
    );

    const ownerProfileRead = await owner.client
      .from("profiles")
      .select("id")
      .eq("id", owner.id)
      .maybeSingle();
    assertNoError(ownerProfileRead.error, "Owner profile read failed");
    checks.owner_can_read_own_profile = ownerProfileRead.data?.id === owner.id;

    const otherProfileRead = await other.client
      .from("profiles")
      .select("id")
      .eq("id", owner.id);
    assertNoError(
      otherProfileRead.error,
      "Cross-user profile read returned an unexpected backend error",
    );
    checks.other_user_cannot_read_profile =
      otherProfileRead.data?.length === 0;

    const otherProfileUpdate = await other.client
      .from("profiles")
      .update({ display_name: "isolation-violation" })
      .eq("id", owner.id)
      .select("id");
    assertNoError(
      otherProfileUpdate.error,
      "Cross-user profile update returned an unexpected backend error",
    );
    const profileAfterUpdate = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", owner.id)
      .single();
    assertNoError(
      profileAfterUpdate.error,
      "Could not verify profile after blocked update",
    );
    checks.other_user_cannot_update_profile =
      otherProfileUpdate.data?.length === 0 &&
      profileAfterUpdate.data?.display_name !== "isolation-violation";

    threadId = randomUUID();
    const insertedThread = await owner.client.from("kai_threads").insert({
      id: threadId,
      user_id: owner.id,
      assessment_id: assessmentId,
      goal: "explain_results",
      title: "Milestone 2 isolation fixture",
    });
    assertNoError(insertedThread.error, "Owner could not create Kai thread");

    const ownerThreadRead = await owner.client
      .from("kai_threads")
      .select("id")
      .eq("id", threadId)
      .maybeSingle();
    assertNoError(ownerThreadRead.error, "Owner Kai thread read failed");
    checks.owner_can_read_own_kai_thread =
      ownerThreadRead.data?.id === threadId;

    const otherThreadRead = await other.client
      .from("kai_threads")
      .select("id")
      .eq("id", threadId);
    assertNoError(
      otherThreadRead.error,
      "Cross-user Kai thread read returned an unexpected backend error",
    );
    checks.other_user_cannot_read_kai_thread =
      otherThreadRead.data?.length === 0;

    const otherThreadUpdate = await other.client
      .from("kai_threads")
      .update({ title: "isolation-violation" })
      .eq("id", threadId)
      .select("id");
    assertNoError(
      otherThreadUpdate.error,
      "Cross-user Kai thread update returned an unexpected backend error",
    );
    const threadAfterUpdate = await admin
      .from("kai_threads")
      .select("title")
      .eq("id", threadId)
      .single();
    assertNoError(
      threadAfterUpdate.error,
      "Could not verify Kai thread after blocked update",
    );
    checks.other_user_cannot_update_kai_thread =
      otherThreadUpdate.data?.length === 0 &&
      threadAfterUpdate.data?.title === "Milestone 2 isolation fixture";

    const otherMessageInsert = await other.client.from("kai_messages").insert({
      id: randomUUID(),
      thread_id: threadId,
      user_id: other.id,
      request_id: randomUUID(),
      role: "user",
      status: "complete",
      text: "isolation-violation",
    });
    checks.other_user_cannot_write_to_kai_thread = Boolean(
      otherMessageInsert.error,
    );

    checksPassed = Object.values(checks).every(Boolean);
  } finally {
    if (threadId) {
      const deletedThread = await admin
        .from("kai_threads")
        .delete()
        .eq("id", threadId);
      if (deletedThread.error) {
        cleanupComplete = false;
        console.warn(
          `Cleanup warning for Kai thread: ${deletedThread.error.message}`,
        );
      }
    }
    if (assessmentId) {
      const deletedAssessment = await admin
        .from("assessments")
        .delete()
        .eq("id", assessmentId);
      if (deletedAssessment.error) {
        cleanupComplete = false;
        console.warn(
          `Cleanup warning for assessment: ${deletedAssessment.error.message}`,
        );
      }
    }
    for (const user of users.reverse()) {
      await user.client.auth.signOut();
      const deletedUser = await admin.auth.admin.deleteUser(user.id);
      if (deletedUser.error) {
        cleanupComplete = false;
        console.warn(`Cleanup warning for user: ${deletedUser.error.message}`);
      }
    }
  }

  const passed = checksPassed && cleanupComplete;
  console.info(
    JSON.stringify(
      {
        result: passed ? "PASS" : "FAIL",
        checks,
        cleanup: cleanupComplete ? "complete" : "incomplete",
      },
      null,
      2,
    ),
  );
  if (!passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
