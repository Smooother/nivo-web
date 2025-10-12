"use client";

import AdvancedAnalyticsDashboard from "@/components/AdvancedAnalyticsDashboard";
import BusinessRulesConfig from "@/components/BusinessRulesConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AnalysisPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="analytics">Analysvy</TabsTrigger>
          <TabsTrigger value="rules">Affärsregler</TabsTrigger>
        </TabsList>
        <TabsContent value="analytics" className="mt-6">
          <AdvancedAnalyticsDashboard />
        </TabsContent>
        <TabsContent value="rules" className="mt-6">
          <BusinessRulesConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}

