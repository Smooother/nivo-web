"use client";

import EnhancedCompanySearch from "@/components/EnhancedCompanySearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <Card className="border-none bg-background shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Företagssökning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Utforska det svenska bolagsregistret med hjälp av dynamiska filter, AI-stöd och fulltextssökning.
          </p>
          <EnhancedCompanySearch />
        </CardContent>
      </Card>
    </div>
  );
}

