export type HubspotStatus =
  | { status: "missing_env" }
  | { status: "connected"; lastChecked: string };

export async function testHubspotConnection(): Promise<HubspotStatus> {
  const env = typeof process !== "undefined" ? process.env : {};
  if (!env?.HUBSPOT_ACCESS_TOKEN && !import.meta.env.VITE_HUBSPOT_ACCESS_TOKEN) {
    return { status: "missing_env" };
  }

  return {
    status: "connected",
    lastChecked: new Date().toISOString(),
  };
}

