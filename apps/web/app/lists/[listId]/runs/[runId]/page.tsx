async function fetchFindings(runId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/runs/${runId}/findings`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.findings as any[];
}

export default async function RunDetailPage({ params }: { params: { listId: string; runId: string } }) {
  const findings = await fetchFindings(params.runId);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Run Results</h1>
      <div className="border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Org#</th>
              <th className="text-left p-2">Rec</th>
              <th className="text-left p-2">Risk</th>
              <th className="text-left p-2">Growth</th>
              <th className="text-left p-2">Profitability</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((f: any) => (
              <tr key={f.id} className="border-t">
                <td className="p-2 font-mono">{f.org_number}</td>
                <td className="p-2">{f.summary?.recommendation || ''}</td>
                <td className="p-2">{f.scores?.risk ?? ''}</td>
                <td className="p-2">{f.scores?.growth ?? ''}</td>
                <td className="p-2">{f.scores?.profitability ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

