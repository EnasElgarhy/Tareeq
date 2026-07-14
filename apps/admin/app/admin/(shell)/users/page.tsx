import PageHeader from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";

export default function UsersPage() {
  return (
    <>
      <PageHeader
        kicker="Admin · Users"
        title="Students & accounts"
        description="Search, review, and support the students using Tareeq."
      />
      <EmptyState
        title="User management is on its way"
        description="Account search, cohort filters, and support tools land here in the next release."
      />
    </>
  );
}
