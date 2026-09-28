"use client";

import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Input, Label } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import type { AssessmentCategory } from "@/lib/admin/custom-content";
import {
  addAssessmentCategory,
  deleteAssessmentCategory,
} from "@/lib/admin/custom-question-actions";

interface Props {
  catalogId: string;
  categories: AssessmentCategory[];
}

export function CustomCategoriesPanel({ catalogId, categories }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(categories.length === 0);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function add() {
    if (!code.trim() || !nameEn.trim()) {
      toast("error", "A category needs a code and an English name.");
      return;
    }
    setBusy(true);
    try {
      await addAssessmentCategory(catalogId, { code, nameEn, nameAr });
      setCode("");
      setNameEn("");
      setNameAr("");
      setAdding(false);
      toast("success", "Category added.");
      router.refresh();
    } catch (e) {
      toast(
        "error",
        e instanceof Error ? e.message : "Could not add category.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, label: string) {
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    setBusy(true);
    try {
      await deleteAssessmentCategory(id);
      toast("success", `Category ${label} removed.`);
      router.refresh();
    } catch (e) {
      toast(
        "error",
        e instanceof Error ? e.message : "Could not remove category.",
      );
    } finally {
      setBusy(false);
      setConfirmingId(null);
    }
  }

  return (
    <section className="mb-8 rounded-adm-lg border border-adm-line-strong bg-adm-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-adm-ink">Result categories</h2>
          <p className="mt-1 text-[13px] text-adm-ink-muted">
            Create the directions an answer can support. You will connect each
            one to a student-facing result below.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={adding ? "ghost" : "primary"}
          onClick={() => setAdding((value) => !value)}
        >
          {adding ? (
            <X className="size-3.5" aria-hidden="true" />
          ) : (
            <Plus className="size-3.5" aria-hidden="true" />
          )}
          {adding ? "Close" : "Add category"}
        </Button>
      </div>

      {categories.length > 0 ? (
        <ul className="mb-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-2 rounded-full border border-adm-line bg-adm-sand px-3 py-1"
            >
              <span className="text-[12px] font-bold text-adm-ink">
                {c.code}
              </span>
              {c.name.en ? (
                <span className="text-[12px] text-adm-ink-muted">
                  {c.name.en}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => remove(c.id, c.code)}
                disabled={busy}
                className={`grid min-h-8 min-w-8 place-items-center rounded-full transition-colors ${
                  confirmingId === c.id
                    ? "bg-adm-error/10 px-2 text-[11px] font-bold text-adm-error-ink"
                    : "text-adm-ink-faint hover:bg-adm-error/10 hover:text-adm-error-ink"
                }`}
                aria-label={
                  confirmingId === c.id
                    ? `Confirm removal of category ${c.code}`
                    : `Remove category ${c.code}`
                }
                title={
                  confirmingId === c.id
                    ? "Click again to confirm"
                    : "Remove category"
                }
              >
                {confirmingId === c.id ? (
                  "Confirm"
                ) : (
                  <Trash2 className="size-3.5" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-[13px] text-adm-ink-faint">
          No categories yet — add at least one before scoring answers.
        </p>
      )}

      {adding ? (
        <div className="grid gap-3 border-t border-adm-line pt-4 sm:grid-cols-[120px_1fr_1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="cat-code">Code</Label>
            <Input
              id="cat-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="LEAD"
              maxLength={24}
            />
          </div>
          <div>
            <Label htmlFor="cat-en">Name (English)</Label>
            <Input
              id="cat-en"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Leadership"
              maxLength={80}
            />
          </div>
          <div>
            <Label htmlFor="cat-ar">Name (العربية)</Label>
            <Input
              id="cat-ar"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="القيادة"
              maxLength={80}
              dir="rtl"
            />
          </div>
          <Button type="button" onClick={add} loading={busy}>
            Add
          </Button>
        </div>
      ) : null}
    </section>
  );
}
