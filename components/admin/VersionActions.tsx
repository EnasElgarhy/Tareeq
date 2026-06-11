"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui/Button";
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

  function onPublish() {
    if (!confirmPublish) {
      setConfirmPublish(true);
      return;
    }
    setConfirmPublish(false);
    setBusy("publish");
    void (async () => {
      try {
        await publishVersion(versionId);
        toast("success", "Published — this version is now live for students.");
        router.refresh();
      } catch (e) {
        toast("error", e instanceof Error ? e.message : "Publish failed");
      }
      setBusy(null);
    })();
  }

  function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setConfirmDelete(false);
    setBusy("delete");
    void (async () => {
      try {
        await deleteDraftVersion(versionId);
        toast("info", "Draft deleted.");
        router.push("/admin/content");
      } catch (e) {
        toast("error", e instanceof Error ? e.message : "Delete failed");
        setBusy(null);
      }
    })();
  }

  return (
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
          {confirmPublish && (
            <span className="text-xs font-semibold text-adm-gold-ink">
              Replaces the live version —
            </span>
          )}
          <Button
            size="sm"
            onClick={onPublish}
            loading={busy === "publish"}
            onBlur={() => setConfirmPublish(false)}
          >
            {confirmPublish ? "Confirm publish" : "Publish"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
            loading={busy === "delete"}
            onBlur={() => setConfirmDelete(false)}
          >
            {confirmDelete ? "Confirm delete" : "Delete"}
          </Button>
        </>
      )}
    </div>
  );
}
