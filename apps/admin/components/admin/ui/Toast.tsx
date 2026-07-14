"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type StatusKind = "success" | "error" | "info";

const kindStyles: Record<StatusKind, string> = {
  success: "border-adm-mint bg-adm-mint/15 text-adm-mint-ink",
  error: "border-adm-error bg-adm-error/15 text-adm-error-ink",
  info: "border-adm-lilac bg-adm-violet/10 text-adm-deep",
};

function KindIcon({ kind }: { kind: StatusKind }) {
  const d =
    kind === "success"
      ? "M5 12l5 5L20 7"
      : kind === "error"
        ? "M12 8v5m0 3.5v.5"
        : "M12 8h.01M11 12h1v5h1";
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Inline status line — use inside forms/cards next to the action. */
export function InlineStatus({
  kind,
  children,
}: {
  kind: StatusKind;
  children: ReactNode;
}) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-center gap-2 rounded-adm-sm border px-3 py-2 text-[13px] font-medium ${kindStyles[kind]}`}
    >
      <KindIcon kind={kind} />
      {children}
    </p>
  );
}

/* ------------------------------ Toasts ------------------------------ */

interface ToastItem {
  id: number;
  kind: StatusKind;
  message: string;
}

const ToastContext = createContext<(kind: StatusKind, message: string) => void>(
  () => {},
);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: StatusKind, message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, kind, message }]);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-80 flex-col gap-2"
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            item={t}
            onDone={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={`adm-fade-up pointer-events-auto flex items-center gap-2 rounded-adm-md border px-4 py-3 text-[13px] font-semibold shadow-adm-lg backdrop-blur ${kindStyles[item.kind]}`}
    >
      <KindIcon kind={item.kind} />
      <span className="flex-1">{item.message}</span>
      <button
        onClick={onDone}
        aria-label="Dismiss notification"
        className="rounded p-0.5 opacity-60 transition-opacity duration-adm-fast hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
