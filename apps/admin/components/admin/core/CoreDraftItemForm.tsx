"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Field, Textarea } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { saveCoreDraftItem } from "@/lib/admin/core/draft-actions";
import type { CoreItem } from "@/lib/admin/core/framework";

interface TextPair {
  text_en: string;
  text_ar: string;
}

/** Wording editor for one CORE question in a draft. Structure is not editable. */
export function CoreDraftItemForm({
  draftId,
  item,
  isChanged,
  isReadOnly,
}: {
  draftId: string;
  item: CoreItem;
  isChanged: boolean;
  isReadOnly: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [stemEn, setStemEn] = useState(item.stem_en);
  const [stemAr, setStemAr] = useState(item.stem_ar);
  const [options, setOptions] = useState<Record<string, TextPair>>(() =>
    Object.fromEntries(
      item.options.map((o) => [
        o.option_id,
        { text_en: o.text_en, text_ar: o.text_ar },
      ]),
    ),
  );
  const [isSaving, setIsSaving] = useState(false);

  function setOption(id: string, key: keyof TextPair, value: string) {
    setOptions((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveCoreDraftItem(draftId, {
        itemId: item.item_id,
        stem_en: stemEn,
        stem_ar: stemAr,
        options,
      });
      toast("success", `${item.item_id} saved.`);
      router.refresh();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Could not save.");
    }
    setIsSaving(false);
  }

  return (
    <details className="group rounded-adm-lg border border-adm-line bg-adm-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3">
        <span className="rounded bg-adm-sand px-1.5 py-0.5 text-[11px] font-bold text-adm-ink-muted">
          {item.item_id}
        </span>
        {item.axis ? (
          <span className="rounded bg-adm-violet/10 px-1.5 py-0.5 text-[11px] font-bold text-adm-deep">
            axis: {item.axis}
          </span>
        ) : null}
        <span className="line-clamp-1 flex-1 text-[13px] text-adm-ink-soft">
          {item.stem_en}
        </span>
        {isChanged ? (
          <span className="rounded-full bg-adm-gold/25 px-2 py-0.5 text-[11px] font-bold text-adm-gold-ink">
            Edited
          </span>
        ) : null}
      </summary>
      <form
        onSubmit={handleSave}
        className="grid gap-4 border-t border-adm-line px-4 py-4"
      >
        <fieldset disabled={isReadOnly} className="grid gap-3 sm:grid-cols-2">
          <Field label="Question (English)">
            {(f) => (
              <Textarea
                {...f}
                rows={3}
                value={stemEn}
                onChange={(e) => setStemEn(e.target.value)}
              />
            )}
          </Field>
          <Field label="Question (Arabic)">
            {(f) => (
              <Textarea
                {...f}
                dir="rtl"
                lang="ar"
                rows={3}
                value={stemAr}
                onChange={(e) => setStemAr(e.target.value)}
              />
            )}
          </Field>
          {item.options.map((o) => (
            <div key={o.option_id} className="contents">
              <Field label={`${o.option_id} · scores to ${o.code} (English)`}>
                {(f) => (
                  <Textarea
                    {...f}
                    rows={2}
                    value={options[o.option_id]?.text_en ?? ""}
                    onChange={(e) =>
                      setOption(o.option_id, "text_en", e.target.value)
                    }
                  />
                )}
              </Field>
              <Field label={`${o.option_id} (Arabic)`}>
                {(f) => (
                  <Textarea
                    {...f}
                    dir="rtl"
                    lang="ar"
                    rows={2}
                    value={options[o.option_id]?.text_ar ?? ""}
                    onChange={(e) =>
                      setOption(o.option_id, "text_ar", e.target.value)
                    }
                  />
                )}
              </Field>
            </div>
          ))}
        </fieldset>
        {isReadOnly ? null : (
          <div>
            <Button type="submit" size="sm" loading={isSaving}>
              Save {item.item_id}
            </Button>
          </div>
        )}
      </form>
    </details>
  );
}
