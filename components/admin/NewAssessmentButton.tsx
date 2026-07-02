"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/admin/ui/Button";

export function NewAssessmentButton() {
  const router = useRouter();

  return (
    <Button onClick={() => router.push("/admin/content/new")}>
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
