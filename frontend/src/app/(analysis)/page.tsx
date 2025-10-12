"use client";

import { useEffect, useState } from "react";
import { supabaseDataService, DashboardAnalytics } from "@/lib/supabaseDataService";
import { supabaseConfig } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, DollarSign, Target, BarChart3 } from "lucide-react";

const metricConfig = [
  {
    title: "Genomsnittlig omsättning",
    accessor: (analytics: DashboardAnalytics | null) =>
      analytics?.totalCompanies ? `${(analytics?.averageRevenue || 0).toLocaleString("sv-SE")} TSEK` : "N/A",
    icon: <DollarSign className="h-6 w-6 text-emerald-500" />,
  },
  {
    title: "Omsättningstillväxt",
    accessor: (analytics: DashboardAnalytics | null) =>
      analytics?.averageRevenueGrowth ? `${(analytics.averageRevenueGrowth * 100).toFixed(1)}%` : "N/A",
    icon: <TrendingUp className="h-6 w-6 text-indigo-500" />,
  },
  {
    title: "EBIT-marginal",
    accessor: (analytics: DashboardAnalytics | null) =>
      analytics?.averageEBITMargin ? `${(analytics.averageEBITMargin * 100).toFixed(1)}%` : "N/A",
    icon: <Target className="h-6 w-6 text-amber-500" />,
  },
  {
    title: "Bolag i portföljen",
    accessor: (analytics: DashboardAnalytics | null) => analytics?.totalCompanies?.toString() ?? "0",
    icon: <BarChart3 className="h-6 w-6 text-rose-500" />,
  },
];

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await supabaseDataService.getDashboardAnalytics();
        if (active) {
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard analytics", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#2E2A2B] via-[#1f1c1d] to-[#2E2A2B] p-8 text-white shadow-lg">
        <h2 className="text-2xl font-semibold tracking-tight">Översikt</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/70">
          Få en snabb översikt av nyckelmetriker för företag, tillväxt och lönsamhet. Informationen uppdateras automatiskt när
          nya datakällor kopplas på.
        </p>
      </div>

      {!supabaseConfig.isConfigured && (
        <Alert variant="secondary">
          <AlertDescription>
            Supabase-anslutningen är inte konfigurerad. Instrumentpanelen visar demo-data tills en riktig anslutning sätts upp.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricConfig.map((metric) => (
            <Card key={metric.title} className="bg-background/90 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {metric.title}
                </CardTitle>
                {metric.icon}
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-foreground">{metric.accessor(analytics)}</p>
                <CardDescription className="mt-2 text-xs text-muted-foreground">
                  Baserat på senaste synkroniserade datasetet
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

