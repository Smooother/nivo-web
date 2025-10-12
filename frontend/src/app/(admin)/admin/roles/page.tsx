"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/rbac";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const roleCapabilities: Record<string, string[]> = {
  admin: [
    "Full tillgång till alla administrationssidor",
    "Hantera integrationer och datakopplingar",
    "Sätta roller och åtkomster för andra användare",
  ],
  analyst: [
    "Tillgång till alla analysvyer",
    "Exportera data och AI-insikter",
    "Konfigurera affärsregler",
  ],
  viewer: [
    "Läsa analyser och dashboards",
    "Exportera fördefinierade rapporter",
  ],
};

export default function RolesPage() {
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Roller och behörigheter"
        description="Överblick av rollhierarkin och vilka funktioner som ingår."
        items={[{ label: "Roller" }]}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(roleCapabilities).map(([role, capabilities]) => (
          <Card key={role} className="border bg-background shadow-sm">
            <CardHeader>
              <CardTitle>{ROLE_LABELS[role as keyof typeof ROLE_LABELS]}</CardTitle>
              <CardDescription>Behörigheter och ansvar</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {capabilities.map((item) => (
                  <li key={item} className="leading-snug">
                    • {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

