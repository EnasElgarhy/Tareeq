import Link from "next/link";
import { NewAssessmentFlow } from "@/components/admin/NewAssessmentFlow";
import PageHeader from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

export default function NewAssessmentPage() {
  return (
    <>
      <PageHeader
        kicker="Admin · Content"
        title="New assessment"
        description="Choose how to build this assessment. Both paths produce the same structure."
        actions={
          <Link
            href="/admin/content"
            className="text-[13px] font-semibold text-adm-violet hover:text-adm-deep"
          >
            ← Back to versions
          </Link>
        }
      />
      <NewAssessmentFlow />
    </>
  );
}
