"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { attributionFromCookieHeader } from "@/lib/analytics/attribution";
import { childInviteUrl, whatsappShareUrl } from "@/lib/analytics/child-invite";
import { trackEvent } from "@/lib/analytics/track";

/**
 * "Send CORE to your child" (For parents page): opens WhatsApp with the
 * ready-made message and a start link carrying the parent's source labels.
 * The link is built on click, so it reads the cookie as it is then.
 */
export function SendToChildButton({ className, placement }: { className?: string; placement: string }) {
  const { t } = useLocale();

  function send() {
    const link = childInviteUrl(window.location.origin, attributionFromCookieHeader(document.cookie));
    trackEvent("child_invite_shared", { placement });
    window.open(whatsappShareUrl(t("parents.send_child.message"), link), "_blank", "noopener,noreferrer");
  }

  return (
    <button type="button" onClick={send} className={className}>
      {t("parents.send_child.cta")}
    </button>
  );
}
