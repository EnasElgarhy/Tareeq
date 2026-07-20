"use client";

import { useState } from "react";

/** Small copy-to-clipboard control for the user ID on the detail header. */
export function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(id).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-adm-md border border-adm-line bg-adm-sand px-2 py-1 font-mono text-[11px] text-adm-ink-muted transition hover:border-adm-violet hover:text-adm-violet"
      title="Copy user ID"
    >
      {id.slice(0, 8)}… {copied ? "✓ copied" : "⧉"}
    </button>
  );
}
