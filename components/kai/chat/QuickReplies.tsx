import { SuggestionChip } from "@/components/kai/chat/SuggestionChip";

/** Every Kai turn ends with these — never leaves the user at a blank
 * text box wondering what to say next. */
export function QuickReplies({
  replies,
  onSelect,
}: {
  replies: string[];
  onSelect: (reply: string) => void;
}) {
  if (replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 ps-1">
      {replies.map((reply) => (
        <SuggestionChip key={reply} label={reply} onSelect={() => onSelect(reply)} />
      ))}
    </div>
  );
}
