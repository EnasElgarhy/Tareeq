import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import {
  InviteScreen,
  type InviteOutcome,
} from "@/components/report-access/InviteScreen";
import { redeemInvite } from "@/app/api/report-access/_lib/redeem";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

/**
 * The destination behind an admin free-access link (`/invite/<token>`).
 *
 * Redemption happens inline, server-side, for the signed-in student the
 * invite was minted for. Signed-out visitors get a sign-in prompt and reopen
 * the same link afterwards — the single-use invite is only consumed on a
 * successful authenticated redeem, never by opening the page anonymously.
 */
export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  // 32 raw bytes render as 43 base64url chars; accept a small margin rather
  // than the exact length so future token sizes keep working.
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) {
    return (
      <LocaleProvider>
        <InviteScreen outcome={{ state: "invalid" }} />
      </LocaleProvider>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <LocaleProvider>
        <InviteScreen outcome={{ state: "signin" }} />
      </LocaleProvider>
    );
  }

  const admin = createSupabaseAdminClient();
  const result = await redeemInvite(admin, user.id, token, user.email ?? null);

  // `already_redeemed` reaches this screen only with the exact token minted
  // for this user (anything foreign reads as `invalid_token` inside the
  // function), so it means "previously claimed" — point at the report.
  // `assessment_incomplete` means an email invite claimed before finishing:
  // the invite stays pending, so coming back after completion succeeds.
  let outcome: InviteOutcome;
  if (result.ok) {
    outcome = { state: "claimed", alreadyOwned: result.alreadyOwned };
  } else if (result.code === "invite_expired") {
    outcome = { state: "expired" };
  } else if (result.code === "already_redeemed") {
    outcome = { state: "redeemed" };
  } else if (result.code === "assessment_incomplete") {
    outcome = { state: "notready" };
  } else if (result.code === "payment_required") {
    outcome = {
      state: "pay",
      hasReport: result.assessmentId != null,
    };
  } else {
    outcome = { state: "invalid" };
  }

  return (
    <LocaleProvider>
      <InviteScreen outcome={outcome} />
    </LocaleProvider>
  );
}
