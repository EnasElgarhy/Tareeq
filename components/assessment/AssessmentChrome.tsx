"use client";

import { ArrowLeft, Type } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { getQuestionPath } from "@/lib/assessment/questions";
import { TareeqWordmark } from "./TareeqWordmark";

type AssessmentChromeProps = {
  children: ReactNode;
  totalQuestions: number;
};

function getIndexFromPathname(pathname: string) {
  const match = /^\/q\/(\d+)$/.exec(pathname);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

export function AssessmentChrome({
  children,
  totalQuestions,
}: AssessmentChromeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const questionIndex = getIndexFromPathname(pathname);
  const hasQuestion = questionIndex !== null;
  const progress = hasQuestion ? (questionIndex / totalQuestions) * 100 : 0;
  const title =
    !hasQuestion || questionIndex < 4 ? "About You" : "Take the Assessment";

  function goBack() {
    if (!hasQuestion) {
      router.push("/");
      return;
    }

    router.push(
      questionIndex > 0 ? getQuestionPath(questionIndex - 1) : "/start",
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-7 pt-[max(env(safe-area-inset-top),1rem)]">
      <header className="flex min-h-11 items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-glass-border bg-glass text-text-100 backdrop-blur transition active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft aria-hidden="true" size={18} strokeWidth={2.4} />
        </button>
        <div className="min-w-0 text-center">
          <TareeqWordmark className="justify-center text-[1.35rem]" />
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-40">
            {title}
          </p>
        </div>
        <div
          className="inline-flex size-10 items-center justify-center rounded-full border border-glass-border bg-glass text-text-80"
          aria-label="Text mode"
          title="Text mode"
        >
          <Type aria-hidden="true" size={17} strokeWidth={2.3} />
        </div>
      </header>

      {hasQuestion ? (
        <div className="my-6 flex items-center gap-3">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="absolute inset-y-0 start-0 rounded-full bg-grad-warm shadow-[0_0_24px_rgba(255,107,61,0.55)] transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="min-w-14 text-end text-sm font-semibold tabular-nums text-text-60">
            <span className="text-accent-orange">{questionIndex + 1}</span> /{" "}
            {totalQuestions}
          </div>
        </div>
      ) : (
        <div className="h-8" />
      )}

      <div className="pointer-events-none fixed end-5 top-[calc(env(safe-area-inset-top)+5rem)] z-10 grid size-14 place-items-center rounded-full border border-white/15 bg-grad-warm text-lg font-bold shadow-[0_14px_38px_rgba(255,61,131,0.35)]">
        K
      </div>

      {children}
    </main>
  );
}
