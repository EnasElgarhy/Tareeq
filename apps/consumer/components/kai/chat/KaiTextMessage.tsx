import { useLocale } from "@/components/i18n/LocaleProvider";
import { UserAvatar } from "@/components/kai/chat/UserAvatar";
import type { KaiChatRole } from "@/lib/kai/chat-types";
import { stripMarkdown } from "@/lib/kai/repair";

/**
 * Every bubble carries a visible identity now, not just left/right
 * alignment — a "Kai" label + avatar on her messages, the user's own
 * (generated, until photo upload exists) avatar on theirs. Scrolling a
 * long conversation should never leave it ambiguous who said what.
 */
export function KaiTextMessage({
  role,
  text,
  userName,
}: {
  role: KaiChatRole;
  text: string;
  userName: string;
}) {
  const { t } = useLocale();
  const isUser = role === "user";

  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-carbon">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny avatar, not worth next/image's overhead here */}
          <img src="/kai/kai-poster.png" alt="" className="h-full w-full object-cover" />
        </span>
      ) : null}

      <div className={`flex min-w-0 flex-col gap-0.5 ${isUser ? "items-end" : "items-start"}`}>
        {!isUser ? (
          <span className="ps-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em] text-[color:var(--day-ink-3,#675d4e)]">
            {t("profile.tab.kai")}
          </span>
        ) : null}
        <p
          className={`max-w-[78vw] rounded-[18px] px-3.5 py-2.5 text-[13.5px] leading-relaxed sm:max-w-[280px] ${
            isUser
              ? "rounded-ee-[6px] bg-carbon text-sand"
              : "rounded-ss-[6px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] text-[color:var(--day-ink-2,#5c5142)] shadow-[0_6px_16px_rgba(43,36,28,0.05)]"
          }`}
        >
          {/* Server-side repair already strips markdown from Gemini's
              text (see lib/kai/repair.ts) — this is a second, defensive
              pass for user-authored text and anything that slips through,
              so a stray "**word**" never renders literally. */}
          {isUser ? text : stripMarkdown(text)}
        </p>
      </div>

      {isUser ? <UserAvatar name={userName} size={24} /> : null}
    </div>
  );
}
