"use client";

import { useActionState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { InlineStatus } from "@/components/admin/ui/Toast";
import {
  type UploadState,
  uploadSubjectGuide,
} from "@/lib/admin/core/subject-guide-actions";

/** Pick the platform JSON and replace the guide Kai reads. */
export function SubjectGuideUpload() {
  const [state, action, pending] = useActionState<UploadState, FormData>(
    uploadSubjectGuide,
    {
      kind: "idle",
    },
  );
  return (
    <form
      action={action}
      className="space-y-3"
      aria-label="Upload a new subject guide"
    >
      <label
        className="block text-[13px] font-semibold text-adm-ink"
        htmlFor="subject-guide-file"
      >
        New guide file (the platform JSON, not the Word file)
      </label>
      <input
        id="subject-guide-file"
        name="file"
        type="file"
        accept="application/json,.json"
        required
        className="block w-full rounded-adm-md border border-adm-line bg-adm-card p-2 text-[13px] text-adm-ink file:me-3 file:rounded-adm-sm file:border-0 file:bg-adm-sand file:px-3 file:py-1.5 file:text-[13px] file:font-semibold file:text-adm-ink"
      />
      <p className="text-[12px] text-adm-ink-muted">
        It is checked before saving. Kai starts using it within five minutes.
      </p>
      {state.kind === "error" ? (
        <InlineStatus kind="error">{state.message}</InlineStatus>
      ) : null}
      {state.kind === "saved" ? (
        <InlineStatus kind="success">
          Saved. Kai will use version {state.version}.
        </InlineStatus>
      ) : null}
      <Button type="submit" loading={pending}>
        {pending ? "Checking and saving…" : "Upload and replace"}
      </Button>
    </form>
  );
}
