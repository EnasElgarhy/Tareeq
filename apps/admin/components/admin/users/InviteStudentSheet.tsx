"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/admin/ui/Button";
import { Sheet } from "@/components/admin/ui/Sheet";
import { EmailInviteManager } from "@/components/admin/users/EmailInviteManager";
import type { ReportInviteRow } from "@/lib/admin/access/actions";

/**
 * Entry point for free-access email invites on the Users list: a quiet action
 * button that opens the invite flow in a side sheet instead of embedding the
 * form in the page.
 */
export function InviteStudentSheet({
  invites,
}: {
  invites: ReportInviteRow[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={15} aria-hidden="true" />
        Invite a new student
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Invite a new student"
        description="A single-use link that grants free access to the premium report."
      >
        <EmailInviteManager invites={invites} />
      </Sheet>
    </>
  );
}
