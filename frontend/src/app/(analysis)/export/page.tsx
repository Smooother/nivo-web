"use client";

import DataExport from "@/components/DataExport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <Card className="border-none bg-background shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Dataexport</CardTitle>
          <CardDescription>
            Exportera bolagsdata, rapporter och AI-genererade analyser till CSV, Excel eller interna format.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataExport />
        </CardContent>
      </Card>
    </div>
  );
}

