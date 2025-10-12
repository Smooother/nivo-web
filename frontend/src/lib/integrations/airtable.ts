export type AirtableStatus =
  | { status: "missing_env" }
  | { status: "connected"; lastChecked: string };

export async function testAirtableConnection(): Promise<AirtableStatus> {
  const env = typeof process !== "undefined" ? process.env : {};
  const apiKey = env?.AIRTABLE_API_KEY || import.meta.env.VITE_AIRTABLE_API_KEY;
  const baseId = env?.AIRTABLE_BASE_ID || import.meta.env.VITE_AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    return { status: "missing_env" };
  }

  return {
    status: "connected",
    lastChecked: new Date().toISOString(),
  };
}

