"use client";

import DbStatusCards from "@/components/admin/DbStatusCards";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function DbStatusPage() {
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Databasstatus"
        description="Överblick av anslutningar, tabeller och latens i Supabase."
        items={[{ label: "Databasstatus" }]}
      />
      <DbStatusCards />
    </div>
  );
}

