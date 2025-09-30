import Link from 'next/link';

async function fetchLists() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/lists`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.lists as any[];
}

export default async function ListsPage() {
  const lists = await fetchLists();
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Lists</h1>
        <Link href="/companies" className="text-blue-600">Create from filters →</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lists.map((l) => (
          <Link key={l.id} href={`/lists/${l.id}`} className="border rounded p-4 hover:bg-gray-50">
            <div className="font-medium">{l.name}</div>
            <div className="text-sm text-gray-600 mt-1">{l.description || '—'}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

