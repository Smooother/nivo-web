import Link from 'next/link';

async function fetchList(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/lists/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.list as any;
}

export default async function ListDetail({ params }: { params: { listId: string } }) {
  const list = await fetchList(params.listId);
  if (!list) return <div className="p-6">List not found.</div>;
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{list.name}</h1>
        <form action="/api/analyze" method="post">
          <input type="hidden" name="listId" value={params.listId} />
          <input type="hidden" name="analysisKind" value="both" />
          <button className="px-3 py-2 bg-black text-white rounded">Run AI Analysis</button>
        </form>
      </div>
      <div className="border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Org#</th>
              <th className="text-left p-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {list.items?.map((it: any) => (
              <tr key={it.id} className="border-t">
                <td className="p-2 font-mono">{it.org_number}</td>
                <td className="p-2">{it.note || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href={`/lists/${params.listId}/runs`} className="text-blue-600">View runs →</Link>
    </div>
  );
}

