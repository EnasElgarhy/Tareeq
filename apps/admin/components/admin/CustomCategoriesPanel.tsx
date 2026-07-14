"use client";

import { useRouter } from "next/navigation";
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
      toast("success", "Category added.");
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not add category.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, label: string) {
    setBusy(true);
    try {
      await deleteAssessmentCategory(id);
      toast("success", `Category ${label} removed.`);
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not remove category.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-8 rounded-adm-lg border border-adm-line-strong bg-adm-card p-5">
      <h2 className="text-sm font-bold text-adm-ink">Scoring categories</h2>
      <p className="mb-4 mt-1 text-[13px] text-adm-ink-muted">
        Each answer awards points to a category. Result rules (next step) turn
        category totals into result profiles.
      </p>

      {categories.length > 0 ? (
        <ul className="mb-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-2 rounded-full border border-adm-line bg-adm-sand px-3 py-1"
            >
              <span className="text-[12px] font-bold text-adm-ink">{c.code}</span>
              {c.name.en ? (
                <span className="text-[12px] text-adm-ink-muted">{c.name.en}</span>
              ) : null}
              <button
                type="button"
                onClick={() => remove(c.id, c.code)}
                disabled={busy}
                className="text-base leading-none text-adm-ink-faint transition-colors hover:text-adm-error-ink"
                aria-label={`Remove category ${c.code}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-[13px] text-adm-ink-faint">
          No categories yet — add at least one before scoring answers.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-[120px_1fr_1fr_auto] sm:items-end">
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
    </section>
  );
}
