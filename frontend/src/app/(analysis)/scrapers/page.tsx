"use client";

import ScraperInterface from "@/components/ScraperInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ScrapersPage() {
  return (
    <div className="space-y-6">
      <Card className="border-none bg-background shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Dataskraper</CardTitle>
        </CardHeader>
        <CardContent>
          <ScraperInterface />
        </CardContent>
      </Card>
    </div>
  );
}

