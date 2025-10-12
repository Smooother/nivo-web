"use client";

import AIAnalysis from "@/components/AIAnalysis";
import AIAnalytics from "@/components/AIAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="insights">AI-insikter</TabsTrigger>
          <TabsTrigger value="workflows">AI-arbetsflöden</TabsTrigger>
        </TabsList>
        <TabsContent value="insights" className="mt-6">
          <AIAnalysis />
        </TabsContent>
        <TabsContent value="workflows" className="mt-6">
          <AIAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}

