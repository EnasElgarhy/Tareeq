"use client";

import { ArrowUp } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function KaiChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const { t } = useLocale();
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-[18px] border border-[color:var(--day-line-strong)] bg-[color:var(--day-card,#fffcf6)] p-2 shadow-[0_12px_30px_rgba(43,36,28,0.1)]">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("kai.chat.input_placeholder")}
        rows={1}
        className="max-h-24 flex-1 resize-none bg-transparent px-2 py-2 text-[13.5px] text-[color:var(--day-ink,#2a2118)] placeholder:text-[color:var(--day-ink-3,#675d4e)] focus:outline-none"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-[#221248] text-[#FFFCF6] transition hover:bg-[#34205F] disabled:opacity-30"
      >
        <ArrowUp size={16} />
      </button>
    </div>
  );
}
