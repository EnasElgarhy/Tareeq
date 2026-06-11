"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { ClusterChip } from "@/components/admin/ui/Badge";
import { InlineStatus, useToast } from "@/components/admin/ui/Toast";
import { CLUSTERS, type ClusterCode } from "@/lib/admin/clusters";
import { PILLAR_NAMES } from "@/lib/admin/content";
import { addQuestion } from "@/lib/admin/content-actions";
import { Card } from "@/components/admin/ui/Card";

/**
 * Speed composer — keyboard-first question entry.
 *
 * Flow: type the question, Enter. Type an option; `@` pops the cluster picker,
 * `*2` sets weight. Enter stages the option. Enter on an empty input (or
 * ⌘/Ctrl+Enter anytime) saves the whole question and the loop restarts.
 * Backspace on an empty input pulls the last option back in for editing.
 *
 * Save maps each staged option to the EXISTING addQuestion action's option
 * shape (letter + text + cluster_code). NOTE: option `weight` is captured in
 * the UI but the current `question_options` schema has no weight column, so it
 * is not persisted — adding it would require a migration + scoring change,
 * which is intentionally out of scope here.
 */

const AT_TOKEN = /@([a-zA-Z]*)$/;
const WEIGHT_TOKEN = /\*([1-3])(?!\d)/;

interface StagedOption {
  id: string;
  label: string;
  cluster: ClusterCode;
  weight: number;
}

let optionSeq = 0;
const uid = () => `o${optionSeq++}`;

function WeightDots({
  weight,
  onCycle,
  label,
}: {
  weight: number;
  onCycle?: () => void;
  label: string;
}) {
  const dots = (
    <span className="flex items-center gap-1" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`h-2 w-2 rounded-full transition-colors duration-adm-fast ${
            n <= weight ? "bg-adm-violet" : "bg-adm-line-strong"
          }`}
        />
      ))}
    </span>
  );
  if (!onCycle) return dots;
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={label}
      title="Click to change weight"
      className="rounded-adm-sm p-1 transition-colors duration-adm-fast hover:bg-adm-sand"
    >
      {dots}
    </button>
  );
}

export function QuestionBuilder({ versionId }: { versionId: string }) {
  const router = useRouter();
  const toast = useToast();
  const questionRef = useRef<HTMLInputElement>(null);
  const optionRef = useRef<HTMLInputElement>(null);

  const [pillar, setPillar] = useState(1);
  const [qText, setQText] = useState("");
  const [staged, setStaged] = useState<StagedOption[]>([]);
  const [value, setValue] = useState("");
  const [pendingCluster, setPendingCluster] = useState<ClusterCode>("TECH");
  const [highlight, setHighlight] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* ---- live token parsing ---- */
  const atMatch = AT_TOKEN.exec(value);
  const filter = atMatch?.[1].toLowerCase() ?? "";
  const matches = useMemo(
    () =>
      atMatch
        ? CLUSTERS.filter(
            (c) =>
              c.code.toLowerCase().startsWith(filter) ||
              c.name.toLowerCase().includes(filter),
          )
        : [],
    [atMatch, filter],
  );
  const popoverOpen = !!atMatch && matches.length > 0;
  const weightMatch = WEIGHT_TOKEN.exec(value);
  const pendingWeight = weightMatch ? Number(weightMatch[1]) : 1;
  const hl = Math.min(highlight, Math.max(matches.length - 1, 0));

  /* ---- actions ---- */
  function chooseCluster(code: ClusterCode) {
    setPendingCluster(code);
    setValue(value.replace(AT_TOKEN, ""));
    setHighlight(0);
    optionRef.current?.focus();
  }

  function commitOption() {
    const label = value.replace(AT_TOKEN, "").replace(WEIGHT_TOKEN, "").trim();
    if (!label) return;
    setStaged([
      ...staged,
      { id: uid(), label, cluster: pendingCluster, weight: pendingWeight },
    ]);
    setValue("");
    setError(null);
  }

  function popLastOption() {
    const last = staged[staged.length - 1];
    if (!last) return;
    setStaged(staged.slice(0, -1));
    setPendingCluster(last.cluster);
    setValue(last.weight > 1 ? `${last.label} *${last.weight}` : last.label);
  }

  async function saveQuestion() {
    if (!qText.trim()) {
      setError("Write the question first — then Enter to start adding options.");
      questionRef.current?.focus();
      return;
    }
    if (staged.length < 2) {
      setError("Stage at least two options before saving.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await addQuestion(versionId, {
        pillar,
        kind: "single",
        title: qText.trim(),
        options: staged.map((o, i) => ({
          letter: String.fromCharCode(65 + i),
          text: { en: o.label },
          cluster_code: o.cluster,
          driver_code: null,
          axis_value: null,
        })),
      });
      setQText("");
      setStaged([]);
      setValue("");
      toast("success", "Question added — keep them coming.");
      questionRef.current?.focus();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add question");
    } finally {
      setSaving(false);
    }
  }

  /* ---- keyboard ---- */
  function onOptionKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void saveQuestion();
      return;
    }
    if (popoverOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        chooseCluster(matches[hl].code);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setValue(value.replace(AT_TOKEN, ""));
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (value.trim()) commitOption();
      else void saveQuestion();
      return;
    }
    if (e.key === "Backspace" && value === "" && staged.length > 0) {
      e.preventDefault();
      popLastOption();
    }
  }

  const cycleCluster = (id: string) =>
    setStaged(
      staged.map((o) => {
        if (o.id !== id) return o;
        const i = CLUSTERS.findIndex((c) => c.code === o.cluster);
        return { ...o, cluster: CLUSTERS[(i + 1) % CLUSTERS.length].code };
      }),
    );

  const cycleWeight = (id: string) =>
    setStaged(
      staged.map((o) => (o.id === id ? { ...o, weight: (o.weight % 3) + 1 } : o)),
    );

  const kbd =
    "rounded border border-adm-line-strong bg-adm-card px-1 py-px font-mono text-[11px] text-adm-ink-soft";

  return (
    <Card tone="tinted" className="w-full border-dashed border-adm-line-strong p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-adm-ink">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full bg-adm-violet text-xs text-white"
            aria-hidden="true"
          >
            ⚡
          </span>
          Quick add
        </h3>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-adm-ink-muted">
          Pillar
          <select
            value={pillar}
            onChange={(e) => setPillar(Number(e.target.value))}
            className="rounded-adm-sm border border-adm-line-strong bg-adm-card px-2 py-1 text-[12px] font-semibold text-adm-ink focus:border-adm-violet focus:outline-none focus:ring-2 focus:ring-adm-violet/25"
          >
            {Object.entries(PILLAR_NAMES).map(([value2, name]) => (
              <option key={value2} value={value2}>
                {value2} · {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mb-4 text-xs text-adm-ink-muted">
        Never leave the keyboard: <span className={kbd}>Enter</span> chains
        question → options → save. <span className={kbd}>@</span> tags a cluster,{" "}
        <span className={kbd}>*2</span> sets weight.
      </p>

      {/* 1 · question */}
      <label htmlFor="sc-q" className="sr-only">
        Question text
      </label>
      <input
        id="sc-q"
        ref={questionRef}
        value={qText}
        onChange={(e) => setQText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            optionRef.current?.focus();
          }
        }}
        placeholder="Type the question, press Enter…"
        className="w-full rounded-adm-md border border-adm-line-strong bg-adm-card px-4 py-3 text-[15px] font-semibold text-adm-ink placeholder:font-normal placeholder:text-adm-ink-faint transition-colors duration-adm-fast hover:border-adm-ink-faint focus:border-adm-violet focus:outline-none focus:ring-2 focus:ring-adm-violet/25"
      />

      {/* 2 · staged options */}
      {staged.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {staged.map((o, i) => (
            <li
              key={o.id}
              className="adm-fade-up flex items-center gap-2 rounded-adm-sm border border-adm-line bg-adm-card px-3 py-2"
            >
              <span
                className="w-5 text-xs font-bold text-adm-ink-faint"
                aria-hidden="true"
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-adm-ink">
                {o.label}
              </span>
              <button
                type="button"
                onClick={() => cycleCluster(o.id)}
                aria-label={`Option ${i + 1} cluster: ${o.cluster}. Click to change.`}
                title="Click to change cluster"
                className="rounded-full transition-transform duration-adm-fast hover:scale-105"
              >
                <ClusterChip code={o.cluster} />
              </button>
              <WeightDots
                weight={o.weight}
                onCycle={() => cycleWeight(o.id)}
                label={`Option ${i + 1} weight: ${o.weight} of 3. Click to change.`}
              />
              <button
                type="button"
                onClick={() => setStaged(staged.filter((x) => x.id !== o.id))}
                aria-label={`Remove option ${i + 1}`}
                className="rounded p-1 text-adm-ink-faint transition-colors duration-adm-fast hover:bg-adm-error/10 hover:text-adm-error-ink"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 3 · option input + cluster popover */}
      <div className="relative mt-3">
        <label htmlFor="sc-o" className="sr-only">
          Add an option — type @ to pick a cluster, *2 to set weight
        </label>
        <div className="flex items-center gap-2 rounded-adm-md border border-adm-line-strong bg-adm-card pl-4 pr-2 transition-colors duration-adm-fast focus-within:border-adm-violet focus-within:ring-2 focus-within:ring-adm-violet/25 hover:border-adm-ink-faint">
          <input
            id="sc-o"
            ref={optionRef}
            role="combobox"
            aria-expanded={popoverOpen}
            aria-controls="sc-clusters"
            aria-activedescendant={
              popoverOpen ? `sc-cl-${matches[hl].code}` : undefined
            }
            aria-autocomplete="list"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={onOptionKeyDown}
            placeholder={
              staged.length === 0
                ? "First option… try “Build a robot @eng *3”, then Enter"
                : staged.length < 2
                  ? "Next option…"
                  : "Next option — or press Enter to save the question"
            }
            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-adm-ink placeholder:text-adm-ink-faint focus:outline-none"
          />
          {/* pending cluster + weight, applied to the next Enter */}
          <button
            type="button"
            onClick={() => {
              const i = CLUSTERS.findIndex((c) => c.code === pendingCluster);
              setPendingCluster(CLUSTERS[(i + 1) % CLUSTERS.length].code);
              optionRef.current?.focus();
            }}
            aria-label={`Next option's cluster: ${pendingCluster}. Click to change, or type @ in the input.`}
            title="Cluster for the next option"
            className="shrink-0 rounded-full transition-transform duration-adm-fast hover:scale-105"
          >
            <ClusterChip code={pendingCluster} />
          </button>
          <WeightDots weight={pendingWeight} label="" />
        </div>

        {popoverOpen && (
          <ul
            id="sc-clusters"
            role="listbox"
            aria-label="Choose a cluster"
            className="absolute left-0 top-full z-20 mt-1.5 w-72 overflow-hidden rounded-adm-md border border-adm-line bg-adm-card py-1 shadow-adm-lg"
          >
            {matches.map((c, i) => (
              <li
                key={c.code}
                id={`sc-cl-${c.code}`}
                role="option"
                aria-selected={i === hl}
                onMouseDown={(e) => {
                  e.preventDefault();
                  chooseCluster(c.code);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm ${
                  i === hl ? "bg-adm-violet/10 text-adm-ink" : "text-adm-ink-soft"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: `var(${c.cssVar})` }}
                />
                <span className="w-12 font-mono text-xs font-bold">{c.code}</span>
                {c.name}
                {i === hl && (
                  <span className="ml-auto text-[11px] text-adm-ink-muted">↵</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 4 · save */}
      <div className="mt-4 flex items-center justify-between gap-3">
        {error ? (
          <InlineStatus kind="error">{error}</InlineStatus>
        ) : (
          <p className="text-xs text-adm-ink-muted" aria-live="polite">
            {staged.length === 0
              ? "No options staged yet."
              : `${staged.length} option${staged.length === 1 ? "" : "s"} staged${
                  staged.length >= 2 ? " — Enter on empty input saves" : ""
                }.`}
          </p>
        )}
        <Button
          type="button"
          size="sm"
          onClick={saveQuestion}
          loading={saving}
          disabled={!qText.trim() || staged.length < 2}
          className="shrink-0"
        >
          Save question ⌘↵
        </Button>
      </div>
    </Card>
  );
}
