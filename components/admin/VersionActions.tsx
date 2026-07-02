"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { useToast } from "@/components/admin/ui/Toast";
import {
  createDraftFromVersion,
  deleteDraftVersion,
  publishVersion,
} from "@/lib/admin/content-actions";

/** Clone / publish / delete controls for a version header. */
export function VersionActions({
  versionId,
  isActive,
}: {
  versionId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<"clone" | "publish" | "delete" | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function onClone() {
    setBusy("clone");
    try {
      const id = await createDraftFromVersion(versionId);
      toast("success", "Cloned into a new draft.");
      router.push(`/admin/content/${id}`);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Clone failed");
      setBusy(null);
    }
  }

  async function doPublish() {
    setConfirmPublish(false);
    setBusy("publish");
    try {
      await publishVersion(versionId);
      toast("success", "Published — this version is now live for students.");
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Publish failed");
    }
    setBusy(null);
  }

  async function doDelete() {
    setConfirmDelete(false);
    setBusy("delete");
    try {
      await deleteDraftVersion(versionId);
      toast("info", "Draft deleted.");
      router.push("/admin/content");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Delete failed");
      setBusy(null);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClone}
          loading={busy === "clone"}
        >
          Clone to draft
        </Button>

        {!isActive && (
          <>
            <Button
              size="sm"
              onClick={() => setConfirmPublish(true)}
              loading={busy === "publish"}
            >
              Publish
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              loading={busy === "delete"}
            >
              Delete
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmPublish}
        title="Publish this version?"
        description="This will replace the current live version. Students will see the new content immediately."
        confirmLabel="Publish"
        onConfirm={doPublish}
        onCancel={() => setConfirmPublish(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this draft?"
        description="This permanently removes all questions and options in this draft. It can't be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
