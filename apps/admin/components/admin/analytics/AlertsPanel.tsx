import { Card } from "@/components/admin/ui/Card";
import type { Alert } from "@/lib/admin/analytics/types";

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <Card className="adm-fade-up p-5">
      <h2 className="mb-4 text-base font-bold text-adm-ink">Alerts</h2>
      {alerts.length === 0 ? (
        <p className="py-4 text-center text-sm text-adm-ink-muted">
          No alerts — everything looks healthy.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`flex items-start gap-2.5 rounded-adm-md p-3 text-[13px] font-semibold ${
                alert.severity === "critical"
                  ? "bg-adm-error/10 text-adm-error-ink"
                  : "bg-adm-gold/15 text-adm-gold-ink"
              }`}
            >
              <span aria-hidden="true">⚠</span>
              {alert.text}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
