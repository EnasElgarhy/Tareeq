"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface SheetProps {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}

/**
 * Right-docked side sheet. Same transitions-dev open/close state machine as
 * ConfirmDialog (150ms close), same backdrop, admin motion tokens. Used for
 * task flows that need form space without leaving the page — e.g. minting a
 * free-access invite from the Users list.
 */
export function Sheet({
  open,
  title,
  description,
  children,
  onClose,
}: SheetProps) {
  const [visible, setVisible] = useState(false);
  const [showing, setShowing] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(true);
      // Next frame triggers the CSS slide transition
      const raf = requestAnimationFrame(() => setShowing(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setShowing(false);
      setClosing(true);
      const t = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 150); // matches --modal-close-dur
      return () => clearTimeout(t);
    }
  }, [open]);

  // Focus the close button when the sheet opens
  useEffect(() => {
    if (showing) closeRef.current?.focus();
  }, [showing]);

  // Escape closes; body scroll locks while open
  useEffect(() => {
    if (!visible) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className="adm-dialog-backdrop adm-sheet-backdrop"
      data-open={showing ? "true" : undefined}
      data-closing={closing ? "true" : undefined}
      aria-modal="true"
      role="dialog"
      aria-labelledby="adm-sheet-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="adm-sheet-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="adm-sheet-title"
              className="text-[15px] font-bold text-adm-ink"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-[12.5px] leading-relaxed text-adm-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            ref={closeRef}
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close panel"
            className="shrink-0 !px-2.5"
          >
            <X size={15} aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-4 grid gap-3">{children}</div>
      </div>
    </div>
  );
}
