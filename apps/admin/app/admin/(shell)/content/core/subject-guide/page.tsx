import { CoreBreadcrumb, CoreTabs } from "@/components/admin/core/CoreTabs";
import { SubjectGuideUpload } from "@/components/admin/core/SubjectGuideUpload";
import PageHeader from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { summarizeSubjectGuide } from "@/lib/admin/core/subject-guide";
import { getCurrentSubjectGuide } from "@/lib/admin/core/subject-guide-store";
import { requirePermission } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

const BUNDLED_REASON = {
  none: "No guide has been uploaded yet, so Kai uses the version that ships with the app.",
  unavailable:
    "The upload store isn't set up yet, so Kai uses the version that ships with the app.",
  invalid:
    "The stored guide failed its check, so Kai uses the version that ships with the app. Upload it again.",
} as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });
}

/** The subject guide Kai reads (developer note, 17 Nov 2026), and its replacement. */
export default async function SubjectGuidePage() {
  await requirePermission("content.edit");
  const current = await getCurrentSubjectGuide();
  const summary = summarizeSubjectGuide(current.guide);
  return (
    <>
      <CoreBreadcrumb
        trail={[
          { label: "CORE 2.0", href: "/admin/content/core" },
          { label: "Subject guide" },
        ]}
      />
      <PageHeader
        kicker="Kai · Subject guide"
        title={`Subject guide ${summary.version}`}
        description="What Kai may say about school subjects, streams and tracks in the UAE, Saudi Arabia and Egypt. Kai uses nothing else on subjects."
      />
      <CoreTabs active="subject-guide" />

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <Card className="p-5">
          <h2 className="text-base font-bold text-adm-ink">
            Kai is using version {summary.version}
          </h2>
          <p className="mt-1 text-[13px] text-adm-ink-muted">
            {current.source === "uploaded"
              ? `Uploaded ${formatDate(current.updatedAt)} (UAE time)${current.updatedBy ? ` by ${current.updatedBy}` : ""}.`
              : BUNDLED_REASON[current.reason]}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-[12px] text-adm-ink-muted">Countries</dt>
              <dd className="text-[15px] font-bold text-adm-ink">
                {summary.countries.join(", ")}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-adm-ink-muted">Field groups</dt>
              <dd className="text-[15px] font-bold text-adm-ink">
                {summary.fieldGroups}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-adm-ink-muted">Job families</dt>
              <dd className="text-[15px] font-bold text-adm-ink">
                {summary.jobFamilies}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-adm-ink-muted">
                Entries still to check
              </dt>
              <dd className="text-[15px] font-bold text-adm-ink">
                {summary.entriesToCheck} of {summary.entries}
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-[12px] leading-relaxed text-adm-ink-muted">
            {summary.status}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-adm-ink-muted">
            For entries still to check, Kai says it has no checked information
            and points the student to their counsellor and the official
            admission portal.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-base font-bold text-adm-ink">
            Replace the guide
          </h2>
          <SubjectGuideUpload />
        </Card>
      </div>
    </>
  );
}
