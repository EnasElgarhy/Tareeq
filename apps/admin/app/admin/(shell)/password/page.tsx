import PageHeader from "@/components/admin/PageHeader";
import { PasswordForm } from "@/components/admin/account/PasswordForm";

export default function PasswordPage() {
  return (
    <>
      <PageHeader
        kicker="Admin · Your account"
        title="Password"
        description="Set a new password. You can always sign in with an email link instead."
      />
      <PasswordForm />
    </>
  );
}
