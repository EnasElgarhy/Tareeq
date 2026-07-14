"use client";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="border-adm-error/40 p-8 text-center">
      <h2 className="adm-display text-2xl">Analytics couldn&apos;t load</h2>
      <p className="mt-2 text-sm text-adm-ink-muted">
        {error.message || "Something went wrong while loading the analytics data."}
      </p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
