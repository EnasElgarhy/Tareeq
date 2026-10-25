import type { Metadata } from "next";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import {
  ParentPayScreen,
  type ParentPayOutcome,
} from "@/components/parent-pay/ParentPayScreen";
import { findActiveEntitlement } from "@/app/api/payments/_lib/entitlements";
import {
  PARENT_LINKS_TABLE,
  findParentLinkByToken,
  isParentLinkTokenShape,
  parentLinkState,
} from "@/app/api/payments/_lib/parent-links";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unlock a CORE report · Map My CORE",
  // A private payment link: never indexed, never previewed with a referrer.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

interface PayPageProps {
  params: Promise<{ token: string }>;
}

/**
 * The page behind an ask-a-parent link (`/pay/<token>`). The parent is not
 * signed in; the token alone decides what this page can do, and nothing on it
 * identifies the student.
 */
export default async function PayPage({ params }: PayPageProps) {
  const { token } = await params;
  const outcome = await resolveOutcome(token);
  return (
    <LocaleProvider>
      <ParentPayScreen token={token} outcome={outcome} />
    </LocaleProvider>
  );
}

async function resolveOutcome(token: string): Promise<ParentPayOutcome> {
  if (!isParentLinkTokenShape(token)) return "invalid";

  const admin = createSupabaseAdminClient();
  const lookup = await findParentLinkByToken(admin, token);
  if (!lookup.ok) {
    console.error("[pay] Link lookup failed", lookup.message);
    return "invalid";
  }
  const link = lookup.link;
  if (!link) return "invalid";

  const state = parentLinkState(link);
  if (state !== "pending") return state;

  // The student may have paid themselves since sending the link.
  const owned = await findActiveEntitlement(admin, link.user_id, link.assessment_id);
  if (owned.ok && owned.entitlement) return "paid";

  if (!link.opened_at) {
    // Feeds "Your parent opens it" on the student's waiting screen. Best
    // effort: a failed write must not stop the parent from paying.
    const opened = await admin
      .from(PARENT_LINKS_TABLE)
      .update({ opened_at: new Date().toISOString() })
      .eq("id", link.id)
      .is("opened_at", null);
    if (opened.error) console.error("[pay] Recording opened_at failed", opened.error);
  }
  return "ready";
}
