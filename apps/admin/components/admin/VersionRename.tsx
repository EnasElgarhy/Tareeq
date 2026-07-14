"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { Input } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { renameVersion } from "@/lib/admin/content-actions";

export function VersionRename({
  versionId,
  label,
  isActive,
  editable,
}: {
  versionId: string;
  label: string;
  isActive: boolean;
  editable: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);

  async function commit(value: string) {
    const next = value.trim();
    setEditing(false);
    if (!next || next === label) return;
    try {
      await renameVersion(versionId, next);
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Rename failed");
    }
  }

  if (editing && editable) {
    return (
      <Input
        autoFocus
        aria-label="Version name"
        defaultValue={label}
        className="max-w-md font-jakarta text-xl font-bold not-italic"
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      {label}
      <StatusBadge status={isActive ? "published" : "draft"} />
      {editable && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Rename version"
          className="rounded-adm-sm p-1 text-adm-ink-muted transition-colors duration-adm-fast hover:bg-adm-sand hover:text-adm-violet"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
