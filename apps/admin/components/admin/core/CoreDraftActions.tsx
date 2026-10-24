"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { useToast } from "@/components/admin/ui/Toast";
import {
  deleteCoreDraft,
  markCoreDraftHandedOff,
} from "@/lib/admin/core/draft-actions";
import type { CoreQuestionSetDoc } from "@/lib/admin/core/framework";

/** Download, hand off and delete controls for a CORE wording draft. */
export function CoreDraftActions({
  draftId,
  body,
  isDraft,
  hasProblems,
}: {
  draftId: string;
  body: CoreQuestionSetDoc;
  isDraft: boolean;
  hasProblems: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, setConfirm] = useState<"handoff" | "delete" | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  function handleDownload() {
    const blob = new Blob([`${JSON.stringify(body, null, 1)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `questions-${body.version}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function run(action: "handoff" | "delete") {
    setConfirm(null);
    setIsBusy(true);
    try {
      if (action === "handoff") {
        await markCoreDraftHandedOff(draftId);
        toast("success", "Draft frozen and marked as handed off.");
        router.refresh();
      } else {
        await deleteCoreDraft(draftId);
        router.push("/admin/content/core");
        return;
      }
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Action failed.");
    }
    setIsBusy(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        disabled={hasProblems}
      >
        Download JSON
      </Button>
      {isDraft ? (
        <>
          <Button
            size="sm"
            loading={isBusy}
            disabled={hasProblems}
            onClick={() => setConfirm("handoff")}
          >
            Mark handed off
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirm("delete")}
          >
            Delete
          </Button>
        </>
      ) : null}
      <ConfirmDialog
        open={confirm === "handoff"}
        title="Hand this draft off?"
        description="The draft becomes read-only. Students only see it once the developer ships the downloaded file as the next question set."
        confirmLabel="Mark handed off"
        onConfirm={() => run("handoff")}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="Delete this draft?"
        description="Its wording edits are lost. The live question set is not affected."
        confirmLabel="Delete draft"
        variant="danger"
        onConfirm={() => run("delete")}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
