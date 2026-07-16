import { UserAvatar } from "@/components/kai/chat/UserAvatar";
import type { KaiChatRole } from "@/lib/kai/chat-types";
import { stripMarkdown } from "@/lib/kai/repair";

/**
 * Message text. The user's turn is a compact right-aligned bubble. Kai's turn
 * is NOT a bubble — it flows as a premium mentor note (paragraphs, generous
 * line-height, no border), because Kai's reply reads as a single article-like
 * answer surface. The avatar + name sit once at the top of that surface (in
 * KaiChatScreen), never on every fragment.
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
  if (role !== "user") {
    // Server-side repair already strips markdown; defensive second pass.
    // Split on blank lines into real paragraphs for article rhythm.
    const paragraphs = stripMarkdown(text)
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    return (
      <div className="grid gap-2.5">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-[14px] leading-[1.65] text-[color:var(--day-ink,#2a2118)]">
            {para}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end justify-end gap-2">
      <p className="max-w-[78vw] rounded-[18px] rounded-ee-[6px] bg-[#221248] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#FFFCF6] shadow-[0_8px_20px_rgba(34,18,72,0.14)] sm:max-w-[300px]">
        {text}
      </p>
      <UserAvatar name={userName} size={24} />
    </div>
  );
}
