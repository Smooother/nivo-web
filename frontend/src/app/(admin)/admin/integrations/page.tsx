"use client";

import IntegrationCard from "@/components/admin/IntegrationCard";
import { testHubspotConnection } from "@/lib/integrations/hubspot";
import { testAirtableConnection } from "@/lib/integrations/airtable";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function IntegrationsPage() {
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Integrationer"
        description="Hantera kopplingar mot CRM och dataflöden. Testa anslutningarna i mock-läge."
        items={[{ label: "Integrationer" }]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <IntegrationCard
          name="HubSpot Free"
          description="Synka leads, deals och kontaktflöden mellan HubSpot och Nivo."
          onTest={testHubspotConnection}
          docsUrl="https://developers.hubspot.com/docs/api"
        />
        <IntegrationCard
          name="Airtable"
          description="Push automatiserade rapporter direkt till Airtable-baser för vidare analys."
          onTest={testAirtableConnection}
          docsUrl="https://airtable.com/developers"
        />
      </div>
    </div>
  );
}

