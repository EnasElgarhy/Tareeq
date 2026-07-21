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
        description="Start from a blank draft or bring in an assessment you already designed."
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
