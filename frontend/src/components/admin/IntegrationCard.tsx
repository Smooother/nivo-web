import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type IntegrationStatus = "connected" | "missing_env" | "disconnected";

type Props = {
  name: string;
  description: string;
  onTest: () => Promise<{ status: IntegrationStatus; lastChecked?: string }>;
  docsUrl: string;
};

export function IntegrationCard({ name, description, onTest, docsUrl }: Props) {
  const [status, setStatus] = useState<IntegrationStatus>("missing_env");
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const result = await onTest();
      setStatus(result.status);
      if (result.lastChecked) {
        setLastChecked(result.lastChecked);
      }
    } finally {
      setLoading(false);
    }
  };

  const badgeVariant =
    status === "connected" ? "default" : status === "missing_env" ? "secondary" : "destructive";
  const badgeText =
    status === "connected"
      ? "Ansluten"
      : status === "missing_env"
      ? "Saknar miljövariabler"
      : "Ej ansluten";

  return (
    <Card className="h-full border bg-background shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant={badgeVariant}>{badgeText}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastChecked && (
          <p className="text-xs text-muted-foreground">
            Senast kontrollerad {new Date(lastChecked).toLocaleString("sv-SE")}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleTest} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Testa anslutning
          </Button>
          <Button asChild variant="outline">
            <a href={docsUrl} target="_blank" rel="noreferrer">
              Dokumentation
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default IntegrationCard;

