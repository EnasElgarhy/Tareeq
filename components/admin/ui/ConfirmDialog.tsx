"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [visible, setVisible] = useState(false);
  const [showing, setShowing] = useState(false);
  const [closing, setClosing] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(true);
      // Next frame triggers the CSS scale+opacity transition
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

  // Focus the cancel button when dialog opens
  useEffect(() => {
    if (showing) cancelRef.current?.focus();
  }, [showing]);

  // Escape key closes the dialog
  useEffect(() => {
    if (!visible) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, onCancel]);

  if (!visible) return null;

  return (
    <div
      className="adm-dialog-backdrop"
      data-open={showing ? "true" : undefined}
      data-closing={closing ? "true" : undefined}
      aria-modal="true"
      role="dialog"
      aria-labelledby="adm-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="adm-dialog-panel">
        <h2
          id="adm-dialog-title"
          className="text-[15px] font-bold text-adm-ink"
        >
          {title}
        </h2>

        {description ? (
          <p className="mt-1.5 text-[13px] text-adm-ink-muted leading-relaxed">
            {description}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button
            ref={cancelRef}
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
