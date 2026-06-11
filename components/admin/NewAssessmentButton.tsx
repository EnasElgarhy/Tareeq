"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/components/admin/ui/Toast";
import { createBlankVersion } from "@/lib/admin/content-actions";

export function NewAssessmentButton() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const id = await createBlankVersion("Untitled assessment");
      toast("success", "Draft created — start adding questions.");
      router.push(`/admin/content/${id}`);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not create draft");
      setLoading(false);
    }
  }

  return (
    <Button onClick={onClick} loading={loading}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      New assessment
    </Button>
  );
}
